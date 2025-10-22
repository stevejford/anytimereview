# Environments & Config Matrix

Purpose
- Define environments, required config, and promotion flow so changes move safely from dev → staging → prod.

Environments
- Local
  - Run services via `wrangler dev` and Next.js dev server; Stripe in test mode; Neon local branch.
- Dev
  - Shared sandbox for integration; Cloudflare dev account/project; Stripe test; Sentry env `dev`.
- Staging
  - Pre‑prod mirror; production‑like configs with smaller quotas; final verification; Sentry env `staging`.
- Prod
  - Customer traffic; strict change control; Sentry env `production`.

Configuration Matrix (by env)
- Cloudflare Workers
  - `worker_name`: `redirector-{env}` (dev/staging/prod)
  - Bindings
    - KV `ROUTES_KV_{ENV}`
    - DO `ROUTE_DO_{ENV}` (if used)
    - AE dataset `clicks_{env}`
- Cloudflare Pages (web)
  - Project: `marketplace-{env}`
  - Environment variables: `NEXT_PUBLIC_*`, `SENTRY_DSN`, API endpoints tagged by env
- Domains
  - Dev: `dev.marketplace.example` (internal), staging: `staging.marketplace.example`, prod: `app.marketplace.example` (replace with real domains)
- Neon Postgres
  - Project: single prod project with branches: `dev`, `staging`, `prod`
  - Connection strings: `DATABASE_URL_{ENV}`
  - Policy: pre‑migration branch cut; run migrations per env
- Stripe
  - Dev/Staging: Test mode keys; Prod: Live keys
  - Webhook secret per env: `STRIPE_WEBHOOK_SECRET_{ENV}`
- Sentry
  - DSN per project; environment tag set to `{env}`; release set to git sha
- Secrets
  - Stored in secret manager; never committed; rotated per policy

Promotion Flow
- Dev → Staging
  - Merge to `main` triggers staging build; run integration tests; manual approval to promote.
  - Run DB migrations on staging; verify dashboards and canary redirects.
- Staging → Prod
  - Create release tag; generate changelog; maintenance window if needed.
  - Pre‑flight: confirm error budget and monitoring green; TLS issuance queue healthy.
  - Run DB migrations (with Neon branch for rollback); deploy web and worker canary; ramp traffic if applicable.
  - Verify: KPI checks (5xx, latency, webhooks); then complete rollout.

Configuration Management
- Version `wrangler.toml`, Pages config, and binding names.
- Keep env‑specific values in CI secrets and Cloudflare vars.
- Maintain a single source‑of‑truth mapping file (internal) of env → resource IDs.

References
- Deploy pipelines: docs/deployment/deploy-pipelines.md
- Observability: docs/ops/observability.md
