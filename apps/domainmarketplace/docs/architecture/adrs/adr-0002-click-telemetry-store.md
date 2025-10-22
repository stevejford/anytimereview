# ADR-0002: Click Telemetry Storage

- Status: Accepted
- Date: 2025-10-18

Context
- We must measure validated clicks for renter billing and analytics. Events originate in the redirector at the edge and must be queryable by time window, geo/device/referrer, and renter/route IDs. We also need to aggregate usage for Stripe metered billing.

Decision
- Use Workers Analytics Engine (AE) to ingest raw click events from the Worker.
- Run nightly aggregation to roll up `valid_clicks` and `invalid_clicks` per rental into Neon Postgres for billing and dashboards.
- Keep route/contract system-of-record in Neon; AE is the click event store.

Event shape (conceptual)
- Dimensions: timestamp, host, path, routeId/rentalId, ownerId, renterId, country, asn, userAgent hash, referrer domain, bot score bucket
- Measures: count (1), invalid flag (bool)

Worker write pattern (pseudo)
```ts
// env.CLICKS_AE is an Analytics Engine dataset binding
env.CLICKS_AE.writeDataPoint({
  blobs: [host, path, routeId, renterId, country, asn, botBucket, referrer],
  doubles: [1, isInvalid ? 1 : 0],
  indexes: [Date.now()],
});
```

Rollup job
- Nightly cron/queue reads AE via SQL API to aggregate per day/rental into Neon (`click_rollups`)
- Late-arriving invalidations (IVT) recorded as adjustments in the next cycle

Alternatives considered
- D1: Closer to relational queries but higher write latency and capacity concerns at global scale
- R2 logs + ETL: Cheap storage, but more operational heavy and slower queries
- Third-party analytics: Faster to start, but billing integration and IVT policy coupling are harder

Consequences
- Two systems (AE + Neon) introduce an ETL step; we mitigate with idempotent rollups and reconciliation reports
- AE query model is columnar/time-series; ad-hoc relational joins should be avoided in AE

POC and measurement
- POC: implement a minimal `writeDataPoint` in the Worker (non-blocking) and verify AE ingestion in a test dataset
- Measurement: confirm ingestion rate and AE query latency for 1/5/30-day windows

Links
- payments/usage-metering-design.md
- ops/observability.md

