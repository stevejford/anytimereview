# Error Budgets & SLOs

Purpose
- Define user‑centric SLOs and enforce error budget policies that shape release velocity and operational risk.

Services & SLIs
- Redirector (Worker)
  - Availability SLI: 1 − (5xx responses / total redirect attempts).
  - Performance SLI: p95/p99 edge compute time from Cloudflare analytics.
- Web app (Next.js)
  - Availability SLI: 1 − (5xx responses / total requests) for prod.
  - Latency SLI: p95 TTFB for SSR routes.
- Analytics Engine (ingest)
  - Freshness SLI: 1 − (lag minutes / total minutes within window), capped at 1 when lag ≤ 2 min.
- Stripe webhooks
  - Delivery SLI: % events successfully processed within 2 minutes.
- TLS issuance (onboarding)
  - Timeliness SLI: % custom hostnames issued within 60 minutes after pre‑validation.

Target SLOs (initial; review quarterly)
- Redirect availability: 99.95% monthly (budget ≈ 21m 54s/month).
- Web app availability: 99.9% monthly (budget ≈ 43m 12s/month).
- Redirect performance: p95 ≤ 20 ms; p99 ≤ 50 ms (edge compute).
- AE freshness: p95 lag ≤ 2 minutes; no single gap > 5 minutes.
- Stripe webhooks: ≥ 99.9% delivered ≤ 2 minutes.
- TLS issuance: 95% ≤ 15 minutes; 100% ≤ 60 minutes.

Measurement
- Source truth per service (see observability.md for tools) with `env=prod` filters.
- Fixed monthly windows for availability; weekly for performance/freshness.
- Exclusions: documented third‑party outages may be excluded if contractual and measurable; keep an "excluded minutes" ledger approved by SRE.

Error Budgets
- Redirect availability budget: 0.05% of monthly minutes.
- Web app availability budget: 0.1% of monthly minutes.
- Performance budget: % of requests exceeding thresholds (e.g., ≤ 5% beyond p95 target).
- Freshness budget: total minutes with lag > 2 min not to exceed 60 min/week.

Policies (burn responses)
- Caution (25–50% budget burned)
  - Add on‑call focus; raise alert sensitivity; analyze top offenders.
- Freeze (≥ 50% burned)
  - Require IM/TL approval for prod deploys; canary only; prioritize fixes.
- Hard freeze (≥ 100% burned)
  - Halt feature deploys; hotfixes only; executive visibility; burn‑down plan.

Governance
- Weekly SLO review in engineering ops; monthly report to stakeholders.
- Post‑incident: adjust SLOs/SLIs or mitigations; do not relax targets without data.

Cross‑links
- Observability: docs/ops/observability.md
- Performance budgets: docs/architecture/performance-budgets.md
- Incident response: docs/ops/runbooks/incident-response.md
