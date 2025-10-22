# Disaster Recovery (DR)

Purpose
- Restore critical services and data within defined recovery objectives after catastrophic failures (vendor outages, data loss, misconfig deploys).

Scope & Priorities
- Tier 0: Redirector availability; DNS/TLS continuity for live customer traffic.
- Tier 1: Core data in Neon Postgres; Stripe webhook processing.
- Tier 2: Web app UX, dashboards, analytics freshness (AE), admin tools.

Recovery Objectives
- RPO (data loss tolerance)
  - Neon Postgres: ≤ 5 minutes via PITR or branch fallback.
  - Routing config (KV/DO): ≤ 15 minutes via export snapshots and replay.
  - Analytics (AE): acceptable to lose ≤ 5 minutes of raw events; derive from rollups.
- RTO (time to service)
  - Redirector: ≤ 15 minutes (promote last known good; route override; vendor failover if supported).
  - Web app: ≤ 60 minutes (re‑deploy previous artifact; static degradation acceptable).
  - TLS/Custom Hostnames: resume issuance within ≤ 60 minutes; continue serving existing certs.

Data Protection
- Neon Postgres
  - Enable PITR; take automated backups; retain ≥ 7 days (tune per cost/compliance).
  - Use Neon branches for safe hotfix testing and quick restore points (pre‑migration tags).
- Routing state
  - Source of truth in DB; export KV snapshots daily; script replay to KV via DO (idempotent writes).
- Configuration as code
  - Version `wrangler.toml`, bindings, Pages config; store secure env vars in secret manager with export procedure.
- Secrets
  - Follow docs/security/secrets-management.md; maintain break‑glass access with audit.

DR Playbooks
- DB corruption or bad migration
  - Halt writes; create branch from last good LSN (Neon) or PITR to timestamp.
  - Point app to branch; validate; then cut forward plan and backfill if needed.
- Cloudflare regional issues affecting Worker
  - Reduce blast via canary routes; redeploy to prior version; contact Cloudflare support.
  - If widespread platform outage, communicate impact; consider temporary DNS route to static fallback if feasible.
- TLS issuance outage
  - Keep existing certs serving; extend maintenance; coordinate reissue once vendor resolves.
- Stripe outage/webhook backlog
  - Buffer events; once recovered, replay webhooks; reconcile ledgers; communicate delayed payouts if applicable.

Drills & Testing
- Quarterly DR exercises
  - Tabletop: simulate SEV1 (redirect outage, DB restore) and walk through steps.
  - Technical: restore Neon branch to a staging environment; replay KV from export; validate app.
- Evidence
  - Capture timestamps, commands, screenshots; store in DR run log.

Dependencies & Contacts
- Cloudflare support portal, status page, and account IDs.
- Neon support; project/org identifiers.
- Stripe status/support; account IDs.

Change Management
- Before risky changes (migrations, Worker refactors), cut a Neon branch; tag releases; ensure rollback plan in deploy ticket.

References
- Observability: docs/ops/observability.md
- Deploy & Rollback: docs/deployment/deploy-pipelines.md
- Secrets: docs/security/secrets-management.md
