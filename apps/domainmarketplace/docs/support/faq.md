# FAQ (MVP)

DNS & Verification
- How do I verify I own the domain?
  - Use Domain Connect if your DNS provider supports it. Otherwise add the TXT/HTTP token shown in the wizard. Verification clears once DNS propagates.
- TXT verification is not clearing — what now?
  - Confirm the exact name and value, no quotes, correct zone, and wait for TTL. Use public DNS (1.1.1.1/8.8.8.8) to check. Try re‑verify.
- Can I point the apex to you if my provider disallows CNAME?
  - Yes, use ALIAS/ANAME/CNAME‑flattening if available. Otherwise contact support for alternatives.
- Why is my SSL certificate pending?
  - Certificates issue after your domain resolves to our target and ownership is verified. If pending >20 minutes, re‑try issuance and confirm no conflicting A/AAAA records remain.
- My domain is already on Cloudflare. What should I do?
  - If your zone is managed in Cloudflare, we can configure via Cloudflare for SaaS or invite the zone. Open a ticket with your domain and account details.

Routing & Redirects
- Do you preserve UTM parameters?
  - Yes. Query strings are preserved by default.
- Which redirect code should I use?
  - Use 302 for temporary hires. Use 301 only when the move is permanent per contract.
- Can I map multiple slugs at once?
  - Yes. Use bulk upload on the slug configuration screen.
- I’m getting a 404. Why?
  - Ensure the exact host/path exists in your routes. If using slugs, confirm you published them and they are not paused.

Billing & Payments
- What’s the difference between period and per‑click billing?
  - Period is a fixed monthly price (exclusive or slug bundles). Per‑click is metered; invoices finalize monthly for validated clicks.
- Who pays Stripe fees and the 4% platform fee?
  - For Direct Charges (period), the owner pays Stripe fees; the platform takes a 4% application fee. For usage billing, the platform bills and transfers owner share minus 4%.
- When are payouts sent to owners?
  - Per your Stripe Connect payout schedule after successful charges clear. See Payouts in your dashboard.

Refunds & IVT
- Do you offer refunds for period hires?
  - Refunds are limited. Pro‑rata credits may apply for platform‑caused downtime per SLA. See our policy.
- How do IVT credits work on per‑click plans?
  - We filter bots and invalid activity. If IVT is identified post‑facto, credits apply up to policy caps and reflected on the next invoice.
- How do I dispute click quality?
  - From Analytics → “Report a concern.” Provide campaign details and time window; we will investigate and respond.

Analytics
- Why do my numbers differ from Google Analytics?
  - Different filters and deduplication rules. We count validated redirects post‑filtering; GA counts page loads with scripts. Some variance is expected.
- Do you track PII?
  - We do not store raw IPs long‑term. We hash IPs for deduplication and store aggregate metrics. See Privacy Policy.

Accounts & Support
- How do I cancel?
  - Period hires: cancel before renewal in Billing → hires. Per‑click: cancel the plan to stop future usage charges.
- How do I contact support?
  - Use in‑app Support or email support@example.com with your domain, hire ID, and a brief description.

References
- DNS Cutover Runbook: docs/ops/runbooks/dns-cutover.md
- Redirect Policy: docs/seo/redirect-policy.md
- Disputes & Credits: docs/payments/disputes-and-credits.md

