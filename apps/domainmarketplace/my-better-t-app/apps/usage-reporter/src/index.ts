import Stripe from "stripe";
import { eq, and, sql, sum } from "drizzle-orm";

import { neon, drizzle, schema, hires, usageLedger, clickRollups } from "@my-better-t-app/db";
import type { CloudflareBindings } from "./types/bindings";

interface ScheduledEvent {
	cron: string;
	scheduledTime: number;
}

export default {
	async scheduled(
		event: ScheduledEvent,
		env: CloudflareBindings,
		ctx: ExecutionContext,
	): Promise<void> {
		console.log("Usage reporter cron triggered", {
			cron: event.cron,
			scheduledTime: new Date(event.scheduledTime).toISOString(),
		});

		try {
			await reportYesterdayUsage(env);
		} catch (error) {
			console.error("Usage reporting failed", {
				error: error instanceof Error ? error.message : String(error),
				stack: error instanceof Error ? error.stack : undefined,
			});
			throw error; // Rethrow to mark the cron execution as failed
		}
	},
};

async function reportYesterdayUsage(env: CloudflareBindings): Promise<void> {
	// Initialize database connection using Neon HTTP driver (Worker-compatible)
	const sqlClient = neon(env.DATABASE_URL);
	const db = drizzle(sqlClient, { schema });

	// Initialize Stripe
	const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
		apiVersion: "2024-11-20.acacia",
	});

	// Calculate yesterday's date range (UTC)
	const now = new Date();
	const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
	const dayString = yesterday.toISOString().split("T")[0]; // YYYY-MM-DD
	const dayStart = new Date(`${dayString}T00:00:00Z`);
	const dayEnd = new Date(`${dayString}T23:59:59Z`);

	console.log("Reporting usage for", {
		day: dayString,
		dayStart: dayStart.toISOString(),
		dayEnd: dayEnd.toISOString(),
	});

	// Query click_rollups for yesterday and join to hires to get subscription item IDs
	// Note: This assumes you have a click_rollups table. If not, adjust query accordingly.
	// For now, we'll query hires with active per_click subscriptions
	const activePerClickHires = await db
		.select({
			hireId: hires.id,
			subscriptionItemId: hires.stripeSubscriptionItemId,
		})
		.from(hires)
		.where(
			and(
				eq(hires.type, "per_click"),
				eq(hires.status, "active"),
				sql`${hires.stripeSubscriptionItemId} IS NOT NULL`
			)
		);

	console.log(`Found ${activePerClickHires.length} active per-click hires`);

	for (const hire of activePerClickHires) {
		if (!hire.subscriptionItemId) {
			console.warn("Hire missing subscription item ID", {
				hireId: hire.hireId,
			});
			continue;
		}

		const idempotencyKey = `usage:${hire.subscriptionItemId}:${dayString}`;

		// Check if already sent
		const [existingLedger] = await db
			.select()
			.from(usageLedger)
			.where(eq(usageLedger.idempotencyKey, idempotencyKey))
			.limit(1);

		if (existingLedger && existingLedger.status === "sent") {
			console.log("Usage already reported for hire", {
				hireId: hire.hireId,
				day: dayString,
				clicksSent: existingLedger.clicksSent,
			});
			continue;
		}

		// Query actual click count from click_rollups table
		// The click_rollups table uses a date column (YYYY-MM-DD string) as part of the primary key
		const [rollupResult] = await db
			.select({ validClicks: sum(clickRollups.validClicks) })
			.from(clickRollups)
			.where(
				and(
					eq(clickRollups.hireId, hire.hireId),
					eq(clickRollups.day, dayString)
				)
			);

		const validClicks = rollupResult?.validClicks ? Number(rollupResult.validClicks) : 0;

		// Handle correction case: if ledger exists with different quantity
		if (existingLedger && existingLedger.clicksSent !== validClicks) {
			console.log("Correcting usage for hire", {
				hireId: hire.hireId,
				day: dayString,
				previousClicks: existingLedger.clicksSent,
				newClicks: validClicks,
			});
			// Continue to report with 'set' action to correct the quantity
		}

		// Skip if no clicks (optional - comment out if you want to report 0 clicks)
		if (validClicks === 0 && !existingLedger) {
			console.log("No clicks to report for hire", {
				hireId: hire.hireId,
				day: dayString,
			});
			continue;
		}

		try {
			// Report usage to Stripe
			const timestamp = Math.floor(dayEnd.getTime() / 1000);
			await stripe.subscriptionItems.createUsageRecord(
				hire.subscriptionItemId,
				{
					quantity: validClicks,
					timestamp,
					action: "set",
				},
				{ idempotencyKey }
			);

			// Determine status: 'corrected' if updating, 'sent' if new
			const status = existingLedger ? "corrected" : "sent";

			// Record in usage ledger
			await db
				.insert(usageLedger)
				.values({
					hireId: hire.hireId,
					subscriptionItemId: hire.subscriptionItemId,
					day: dayStart,
					clicksSent: validClicks,
					idempotencyKey,
					sentAt: new Date(),
					status,
				})
				.onConflictDoUpdate({
					target: usageLedger.idempotencyKey,
					set: {
						clicksSent: validClicks,
						sentAt: new Date(),
						status,
					},
				});

			console.log("Successfully reported usage", {
				hireId: hire.hireId,
				subscriptionItemId: hire.subscriptionItemId,
				day: dayString,
				validClicks,
				status,
			});
		} catch (error) {
			console.error("Failed to report usage for hire", {
				hireId: hire.hireId,
				subscriptionItemId: hire.subscriptionItemId,
				day: dayString,
				validClicks,
				error: error instanceof Error ? error.message : String(error),
				stack: error instanceof Error ? error.stack : undefined,
			});

			// Record failure in ledger for audit trail
			try {
				await db
					.insert(usageLedger)
					.values({
						hireId: hire.hireId,
						subscriptionItemId: hire.subscriptionItemId,
						day: dayStart,
						clicksSent: validClicks, // Record attempted clicks for audit
						idempotencyKey,
						sentAt: new Date(),
						status: "failed",
					})
					.onConflictDoUpdate({
						target: usageLedger.idempotencyKey,
						set: {
							clicksSent: validClicks,
							status: "failed",
							sentAt: new Date(),
						},
					});
			} catch (ledgerError) {
				console.error("Failed to record usage failure in ledger", {
					hireId: hire.hireId,
					error: ledgerError instanceof Error ? ledgerError.message : String(ledgerError),
				});
			}

			// Rethrow to fail the worker run so cron can retry
			throw error;
		}
	}

	console.log("Usage reporting completed");
}

