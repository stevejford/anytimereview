/**
 * Stripe Webhook Handler for Vercel
 *
 * Handles Stripe webhook events for payment processing and subscription management.
 * Ported from server/src/routes/webhooks.ts with full business logic.
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { eq } from 'drizzle-orm';
import { db } from '@my-better-t-app/db';
import { hires } from '@my-better-t-app/db/schema/hires';
import { listings } from '@my-better-t-app/db/schema/listings';
import { domains } from '@my-better-t-app/db/schema/domains';
import { user as users } from '@my-better-t-app/db/schema/auth';
import { invoices, payouts, stripeEvents } from '@my-better-t-app/db/schema/billing';

export const runtime = 'nodejs';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

// Helper functions
function getEventPayload<T>(event: Stripe.Event): T {
  return event.data.object as T;
}

async function isEventProcessed(eventId: string): Promise<boolean> {
  const [existing] = await db
    .select()
    .from(stripeEvents)
    .where(eq(stripeEvents.id, eventId))
    .limit(1);

  return Boolean(existing?.processed);
}

async function markEventProcessed(
  eventId: string,
  eventType: string,
  payload: unknown
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

async function createTransfer(
  amountCents: number,
  currency: string,
  destinationAccountId: string,
  metadata: Record<string, string>
): Promise<string> {
  const transfer = await stripe.transfers.create({
    amount: amountCents,
    currency,
    destination: destinationAccountId,
    metadata,
  });

  return transfer.id;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET is not configured');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Check if event already processed (idempotency)
    const alreadyHandled = await isEventProcessed(event.id);
    if (alreadyHandled) {
      return NextResponse.json({ status: 'ok' }, { status: 200 });
    }

    // Handle the event
    try {
      await handleEvent(event);
      await markEventProcessed(event.id, event.type, event);
      return NextResponse.json({ status: 'ok' }, { status: 200 });
    } catch (error) {
      console.error('Stripe webhook handling failed', {
        eventId: event.id,
        eventType: event.type,
        error,
      });
      return NextResponse.json(
        { error: 'Processing failed' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}


// Event handlers
async function handleEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case 'payment_intent.succeeded':
      await handlePaymentIntentSucceeded(event);
      break;
    case 'payment_intent.payment_failed':
      await handlePaymentIntentFailed(event);
      break;
    case 'customer.subscription.created':
      await handleSubscriptionCreated(event);
      break;
    case 'invoice.paid':
      await handleInvoicePaid(event);
      break;
    case 'charge.refunded':
      await handleChargeRefunded(event);
      break;
    default:
      console.log('Unhandled stripe event', { type: event.type });
  }
}

async function handlePaymentIntentSucceeded(event: Stripe.Event): Promise<void> {
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
    console.error('handlePaymentIntentSucceeded: hire not found', {
      hireId,
      intentId: intent.id,
    });
    return;
  }

  const expectedDestination = row.owner.stripeConnectAccountId;
  const actualDestination = intent.transfer_data?.destination;

  if (
    expectedDestination &&
    actualDestination &&
    expectedDestination !== actualDestination
  ) {
    console.error('handlePaymentIntentSucceeded: destination mismatch', {
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
    .set({ status: 'paid', updatedAt: new Date() })
    .where(eq(invoices.stripeInvoiceId, intent.id));

  await db
    .update(hires)
    .set({ updatedAt: new Date() })
    .where(eq(hires.id, hireId));

  if (intent.customer && typeof intent.customer === 'string') {
    await db
      .update(hires)
      .set({ stripeCustomerId: intent.customer, updatedAt: new Date() })
      .where(eq(hires.id, hireId));
  }
}

async function handlePaymentIntentFailed(event: Stripe.Event): Promise<void> {
  const intent = getEventPayload<Stripe.PaymentIntent>(event);
  const hireId = intent.metadata?.hireId;
  if (!hireId) return;

  await db
    .insert(invoices)
    .values({
      stripeInvoiceId: intent.id,
      amountCents: intent.amount ?? 0,
      type: 'period',
      status: 'void',
      hireId,
    })
    .onConflictDoUpdate({
      target: invoices.stripeInvoiceId,
      set: {
        status: 'void',
        updatedAt: new Date(),
      },
    });
}

async function handleSubscriptionCreated(event: Stripe.Event): Promise<void> {
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


async function handleInvoicePaid(event: Stripe.Event): Promise<void> {
  const invoice = getEventPayload<Stripe.Invoice>(event);
  const hireId = invoice.metadata?.hireId;
  if (!hireId) return;

  const isMetered =
    invoice.lines?.data[0]?.price?.recurring?.usage_type === 'metered';

  await db
    .insert(invoices)
    .values({
      stripeInvoiceId: invoice.id,
      amountCents: invoice.amount_paid ?? 0,
      type: isMetered ? 'usage' : 'period',
      status: 'paid',
      hireId,
    })
    .onConflictDoUpdate({
      target: invoices.stripeInvoiceId,
      set: {
        amountCents: invoice.amount_paid ?? 0,
        status: 'paid',
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
      console.error('handleInvoicePaid: owner or Connect account not found', {
        hireId,
        invoiceId: invoice.id,
      });
      // Return error to trigger Stripe retry
      throw new Error('Owner Connect account not found');
    }

    const ownerId = row.owner.id;
    const ownerAccountId = row.owner.stripeConnectAccountId;

    // Calculate platform fee and owner amount
    const feePercent = Number(process.env.STRIPE_PLATFORM_FEE_PERCENT ?? '4');
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
      console.log('handleInvoicePaid: payout already exists', {
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
        status: 'pending',
        periodStart,
        periodEnd,
      })
      .returning();

    if (!payoutRecord) {
      console.error('handleInvoicePaid: failed to create payout record', {
        hireId,
        invoiceId: invoice.id,
      });
      throw new Error('Failed to create payout record');
    }

    try {
      // Create Stripe transfer
      const transferId = await createTransfer(
        ownerAmount,
        (invoice.currency ?? 'usd').toLowerCase(),
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
          status: 'paid',
          updatedAt: new Date(),
        })
        .where(eq(payouts.id, payoutRecord.id));

      console.log('handleInvoicePaid: transfer created', {
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
          status: 'failed',
          updatedAt: new Date(),
        })
        .where(eq(payouts.id, payoutRecord.id));

      console.error('handleInvoicePaid: transfer failed', {
        hireId,
        invoiceId: invoice.id,
        error,
      });

      // Rethrow to trigger Stripe retry
      throw error;
    }
  }
}

async function handleChargeRefunded(event: Stripe.Event): Promise<void> {
  const charge = getEventPayload<Stripe.Charge>(event);
  const hireId = charge.metadata?.hireId;
  if (!hireId) return;

  await db
    .update(invoices)
    .set({ status: 'void', updatedAt: new Date() })
    .where(eq(invoices.stripeInvoiceId, charge.invoice as string));

  if (charge.transfer) {
    const transferId =
      typeof charge.transfer === 'string' ? charge.transfer : charge.transfer.id;
    await db
      .update(payouts)
      .set({ status: 'failed', updatedAt: new Date() })
      .where(eq(payouts.stripeTransferId, transferId));
  }
}

