# Chargeback Evidence Templates

General guidance
- Submit within network deadline; ensure all fields match the disputed charge.
- Provide concise, factual narrative and attach corroborating evidence.

Common dispute categories and evidence
- Fraudulent / card not present
  - Narrative: Service delivered; redirect activity from cardholder IP/ASN geos; no signs of account takeover; terms accepted.
  - Attach: Click logs around charge window (timestamps, geo/ASN, UA hash), account login/IPs, TOS acceptance records, invoice/receipt.
- Product not received / service not received
  - Narrative: Routing active; link checker success; traffic delivered (validated clicks count and sample logs).
  - Attach: Routing uptime evidence, AE rollups for the period, screenshots of active routes, communication with customer.
- Canceled recurring / subscription canceled
  - Narrative: Show cancellation date/time and renewal policy; charge preceded cancellation; or charge reversed/credited.
  - Attach: Subscription/hire logs, cancellation request, policy excerpt, credit/refund proof if applicable.
- Duplicate
  - Narrative: Single service per period; one charge valid; the other already refunded or voided.
  - Attach: Charge IDs mapping, refund/void records, invoice copies.
- Credit not processed
  - Narrative: Credit applied via invoice credit note or refund; reference IDs and dates.
  - Attach: Credit note, refund receipt, communication.

Checklist per submission
- [ ] Charge/PaymentIntent ID and date
- [ ] Customer, hireId, and service description
- [ ] Service delivery proof (routing active, logs, analytics)
- [ ] TOS/AUP acceptance and policy excerpts
- [ ] Communication thread excerpts (if any)
- [ ] Refund/credit records (if any)
- [ ] Contact information for follow‑up

Templates

Header
```
Dispute ID: <id>
Charge ID: <ch_...>
Payment Intent: <pi_...>
Customer: <name/email>
Service: Domain/slug hire for <domain>, period <dates>
Amount: $X.XX
```

Narrative (example — service delivered)
```
We provide a domain routing service (HTTP redirects) for campaign destinations.
For the disputed period, routing for <domain>/<slug> was active and functional.
Validated clicks: <count>. Attached are logs with timestamps, geo/ASN, and user‑agent hashes.
Our terms and cancellation policy were accepted at signup. No cancellation was requested before billing.
```

Attachments
- PDF/CSV: click summaries; AE rollups excerpt
- Screenshots: active routes, link checker results, dashboard
- Policies: TOS/AUP excerpts; refund policy

