import { eq } from "drizzle-orm";
import Stripe from "stripe";

import { db, stripeEvents } from "@my-better-t-app/db";

import type { CloudflareBindings } from "../types/bindings";
import { getStripeClient } from "./stripe-client";

export function verifyWebhookSignature(
	stripe: Stripe,
	payload: string,
	signature: string | null,
	secret: string,
): Stripe.Event | null {
	if (!signature) {
		return null;
	}

	try {
		return stripe.webhooks.constructEvent(payload, signature, secret);
	} catch (error) {
		console.error("Failed to verify webhook signature", error);
		return null;
	}
}

export async function isEventProcessed(eventId: string): Promise<boolean> {
	const [existing] = await db
		.select()
		.from(stripeEvents)
		.where(eq(stripeEvents.id, eventId));

	return Boolean(existing?.processed);
}

export async function markEventProcessed(
	eventId: string,
	eventType: string,
	payload: unknown,
): Promise<void> {
	await db
		.insert(stripeEvents)
		.values({
			id: eventId,
			type: eventType,
			processed: true,
			processedAt: new Date(),
			payload,
		})
		.onConflictDoUpdate({
			target: stripeEvents.id,
			set: {
				processed: true,
				processedAt: new Date(),
				payload,
			},
		});
}

export function getEventPayload<T>(event: Stripe.Event): T {
	return event.data.object as T;
}

export function initStripeForWebhooks(env: CloudflareBindings): Stripe {
	return getStripeClient(env);
}


