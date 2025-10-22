# Owner Onboarding Guide

Audience
- Domain owners listing domains for exclusive rentals or shared slugs.

What you need
- Registrar/DNS access for the domain
- Stripe account details (for payouts via Stripe Connect)

Time required
- 10–25 minutes (depending on DNS method)

Overview
1) Sign up → 2) Connect Stripe → 3) Add domain → 4) Verify control → 5) Lower TTLs → 6) Cutover (CNAME/ALIAS) → 7) TLS auto‑provision → 8) Set pricing → 9) Publish

Step‑by‑step
1) Create account
- Go to the app and sign up/log in. Complete email verification if prompted.
[screenshot: sign up]

2) Connect Stripe (payouts)
- In Owner Dashboard → Payouts, click “Connect with Stripe.” Complete KYC. Status must be charges_enabled to receive payouts.
[screenshot: stripe connect]

3) Add your domain
- Owner Dashboard → Domains → “Add domain.” Enter the FQDN (e.g., example.com).
[screenshot: add domain]

4) Verify domain control (choose one)
- Domain Connect (one‑click) [recommended when supported]
  - Pick your DNS provider, authorize changes, and we’ll configure required records.
  - If your provider isn’t listed, use pre‑validation or manual.
  [screenshot: DC provider picker]
- Cloudflare for SaaS pre‑validation (TXT/HTTP)
  - TXT: Add the TXT record shown in the wizard. Wait for status to switch from pending to verified.
  - HTTP: If your site is live, upload the HTTP token at the provided path; we’ll confirm before cutover.
  [screenshot: pre‑validation tokens]
- Manual (fallback)
  - We’ll show exact records (CNAME/ALIAS) and the pre‑validation token. Add them in your DNS panel.

5) Lower TTLs before cutover
- Reduce TTL on apex and www to 300s (or provider minimum) at least one hour before cutover.

6) Cutover DNS (zero/minimal downtime)
- Apex: use ALIAS/ANAME/CNAME‑flattening to the provided Cloudflare target if your DNS supports it.
- www and other hosts: CNAME to the Cloudflare target.
- Save changes; propagation commonly takes minutes to an hour based on TTL.
[screenshot: CNAME/ALIAS example]

7) TLS (SSL) issuance
- Certificates issue automatically after records resolve. If issuance is pending >20 minutes, see Troubleshooting.
[screenshot: TLS issued]

8) Set pricing and availability
- Listing → choose Exclusive (entire domain) or Shared slugs.
- Pricing: monthly (period) and/or per‑click. You can require a minimum term.
[screenshot: pricing]

9) Publish listing
- Click Publish to make your domain discoverable. You can pause/unpublish anytime; active rentals run until term end.
[screenshot: publish]

DNS tips and notes
- Apex vs www: Many providers don’t allow CNAME at apex; use ALIAS/ANAME/flattening if available. Otherwise, point apex by provider’s alias feature.
- Preserve your site during pre‑validation: TXT/HTTP tokens do not change routing. Traffic only moves when you flip CNAME/ALIAS.
- Propagation: Expect up to the TTL you set. Keep TTL low during the migration window, then raise back to 1800–3600s when stable.
- Certificates: Auto‑issued after validation. If stuck, retry issuance and confirm DNS is resolving to the Cloudflare target.

Troubleshooting
- Verification stuck at pending
  - Check TXT/HTTP token spelling and label; wait for TTL; re‑run verification.
- SSL certificate not issued
  - Confirm CNAME/ALIAS resolves to the Cloudflare target and no conflicting A/AAAA remain. Retry issuance.
- Apex can’t CNAME
  - Use ALIAS/ANAME/flattening if provided by your DNS host, or point www first and contact support for apex options.
- Domain already on Cloudflare
  - If your domain is managed inside Cloudflare, we may need to invite the zone or configure within your existing account. Contact support.

Related docs
- Runbook — DNS Cutover & Rollback: docs/ops/runbooks/dns-cutover.md
- Domain Connect & Registrar Matrix: docs/research/domain-connect-matrix.md

