# Bot Lists Lifecycle — Sources, Exceptions, and Audit

Purpose
- Maintain an accurate, conservative block/allow framework for known spiders/bots, minimizing false positives while keeping measurement clean.

Sources
- Primary: IAB Tech Lab International Spiders & Bots list (subscription).
- Secondary: Cloudflare Verified Bots catalog; internal signatures (test tools, monitors).

Cadence
- Regular: monthly sync aligned with IAB releases.
- Interim: ad‑hoc updates for emergent threats or false‑positive corrections.

Workflow
1) Sync
   - Pull latest lists; normalize UA patterns and IP/ASN notes.
2) Validate
   - Diff vs current; run sample classification over last 7 days of events; estimate FP/FN impact.
3) Stage
   - Apply to staging WAF rules/Worker filter with shadow mode (count‑only) for 24–72 hours.
4) Deploy
   - Promote to prod as block/exclude for measurement; keep verified bots on allowlist if desired for crawling.
5) Audit
   - Record version, diffs, impact, and sign‑offs in the change ticket; link dashboards.

Exceptions
- Allowlist
  - Known search engines/crawlers for SEO (if customers opt‑in) marked non‑billable and excluded from KPIs.
  - Customer‑approved QA tools; scope by domain/listing and time‑box.
- Blocklist overrides
  - If a source in IAB list is necessary for a customer workflow, treat as allowlist with count‑only, never billable.
- Ownership
  - T&S owns exception approvals; SRE reviews for operational risk; Legal reviews if policy/contract requires.

Rollbacks & Hotfixes
- If false positives exceed threshold (e.g., >0.05% of human traffic or major customer impact), immediately revert to prior list; communicate via status update and incident process if needed.

Testing
- Shadow mode comparisons: before/after counters on staging and a small canary share of prod.
- Sample log inspection for new/changed signatures, with representative device/geo diversity.

Audit & Records
- Keep changelog with: date, source version, diffs summary, FP/FN estimates, staging window results, prod promotion time, approvers.
- Retention: ≥ 12 months; store artifacts per data‑classification policy.

Contacts
- Owner: Trust & Safety lead
- Partners: SRE on‑call (deployment), SEO lead (crawler policy), Legal (policy exceptions)
