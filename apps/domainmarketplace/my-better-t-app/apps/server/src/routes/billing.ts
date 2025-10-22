import { Hono } from "hono";
import { z } from "zod";
import { desc, eq } from "drizzle-orm";

import { db } from "@my-better-t-app/db";
import { hires } from "@my-better-t-app/db/schema/hires";
import { listings } from "@my-better-t-app/db/schema/listings";
import { domains } from "@my-better-t-app/db/schema/domains";
import { user as users } from "@my-better-t-app/db/schema/auth";
import { invoices, payouts, usageLedger } from "@my-better-t-app/db/schema/billing";

import {
	authMiddleware,
	requireAuth,
	type AuthenticatedVariables,
} from "../middleware/auth";
import { getStripeClient, generateIdempotencyKey } from "../lib/stripe-client";
import {
	createOrGetCustomer,
	createPeriodPaymentIntent,
	recordUsage,
} from "../lib/stripe-billing";
import { getAccountStatus } from "../lib/stripe-connect";
import type { CloudflareBindings } from "../types/bindings";

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const router = new Hono<AuthenticatedVariables & { Bindings: CloudflareBindings }>();

router.use("*", authMiddleware);

const periodCheckoutSchema = z.object({
	hireId: z.string().min(1),
});

const usageReportSchema = z.object({
	hireId: z.string().min(1),
	day: z.string().regex(DATE_REGEX, "day must be YYYY-MM-DD").optional(),
	clicks: z.number().int().nonnegative(),
	force: z.boolean().optional(),
});

function parseFeePercent(env: CloudflareBindings): number {
	const raw = env.STRIPE_PLATFORM_FEE_PERCENT;
	const parsed = raw !== undefined ? Number(raw) : 4;
	return Number.isFinite(parsed) && parsed >= 0 ? parsed : 4;
}

router.post("/period/checkout", requireAuth, async (c) => {
	const user = c.get("user");
	if (!user) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	const body = await c.req.json().catch(() => ({}));
	const parsed = periodCheckoutSchema.safeParse(body);
	if (!parsed.success) {
		return c.json({ error: "Invalid request" }, 400);
	}

	const { hireId } = parsed.data;

	try {
		const [row] = await db
			.select({
				hire: hires,
				listing: listings,
				domain: domains,
				owner: users,
			})
			.from(hires)
			.innerJoin(listings, eq(listings.id, hires.listingId))
			.innerJoin(domains, eq(domains.id, listings.domainId))
			.innerJoin(users, eq(users.id, domains.ownerId))
			.where(eq(hires.id, hireId))
			.limit(1);

		if (!row) {
			return c.json({ error: "Hire not found" }, 404);
		}

		if (row.hire.hirerId !== user.id) {
			return c.json({ error: "Forbidden" }, 403);
		}

		if (row.hire.type !== "period") {
			return c.json({ error: "Hire is not configured for period billing" }, 400);
		}

		if (row.listing.pricePeriodCents === null) {
			return c.json({ error: "Listing is missing period pricing" }, 400);
		}

		if (!row.owner.stripeConnectAccountId) {
			return c.json({ error: "Listing owner has not completed payouts setup" }, 409);
		}

		// Verify the owner's Connect account is ready to receive charges
		const stripe = getStripeClient(c.env);
		const accountStatus = await getAccountStatus(stripe, row.owner.stripeConnectAccountId);
		
		if (!accountStatus.chargesEnabled) {
			return c.json({ 
				error: "Listing owner must complete Stripe Connect onboarding before accepting payments" 
			}, 409);
		}

		const [renterRecord] = await db
			.select()
			.from(users)
			.where(eq(users.id, user.id))
			.limit(1);

		if (!renterRecord || !renterRecord.email) {
			return c.json({ error: "Unable to resolve renter profile" }, 400);
		}

		let customerId = row.rental.stripeCustomerId;
		if (!customerId) {
			customerId = await createOrGetCustomer(stripe, renterRecord.email, renterRecord.id, {
				rentalId,
			});
			await db
				.update(rentals)
				.set({ stripeCustomerId: customerId, updatedAt: new Date() })
				.where(eq(rentals.id, rentalId));
		}

		const feePercent = parseFeePercent(c.env);
		const amountCents = row.listing.pricePeriodCents ?? 0;
		const currency = row.listing.currency ?? "USD";

		const { clientSecret, paymentIntentId } = await createPeriodPaymentIntent(stripe, {
			amountCents,
			currency,
			customerId,
			ownerAccountId: row.owner.stripeConnectAccountId,
			rentalId,
			feePercent,
		});

		// Insert invoice record with the PaymentIntent ID
		const [invoiceRecord] = await db
			.insert(invoices)
			.values({
				rentalId,
				stripeInvoiceId: paymentIntentId,
				amountCents,
				type: "period",
				status: "open",
			})
			.returning({ id: invoices.id })
			.onConflictDoUpdate({
				target: invoices.stripeInvoiceId,
				set: {
					amountCents,
					status: "open",
					updatedAt: new Date(),
				},
			});

		return c.json({ 
			clientSecret, 
			invoiceId: invoiceRecord?.id ?? null 
		});
	} catch (error) {
		console.error("period checkout failed", {
			rentalId,
			userId: user.id,
			error,
		});
		return c.json({ error: "Unable to create checkout session" }, 500);
	}
});

router.post("/usage/report", async (c) => {
	const sharedSecret = c.env.USAGE_REPORT_TOKEN;
	if (!sharedSecret) {
		console.error("usage reporting disabled: missing USAGE_REPORT_TOKEN binding");
		return c.json({ error: "Usage reporting not configured" }, 500);
	}

	const token = c.req.header("x-usage-reporter-token");
	if (!token || token !== sharedSecret) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	const body = await c.req.json().catch(() => ({}));
	const parsed = usageReportSchema.safeParse(body);
	if (!parsed.success) {
		return c.json({ error: "Invalid request" }, 400);
	}

	let { rentalId, day, clicks, force } = parsed.data;

	// If day is not provided, compute yesterday's date
	if (!day) {
		const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
		day = yesterday.toISOString().split('T')[0];
	}

	try {
		const [rentalRow] = await db
			.select({ rental: rentals })
			.from(rentals)
			.where(eq(rentals.id, rentalId))
			.limit(1);

		if (!rentalRow) {
			return c.json({ error: "Rental not found" }, 404);
		}

		const rental = rentalRow.rental;
		if (rental.type !== "per_click") {
			return c.json({ error: "Rental is not usage based" }, 400);
		}

		if (!rental.stripeSubscriptionItemId) {
			return c.json({ error: "Rental does not have an active subscription" }, 409);
		}

		if (!day) {
			return c.json({ error: "day parameter is required" }, 400);
		}

		const idempotencyKey = generateIdempotencyKey(
			"usage",
			rental.stripeSubscriptionItemId,
			day,
		);

		const [existing] = await db
			.select()
			.from(usageLedger)
			.where(eq(usageLedger.idempotencyKey, idempotencyKey))
			.limit(1);

		if (existing && !force) {
			return c.json({ status: "duplicate" }, 200);
		}

		if (clicks === 0 && !force) {
			return c.json({ status: "ignored" }, 200);
		}

		const asDate = new Date(`${day}T23:59:59Z`);
		if (Number.isNaN(asDate.getTime())) {
			return c.json({ error: "Invalid day value" }, 400);
		}

		const stripe = getStripeClient(c.env);
		await recordUsage(
			stripe,
			rental.stripeSubscriptionItemId,
			clicks,
			Math.floor(asDate.getTime() / 1000),
			idempotencyKey,
		);

		await db
			.insert(usageLedger)
			.values({
				rentalId,
				subscriptionItemId: rental.stripeSubscriptionItemId,
				day, // day is already a string in YYYY-MM-DD format
				clicksSent: clicks,
				idempotencyKey,
				sentAt: new Date(),
				status: "sent",
			})
			.onConflictDoUpdate({
				target: usageLedger.idempotencyKey,
				set: {
					clicksSent: clicks,
					sentAt: new Date(),
					status: "sent",
				},
			});

		return c.json({ status: "accepted" }, 202);
	} catch (error) {
		console.error("usage reporting failed", {
			rentalId,
			day,
			error,
		});
		return c.json({ error: "Unable to record usage" }, 500);
	}
});

router.get("/invoices", requireAuth, async (c) => {
	const user = c.get("user");
	if (!user) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	try {
		const rows = await db
			.select({ invoice: invoices, rental: rentals })
			.from(invoices)
			.leftJoin(rentals, eq(invoices.rentalId, rentals.id))
			.where(eq(rentals.renterId, user.id))
			.orderBy(desc(invoices.createdAt));

		const payload = rows.map(({ invoice, rental }) => ({
			id: invoice.id,
			stripeInvoiceId: invoice.stripeInvoiceId,
			amountCents: invoice.amountCents,
			type: invoice.type,
			status: invoice.status,
			rentalId: rental?.id ?? null,
			createdAt: invoice.createdAt.toISOString(),
			updatedAt: invoice.updatedAt.toISOString(),
		}));

		return c.json(payload);
	} catch (error) {
		console.error("list invoices failed", { userId: user.id, error });
		return c.json({ error: "Unable to load invoices" }, 500);
	}
});

router.get("/payouts", requireAuth, async (c) => {
	const user = c.get("user");
	if (!user) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	try {
		const rows = await db
			.select()
			.from(payouts)
			.where(eq(payouts.ownerId, user.id))
			.orderBy(desc(payouts.createdAt));

		const payload = rows.map((record) => ({
			id: record.id,
			amountCents: record.amountCents,
			status: record.status,
			stripeTransferId: record.stripeTransferId ?? null,
			periodStart: record.periodStart ? record.periodStart.toISOString() : null,
			periodEnd: record.periodEnd ? record.periodEnd.toISOString() : null,
			createdAt: record.createdAt.toISOString(),
			updatedAt: record.updatedAt.toISOString(),
		}));

		return c.json(payload);
	} catch (error) {
		console.error("list payouts failed", { userId: user.id, error });
		return c.json({ error: "Unable to load payouts" }, 500);
	}
});

export default router;

