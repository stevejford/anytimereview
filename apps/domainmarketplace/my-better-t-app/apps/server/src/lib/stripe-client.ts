import Stripe from "stripe";

import type { CloudflareBindings } from "../types/bindings";

export function getStripeClient(env: CloudflareBindings): Stripe {
	if (!env.STRIPE_SECRET_KEY) {
		throw new Error("Missing STRIPE_SECRET_KEY binding");
	}

	return new Stripe(env.STRIPE_SECRET_KEY, {
		apiVersion: "2025-02-24.acacia",
		appInfo: {
			name: "domain-hire-marketplace",
			version: "1.0.0",
		},
	});
}

export function generateIdempotencyKey(prefix: string, ...parts: string[]): string {
	return [prefix, ...parts].join(":");
}

export function calculateApplicationFee(amountCents: number, feePercent: number): number {
	return Math.round((amountCents * feePercent) / 100);
}

export async function retryWithBackoff<T>(
	fn: () => Promise<T>,
	maxRetries = 3,
): Promise<T> {
	let attempt = 0;
	let lastError: unknown;
	const delays = [1000, 5000, 30000];

	while (attempt < maxRetries) {
		try {
			return await fn();
		} catch (error) {
			lastError = error;
			const delay = delays[attempt] ?? delays[delays.length - 1];
			await new Promise((resolve) => setTimeout(resolve, delay));
			attempt += 1;
		}
	}

	throw lastError instanceof Error
		? lastError
		: new Error("Unknown error during retryWithBackoff execution");
}

