import { Hono, type Context } from "hono";
import { z } from "zod";
import { and, desc, eq } from "drizzle-orm";

import { db } from "@my-better-t-app/db";
import { hires, routes } from "@my-better-t-app/db/schema/hires";

import {
	authMiddleware,
	requireAuth,
	type AuthenticatedVariables,
} from "../middleware/auth";
import { checkRouteConflict, validateRedirectCode } from "../lib/route-validation";
import { isValidRedirectUrl, normalizeUrl } from "../lib/url-validation";
import type { CloudflareBindings } from "../types/bindings";

const hostRegex = /^(apex|www)$/;
const subdomainRegex = /^(?!-)[a-z0-9-]{1,63}(?<!-)$/i;
const pathRegex = /^(\/[^?#]*)?$/;

type RouteCoordinatorStub = {
	syncRoute(
		routeId: string,
		previous?: { host: string; path: string; hireId: string },
	): Promise<void>;
	invalidateRoute(
		host: string,
		path: string,
		hireId: string,
		routeId?: string,
	): Promise<void>;
};

const routeInputSchema = z.object({
	host: z.string().trim().min(1),
	path: z
		.string()
		.trim()
		.min(1)
		.regex(pathRegex, "Path must start with '/' and not include query or hash"),
	targetUrl: z.string().trim().min(1),
	redirectCode: z.number().int(),
});

const bulkInputSchema = z.array(routeInputSchema);

function toResponse(record: typeof routes.$inferSelect) {
	return {
		id: record.id,
		hireId: record.hireId,
		host: record.host,
		path: record.path,
		targetUrl: record.targetUrl,
		redirectCode: record.redirectCode,
		createdAt: record.createdAt.toISOString(),
		updatedAt: record.updatedAt.toISOString(),
	};
}

async function requireHireOwnership(
	c: Context<any, any, any>
) {
	const hireId = c.req.param("hireId");
	const user = c.get("user");

	const [hire] = await db
		.select({ hire: hires })
		.from(hires)
		.where(eq(hires.id, hireId))
		.limit(1);

	if (!hire) {
		return { error: c.json({ error: "Hire not found" }, 404) } as const;
	}

	if (!user || hire.hire.hirerId !== user.id) {
		return { error: c.json({ error: "Forbidden" }, 403) } as const;
	}

	return { hire: hire.hire } as const;
}

function validateHost(host: string): boolean {
	if (hostRegex.test(host)) {
		return true;
	}
	return subdomainRegex.test(host);
}

const router = new Hono<AuthenticatedVariables & { Bindings: CloudflareBindings }>();

router.use("*", authMiddleware);

router.get("/:hireId/routes", requireAuth, async (c) => {
	const ownership = await requireHireOwnership(c);
	if ("error" in ownership) return ownership.error;

	const hire = ownership.hire;

	const records = await db
		.select()
		.from(routes)
		.where(eq(routes.hireId, hire.id))
		.orderBy(desc(routes.createdAt));

	return c.json(records.map(toResponse));
});

router.post("/:hireId/routes", requireAuth, async (c) => {
	const ownership = await requireHireOwnership(c);
	if ("error" in ownership) return ownership.error;

	const hire = ownership.hire;
	const body = await c.req.json().catch(() => ({}));
	const parsed = routeInputSchema.safeParse(body);

	if (!parsed.success) {
		return c.json({ error: "Invalid request" }, 400);
	}

	const { host, path, targetUrl, redirectCode } = parsed.data;
	const normalizedHost = host.toLowerCase();

	if (!validateHost(normalizedHost)) {
		return c.json({ error: "Invalid host" }, 400);
	}

	if (!validateRedirectCode(redirectCode)) {
		return c.json({ error: "Invalid redirect code" }, 400);
	}

	if (!isValidRedirectUrl(targetUrl)) {
		return c.json({ error: "Invalid target URL" }, 400);
	}

	let normalizedUrl: string;
	try {
		normalizedUrl = normalizeUrl(targetUrl);
	} catch (error) {
		return c.json({ error: error instanceof Error ? error.message : "Invalid target URL" }, 400);
	}

	const conflict = await checkRouteConflict({
		hireId: hire.id,
		host: normalizedHost,
		path,
	});

	if (conflict) {
		return c.json({ error: "Route already exists" }, 409);
	}

	const [created] = await db
		.insert(routes)
		.values({
			hireId: hire.id,
			host: normalizedHost,
			path,
			targetUrl: normalizedUrl,
			redirectCode,
		})
		.returning();

	if (!created) {
		return c.json({ error: "Unable to create route" }, 500);
	}

	const coordinatorId = c.env.ROUTE_COORDINATOR.idFromName("global");
	const coordinatorStub = c.env.ROUTE_COORDINATOR.get(coordinatorId) as unknown as RouteCoordinatorStub;

	try {
		c.executionCtx.waitUntil(
			(async () => {
				try {
					await coordinatorStub.syncRoute(created.id);
				} catch (error) {
					console.error("route syncRoute failed", {
						routeId: created.id,
						action: "create",
						error,
					});
				}
			})(),
		);
	} catch (error) {
		console.error("failed to schedule route sync", {
			action: "create",
			routeId: created.id,
			error,
		});
	}

	return c.json(toResponse(created), 201);
});

router.patch("/:hireId/routes/:routeId", requireAuth, async (c) => {
	const ownership = await requireHireOwnership(c);
	if ("error" in ownership) return ownership.error;

	const hire = ownership.hire;
	const routeId = c.req.param("routeId");
	const body = await c.req.json().catch(() => ({}));
	const parsed = routeInputSchema.partial().safeParse(body);

	if (!parsed.success) {
		return c.json({ error: "Invalid request" }, 400);
	}

	const payload = parsed.data;

	if (Object.keys(payload).length === 0) {
		return c.json({ error: "No fields to update" }, 400);
	}

	const [existing] = await db
		.select()
		.from(routes)
		.where(and(eq(routes.id, routeId), eq(routes.hireId, hire.id)))
		.limit(1);

	if (!existing) {
		return c.json({ error: "Route not found" }, 404);
	}

	const updatePayload: Partial<typeof routes.$inferInsert> = {
		updatedAt: new Date(),
	};

	const nextHost = payload.host !== undefined ? payload.host.toLowerCase() : existing.host;

	if (payload.host !== undefined && !validateHost(nextHost)) {
		return c.json({ error: "Invalid host" }, 400);
	}

	const nextRedirectCode = payload.redirectCode ?? existing.redirectCode;

	if (!validateRedirectCode(nextRedirectCode)) {
		return c.json({ error: "Invalid redirect code" }, 400);
	}

	let nextPath = existing.path;
	if (payload.path !== undefined) {
		const trimmed = payload.path.trim();
		if (trimmed.length === 0 || !pathRegex.test(trimmed)) {
			return c.json({ error: "Invalid path" }, 400);
		}
		nextPath = trimmed;
	}

	let nextTargetUrl = existing.targetUrl;
	if (payload.targetUrl !== undefined) {
		if (!isValidRedirectUrl(payload.targetUrl)) {
			return c.json({ error: "Invalid target URL" }, 400);
		}
		try {
			nextTargetUrl = normalizeUrl(payload.targetUrl);
		} catch (error) {
			return c.json({ error: error instanceof Error ? error.message : "Invalid target URL" }, 400);
		}
	}

	const conflict = await checkRouteConflict({
		hireId: hire.id,
		host: nextHost,
		path: nextPath,
		routeId,
	});

	if (conflict) {
		return c.json({ error: "Route already exists" }, 409);
	}

	updatePayload.host = nextHost;
	updatePayload.path = nextPath;
	updatePayload.targetUrl = nextTargetUrl;
	updatePayload.redirectCode = nextRedirectCode;

	const [updated] = await db
		.update(routes)
		.set(updatePayload)
		.where(eq(routes.id, routeId))
		.returning();

	if (!updated) {
		return c.json({ error: "Unable to update route" }, 500);
	}

	const coordinatorId = c.env.ROUTE_COORDINATOR.idFromName("global");
	const coordinatorStub = c.env.ROUTE_COORDINATOR.get(coordinatorId) as unknown as RouteCoordinatorStub;

	try {
		c.executionCtx.waitUntil(
			(async () => {
				try {
					await coordinatorStub.syncRoute(updated.id, {
						host: existing.host,
						path: existing.path,
						hireId: hire.id,
					});
				} catch (error) {
					console.error("route syncRoute failed", {
						routeId: updated.id,
						action: "update",
						error,
					});
				}
			})(),
		);
	} catch (error) {
		console.error("failed to schedule route sync", {
			action: "update",
			routeId: updated.id,
			error,
		});
	}

	return c.json(toResponse(updated));
});

router.delete("/:hireId/routes/:routeId", requireAuth, async (c) => {
	const ownership = await requireHireOwnership(c);
	if ("error" in ownership) return ownership.error;

	const hire = ownership.hire;
	const routeId = c.req.param("routeId");

	const [existing] = await db
		.select({ id: routes.id, host: routes.host, path: routes.path })
		.from(routes)
		.where(and(eq(routes.id, routeId), eq(routes.hireId, hire.id)))
		.limit(1);

	if (!existing) {
		return c.json({ error: "Route not found" }, 404);
	}

	await db.delete(routes).where(eq(routes.id, routeId));

	const coordinatorId = c.env.ROUTE_COORDINATOR.idFromName("global");
	const coordinatorStub = c.env.ROUTE_COORDINATOR.get(coordinatorId) as unknown as RouteCoordinatorStub;

	try {
		c.executionCtx.waitUntil(
			(async () => {
				try {
					await coordinatorStub.invalidateRoute(existing.host, existing.path, hire.id, routeId);
				} catch (error) {
					console.error("route invalidate failed", {
						routeId,
						action: "delete",
						error,
					});
				}
			})(),
		);
	} catch (error) {
		console.error("failed to schedule route invalidation", {
			action: "delete",
			routeId,
			error,
		});
	}

	return c.body(null, 204);
});

router.post("/:hireId/routes/bulk", requireAuth, async (c) => {
	const ownership = await requireHireOwnership(c);
	if ("error" in ownership) return ownership.error;

	const hire = ownership.hire;
	const body = await c.req.json().catch(() => undefined);

	const parsed = bulkInputSchema.safeParse(body);

	if (!parsed.success) {
		return c.json({ error: "Invalid request" }, 400);
	}

	const routesInput = parsed.data;
	const created: Array<typeof routes.$inferSelect> = [];
	const failed: Array<{
		index: number;
		errors: Array<{ field: string; message: string }>;
	}> = [];

	const coordinatorId = c.env.ROUTE_COORDINATOR.idFromName("global");
	const coordinatorStub = c.env.ROUTE_COORDINATOR.get(coordinatorId) as unknown as RouteCoordinatorStub;

	for (let index = 0; index < routesInput.length; index++) {
		const item = routesInput[index];
		if (!item) {
			failed.push({ index, errors: [{ field: "item", message: "Invalid item" }] });
			continue;
		}

		const errors: Array<{ field: string; message: string }> = [];

		const host = item.host.toLowerCase();
		if (!validateHost(host)) {
			errors.push({ field: "host", message: "Invalid host" });
		}

		if (!validateRedirectCode(item.redirectCode)) {
			errors.push({ field: "redirectCode", message: "Invalid redirect code" });
		}

		if (!isValidRedirectUrl(item.targetUrl)) {
			errors.push({ field: "targetUrl", message: "Invalid target URL" });
		}

		const targetUrl = errors.length === 0 ? normalizeUrl(item.targetUrl) : item.targetUrl;
		const path = item.path.trim();

		if (errors.length === 0) {
			const conflict = await checkRouteConflict({
				hireId: hire.id,
				host,
				path,
			});
			if (conflict) {
				errors.push({ field: "path", message: "Route already exists" });
			}
		}

		if (errors.length > 0) {
			failed.push({ index, errors });
			continue;
		}

		const [record] = await db
			.insert(routes)
			.values({
				hireId: hire.id,
				host,
				path,
				targetUrl,
				redirectCode: item.redirectCode,
			})
			.returning();

		if (record) {
			created.push(record);

			try {
				c.executionCtx.waitUntil(
					(async () => {
						try {
							await coordinatorStub.syncRoute(record.id);
						} catch (error) {
							console.error("route syncRoute failed", {
								routeId: record.id,
								action: "bulk-create",
								error,
							});
						}
					})(),
				);
			} catch (error) {
				console.error("failed to schedule route sync", {
					action: "bulk-create",
					routeId: record.id,
					error,
				});
			}
		}
	}

	const responsePayload = {
		created: created.map(toResponse),
		failed,
		summary: {
			total: routesInput.length,
			created: created.length,
			failed: failed.length,
		},
	};

	return c.json(responsePayload, 201);
});

export default router;


