import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";

import { db, desc, eq } from "@my-better-t-app/db";
import {
	hires,
	routes,
	type Route as RouteModel,
} from "@my-better-t-app/db/schema/hires";

import {
	authMiddleware,
	requireAuth,
	type AuthenticatedVariables,
} from "../middleware/auth";
import {
	checkRouteConflict,
	normalizeRouteHost,
	normalizeRoutePath,
	validateRedirectCode,
} from "../lib/route-validation";
import { isValidRedirectUrl, normalizeUrl } from "../lib/url-validation";

const router = new Hono();

const createRouteSchema = z.object({
	host: z
		.string()
		.min(1, "Host is required"),
	path: z
		.string()
		.min(1, "Path is required"),
	targetUrl: z
		.string()
		.min(1)
		.transform((value) => value.trim())
		.refine((value) => isValidRedirectUrl(value), {
			message: "Target URL must be an http or https URL",
		}),
	redirectCode: z
		.number()
		.int()
		.refine((value) => validateRedirectCode(value), {
			message: "Redirect code must be one of 301, 302, 307, or 308",
		}),
});

const updateRouteSchema = z
	.object({
		host: z.string().min(1).optional(),
		path: z
			.string()
			.min(1)
			.transform((value) => normalizeRoutePath(value))
			.optional(),
		targetUrl: z
			.string()
			.min(1)
			.transform((value) => value.trim())
			.refine((value) => isValidRedirectUrl(value))
			.optional(),
		redirectCode: z
			.number()
			.int()
			.refine((value) => validateRedirectCode(value))
			.optional(),
	})
	.refine((data) => Object.keys(data).length > 0, {
		message: "At least one field must be provided",
	});

const bulkRouteSchema = z.array(createRouteSchema).max(1000);

type RouteResponse = {
  id: string;
  hireId: string;
  host: string;
  path: string;
  targetUrl: string;
  redirectCode: number;
  createdAt: string;
  updatedAt: string;
};

function toResponse(route: RouteModel): RouteResponse {
  return {
    id: route.id,
    hireId: route.hireId,
    host: route.host,
    path: route.path,
    targetUrl: route.targetUrl,
    redirectCode: route.redirectCode,
    createdAt: route.createdAt.toISOString(),
    updatedAt: route.updatedAt.toISOString(),
  };
}

async function ensureHireOwnership(hireId: string, userId: string) {
  const hire = await db.query.hires.findFirst({
    where: eq(hires.id, hireId),
    with: {
      listing: true,
    },
  });

  if (!hire) {
    throw new HTTPException(404, { message: "Hire not found" });
  }

  if (hire.hirerId !== userId) {
    throw new HTTPException(403, {
      message: "You do not have permission to access this hire",
    });
  }

  return hire;
}

router.use("/*", requireAuth);

router.get("/:hireId/routes", async (c) => {
	const user = c.get("user");
	const { hireId } = c.req.param();

	await ensureHireOwnership(hireId, user.id);

	const hireRoutes = await db
		.select()
		.from(routes)
		.where(eq(routes.hireId, hireId))
		.orderBy(desc(routes.createdAt));

	return c.json(hireRoutes.map((route) => toResponse(route)));
});

router.post("/:hireId/routes", async (c) => {
	const user = c.get("user");
	const { hireId } = c.req.param();
	const body = await c.req.json();

	const parsed = createRouteSchema.parse(body);
	const { host, path, targetUrl, redirectCode } = parsed.data;
	const normalizedHost = normalizeRouteHost(host);
	let normalizedPath: string;
	try {
		normalizedPath = normalizeRoutePath(path);
	} catch (error) {
		return c.json(
			{ error: error instanceof Error ? error.message : "Invalid path" },
			400,
		);
	}

	const normalizedUrl = normalizeUrl(targetUrl);

	if (!isValidRedirectUrl(normalizedUrl)) {
		throw new HTTPException(400, {
			message: "Target URL must be an http or https URL",
		});
	}

	const payload = {
		host: normalizedHost,
		path: normalizedPath,
		targetUrl: normalizedUrl,
		redirectCode,
	};

	await ensureHireOwnership(hireId, user.id);

	const conflict = await checkRouteConflict(
		hireId,
		normalizedHost,
		normalizedPath,
	);

	if (conflict) {
		throw new HTTPException(409, {
			message: "Route already exists for this host and path",
		});
	}

	const [createdRoute] = await db
		.insert(routes)
		.values({ hireId, ...payload })
		.returning();

	const coordinatorId = c.env.ROUTE_COORDINATOR.idFromName("global");
	const coordinatorStub = c.env.ROUTE_COORDINATOR.get(coordinatorId) as unknown as RouteCoordinatorStub;
	try {
		await coordinatorStub.syncRoute(createdRoute.id);
	} catch (error) {
		console.error("route.syncRoute.failed", {
			routeId: createdRoute.id,
			error,
		});
	}

	return c.json(toResponse(createdRoute), 201);
});

router.patch("/:hireId/routes/:routeId", async (c) => {
	const user = c.get("user");
	const { hireId, routeId } = c.req.param();
	const body = await c.req.json();
	const payload = updateRouteSchema.parse(body);

	await ensureHireOwnership(hireId, user.id);

	const existingRoute = await db.query.routes.findFirst({
		where: (route, { eq }) =>
			eq(route.id, routeId) && eq(route.hireId, hireId),
	});

	if (!existingRoute) {
		throw new HTTPException(404, { message: "Route not found" });
	}

	const nextHost =
		payload.host !== undefined ? normalizeRouteHost(payload.host) : existingRoute.host;
	let nextPath = existingRoute.path;
	if (payload.path !== undefined) {
		try {
			nextPath = normalizeRoutePath(payload.path);
		} catch (error) {
			return c.json(
				{ error: error instanceof Error ? error.message : "Invalid path" },
				400,
			);
		}
	}

	let nextTargetUrl = existingRoute.targetUrl;
	if (payload.targetUrl !== undefined) {
		nextTargetUrl = normalizeUrl(payload.targetUrl);
		if (!isValidRedirectUrl(nextTargetUrl)) {
			throw new HTTPException(400, {
				message: "Target URL must be an http or https URL",
			});
		}
	}

	if (nextHost !== existingRoute.host || nextPath !== existingRoute.path) {
		const conflict = await checkRouteConflict(
			hireId,
			nextHost,
			nextPath,
			routeId,
		);

		if (conflict) {
			throw new HTTPException(409, {
				message: "Route already exists for this host and path",
			});
		}
	}

  const updatePayload: Partial<typeof routes.$inferInsert> = {
    host: nextHost,
    path: nextPath,
    targetUrl: nextTargetUrl,
    updatedAt: new Date(),
  };

  if (payload.redirectCode !== undefined) {
    updatePayload.redirectCode = payload.redirectCode;
  }

	const [updatedRoute] = await db
		.update(routes)
		.set(updatePayload)
		.where(eq(routes.id, routeId))
		.returning();

	const coordinatorId = c.env.ROUTE_COORDINATOR.idFromName("global");
	const coordinatorStub = c.env.ROUTE_COORDINATOR.get(coordinatorId) as unknown as RouteCoordinatorStub;
	try {
		await coordinatorStub.syncRoute(updatedRoute.id, {
			host: existingRoute.host,
			path: existingRoute.path,
			hireId: hireId,
		});
	} catch (error) {
		console.error("route.syncRoute.failed", {
			routeId: updatedRoute.id,
			error,
		});
	}

	try {
		await coordinatorStub.invalidateRoute(existingRoute.host, existingRoute.path, hireId, routeId);
	} catch (error) {
		console.error("route.invalidateRoute.failed", {
			routeId,
			error,
		});
	}

	return c.json(toResponse(updatedRoute));
});

router.delete("/:hireId/routes/:routeId", async (c) => {
	const user = c.get("user");
	const { hireId, routeId } = c.req.param();

	await ensureHireOwnership(hireId, user.id);

	const existingRoute = await db.query.routes.findFirst({
		where: (route, { eq }) =>
			eq(route.id, routeId) && eq(route.hireId, hireId),
	});

	if (!existingRoute) {
		throw new HTTPException(404, { message: "Route not found" });
	}

	await db.delete(routes).where(eq(routes.id, routeId));

	const coordinatorId = c.env.ROUTE_COORDINATOR.idFromName("global");
	const coordinatorStub = c.env.ROUTE_COORDINATOR.get(coordinatorId) as unknown as RouteCoordinatorStub;
	try {
		await coordinatorStub.invalidateRoute(existingRoute.host, existingRoute.path, hireId, routeId);
	} catch (error) {
		console.error("route.invalidateRoute.failed", {
			routeId,
			error,
		});
	}

	return c.body(null, 204);
});

router.post("/:hireId/routes/bulk", async (c) => {
	const user = c.get("user");
	const { hireId } = c.req.param();
  const body = await c.req.json();
  const payload = bulkRouteSchema.parse(body);

	await ensureHireOwnership(hireId, user.id);

  const errors: Array<{
    index: number;
    errors: Array<{ field: string; message: string }>;
  }> = [];
  const validRoutes: Array<typeof routes.$inferInsert> = [];

  for (const [index, route] of payload.entries()) {
    let normalizedPath: string;
    try {
      normalizedPath = normalizeRoutePath(route.path);
    } catch (error) {
      errors.push({
        index,
        errors: [
          {
            field: "path",
            message: error instanceof Error ? error.message : "Invalid path",
          },
        ],
      });
      continue;
    }

    const normalizedUrl = normalizeUrl(route.targetUrl);
    const isUrlValid = isValidRedirectUrl(normalizedUrl);

    if (!isUrlValid) {
      errors.push({
        index,
        errors: [
          {
            field: "targetUrl",
            message: "Target URL must be an http or https URL",
          },
        ],
      });
      continue;
    }

    const conflict = await checkRouteConflict(
      hireId,
      route.host,
      normalizedPath,
    );

    if (conflict) {
      errors.push({
        index,
        errors: [
          {
            field: "host",
            message: "A route with this host and path already exists",
          },
        ],
      });
      continue;
    }

    validRoutes.push({
      hireId,
      host: route.host,
      path: normalizedPath,
      targetUrl: normalizedUrl,
      redirectCode: route.redirectCode,
    });
  }

	if (errors.length > 0) {
		return c.json(
			{
				created: [],
				failed: errors,
				summary: {
          total: payload.length,
					created: 0,
					failed: errors.length,
				},
			},
			400,
		);
	}

	const createdRoutes = await db.transaction(async (tx) =>
		tx
			.insert(routes)
			.values(validRoutes)
			.returning(),
	);

	const coordinatorId = c.env.ROUTE_COORDINATOR.idFromName("global");
	const coordinatorStub = c.env.ROUTE_COORDINATOR.get(coordinatorId) as unknown as RouteCoordinatorStub;
	for (let index = 0; index < createdRoutes.length; index++) {
		const record = createdRoutes[index];
		if (record) {
			created.push(record);
			try {
				await coordinatorStub.syncRoute(record.id);
			} catch (error) {
				console.error("route.syncRoute.failed", {
					routeId: record.id,
					error,
				});
			}
		}
	}

	return c.json(
		{
			created: createdRoutes.map((route) => toResponse(route)),
			failed: [],
			summary: {
        total: payload.length,
				created: createdRoutes.length,
				failed: 0,
			},
		},
		201,
	);
});

export default router;

