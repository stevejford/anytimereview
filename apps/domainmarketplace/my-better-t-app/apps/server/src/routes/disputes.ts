import { Hono } from "hono";
import { z } from "zod";
import { and, desc, eq, or } from "drizzle-orm";

import { db } from "@my-better-t-app/db";
import { disputes } from "@my-better-t-app/db/schema/disputes";
import { hires } from "@my-better-t-app/db/schema/hires";
import { listings } from "@my-better-t-app/db/schema/listings";
import { domains } from "@my-better-t-app/db/schema/domains";
import { user } from "@my-better-t-app/db/schema/auth";
import { invoices } from "@my-better-t-app/db/schema/billing";

import {
	authMiddleware,
	requireAuth,
	requireAdmin,
	type AuthenticatedVariables,
} from "../middleware/auth";
import { getStripeClient } from "../lib/stripe-client";
import { createRefund, createCreditNote } from "../lib/stripe-refunds";
import type { CloudflareBindings } from "../types/bindings";

const createDisputeSchema = z.object({
	hireId: z.string(),
	reason: z.string().min(10).max(2000),
	category: z.enum(["ivt", "quality", "billing", "other"]).optional(),
});

const searchDisputesSchema = z.object({
	status: z.enum(["open", "investigating", "resolved", "rejected"]).optional(),
	claimantRole: z.enum(["owner", "hirer"]).optional(),
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(50).default(10),
});

const resolveDisputeSchema = z.object({
	status: z.enum(["resolved", "rejected"]),
	resolution: z.string().min(10).max(2000),
	creditAmountCents: z.number().int().min(0).optional(),
});

type DisputeJoinRow = {
	dispute: typeof disputes.$inferSelect;
	hire: typeof hires.$inferSelect | null;
	listing: typeof listings.$inferSelect | null;
	domain: typeof domains.$inferSelect | null;
	claimant: typeof user.$inferSelect | null;
};

function toResponse(row: DisputeJoinRow) {
	const { dispute, hire, listing, domain, claimant } = row;

	return {
		id: dispute.id,
		hireId: dispute.hireId,
		claimantId: dispute.claimantId,
		claimantRole: dispute.claimantRole as "owner" | "hirer",
		reason: dispute.reason,
		category: dispute.category,
		status: dispute.status as "open" | "investigating" | "resolved" | "rejected",
		resolution: dispute.resolution,
		creditAmountCents: dispute.creditAmountCents,
		stripeReferenceId: dispute.stripeReferenceId,
		resolvedAt: dispute.resolvedAt ? dispute.resolvedAt.toISOString() : null,
		resolvedBy: dispute.resolvedBy,
		createdAt: dispute.createdAt.toISOString(),
		updatedAt: dispute.updatedAt.toISOString(),
		hire: hire && listing && domain
			? {
				id: hire.id,
				type: hire.type,
				status: hire.status,
				listing: {
					id: listing.id,
					mode: listing.mode,
					domain: {
						id: domain.id,
						fqdn: domain.fqdn,
					},
				},
			}
			: null,
		claimant: claimant
			? {
				id: claimant.id,
				name: claimant.name,
				email: claimant.email,
			}
			: null,
	};
}

const router = new Hono<AuthenticatedVariables>();

router.use("*", authMiddleware);

router.post("/", requireAuth, async (c) => {
	try {
		const user = c.get("user")!;
		const body = await c.req.json().catch(() => ({}));
		const parsed = createDisputeSchema.safeParse(body);

		if (!parsed.success) {
			return c.json({ error: "Invalid request" }, 400);
		}

		const { hireId, reason, category } = parsed.data;

		const [hireRow] = await db
			.select({ hire: hires, listing: listings, domain: domains })
			.from(hires)
			.innerJoin(listings, eq(hires.listingId, listings.id))
			.innerJoin(domains, eq(listings.domainId, domains.id))
			.where(eq(hires.id, hireId))
			.limit(1);

		if (!hireRow) {
			return c.json({ error: "Hire not found" }, 404);
		}

		let claimantRole: "owner" | "hirer";
		if (hireRow.hire.hirerId === user.id) {
			claimantRole = "hirer";
		} else if (hireRow.domain.ownerId === user.id) {
			claimantRole = "owner";
		} else {
			return c.json({ error: "Forbidden" }, 403);
		}

		const [newDispute] = await db
			.insert(disputes)
			.values({
				hireId,
				claimantId: user.id,
				claimantRole,
				reason,
				category: category ?? null,
				status: "open",
			})
			.returning();

		if (!newDispute) {
			return c.json({ error: "Unable to create dispute" }, 500);
		}

		return c.json(
			toResponse({
				dispute: newDispute,
				hire: hireRow.hire,
				listing: hireRow.listing,
				domain: hireRow.domain,
				claimant: null,
			}),
			201,
		);
	} catch (error) {
		console.error("Error creating dispute:", error);
		return c.json({ error: "Internal server error" }, 500);
	}
});

router.get("/", requireAdmin, async (c) => {
	try {
		const parsed = searchDisputesSchema.safeParse({
			status: c.req.query("status") ?? undefined,
			claimantRole: c.req.query("claimantRole") ?? undefined,
			page: c.req.query("page") ?? undefined,
			limit: c.req.query("limit") ?? undefined,
		});

		if (!parsed.success) {
			return c.json({ error: "Invalid request" }, 400);
		}

		const { status, claimantRole, page, limit } = parsed.data;
		const offset = (page - 1) * limit;

		const conditions = [];
		if (status) {
			conditions.push(eq(disputes.status, status));
		}
		if (claimantRole) {
			conditions.push(eq(disputes.claimantRole, claimantRole));
		}

		const rows = await db
			.select({
				dispute: disputes,
				rental: rentals,
				listing: listings,
				domain: domains,
				claimant: user,
			})
			.from(disputes)
			.leftJoin(rentals, eq(disputes.rentalId, rentals.id))
			.leftJoin(listings, eq(rentals.listingId, listings.id))
			.leftJoin(domains, eq(listings.domainId, domains.id))
			.leftJoin(user, eq(disputes.claimantId, user.id))
			.where(conditions.length > 0 ? and(...conditions) : undefined)
			.orderBy(desc(disputes.createdAt))
			.limit(limit)
			.offset(offset);

		return c.json(rows.map((row) => toResponse(row)));
	} catch (error) {
		console.error("Error fetching disputes:", error);
		return c.json({ error: "Internal server error" }, 500);
	}
});

router.get("/:id", requireAdmin, async (c) => {
	try {
		const disputeId = c.req.param("id");

		const [row] = await db
			.select({
				dispute: disputes,
				rental: rentals,
				listing: listings,
				domain: domains,
				claimant: user,
			})
			.from(disputes)
			.leftJoin(rentals, eq(disputes.rentalId, rentals.id))
			.leftJoin(listings, eq(rentals.listingId, listings.id))
			.leftJoin(domains, eq(listings.domainId, domains.id))
			.leftJoin(user, eq(disputes.claimantId, user.id))
			.where(eq(disputes.id, disputeId))
			.limit(1);

		if (!row) {
			return c.json({ error: "Dispute not found" }, 404);
		}

		return c.json(toResponse(row));
	} catch (error) {
		console.error("Error fetching dispute:", error);
		return c.json({ error: "Internal server error" }, 500);
	}
});

router.patch("/:id", requireAdmin, async (c) => {
	try {
		const disputeId = c.req.param("id");
		const adminUser = c.get("user")!;
		const body = await c.req.json().catch(() => ({}));
		const parsed = resolveDisputeSchema.safeParse(body);

		if (!parsed.success) {
			return c.json({ error: "Invalid request" }, 400);
		}

		const { status, resolution, creditAmountCents } = parsed.data;

		const [disputeRow] = await db
			.select({
				dispute: disputes,
				rental: rentals,
				listing: listings,
				domain: domains,
				invoice: invoices,
			})
			.from(disputes)
			.leftJoin(rentals, eq(disputes.rentalId, rentals.id))
			.leftJoin(listings, eq(rentals.listingId, listings.id))
			.leftJoin(domains, eq(listings.domainId, domains.id))
			.leftJoin(invoices, eq(invoices.rentalId, rentals.id))
			.where(eq(disputes.id, disputeId))
			.limit(1);

		if (!disputeRow) {
			return c.json({ error: "Dispute not found" }, 404);
		}

		let stripeRefundId: string | null = null;

		if (status === "resolved" && creditAmountCents && creditAmountCents > 0) {
			const stripe = getStripeClient(c.env as CloudflareBindings);

			if (disputeRow.rental?.type === "per_click") {
				if (!disputeRow.invoice?.stripeInvoiceId) {
					return c.json({ error: "No invoice found for credit" }, 400);
				}
				stripeRefundId = await createCreditNote(
					stripe,
					disputeRow.invoice.stripeInvoiceId,
					creditAmountCents,
					resolution,
					{
						disputeId,
						rentalId: disputeRow.rental.id,
						category: disputeRow.dispute.category ?? "other",
					},
				);
			} else if (disputeRow.rental?.type === "period") {
				if (!disputeRow.invoice?.stripePaymentIntentId) {
					return c.json({ error: "No payment intent found for refund" }, 400);
				}
				stripeRefundId = await createRefund(
					stripe,
					disputeRow.invoice.stripePaymentIntentId,
					creditAmountCents,
					"requested_by_customer",
					{
						disputeId,
						rentalId: disputeRow.rental.id,
						category: disputeRow.dispute.category ?? "other",
					},
				);
			}
		}

		const [updatedDispute] = await db
			.update(disputes)
			.set({
				status,
				resolution,
				creditAmountCents: creditAmountCents ?? null,
				stripeReferenceId: stripeRefundId,
				resolvedAt: new Date(),
				resolvedBy: adminUser.id,
				updatedAt: new Date(),
			})
			.where(eq(disputes.id, disputeId))
			.returning();

		if (!updatedDispute) {
			return c.json({ error: "Unable to update dispute" }, 500);
		}

		return c.json(
			toResponse({
				dispute: updatedDispute,
				rental: disputeRow.rental,
				listing: disputeRow.listing,
				domain: disputeRow.domain,
				claimant: null,
			}),
		);
	} catch (error) {
		console.error("Error resolving dispute:", error);
		return c.json({ error: "Internal server error" }, 500);
	}
});

export default router;

