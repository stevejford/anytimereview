# Usage Metering Design

Objective
- Convert validated click events into monthly Stripe Billing charges with high integrity, low cost, and easy reconciliation.

Data sources
- Raw events: Workers Analytics Engine (AE)
- Rollups: `click_rollups` in Neon (day, hireId, valid/invalid)

Aggregation job (nightly)
- Window: previous UTC day (00:00–23:59:59)
- Query AE for `valid_clicks` minus confirmed invalid clicks for each hireId
- Upsert into Neon `click_rollups(day, hire_id)` with `valid_clicks`, `invalid_clicks`
- Derive usage items: `{ hireId, day, clicks }`

Stripe usage recording
- Approach: Stripe Billing subscription with metered price per hire (or per Owner with separate meter per hireId—choose based on desired invoice granularity)
- API: record usage with idempotency
- Idempotency key: `usage:{subscriptionItemId}:{day}`
- Payload: `{ quantity: clicks, timestamp: end_of_day_ts, action: 'set' }` or cumulative ‘set’ values to avoid double counts

Idempotency and retries
- Store a usage ledger in Neon: `{ subscriptionItemId, day, clicks_sent, idempotency_key, sent_at }`
- On retry, read ledger; if id matches, skip; if mismatch, compare and either re‑send with corrected ‘set’ quantity or reconcile next day
- Exponential backoff (e.g., 1s, 5s, 30s, 2m, 10m) capped at 24h; alert on persistent failures

Late IVT adjustments
- Maintain `adjustments` table with `{ hireId, day, delta_clicks, reason, created_at }`
- Apply deltas via next cycle credit note or usage correction (set to corrected cumulative value)

Backfill & replay
- If AE/Neon outage occurs, recompute from AE for affected days and re‑emit ‘set’ quantities with the same idempotency key scheme per day
- For long gaps, coordinate with Finance to issue manual credits/adjustments on the invoice

Reconciliation
- Nightly: Stripe invoice preview vs Neon expected totals per subscription/hire
- Monthly close: lock rollups; generate variance report; investigate deltas > 0.5%

Security & privacy
- No PII in usage payloads; hireId/subscriptionItemId only
- Verify Stripe API keys are restricted; use server‑side only; signature‑verify webhooks

Monitoring
- Metrics: usage_records_sent, usage_records_failed, idempotency_conflicts, adjustments_applied
- Alerts: failure rate >1% per hour or any job >15m late

Mermaid — Nightly Flow
```mermaid
flowchart LR
  AE[Analytics Engine] -->|query day| JOB[Aggregator Job]
  JOB -->|rollups| NEON[(Neon click_rollups)]
  JOB -->|usage (idempotent)| STRIPE[Stripe Billing]
  JOB -->|ledger| NEON2[(Neon usage_ledger)]
  STRIPE -->|webhooks| APP[Webhook Handler]
  APP -->|log & reconcile| NEON3[(Neon recon tables)]
```

