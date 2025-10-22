import { Hono } from "hono";
import { z } from "zod";
import { and, desc, eq } from "drizzle-orm";

import { db } from "@my-better-t-app/db";
import { hires } from "@my-better-t-app/db/schema/hires";
import { listings } from "@my-better-t-app/db/schema/listings";
import { domains } from "@my-better-t-app/db/schema/domains";

import {
	authMiddleware,
	requireAuth,
	type AuthenticatedVariables,
} from "../middleware/auth";

const createHireSchema = z.object({
	listingId: z.string(),
	type: z.enum(["period", "per_click"]),
});

const searchHiresSchema = z.object({
	status: z.enum(["active", "ended", "suspended"]).optional(),
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(50).default(10),
});

type HireJoinRow = {
	hire: typeof hires.$inferSelect;
	listing: typeof listings.$inferSelect | null;
	domain: typeof domains.$inferSelect | null;
};

function toResponse(row: HireJoinRow) {
	const { hire, listing, domain } = row;

	return {
		id: hire.id,
		listingId: hire.listingId,
		hirerId: hire.hirerId,
		type: hire.type,
		status: hire.status as "active" | "ended" | "suspended",
		startAt: hire.startAt.toISOString(),
		endAt: hire.endAt ? hire.endAt.toISOString() : null,
		createdAt: hire.createdAt.toISOString(),
		updatedAt: hire.updatedAt.toISOString(),
		listing: listing
			? {
				id: listing.id,
				mode: listing.mode,
				domainId: listing.domainId,
				pricePeriodCents: listing.pricePeriodCents ?? null,
				priceClickCents: listing.priceClickCents ?? null,
				currency: listing.currency,
				status: listing.status,
				createdAt: listing.createdAt.toISOString(),
				updatedAt: listing.updatedAt.toISOString(),
				domain: domain
					? {
						id: domain.id,
						fqdn: domain.fqdn,
					}
					: null,
			}
			: null,
	};
}

const router = new Hono<AuthenticatedVariables>();

router.use("*", authMiddleware);

router.post("/", requireAuth, async (c) => {
	const user = c.get("user")!;
	const body = await c.req.json().catch(() => ({}));
	const parsed = createHireSchema.safeParse(body);

	if (!parsed.success) {
		return c.json({ error: "Invalid request" }, 400);
	}

	const { listingId, type } = parsed.data;

	const [listingRow] = await db
		.select({ listing: listings, domain: domains })
		.from(listings)
		.innerJoin(domains, eq(listings.domainId, domains.id))
		.where(eq(listings.id, listingId))
		.limit(1);

	if (!listingRow) {
		return c.json({ error: "Listing not found" }, 404);
	}

	if (listingRow.listing.status !== "active") {
		return c.json({ error: "Listing is not available for hire" }, 400);
	}

	if (listingRow.domain.ownerId === user.id) {
		return c.json({ error: "Cannot hire your own listing" }, 400);
	}

	if (listingRow.listing.mode === "exclusive") {
		const [existingHire] = await db
			.select({ hire: hires })
			.from(hires)
			.where(
				and(
					eq(hires.listingId, listingId),
					eq(hires.status, "active"),
				),
			)
			.limit(1);

		if (existingHire) {
			return c.json({ error: "Listing already hired" }, 409);
		}
	}

	const [newHire] = await db
		.insert(hires)
		.values({
			listingId,
			hirerId: user.id,
			type,
			status: "active",
		})
		.returning();

	if (!newHire) {
		return c.json({ error: "Unable to create hire" }, 500);
	}

	return c.json(
		toResponse({
			hire: newHire,
			listing: listingRow.listing,
			domain: listingRow.domain,
		}),
		201,
	);
});

router.get("/", requireAuth, async (c) => {
	const user = c.get("user")!;
	const parsed = searchHiresSchema.safeParse({
		status: c.req.query("status") ?? undefined,
		page: c.req.query("page") ?? undefined,
		limit: c.req.query("limit") ?? undefined,
	});

	if (!parsed.success) {
		return c.json({ error: "Invalid request" }, 400);
	}

	const { status, page, limit } = parsed.data;
	const offset = (page - 1) * limit;

	const conditions = [eq(hires.hirerId, user.id)];
	if (status) {
		conditions.push(eq(hires.status, status));
	}

	const rows = await db
		.select({ hire: hires, listing: listings, domain: domains })
		.from(hires)
		.innerJoin(listings, eq(hires.listingId, listings.id))
		.innerJoin(domains, eq(listings.domainId, domains.id))
		.where(and(...conditions))
		.orderBy(desc(hires.createdAt))
		.limit(limit)
		.offset(offset);

	return c.json(rows.map((row) => toResponse(row)));
});

router.get("/:id", requireAuth, async (c) => {
	const hireId = c.req.param("id");
	const user = c.get("user")!;

	const [row] = await db
		.select({ hire: hires, listing: listings, domain: domains })
		.from(hires)
		.leftJoin(listings, eq(hires.listingId, listings.id))
		.leftJoin(domains, eq(listings.domainId, domains.id))
		.where(eq(hires.id, hireId))
		.limit(1);

	if (!row) {
		return c.json({ error: "Hire not found" }, 404);
	}

	if (row.hire.hirerId !== user.id) {
		return c.json({ error: "Forbidden" }, 403);
	}

	return c.json(toResponse(row));
});

export default router;


