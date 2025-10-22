# Support Macros (MVP)

Usage
- Replace variables like {{domain}}, {{hire_id}}, {{provider}}, {{ttl}}, {{target_url}}, {{invoice_id}}, {{amount}}.
- Link internal runbooks where noted.

---

DNS-VERIFICATION-FAILED
Subject: DNS verification pending for {{domain}}
Body:
Hi {{name}},

We’re still not seeing the verification record for {{domain}}. Please:
- Confirm the TXT (or HTTP) token matches exactly from the onboarding screen
- Ensure it’s added in the correct zone ({{domain}}) and not a subzone
- Wait for propagation (TTL ~ {{ttl}} seconds)
- Re-run “Verify” in the dashboard

If this persists, reply with a screenshot of your DNS record and we’ll help.

Links: docs/ops/runbooks/dns-cutover.md

---

CERTIFICATE-PENDING
Subject: TLS certificate still pending for {{domain}}
Body:
Hi {{name}},

Your DNS appears to resolve correctly, but the certificate is still pending. We’ve re‑tried issuance.
Please ensure no conflicting A/AAAA records remain and that CNAME/ALIAS points to our target. Once DNS propagates, TLS should issue within ~20 minutes.

We’ll monitor for completion. Thanks!

Links: docs/ops/runbooks/dns-cutover.md

---

DOMAIN-CONNECT-UNSUPPORTED
Subject: Domain Connect not available for {{provider}}
Body:
Hi {{name}},

It looks like {{provider}} doesn’t support Domain Connect. Please use the TXT pre‑validation, then set the CNAME/ALIAS as shown in the wizard. This approach is safe and avoids downtime until you flip the records.

If you need guidance for {{provider}}, send a screenshot and we’ll advise.

Links: docs/research/domain-connect-matrix.md

---

ZONE-CONFLICT-CLOUDFLARE
Subject: {{domain}} is already managed in Cloudflare
Body:
Hi {{name}},

We detected that {{domain}} is already on Cloudflare. To proceed, we can configure Cloudflare for SaaS within your existing zone, or set up a zone invitation. Please confirm whether you control the Cloudflare account for {{domain}} and we’ll share next steps.

Thanks!

---

ROUTING-404
Subject: 404 on {{domain}} path
Body:
Hi {{name}},

We’re seeing a 404 because the exact host/path is not mapped. Please:
- Open your hire routes and confirm {{path}} exists and is published
- For exclusive hires, set apex and www targets
- Use the link checker to validate the 3xx to {{target_url}}

Reply if this still fails and we’ll investigate.

---

REDIRECT-CODE-ADVICE
Subject: Which redirect code should I use?
Body:
Hi {{name}},

Use 302 (temporary) for most campaign hires. Choose 301 (permanent) only if you intend a permanent move contractually. See our Redirect Policy for details.

Links: docs/seo/redirect-policy.md

---

BILLING-PERIOD-REFUND
Subject: Refund request for {{hire_id}}
Body:
Hi {{name}},

Period hires are billed monthly. Refunds are limited to platform‑caused downtime per SLA. If you experienced an outage, please share the time window and impact. We’ll review logs and follow up with options (credit or pro‑rata where applicable).

Links: docs/payments/disputes-and-credits.md

---

BILLING-USAGE-INVOICE
Subject: Usage invoice {{invoice_id}}
Body:
Hi {{name}},

Your monthly invoice includes validated clicks only. You can compare counts in Analytics → export CSV for the same range. If you suspect invalid traffic, file a dispute from Analytics and we’ll review and credit validated IVT per policy.

Links: docs/trust-safety/ivt-policy.md, docs/payments/disputes-and-credits.md

---

PAYMENT-FAILED
Subject: Action required — payment failed
Body:
Hi {{name}},

We couldn’t process your payment. Please update your payment method in Billing → Payment methods and retry. Routes may be paused if not resolved within 7 days.

---

CANCEL-PERIOD-HIRE
Subject: Cancellation confirmation
Body:
Hi {{name}},

Your hire will remain active through the current billing period and won’t renew next cycle. Routing stops at term end. You can resume any time by re‑activating.

---

IVT-DISPUTE-RECEIVED
Subject: Click quality review started — {{hire_id}}
Body:
Hi {{name}},

Thanks for reporting your concern. We’ve started a review for {{hire_id}} covering {{date_range}}. We’ll analyze bot scores, ASN/geo anomalies, frequency caps, and referrer integrity. Expect an update within 3–5 business days.

Links: docs/trust-safety/ivt-policy.md

---

CHARGEBACK-EVIDENCE
Subject: Chargeback evidence request — {{invoice_id}}
Body:
Hi {{name}},

We’re preparing evidence for {{invoice_id}}. Please provide any campaign context (creative, targeting, geo) that could help. Our bundle will include click summaries, referrers, geo/ASN, and policy references.

Links: docs/payments/chargeback-evidence.md

---

DSR-REQUEST
Subject: Data request received
Body:
Hi {{name}},

We received your data request and logged it under our DSR process. We will verify your identity and respond within the statutory timeframe.

Links: docs/compliance/dsr-process.md

---

DMCA-TAKEDOWN
Subject: DMCA notice received for {{domain}}
Body:
Hi {{name}},

We received a DMCA notice referencing {{domain}}/{{path}}. We have processed the takedown per policy and notified involved parties. If you believe this is in error, please submit a counter‑notice as described in our DMCA policy.

Links: docs/legal/dmca-policy.md

---

UDRP-NOTICE
Subject: UDRP complaint received — {{domain}}
Body:
Hi {{name}},

We received a UDRP complaint involving {{domain}}. We have placed the affected routes on hold pending outcome, per policy. Please review our workflow and provide any relevant documentation.

Links: docs/legal/udrp-workflow.md

