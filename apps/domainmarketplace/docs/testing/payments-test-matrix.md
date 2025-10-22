# Payments Test Matrix (Stripe)

Environment
- Stripe test mode; platform and Connect Express test accounts.
- Webhooks signed; handler verifies signature and logs event IDs.

Artifacts per test
- PaymentIntent/Charge IDs, Subscription/Invoice IDs, Transfer/Transfer Reversal IDs
- Webhook event IDs processed (ordered), idempotency keys used
- App logs, DB records (contracts, rollups, usage_ledger)

Period Rentals — Direct Charges
- Success — happy path
  - Steps: Create PaymentIntent (on_behalf_of + transfer_data + app fee) → confirm → webhook handled.
  - Assert: contract active; owner payout scheduled; platform app fee recorded.
- Requires 3DS (if enabled in future)
  - Steps: Use 3DS test card; confirm flow; ensure webhook sequence handled.
  - Assert: final succeeded; no duplicate contract.
- Payment failure
  - Steps: Use decline card; confirm.
  - Assert: contract not active; clear error surfaced; no owner payout.
- Refund (full/partial)
  - Steps: Issue refund on connected account.
  - Assert: refund webhook handled; contract adjusted/ended; app fee refunded if policy requires.
- Chargeback (dispute created → closed)
  - Steps: Create dispute via dashboard; submit evidence; close as won/lost.
  - Assert: evidence bundle created; transfer reversal created if funds moved; ledger updated.

Usage Billing — Metered Subscriptions
- Subscription create/cancel
  - Steps: Create customer + subscription; later cancel.
  - Assert: statuses reflected; no charges after cancel effective date.
- Usage recording idempotency (daily ‘set’)
  - Steps: Record usage with same idempotency key twice.
  - Assert: single usage counted; ledger shows one send.
- Out‑of‑order usage
  - Steps: Send day N, then N‑1; use ‘set’ quantity.
  - Assert: final invoice uses latest ‘set’; no double counts.
- Missing usage (backfill)
  - Steps: Skip a day; run backfill.
  - Assert: correct totals on invoice.
- Invoice finalize and paid
  - Steps: Trigger finalize/payout; handle webhooks.
  - Assert: post‑paid transfer created; owner payout reflected.
- Payment failure/dunning
  - Steps: Simulate failed invoice.
  - Assert: subscription in past_due; routes paused if policy; retries occur.
- Credit note (IVT adjustment)
  - Steps: Create credit note for invoice.
  - Assert: renter balance updated; owner transfer adjusted if needed.

Connect Transfers
- Transfer success
  - Steps: Create transfer after invoice.paid.
  - Assert: transfer shows pending→paid; owner dashboard updated.
- KYC required / capabilities_disabled
  - Steps: Attempt transfer to incomplete account.
  - Assert: transfer fails; queued; owner notified.

Webhooks & Idempotency
- Retry handling
  - Steps: Return 500 on first attempt; accept on retry.
  - Assert: no duplicate side effects; idempotency store prevents double‑writes.
- Out‑of‑order delivery
  - Steps: Deliver events in shuffled order.
  - Assert: handler reorders/guards; state ends correct.
- Signature validation
  - Steps: Send invalid signature.
  - Assert: event rejected; logged; no state change.

Evidence collection
- Save event payloads, IDs, and key fields in CI artifacts.
- Record ledger entries for usage and transfers; export CSV for finance reconciliation.

