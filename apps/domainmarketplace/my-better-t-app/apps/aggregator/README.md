# Aggregator Worker

Nightly Cloudflare Worker that aggregates click telemetry from Analytics Engine into Postgres rollup tables.

## Overview

- Runs as a scheduled Worker (cron) at 01:00 UTC each day.
- Queries the `clicks` Analytics Engine dataset for the previous day's events.
- Upserts aggregated metrics into the `click_rollups` table in Postgres following the idempotent pattern described in `docs/payments/usage-metering-design.md`.
- Supports downstream analytics APIs served from the server Worker (ADR-0002).

## Architecture

- Raw click events are captured by the redirector Worker and stored in Cloudflare Analytics Engine (`CLICKS_AE`).
- The aggregator Worker queries AE and writes daily per-hire rollups to Postgres.
- The server Worker reads from Postgres and AE to serve analytics to the web dashboard.
- Refer to `docs/architecture/adrs/adr-0002-click-telemetry-store.md` for the end-to-end design rationale.

## Schedule

- Cron expression `0 1 * * *` (01:00 UTC) defined in `wrangler.jsonc`.
- Aggregation covers the prior UTC day to ensure the full window of events has landed.
- Cron retries are safe: rollups use composite primary key `(day, hireId)` with upsert semantics.

## Local Development

```sh
pnpm --filter aggregator dev
```

- Use `wrangler dev --test-scheduled` to simulate the cron locally.
- Trigger the scheduled event manually via `curl http://127.0.0.1:8787/__scheduled?cron=0+1+*+*+*`.
- Configure environment variables in `.env` (see `.env.example`).
- Analytics Engine queries require Cloudflare login; use `wrangler login` before running locally.

## Deployment

```sh
pnpm deploy:aggregator
```

- Ensure `DATABASE_URL` is stored as a Worker secret: `wrangler secret put DATABASE_URL`.
- Confirm the Analytics Engine dataset binding (`CLICKS_AE`) exists in the target environment.
- Deployment follows the standard process in `docs/deployment/deploy-pipelines.md`.

## Idempotency & Monitoring

- Rollups are written using `ON CONFLICT DO UPDATE`, so replays update the same row safely.
- Store aggregation logs in Cloudflare Workers Logs; integrate with observability pipelines (`docs/ops/observability.md`).
- Monitor AE query latency and error budgets to ensure nightly jobs complete within SLOs.




