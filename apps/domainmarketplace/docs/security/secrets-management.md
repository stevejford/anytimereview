# Secrets & Environment Management

Principles
- Least privilege; no secrets in repo; environment isolation; short‑lived tokens where possible; rotate regularly.

Secret Stores
- Cloudflare Wrangler `wrangler secret` for Worker secrets (prod/stage/dev)
- GitHub Actions/CI secrets for build deploy tokens; restrict scopes
- Neon roles with distinct users/URLs per env (read/write)
- Stripe restricted API keys per env; separate webhook signing secrets
- Resend (email) API key per env

Environment Matrix (example)
- Dev
  - `DATABASE_URL` (Neon dev HTTP URL, least privilege)
  - `BETTER_AUTH_SECRET` (random 32+ bytes)
  - `STRIPE_SECRET_KEY` (test)
  - `STRIPE_WEBHOOK_SECRET` (test)
  - `RESEND_API_KEY` (test)
  - `CORS_ORIGIN` (http://localhost:3001)
- Staging
  - Separate Neon staging DB/user; staging Stripe keys/webhook secret
  - Distinct Cloudflare secrets; staging domains/origins
- Production
  - Production Neon with read/write roles; use HTTP driver only as required; consider pooling for server actions
  - Stripe live keys; Connect onboarding enabled; webhook secret rotated 90 days
  - Resend live key; narrowed sender domains

Rotation & Access
- Rotate Stripe webhook secrets and API keys at least every 90 days
- Rotate Resend and other API keys every 180 days
- Cloudflare API tokens: least privilege (deploy to specific account/zone only); rotate 180 days
- Neon passwords: rotate 180 days; use separate users for migration vs runtime
- Remove access immediately on offboarding; review accesses quarterly

Handling & Usage
- Never log secrets; avoid echoing env vars
- Use allowlisted origins in CORS; avoid reflecting tokens in URLs
- Use idempotency keys for Stripe; store webhook secrets in CF secrets only

CI/CD Mapping
- Store deploy tokens and environment secrets in CI; do not leak to build artifacts
- Separate jobs per env; require approvals for production secrets access

Incident Playbook
- Suspected key leak: revoke/rotate immediately; invalidate sessions; audit logs for misuse; notify stakeholders

