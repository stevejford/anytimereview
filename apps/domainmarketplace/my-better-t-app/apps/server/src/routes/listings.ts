import { Hono } from "hono";
import { z } from "zod";
import { and, desc, eq, ilike } from "drizzle-orm";

import { db } from "@my-better-t-app/db";
import { listings } from "@my-better-t-app/db/schema/listings";
import { domains } from "@my-better-t-app/db/schema/domains";

import {
	authMiddleware,
	requireAuth,
	type AuthenticatedVariables,
} from "../middleware/auth";

const createListingSchema = z
	.object({
		domainId: z.string(),
		mode: z.enum(["exclusive", "shared_slugs"]),
		pricePeriodCents: z.number().int().min(0).optional(),
		priceClickCents: z.number().int().min(0).optional(),
	})
	.refine(
		(data) =>
			typeof data.pricePeriodCents === "number" ||
			typeof data.priceClickCents === "number",
		{ message: "At least one pricing option is required", path: ["pricePeriodCents"] },
	);

const updateListingSchema = z
	.object({
		status: z.enum(["draft", "active", "paused"]).optional(),
		pricePeriodCents: createListingSchema.shape.pricePeriodCents.nullable(),
		priceClickCents: createListingSchema.shape.priceClickCents.nullable(),
	})
	.refine(
		(data) => {
			const touchedPricing =
				data.pricePeriodCents !== undefined || data.priceClickCents !== undefined;
			if (!touchedPricing) {
				return data.status !== undefined;
			}
			return (
				typeof data.pricePeriodCents === "number" ||
				typeof data.priceClickCents === "number"
			);
		},
		{
			message: "At least one pricing option is required",
			path: ["pricePeriodCents"],
		},
	);

const searchListingsSchema = z.object({
	search: z.string().min(1).optional(),
	status: z.enum(["draft", "active", "paused"]).optional(),
	mode: z.enum(["exclusive", "shared_slugs"]).optional(),
	page: z.coerce.number().int().min(1).optional(),
	limit: z.coerce.number().int().min(1).max(100).optional(),
});

const publicSearchSchema = z.object({
	search: z.string().min(1).optional(),
	mode: z.enum(["exclusive", "shared_slugs"]).optional(),
	page: z.coerce.number().int().min(1).optional(),
	limit: z.coerce.number().int().min(1).max(100).optional(),
});

function toResponse(
	record: typeof listings.$inferSelect,
	domainRecord?: typeof domains.$inferSelect | null,
) {
	return {
		id: record.id,
		domainId: record.domainId,
		mode: record.mode,
		pricePeriodCents: record.pricePeriodCents ?? null,
		priceClickCents: record.priceClickCents ?? null,
		currency: record.currency,
		status: record.status,
		createdAt: record.createdAt.toISOString(),
		updatedAt: record.updatedAt.toISOString(),
		domain: domainRecord
			? {
				id: domainRecord.id,
				fqdn: domainRecord.fqdn,
			}
			: null,
	};
}

const router = new Hono<AuthenticatedVariables>();

router.use("*", authMiddleware);

router.post("/", requireAuth, async (c) => {
	const user = c.get("user")!;
	const body = await c.req.json().catch(() => ({}));
	const parsed = createListingSchema.safeParse(body);
	if (!parsed.success) {
		return c.json({ error: "Invalid request" }, 400);
	}

	const { domainId, mode, pricePeriodCents, priceClickCents } = parsed.data;

	const [domainRecord] = await db
		.select()
		.from(domains)
		.where(and(eq(domains.id, domainId), eq(domains.ownerId, user.id)))
		.limit(1);

	if (!domainRecord) {
		return c.json({ error: "Domain not found" }, 404);
	}

	if (domainRecord.verificationStatus !== "verified") {
		return c.json({ error: "Domain must be verified before listing" }, 400);
	}

	const [newListing] = await db
		.insert(listings)
		.values({
			domainId,
			mode,
			pricePeriodCents: pricePeriodCents ?? null,
			priceClickCents: priceClickCents ?? null,
			currency: "USD",
		})
		.returning();

	if (!newListing) {
		return c.json({ error: "Unable to create listing" }, 500);
	}

return c.json(toResponse(newListing, domainRecord), 201);
});

router.get("/", requireAuth, async (c) => {
	const user = c.get("user")!;
	const parsed = searchListingsSchema.safeParse({
		search: c.req.query("search") ?? undefined,
		status: c.req.query("status") ?? undefined,
		mode: c.req.query("mode") ?? undefined,
		page: c.req.query("page") ?? undefined,
		limit: c.req.query("limit") ?? undefined,
	});

	if (!parsed.success) {
		return c.json({ error: "Invalid request" }, 400);
	}

	const { search, status, mode } = parsed.data;
	const page = parsed.data.page ?? 1;
	const limit = parsed.data.limit;

	const conditions = [eq(domains.ownerId, user.id)];
	if (status) {
		conditions.push(eq(listings.status, status));
	}
	if (mode) {
		conditions.push(eq(listings.mode, mode));
	}
	if (search) {
		conditions.push(ilike(domains.fqdn, `%${search}%`));
	}

	const baseQuery = db
		.select({ listing: listings, domain: domains })
		.from(listings)
		.innerJoin(domains, eq(listings.domainId, domains.id))
		.where(and(...conditions))
		.orderBy(desc(listings.createdAt));

	const rowsQuery = typeof limit === "number"
		? baseQuery.limit(limit).offset((page - 1) * limit)
		: baseQuery;

	const rows = await rowsQuery;

	return c.json(rows.map((row) => toResponse(row.listing, row.domain)));
});

router.get("/public", async (c) => {
	const parsed = publicSearchSchema.safeParse({
		search: c.req.query("search") ?? undefined,
		mode: c.req.query("mode") ?? undefined,
		page: c.req.query("page") ?? undefined,
		limit: c.req.query("limit") ?? undefined,
	});

	if (!parsed.success) {
		return c.json({ error: "Invalid request" }, 400);
	}

	const { search, mode } = parsed.data;
	const page = parsed.data.page ?? 1;
	const limit = parsed.data.limit;

	const conditions = [eq(listings.status, "active")];
	if (mode) {
		conditions.push(eq(listings.mode, mode));
	}
	if (search) {
		conditions.push(ilike(domains.fqdn, `%${search}%`));
	}

	const baseQuery = db
		.select({ listing: listings, domain: domains })
		.from(listings)
		.innerJoin(domains, eq(listings.domainId, domains.id))
		.where(and(...conditions))
		.orderBy(desc(listings.createdAt));

	const rowsQuery = typeof limit === "number"
		? baseQuery.limit(limit).offset((page - 1) * limit)
		: baseQuery;

	const rows = await rowsQuery;

	return c.json(rows.map((row) => toResponse(row.listing, row.domain)));
});

router.get("/public/:id", async (c) => {
	const listingId = c.req.param("id");
	const [row] = await db
		.select({ listing: listings, domain: domains })
		.from(listings)
		.innerJoin(domains, eq(listings.domainId, domains.id))
		.where(and(eq(listings.id, listingId), eq(listings.status, "active")))
		.limit(1);

	if (!row) {
		return c.json({ error: "Not Found" }, 404);
	}

	return c.json(toResponse(row.listing, row.domain));
});

router.get("/:id", requireAuth, async (c) => {
	const listingId = c.req.param("id");
	const user = c.get("user")!;

	const [row] = await db
		.select({ listing: listings, domain: domains })
		.from(listings)
		.innerJoin(domains, eq(listings.domainId, domains.id))
		.where(and(eq(listings.id, listingId), eq(domains.ownerId, user.id)))
		.limit(1);

	if (!row) {
		return c.json({ error: "Not Found" }, 404);
	}

	return c.json(toResponse(row.listing, row.domain));
});

router.patch("/:id", requireAuth, async (c) => {
	const listingId = c.req.param("id");
	const user = c.get("user")!;
	const body = await c.req.json().catch(() => ({}));
	const parsed = updateListingSchema.safeParse(body);

	if (!parsed.success) {
		return c.json({ error: "Invalid request" }, 400);
	}

	const hasPricePeriod = Object.prototype.hasOwnProperty.call(body, "pricePeriodCents");
	const hasPriceClick = Object.prototype.hasOwnProperty.call(body, "priceClickCents");
	const hasStatus = Object.prototype.hasOwnProperty.call(body, "status");

	if (!hasPricePeriod && !hasPriceClick && !hasStatus) {
		return c.json({ error: "No fields to update" }, 400);
	}

	const [row] = await db
		.select({ listing: listings, domain: domains })
		.from(listings)
		.innerJoin(domains, eq(listings.domainId, domains.id))
		.where(and(eq(listings.id, listingId), eq(domains.ownerId, user.id)))
		.limit(1);

	if (!row) {
		return c.json({ error: "Not Found" }, 404);
	}

	const updatePayload: Partial<typeof listings.$inferInsert> = {
		updatedAt: new Date(),
	};

	if (hasStatus && parsed.data.status !== undefined) {
		updatePayload.status = parsed.data.status;
	}
	if (hasPricePeriod) {
		updatePayload.pricePeriodCents =
			typeof parsed.data.pricePeriodCents === "number"
				? parsed.data.pricePeriodCents
				: null;
	}
	if (hasPriceClick) {
		updatePayload.priceClickCents =
			typeof parsed.data.priceClickCents === "number"
				? parsed.data.priceClickCents
				: null;
	}

	const [updated] = await db
		.update(listings)
		.set(updatePayload)
		.where(eq(listings.id, listingId))
		.returning();

	if (!updated) {
		return c.json({ error: "Unable to update listing" }, 500);
	}

	return c.json(toResponse(updated, row.domain));
});

export default router;

