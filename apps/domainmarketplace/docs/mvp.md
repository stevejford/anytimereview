# MVP Documentation Map
\
Purpose
- Provide a single starting point that links the core documents required to plan, build, launch, and operate the Domain Rental Marketplace MVP.

How to Use This Map
1. Start with the strategy and scope docs to understand the product vision and constraints.
2. Dive into the functional area needed for your task (product, engineering, operations, trust & safety, legal, etc.).
3. Follow cross-links for detailed runbooks, policies, and playbooks. Each section below calls out the primary owner and key decisions already captured.

## 1. Strategy & Scope
- `docs/domain-rental-marketplace-report.md` — Foundation research, architecture choices, and the embedded MVP PRD.
- `docs/product/kpis-and-dashboards.md` — North-star KPIs and success metrics for launch and beyond.
- `docs/agents/workers/product-strategist.worker.md` — Role charter guiding roadmap and backlog ownership.

## 2. Personas, Journeys & GTM
- `docs/gtm/owner-onboarding.md` — Owner acquisition funnel, onboarding steps, and messaging.
- `docs/gtm/renter-onboarding.md` — Renter journey, trial-to-paid conversion points, and nurture tactics.
- `docs/support/faq.md` — Top customer questions aligning support with GTM messaging.

## 3. Product & Experience Requirements
- `docs/seo/redirect-policy.md` — Redirect semantics (302 vs 301) and SEO guardrails for rentals versus slugs.
- `docs/support/macros.md` — Communication templates for key scenarios (rentals, IVT disputes, outages).
- `docs/payments/disputes-and-credits.md` — Customer-facing policy for refunds, IVT credits, and evidence expectations.

## 4. Architecture & Edge Strategy
- `docs/architecture/performance-budgets.md` — P95/P99 latency, bundle size, and error budgets for workers and web.
- `docs/architecture/cloudflare-limits.md` — Platform quotas and mitigations for Workers, KV, Durable Objects, and Analytics Engine.
- `docs/research/domain-connect-matrix.md` — Registrar support matrix for Domain Connect onboarding.
- `docs/agents/workers/edge-architect.worker.md` — Edge architecture responsibilities and task plan.

## 5. Engineering Enablement
- `docs/engineering/local-setup.md` — Local development prerequisites and commands.
- `docs/engineering/contributing.md` — Contribution standards, PR checklists, and coding conventions.
- `docs/engineering/api-guidelines.md` — API versioning, pagination, and error response rules.
- `docs/engineering/openapi-publishing.md` — CI/CD for specs, documentation publishing, and client generation.
- `docs/agents/workers/dx-lead.worker.md` — Role charter for developer experience stewardship.

## 6. Operations & Reliability
- `docs/ops/observability.md` — Signals, SLOs, alert thresholds, and dashboards.
- `docs/ops/runbooks/incident-response.md` — Incident severities, roles, flow, and communications templates.
- `docs/ops/error-budgets.md` — SLO targets, burn policies, and governance cadence.
- `docs/ops/disaster-recovery.md` — RPO/RTO targets, Neon branching strategy, and drill expectations.

## 7. Deployment & Environments
- `docs/deployment/environments.md` — Env matrix (local/dev/staging/prod), bindings, and promotion gates.
- `docs/deployment/deploy-pipelines.md` — CI/CD stages for Next.js (Pages) and Workers, canaries, rollbacks.
- `docs/testing/edge-testing-guide.md` — How to verify redirects and edge behavior pre- and post-deploy.
- `docs/testing/test-strategy.md` — Overall testing approach including unit, integration, and load.

## 8. Security & Compliance
- `docs/security/secrets-management.md` — Secret storage, rotation policy, and break-glass access.
- `docs/security/data-classification-and-retention.md` — Data handling levels and retention windows.
- `docs/compliance/dpia.md` — Data Protection Impact Assessment summary for the marketplace.
- `docs/compliance/dsr-process.md` — Data subject request workflow.
- `docs/compliance/cookie-consent.md` — Consent banner requirements and tracking disclosures.
- `docs/agents/workers/security-engineer.worker.md` & `docs/agents/workers/privacy-compliance.worker.md` — Role briefs for owning these areas.

## 9. Trust, Safety & Legal
- `docs/trust-safety/ivt-policy.md` — IVT tiers, scoring, auto-credit caps, and dispute evidence.
- `docs/trust-safety/bot-lists-process.md` — Bot list lifecycle, exceptions, and audit trail.
- `docs/trust-safety/escalation-sla.md` — Abuse intake, severities, contact tree, and appeal timelines.
- `docs/legal/acceptable-use-policy.md` — Customer obligations and prohibited content.
- `docs/legal/terms-of-service.md` — Platform terms governing owners and renters.
- `docs/legal/udrp-workflow.md` — Workflow for domain disputes and trademark claims.
- `docs/trust-safety/bot-lists-process.md` pairs with Cloudflare controls in `docs/architecture/cloudflare-limits.md` for mitigation.

## 10. Payments & Finance
- `docs/payments/disputes-and-credits.md` — Billing adjustments and refund processes (linked above).
- `docs/payments/disputes-and-credits.md` relies on Worker metrics and IVT outcomes; coordinate with `docs/trust-safety/ivt-policy.md`.
- `docs/testing/payments-test-matrix.md` — Test scenarios for Stripe Connect, metered billing, and credits.
- `docs/agents/workers/payments-specialist.worker.md` — Role charter for payout, reconciliation, and dispute handling.

## 11. Support & Customer Success
- `docs/support/faq.md` — FAQ baseline for support reps.
- `docs/support/macros.md` — Messaging templates (ready for customization).
- `docs/agents/workers/gtm-support.worker.md` — Scope for GTM support operations.

## 12. QA & Launch Readiness
- `docs/testing/test-strategy.md` — Comprehensive QA coverage plan.
- `docs/testing/payments-test-matrix.md` — Payments-specific validation (linked above).
- `docs/agents/workers/qa-lead.worker.md` — QA leadership responsibilities and task plan.
- `docs/ops/runbooks/dns-cutover.md` — Launch-day DNS cutover/rollback guidance.

## 13. Role Directory (Agents & Workers)
- `docs/agents/README.md` — Overview of agent roles and how they collaborate.
- `docs/agents/workers/_template.worker.md` — Template for any new worker charter.
- Key role-specific charters referenced above ensure every critical domain (security, SRE, trust & safety, legal, GTM) has ownership and process.

## 14. Research & Appendices
- `docs/research/domain-connect-matrix.md` — Registrar integration research (linked above).
- `docs/research/market-landscape.md` & `docs/research/pricing-benchmarks.md` — Competitive insights for pricing decisions.
- `docs/architecture/performance-budgets.md` cross-links to `docs/ops/error-budgets.md` for operational alignment.

## Change Management
- Update this map when new policies, runbooks, or architecture decisions are added. Include owners and review cycles in the respective documents to keep the MVP playbook consistent.
