# Observability — Domain Hire Marketplace

Purpose
- Provide actionable visibility across the edge redirector (Cloudflare Worker), web app (Next.js on Pages), data (Neon Postgres), billing (Stripe), and onboarding (Cloudflare for SaaS custom hostnames). Tie signals to SLOs and alerts with runbook links.

Scope (components)
- Edge redirector (Worker/Hono): host/path → target redirect, click event emit.
- Web app (Next.js): listings, onboarding flows, dashboards, admin.
- Data plane: Neon Postgres (primary state), Workers KV (routing cache), Durable Objects (coordination), Analytics Engine (clicks/IVT telemetry).
- External: Stripe (Connect + Billing), Cloudflare Custom Hostnames (TLS issuance), DNS providers (Domain Connect or manual).

Key Signals
- Availability
  - Redirect availability (Worker): 5xx rate, route misses, TLS handshake failures.
  - Web app uptime: 5xx rate, build/SSR errors.
- Performance
  - Redirect edge compute time: p95 ≤ 20 ms, p99 ≤ 50 ms (see performance budgets).
  - API latency (SSR/data): p95 ≤ 150 ms simple reads, ≤ 300 ms heavier reads.
- Correctness & data
  - Analytics Engine ingest success rate; backlog/lag ≤ 2 minutes.
  - KV/Durable Object error rates and latencies.
- Onboarding
  - DNS pre‑validation duration (txt/http), success/failure counts.
  - TLS issuance/renewal status for Custom Hostnames.
- Payments
  - Stripe webhook delivery success; backlog; signature verification failures.
- Trust & Safety
  - IVT rate (invalid traffic): bot‑flagged share; spike detection vs baseline.

SLOs (initial)
- Redirect availability: 99.95% monthly (error budget ≈ 21m 54s/month).
- Web app availability: 99.9% monthly (budget ≈ 43m 12s/month).
- Redirect performance: p95 ≤ 20 ms edge compute, measured at Cloudflare.
- AE ingestion lag: ≤ 2 minutes p95; 0 dropped events due to application.
- Stripe webhook success: ≥ 99.9% delivery within 2 minutes p95.
- TLS issuance: 95% within 15 minutes of pre‑validation; 100% within 60 minutes.

Dashboards (minimum set)
- Edge Redirect Health
  - 5xx rate, p95/p99 compute time, KV get latency, AE ingest lag, IVT rate.
- Web App Health
  - 5xx/4xx by route, SSR error count (Sentry), API p95.
- Onboarding & TLS
  - Pre‑validation attempts, success time distribution, TLS issuance/renewal status counts.
- Payments
  - Webhook delivery outcomes, retries, signature failures; payout/transfer error counts.

Tooling & Data Sources
- Cloudflare
  - Analytics/Logs (Logpush) for Worker metrics and edge errors.
  - Workers Analytics Engine for click telemetry and IVT analysis.
- Sentry
  - Unhandled exceptions for web and worker; release health; env tagging.
- Neon Postgres
  - Connection errors, query latencies via Neon metrics; slow query sampling.
- Synthetic
  - Scheduled canaries: sample hostnames and slugs validating redirect code and query preservation.

Alert Rules (actionable)
- Redirect 5xx rate
  - Warn: > 0.01% over 10 minutes; Page/Worker errors > 50/min.
  - Crit: > 0.1% over 5 minutes or sustained > 0.05% over 15 minutes.
  - Action: Invoke Incident Response; consider rollback/circuit‑breakers.
- Edge latency
  - Warn: p95 compute > 20 ms for 10 minutes; Crit: p99 > 80 ms for 5 minutes.
  - Action: check recent deploy, dependency latency, KV hot keys, regional anomalies.
- TLS issuance/renewal
  - Warn: Custom Hostname cert status pending > 15 minutes.
  - Crit: status failed or cert expiry < 7 days without renewal in progress.
  - Action: follow DNS Cutover & TLS runbook; reissue; open Cloudflare ticket if needed.
- Stripe webhooks
  - Warn: delivery failure rate > 0.5% over 10 minutes or backlog > 100 events.
  - Crit: failure rate > 2% over 5 minutes or backlog age > 5 minutes p95.
  - Action: verify endpoint health, recent deploy, Stripe status; replay events.
- AE ingest/backlog
  - Warn: ingest errors > 0.1% or lag > 2 minutes p95 for 10 minutes.
  - Crit: lag > 5 minutes for 5 minutes.
  - Action: pause enrichments, sample if necessary, verify credentials/quotas.
- IVT spike
  - Warn: bot‑flagged share > 2× 24h baseline for 10 minutes.
  - Crit: > 3× baseline or absolute IVT rate > 25% of traffic.
  - Action: enable stricter WAF/Bot rules; rate‑limit; communicate to customers if traffic impacted.

Runbook Links
- Incident Response: docs/ops/runbooks/incident-response.md
- DNS Cutover & TLS: docs/ops/runbooks/dns-cutover.md
- Deploy & Rollback: docs/deployment/deploy-pipelines.md

Synthetic Checks (examples)
- Redirect canary
  - Hit `https://canary.<your-edge-host>/health-redirect` expecting 302 to known target; assert Location and query preserved.
- Onboarding/TLS
  - API check for TLS status on active custom hostnames; alert on non‑ready > threshold.
- Payments
  - Scheduled Stripe test webhook to staging; verify handled and recorded.

Operational Notes
- Tag all metrics and logs with `env` (dev/staging/prod), `service` (web/worker), and `version` (git sha) for fast correlation.
- Retention: keep logs/metrics per compliance and cost posture (see security/secrets-management and data‑classification docs).
- Cross‑reference: docs/architecture/performance-budgets.md for latency/error targets.

References
- Cloudflare Analytics/Logs and Workers Analytics Engine
- Sentry Releases/Environments
- Neon branching and PITR
