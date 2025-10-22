# Runbook — Incident Response

Purpose
- Coordinate fast, safe resolution of production incidents with clear roles, comms, and decision points. Blameless by default.

Severities (examples)
- SEV1 — Critical outage or high user impact
  - Global redirect failures (>0.1% 5xx for 5+ min), TLS expiry causing widespread failures, Stripe webhooks failing backlog > 5 min impacting charges/payouts.
- SEV2 — Degraded service or partial impact
  - Regional redirect latency/5xx spike, onboarding/TLS issuance stalling for many customers, elevated IVT filtering impacting valid traffic.
- SEV3 — Minor impact or single‑tenant issue
  - Isolated domain onboarding failure, small subset of links mis‑routed, minor dashboard errors.

Roles
- Incident Manager (IM)
  - Owns timeline, severity, and comms; keeps focus and drive to mitigation/close.
- Tech Lead (TL)
  - Leads diagnosis/mitigation, assigns responders, owns rollback decision with IM.
- Comms Lead
  - Handles internal/external updates, status page posts, customer comms templates.
- Scribe
  - Captures timeline, decisions, evidence for postmortem.

Activation
- Trigger sources: monitoring alerts (see observability), customer reports, on‑call manual page.
- Channel: create Slack `#incidents-<YYYYMMDD>-<short>`; link to ticket/issue.
- Declare severity; assign IM/TL/Comms/Scribe; start timeline.

Standard Flow
1) Detect
   - Confirm signal and scope; check recent deploys (git sha/version), status pages (Cloudflare/Neon/Stripe).
2) Triage (≤ 10 minutes)
   - Identify blast radius (global, region, tenant); pick primary hypothesis; decide on rollback/safeguards if indicated.
3) Mitigate
   - Apply fastest safe mitigation (rollback, feature flag, WAF rule change, route override, replay webhooks).
4) Communicate
   - Internal update every 15 minutes (or as agreed); external status update per severity.
5) Verify
   - Confirm KPIs back to normal; watch for 30–60 minutes.
6) Close & Postmortem
   - Document timeline, root causes, corrective actions; schedule review within 5 business days.

Common Mitigations
- Redirector
  - Roll back Worker to last known good (wrangler deploy previous version); disable new features; reduce KV writes.
- Web app
  - Revert Pages deployment to previous; toggle feature flags; degrade non‑critical analytics.
- TLS/Onboarding
  - Retry issuance; switch method (TXT vs HTTP); communicate alternative path; extend maintenance if required.
- Payments
  - Validate webhook endpoint; re‑deploy; replay Stripe events; pause charges if data integrity in doubt.
- IVT spikes
  - Tighten WAF/Bot policies; enable Turnstile; rate‑limit suspicious segments; communicate temporary filtering to customers if needed.

Decision Points
- Rollback criteria
  - Sustained SEV1 metrics; failed mitigation attempts; rising error budget burn.
- Escalation to vendor
  - Cloudflare (runtime/TLS), Neon (DB), Stripe (webhooks/payments) — open tickets if vendor health pages indicate issues or you’ve isolated vendor‑side faults.

Checklists
- First 15 minutes
  - [ ] Page on‑call; declare severity; assign roles; start Slack channel
  - [ ] Snapshot metrics; identify recent changes; decide rollback hold or go
  - [ ] Prepare customer update stub if SEV1/2
- Pre‑rollback
  - [ ] Verify last known good artifact/version
  - [ ] Confirm safe DB state/migrations; consider Neon branch for isolation
  - [ ] Announce rollback plan and blast radius
- Verification
  - [ ] KPIs recovered (5xx, latency, webhooks, TLS status)
  - [ ] No new errors in Sentry; dashboards stable for 30–60 minutes

Communication Templates
- Internal (Slack)
  - “SEV1 Redirect errors elevated (0.3% 5xx, 10 min). IM: <name>, TL: <name>. Hypothesis: new Worker release. Action: rollback in 2 min. Next update: 10:30 UTC.”
- External (status page)
  - “We’re investigating increased redirect errors affecting some traffic. We’ve initiated a rollback and expect recovery shortly. Next update in 15 minutes.”
- Customer email (SEV1 major tenant impact)
  - “Between HH:MM–HH:MM UTC, some redirects from your domains experienced errors due to a service regression. We rolled back and validated recovery. Impact: X% of requests. We’re conducting a post‑incident review and will share details within 5 business days.”

Artifacts & Sources
- Observability: docs/ops/observability.md
- Deploy & Rollback: docs/deployment/deploy-pipelines.md
- DNS Cutover/TLS: docs/ops/runbooks/dns-cutover.md

Postmortem (blameless)
- Create a doc titled “YYYY‑MM‑DD — <summary>”. Include:
  - Impact and detection timeline
  - Root cause and contributing factors
  - What went well / could be better
  - Action items with owners and due dates (prevent/mitigate/detect)
  - Links to dashboards, logs, commits, tickets

On‑call & Coverage
- Maintain an on‑call schedule; ensure rotation knows how to escalate to Cloudflare/Neon/Stripe support.
- Keep runbooks discoverable; run quarterly incident drills.
