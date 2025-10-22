# Runbook — DNS Cutover & Rollback

Objective
- Safely move traffic to Cloudflare for SaaS custom hostnames with minimal downtime and verifiable control.

References
- Cloudflare for SaaS pre-validation: https://developers.cloudflare.com/cloudflare-for-platforms/cloudflare-for-saas/domain-support/hostname-validation/pre-validation/
- Cloudflare for SaaS getting started: https://developers.cloudflare.com/cloudflare-for-platforms/cloudflare-for-saas/start/getting-started/
- Domain Connect overview: https://www.domainconnect.org/

Pre-checks
- Ownership: Confirm domain owner has registrar/DNS access; confirm current nameservers and DNS host.
- Records inventory: Export existing A/AAAA/CNAME/ALIAS and relevant TXT; note CDN/WAF in front if any.
- TTL audit: Identify TTLs for apex and www; plan reduction window.

Phase 1 — Pre-validation (before cutover)
- Choose method per listing:
  - TXT token: publish TXT at specified label to prove control (recommended for apex).
  - HTTP token: serve token at well-known path if existing site allows.
  - Domain Connect (if supported): complete provider authorization to automate records.
- In Cloudflare (Custom Hostnames):
  - Create custom hostname entry for the customer domain.
  - Enable pre-validation using TXT/HTTP method; wait for `pending_validation=false`.
- Reduce TTLs: lower affected records to 300s (or provider minimum) at least one hour before cutover.

Phase 2 — Cutover
- Create/confirm target:
  - For apex: use ALIAS/ANAME/CNAME flattening per provider capability to Cloudflare target.
  - For www and other hosts: CNAME to Cloudflare target.
- Flip records:
  - Apply changes during scheduled window; verify in DNS (dig/nslookup) that records resolve to Cloudflare.
- Certificates:
  - Ensure Cloudflare issued TLS for the custom hostname (status green). If stuck, retry issuance.

Validation
- HTTP checks: verify 200/3xx from edge; confirm correct redirect codes and query preservation.
- Propagation: check multiple resolvers (Google 8.8.8.8, Cloudflare 1.1.1.1, ISP) after TTL window.
- Analytics smoke: see events in Analytics Engine for test hits (if enabled).

Monitoring (first 30–120 minutes)
- Error budget: watch 5xx at edge; spikes trigger rollback evaluation.
- SSL: monitor issuance/renewal errors; auto-retry on failure.
- Performance: P95 redirect latency within budget (see performance-budgets).

Rollback
- Criteria: sustained 5xx, misrouting, SSL issuance failure beyond 20 minutes, or business directive.
- Steps:
  - Revert DNS to prior A/AAAA/CNAME values from inventory.
  - Clear local/edge caches as possible; communicate rollback to stakeholders.
  - Keep pre-validation in place for quick reattempt.

SLA & Communications
- Planned window: announce at least 24h prior; typical 30–60 minute window.
- Downtime target: zero downtime; acceptable transient 3–5 minutes during propagation for some resolvers.
- Status updates: T-10, T0, T+15, T+60 with success/fail indicators; incident comms if rollback.

Post-cutover
- Lock TTLs back to standard (e.g., 1800s–3600s) once stable for 24h.
- Document changes, screenshots, and any deviations.
- Close the change ticket with validation evidence (DNS checks, HTTP, analytics, TLS status).
