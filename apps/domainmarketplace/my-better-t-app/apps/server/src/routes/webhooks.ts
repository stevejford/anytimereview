import Stripe from "stripe";
import { Hono } from "hono";
import { Webhook } from "svix";

import { eq } from "drizzle-orm";

import { db } from "@my-better-t-app/db";
import { hires } from "@my-better-t-app/db/schema/hires";
import { listings } from "@my-better-t-app/db/schema/listings";
import { domains } from "@my-better-t-app/db/schema/domains";
import { user as users } from "@my-better-t-app/db/schema/auth";
import { invoices, payouts, stripeEvents } from "@my-better-t-app/db/schema/billing";

import { getStripeClient } from "../lib/stripe-client";
import { createTransfer } from "../lib/stripe-billing";
import {
	verifyWebhookSignature,
	isEventProcessed,
	markEventProcessed,
	getEventPayload,
} from "../lib/webhook-verification";
import type { CloudflareBindings } from "../types/bindings";

const router = new Hono<{ Bindings: CloudflareBindings }>();

router.post("/stripe", async (c) => {
	const stripe = getStripeClient(c.env);
	const signature = c.req.header("stripe-signature");
	const payload = await c.req.text();
	const secret = c.env.STRIPE_WEBHOOK_SECRET;

	if (!secret) {
		console.error("Stripe webhook secret is not configured");
		return c.json({ error: "Webhook not configured" }, 500);
	}

	if (!signature) {
		console.error("Missing stripe-signature header");
		return c.json({ error: "Invalid signature" }, 400);
	}

	const event = verifyWebhookSignature(stripe, payload, signature, secret);
	if (!event) {
		return c.json({ error: "Invalid signature" }, 400);
	}

	try {
		const alreadyHandled = await isEventProcessed(event.id);
		if (alreadyHandled) {
			return c.json({ status: "ok" }, 200);
		}

		await handleEvent(stripe, c.env, event);
		await markEventProcessed(event.id, event.type, event);

		return c.json({ status: "ok" }, 200);
	} catch (error) {
		console.error("stripe webhook handling failed", {
			eventId: event.id,
			eventType: event.type,
			error,
		});
		return c.json({ error: "Processing failed" }, 500);
	}
});

async function handleEvent(stripe: Stripe, env: CloudflareBindings, event: Stripe.Event) {
	switch (event.type) {
		case "payment_intent.succeeded":
			await handlePaymentIntentSucceeded(event);
			break;
		case "payment_intent.payment_failed":
			await handlePaymentIntentFailed(event);
			break;
		case "customer.subscription.created":
			await handleSubscriptionCreated(event);
			break;
		case "invoice.paid":
			await handleInvoicePaid(stripe, env, event);
			break;
		case "charge.refunded":
			await handleChargeRefunded(event);
			break;
		default:
			console.log("unhandled stripe event", { type: event.type });
	}
}

async function handlePaymentIntentSucceeded(event: Stripe.Event) {
	const intent = getEventPayload<Stripe.PaymentIntent>(event);
	const hireId = intent.metadata?.hireId;
	if (!hireId) return;

	// Verify destination account matches the hire owner
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
		console.error("handlePaymentIntentSucceeded: hire not found", { hireId, intentId: intent.id });
		return;
	}

	const expectedDestination = row.owner.stripeConnectAccountId;
	const actualDestination = intent.transfer_data?.destination;

	if (expectedDestination && actualDestination && expectedDestination !== actualDestination) {
		console.error("handlePaymentIntentSucceeded: destination mismatch", {
			hireId,
			intentId: intent.id,
			expectedDestination,
			actualDestination,
		});
		// Do not update invoice/hire status; manual investigation required
		return;
	}

	// Update invoice status to paid
	await db
		.update(invoices)
		.set({ status: "paid", updatedAt: new Date() })
		.where(eq(invoices.stripeInvoiceId, intent.id));

	await db
		.update(hires)
		.set({ updatedAt: new Date() })
		.where(eq(hires.id, hireId));

	if (intent.customer && typeof intent.customer === "string") {
		await db
			.update(hires)
			.set({ stripeCustomerId: intent.customer, updatedAt: new Date() })
			.where(eq(hires.id, hireId));
	}
}

async function handlePaymentIntentFailed(event: Stripe.Event) {
	const intent = getEventPayload<Stripe.PaymentIntent>(event);
	const hireId = intent.metadata?.hireId;
	if (!hireId) return;

	await db
		.insert(invoices)
		.values({
			stripeInvoiceId: intent.id,
			amountCents: intent.amount ?? 0,
			type: "period",
			status: "void",
			hireId,
		})
		.onConflictDoUpdate({
			target: invoices.stripeInvoiceId,
			set: {
				status: "void",
				updatedAt: new Date(),
			},
		});
}

async function handleSubscriptionCreated(event: Stripe.Event) {
	const subscription = getEventPayload<Stripe.Subscription>(event);
	const hireId = subscription.metadata?.hireId;
	if (!hireId) return;

	const item = subscription.items.data[0];
	if (!item) return;

	await db
		.update(hires)
		.set({
			stripeSubscriptionId: subscription.id,
			stripeSubscriptionItemId: item.id,
			updatedAt: new Date(),
		})
		.where(eq(hires.id, hireId));
}

async function handleInvoicePaid(stripe: Stripe, env: CloudflareBindings, event: Stripe.Event) {
	const invoice = getEventPayload<Stripe.Invoice>(event);
	const hireId = invoice.metadata?.hireId;
	if (!hireId) return;

	const isMetered = invoice.lines?.data[0]?.price?.recurring?.usage_type === "metered";

	await db
		.insert(invoices)
		.values({
			stripeInvoiceId: invoice.id,
			amountCents: invoice.amount_paid ?? 0,
			type: isMetered ? "usage" : "period",
			status: "paid",
			hireId,
		})
		.onConflictDoUpdate({
			target: invoices.stripeInvoiceId,
			set: {
				amountCents: invoice.amount_paid ?? 0,
				status: "paid",
				updatedAt: new Date(),
			},
		});

	// For metered billing, create payout and transfer to owner
	if (isMetered) {
		// Fetch owner information via hire -> listing -> domain -> user
		const [row] = await db
			.select({
				owner: users,
			})
			.from(hires)
			.innerJoin(listings, eq(listings.id, hires.listingId))
			.innerJoin(domains, eq(domains.id, listings.domainId))
			.innerJoin(users, eq(users.id, domains.ownerId))
			.where(eq(hires.id, hireId))
			.limit(1);

		if (!row || !row.owner.stripeConnectAccountId) {
			console.error("handleInvoicePaid: owner or Connect account not found", {
				hireId,
				invoiceId: invoice.id
			});
			// Return error to trigger Stripe retry
			throw new Error("Owner Connect account not found");
		}

		const ownerId = row.owner.id;
		const ownerAccountId = row.owner.stripeConnectAccountId;

		// Calculate platform fee and owner amount
		const feePercent = Number(env.STRIPE_PLATFORM_FEE_PERCENT ?? "4");
		const amountPaid = invoice.amount_paid ?? 0;
		const platformFee = Math.round((amountPaid * feePercent) / 100);
		const ownerAmount = amountPaid - platformFee;

		// Check if payout already exists for this invoice (idempotency)
		const [existingPayout] = await db
			.select()
			.from(payouts)
			.where(eq(payouts.stripeTransferId, invoice.id))
			.limit(1);

		if (existingPayout) {
			console.log("handleInvoicePaid: payout already exists", {
				hireId,
				invoiceId: invoice.id,
				payoutId: existingPayout.id,
			});
			return;
		}

		// Convert period timestamps to dates
		const periodStart = invoice.period_start
			? new Date(invoice.period_start * 1000)
			: null;
		const periodEnd = invoice.period_end
			? new Date(invoice.period_end * 1000)
			: null;

		// Create payout record
		const [payoutRecord] = await db
			.insert(payouts)
			.values({
				ownerId,
				amountCents: ownerAmount,
				status: "pending",
				periodStart,
				periodEnd,
			})
			.returning();

		if (!payoutRecord) {
			console.error("handleInvoicePaid: failed to create payout record", {
				hireId,
				invoiceId: invoice.id
			});
			throw new Error("Failed to create payout record");
		}

		try {
			// Create Stripe transfer
			const transferId = await createTransfer(
				stripe,
				ownerAmount,
				(invoice.currency ?? "usd").toLowerCase(),
				ownerAccountId,
				{
					hireId,
					invoiceId: invoice.id,
					payoutId: payoutRecord.id,
				}
			);

			// Update payout with transfer ID and status
			await db
				.update(payouts)
				.set({
					stripeTransferId: transferId,
					status: "paid",
					updatedAt: new Date(),
				})
				.where(eq(payouts.id, payoutRecord.id));

			console.log("handleInvoicePaid: transfer created", {
				hireId,
				invoiceId: invoice.id,
				transferId,
				ownerAmount,
			});
		} catch (error) {
			// Mark payout as failed and log error
			await db
				.update(payouts)
				.set({
					status: "failed",
					updatedAt: new Date(),
				})
				.where(eq(payouts.id, payoutRecord.id));

			console.error("handleInvoicePaid: transfer failed", {
				hireId,
				invoiceId: invoice.id,
				error,
			});

			// Rethrow to trigger Stripe retry
			throw error;
		}
	}
}

async function handleChargeRefunded(event: Stripe.Event) {
	const charge = getEventPayload<Stripe.Charge>(event);
	const hireId = charge.metadata?.hireId;
	if (!hireId) return;

	await db
		.update(invoices)
		.set({ status: "void", updatedAt: new Date() })
		.where(eq(invoices.stripeInvoiceId, charge.invoice as string));

	if (charge.transfer) {
		const transferId = typeof charge.transfer === 'string' ? charge.transfer : charge.transfer.id;
		await db
			.update(payouts)
			.set({ status: "failed", updatedAt: new Date() })
			.where(eq(payouts.stripeTransferId, transferId));
	}
}

// Clerk webhook handler for user sync
router.post("/clerk", async (c) => {
	const payload = await c.req.text();
	const svixId = c.req.header("svix-id");
	const svixTimestamp = c.req.header("svix-timestamp");
	const svixSignature = c.req.header("svix-signature");

	if (!svixId || !svixTimestamp || !svixSignature) {
		console.error("Missing svix headers");
		return c.json({ error: "Missing webhook headers" }, 400);
	}

	const secret = c.env.CLERK_WEBHOOK_SECRET;
	if (!secret) {
		console.error("Clerk webhook secret is not configured");
		return c.json({ error: "Webhook not configured" }, 500);
	}

	let event: any;
	try {
		const wh = new Webhook(secret);
		event = wh.verify(payload, {
			"svix-id": svixId,
			"svix-timestamp": svixTimestamp,
			"svix-signature": svixSignature,
		});
	} catch (error) {
		console.error("Clerk webhook verification failed", error);
		return c.json({ error: "Invalid signature" }, 400);
	}

	// Check if event already processed (idempotency)
	const [existingEvent] = await db
		.select()
		.from(stripeEvents)
		.where(eq(stripeEvents.id, svixId))
		.limit(1);

	if (existingEvent) {
		return c.json({ status: "ok" }, 200);
	}

	try {
		// Handle user.created and user.updated events
		if (event.type === "user.created" || event.type === "user.updated") {
			const clerkUser = event.data;
			const primaryEmail = clerkUser.email_addresses?.find(
				(email: any) => email.id === clerkUser.primary_email_address_id
			);

			if (!primaryEmail?.email_address) {
				console.error("Clerk user has no primary email", { userId: clerkUser.id });
				return c.json({ error: "No primary email found" }, 400);
			}

			const firstName = clerkUser.first_name || "";
			const lastName = clerkUser.last_name || "";
			const fullName = `${firstName} ${lastName}`.trim() || primaryEmail.email_address;
			const role = (clerkUser.public_metadata?.role as string) || "hirer";

			// Upsert user into local database
			await db
				.insert(users)
				.values({
					id: clerkUser.id,
					email: primaryEmail.email_address,
					name: fullName,
					role: role,
					image: clerkUser.image_url || null,
					emailVerified: !!primaryEmail.verification?.status === "verified",
					createdAt: new Date(clerkUser.created_at),
					updatedAt: new Date(clerkUser.updated_at),
				})
				.onConflictDoUpdate({
					target: users.id,
					set: {
						email: primaryEmail.email_address,
						name: fullName,
						image: clerkUser.image_url || null,
						emailVerified: !!primaryEmail.verification?.status === "verified",
						updatedAt: new Date(clerkUser.updated_at),
					},
				});

			console.log("Clerk user synced", { userId: clerkUser.id, event: event.type });
		}

		// Mark event as processed
		await db.insert(stripeEvents).values({
			id: svixId,
			type: event.type,
			processed: true,
			processedAt: new Date(),
			payload: event,
		});

		return c.json({ status: "ok" }, 200);
	} catch (error) {
		console.error("Clerk webhook handling failed", {
			eventId: svixId,
			eventType: event.type,
			error,
		});
		return c.json({ error: "Processing failed" }, 500);
	}
});

export default router;

