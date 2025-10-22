import { Hono } from "hono";
import { z } from "zod";
import { and, desc, eq, ilike, or } from "drizzle-orm";

import { db } from "@my-better-t-app/db";
import { listings } from "@my-better-t-app/db/schema/listings";
import { domains } from "@my-better-t-app/db/schema/domains";
import { user } from "@my-better-t-app/db/schema/auth";

import {
	authMiddleware,
	requireAdmin,
	type AuthenticatedVariables,
} from "../middleware/auth";

// Zod schemas
const searchListingsSchema = z.object({
	search: z.string().optional(),
	status: z.enum(["draft", "active", "paused"]).optional(),
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(100).default(20),
});

const moderateListingSchema = z.object({
	status: z.enum(["active", "paused"]),
	reason: z.string().min(10).max(500).optional(),
});

const searchUsersSchema = z.object({
	search: z.string().optional(),
	role: z.enum(["owner", "hirer", "admin"]).optional(),
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(100).default(20),
});

const moderateUserSchema = z.object({
	action: z.enum(["suspend", "unsuspend", "ban"]),
	reason: z.string().min(10).max(500),
});

// Response helpers
function listingToResponse(
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
				ownerId: domainRecord.ownerId,
			}
			: null,
	};
}

function userToResponse(record: typeof user.$inferSelect) {
	return {
		id: record.id,
		name: record.name,
		email: record.email,
		role: record.role,
		suspended: record.suspended,
		suspendedAt: record.suspendedAt?.toISOString() ?? null,
		suspendedReason: record.suspendedReason ?? null,
		bannedAt: record.bannedAt?.toISOString() ?? null,
		stripeConnectAccountId: record.stripeConnectAccountId ?? null,
		stripeConnectOnboardingComplete: record.stripeConnectOnboardingComplete,
		createdAt: record.createdAt.toISOString(),
		updatedAt: record.updatedAt.toISOString(),
	};
}

const router = new Hono<AuthenticatedVariables>();

// GET /listings - Admin listings moderation queue
router.get("/listings", requireAdmin, async (c) => {
	const parsed = searchListingsSchema.safeParse({
		search: c.req.query("search") ?? undefined,
		status: c.req.query("status") ?? undefined,
		page: c.req.query("page") ?? undefined,
		limit: c.req.query("limit") ?? undefined,
	});

	if (!parsed.success) {
		return c.json({ error: "Invalid request" }, 400);
	}

	const { search, status, page, limit } = parsed.data;

	const conditions = [];
	if (status) {
		conditions.push(eq(listings.status, status));
	}
	if (search) {
		conditions.push(ilike(domains.fqdn, `%${search}%`));
	}

	const baseQuery = db
		.select({ listing: listings, domain: domains })
		.from(listings)
		.innerJoin(domains, eq(listings.domainId, domains.id))
		.where(conditions.length > 0 ? and(...conditions) : undefined)
		.orderBy(desc(listings.createdAt));

	const rowsQuery = baseQuery.limit(limit).offset((page - 1) * limit);

	const rows = await rowsQuery;

	return c.json(rows.map((row) => listingToResponse(row.listing, row.domain)));
});

// PATCH /listings/:id - Moderate a listing
router.patch("/listings/:id", requireAdmin, async (c) => {
	const listingId = c.req.param("id");
	const body = await c.req.json().catch(() => ({}));
	const parsed = moderateListingSchema.safeParse(body);

	if (!parsed.success) {
		return c.json({ error: "Invalid request" }, 400);
	}

	const { status, reason } = parsed.data;

	// Verify listing exists
	const [row] = await db
		.select({ listing: listings, domain: domains })
		.from(listings)
		.innerJoin(domains, eq(listings.domainId, domains.id))
		.where(eq(listings.id, listingId))
		.limit(1);

	if (!row) {
		return c.json({ error: "Listing not found" }, 404);
	}

	// Update listing status
	const [updated] = await db
		.update(listings)
		.set({ status, updatedAt: new Date() })
		.where(eq(listings.id, listingId))
		.returning();

	if (!updated) {
		return c.json({ error: "Unable to update listing" }, 500);
	}

	// Note: For MVP, reason is not stored. Consider adding an audit_log table in future.

	return c.json(listingToResponse(updated, row.domain));
});

// GET /users - Admin user management
router.get("/users", requireAdmin, async (c) => {
	const parsed = searchUsersSchema.safeParse({
		search: c.req.query("search") ?? undefined,
		role: c.req.query("role") ?? undefined,
		page: c.req.query("page") ?? undefined,
		limit: c.req.query("limit") ?? undefined,
	});

	if (!parsed.success) {
		return c.json({ error: "Invalid request" }, 400);
	}

	const { search, role, page, limit } = parsed.data;

	const conditions = [];
	if (role) {
		conditions.push(eq(user.role, role));
	}
	if (search) {
		conditions.push(
			or(
				ilike(user.email, `%${search}%`),
				ilike(user.name, `%${search}%`),
			),
		);
	}

	const baseQuery = db
		.select()
		.from(user)
		.where(conditions.length > 0 ? and(...conditions) : undefined)
		.orderBy(desc(user.createdAt));

	const rowsQuery = baseQuery.limit(limit).offset((page - 1) * limit);

	const rows = await rowsQuery;

	return c.json(rows.map((row) => userToResponse(row)));
});

// PATCH /users/:id - Moderate a user
router.patch("/users/:id", requireAdmin, async (c) => {
	const userId = c.req.param("id");
	const adminUser = c.get("user")!;
	const body = await c.req.json().catch(() => ({}));
	const parsed = moderateUserSchema.safeParse(body);

	if (!parsed.success) {
		return c.json({ error: "Invalid request" }, 400);
	}

	const { action, reason } = parsed.data;

	// Prevent self-moderation
	if (userId === adminUser.id) {
		return c.json({ error: "Cannot moderate your own account" }, 400);
	}

	// Verify user exists
	const [existingUser] = await db
		.select()
		.from(user)
		.where(eq(user.id, userId))
		.limit(1);

	if (!existingUser) {
		return c.json({ error: "User not found" }, 404);
	}

	// Apply moderation action
	let updatePayload: Partial<typeof user.$inferInsert> = {
		updatedAt: new Date(),
	};

	switch (action) {
		case "suspend":
			updatePayload = {
				...updatePayload,
				suspended: true,
				suspendedAt: new Date(),
				suspendedReason: reason,
			};
			break;
		case "unsuspend":
			updatePayload = {
				...updatePayload,
				suspended: false,
				suspendedAt: null,
				suspendedReason: null,
			};
			break;
		case "ban":
			updatePayload = {
				...updatePayload,
				suspended: true,
				suspendedAt: new Date(),
				bannedAt: new Date(),
				suspendedReason: reason,
			};
			break;
	}

	const [updated] = await db
		.update(user)
		.set(updatePayload)
		.where(eq(user.id, userId))
		.returning();

	if (!updated) {
		return c.json({ error: "Unable to update user" }, 500);
	}

	return c.json(userToResponse(updated));
});

export default router;

