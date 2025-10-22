# Disputes, Credits, and Refunds

Scope
- Applies to period (fixed) rentals and per‑click metered plans.

Principles
- Fairness and integrity; credits for validated invalid traffic (IVT); clear timelines; auditable adjustments.

IVT Credits (Per‑click)
- Auto‑credits: Up to X% of monthly clicks auto‑credited when our filters mark events as ‘definite IVT’ (policy to define; start with 1–3%).
- Manual credits: Additional suspected IVT handled via dispute intake; adjust next invoice or issue credit note on current invoice if still open.
- Evidence: Bot scores, ASN/geo anomalies, frequency caps, referrer integrity, IAB lists; see ivt-policy.md.

Period Rental Refunds
- Eligibility: Platform‑caused downtime (routing unavailability) exceeding SLA thresholds (e.g., > 15 consecutive minutes or > 0.1% monthly unavailability).
- Form: Pro‑rata service credit applied to next cycle; refunds to original payment method only for exceptional cases.
- Exclusions: Customer DNS misconfiguration, destination outages, content/app errors, or abuse suspensions.

Dispute SOP (both models)
1) Intake
- Ticket created with rentalId, period, claimed issue, requested remedy.
2) Investigation
- Gather logs (routing health, click telemetry, bot signals); compare against SLAs and policy thresholds.
3) Decision
- Approve or deny with rationale; determine credit/refund amount and method.
4) Communication
- Inform customer; include evidence summary and next steps.
5) Ledger adjustments
- Metered: create credit note or usage adjustment; Period: refund (Direct Charge) or create platform credit and apply.
6) Close & audit
- Record case artifacts: logs, screenshots, calculations, communications.

Stripe mechanics
- Period (Direct Charges):
  - Refunds issued from Owner connected account; optionally refund application fee.
  - If dispute (chargeback): prepare evidence and respond; platform may need to reverse transfers to Owner if funds already moved.
- Metered (Collect‑then‑Transfer):
  - Use credit notes on invoices for IVT adjustments; prefer against refunds.
  - For refunds, reverse related transfers to Owners.

Timelines
- Dispute submission window: within 30 days of invoice finalization (metered) or rental period charge (period).
- Investigation SLA: initial response within 3 business days; resolution within 10 business days.

Communications
- See support/macros.md for templates (IVT‑DISPUTE‑RECEIVED, BILLING‑PERIOD‑REFUND, BILLING‑USAGE‑INVOICE).

Testing
- See docs/testing/payments-test-matrix.md for scenarios including webhooks, retries, idempotency, and credits.

