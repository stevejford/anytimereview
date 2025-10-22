import Stripe from "stripe";

import { calculateApplicationFee, generateIdempotencyKey } from "./stripe-client";

export async function createOrGetCustomer(
	stripe: Stripe,
	email: string,
	userId: string,
	metadata: Record<string, string> = {},
): Promise<string> {
	const existingCustomers = await stripe.customers.list({
		email,
		limit: 1,
	});

	if (existingCustomers.data.length > 0 && existingCustomers.data[0]) {
		return existingCustomers.data[0].id;
	}

	const customer = await stripe.customers.create({
		email,
		metadata: {
			userId,
			...metadata,
		},
	});

	return customer.id;
}

export async function createPeriodPaymentIntent(
	stripe: Stripe,
	params: {
		amountCents: number;
		currency: string;
		customerId: string;
		ownerAccountId: string;
		rentalId: string;
		feePercent: number;
	},
): Promise<{ clientSecret: string; paymentIntentId: string }> {
	const applicationFee = calculateApplicationFee(
		params.amountCents,
		params.feePercent,
	);

	const paymentIntent = await stripe.paymentIntents.create(
		{
			amount: params.amountCents,
			currency: params.currency,
			customer: params.customerId,
			transfer_data: {
				destination: params.ownerAccountId,
			},
			application_fee_amount: applicationFee,
			on_behalf_of: params.ownerAccountId,
			metadata: {
				rentalId: params.rentalId,
			},
		},
		{
			idempotencyKey: generateIdempotencyKey(
				"payment_intent",
				params.rentalId,
				String(params.amountCents),
			),
		},
	);

	if (!paymentIntent.client_secret || !paymentIntent.id) {
		throw new Error("Failed to create payment intent");
	}

	return {
		clientSecret: paymentIntent.client_secret,
		paymentIntentId: paymentIntent.id,
	};
}

export async function createMeteredSubscription(
	stripe: Stripe,
	params: {
		customerId: string;
		priceId: string;
		rentalId: string;
	},
): Promise<{ subscriptionId: string; subscriptionItemId: string }> {
	const subscription = await stripe.subscriptions.create({
		customer: params.customerId,
		items: [{ price: params.priceId, metadata: { rentalId: params.rentalId } }],
		metadata: {
			rentalId: params.rentalId,
		},
		collection_method: "charge_automatically",
	});

	const item = subscription.items.data[0];

	if (!item) {
		throw new Error("Subscription item missing");
	}

	return {
		subscriptionId: subscription.id,
		subscriptionItemId: item.id,
	};
}

export async function recordUsage(
	stripe: Stripe,
	subscriptionItemId: string,
	quantity: number,
	timestamp: number,
	idempotencyKey: string,
): Promise<void> {
	await stripe.subscriptionItems.createUsageRecord(
		subscriptionItemId,
		{
			quantity,
			timestamp,
			action: "set",
		},
		{ idempotencyKey },
	);
}

export async function createTransfer(
	stripe: Stripe,
	amountCents: number,
	currency: string,
	destinationAccountId: string,
	metadata: Record<string, string>,
): Promise<string> {
	const transfer = await stripe.transfers.create({
		amount: amountCents,
		currency,
		destination: destinationAccountId,
		metadata,
	});

	return transfer.id;
}

