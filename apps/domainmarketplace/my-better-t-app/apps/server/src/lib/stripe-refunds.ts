import Stripe from "stripe";
import { generateIdempotencyKey } from "./stripe-client";

export async function createRefund(
	stripe: Stripe,
	paymentIntentId: string,
	amountCents: number,
	reason: "duplicate" | "fraudulent" | "requested_by_customer",
	metadata: Record<string, string>,
): Promise<string> {
	const idempotencyKey = generateIdempotencyKey("refund", paymentIntentId, String(amountCents));

	const refund = await stripe.refunds.create(
		{
			payment_intent: paymentIntentId,
			amount: amountCents,
			reason,
			metadata,
		},
		{
			idempotencyKey,
		},
	);

	return refund.id;
}

export async function createCreditNote(
	stripe: Stripe,
	invoiceId: string,
	amountCents: number,
	reason: string,
	metadata: Record<string, string>,
): Promise<string> {
	const idempotencyKey = generateIdempotencyKey("credit_note", invoiceId, String(amountCents));

	const creditNote = await stripe.creditNotes.create(
		{
			invoice: invoiceId,
			lines: [
				{
					type: "custom_line_item",
					description: reason,
					unit_amount: amountCents,
					quantity: 1,
				},
			],
			metadata,
		},
		{
			idempotencyKey,
		},
	);

	return creditNote.id;
}

export async function reverseTransfer(
	stripe: Stripe,
	transferId: string,
	amountCents: number,
	metadata: Record<string, string>,
): Promise<string> {
	const idempotencyKey = generateIdempotencyKey("transfer_reversal", transferId, String(amountCents));

	const reversal = await stripe.transfers.createReversal(
		transferId,
		{
			amount: amountCents,
			metadata,
		},
		{
			idempotencyKey,
		},
	);

	return reversal.id;
}

