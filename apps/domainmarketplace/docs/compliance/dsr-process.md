# Data Subject Request (DSR) Process

Scope
- Applies to requests under GDPR/UK GDPR, CCPA/CPRA, and similar frameworks (access, deletion, correction, portability, restriction, objection, opt‑out).

Intake Channels
- privacy@example.com or in‑app privacy request form. Log every request in a dedicated tracker with timestamps.

Verification
- Email‑based verification for account holders (link or code). For higher assurance or sensitive requests, require additional verification (recent login IP match, billing zip provided to Stripe, or government ID where lawful and necessary).
- For agent requests (CCPA), require signed authorization and reasonable verification of the consumer.

Discovery
- Systems of record: Neon (accounts, listings, rentals, disputes), Stripe (billing), Cloudflare AE (click telemetry), support desk.
- Use identifiers: email, userId, rentalId. For telemetry, search by userId/rentalId and aggregate visitor data; avoid releasing raw IPs/UAs.

Fulfillment Steps
- Access (copy): Provide a structured report of personal data categories and specific records where feasible; include source, purpose, retention, recipients.
- Deletion (erasure): Delete or pseudonymize personal data in Neon; stop processing in active systems. Exclusions: where retention required (billing/tax, security logs). Remove identifiers from telemetry if feasible without degrading security.
- Correction: Update inaccurate account fields.
- Portability: Provide machine‑readable export (JSON/CSV) of user‑provided data and observed activity tied to the account.
- Objection/Restriction: Cease processing for specific purposes (e.g., analytics) where applicable; update preferences.

Exceptions and Limits
- Deny or limit where disclosure would adversely affect rights/freedoms of others, reveal trade secrets, or conflict with legal obligations. Document rationale.

Timelines (start at verification)
- GDPR/UK: Respond within 1 month; extend by 2 months for complexity with notice within 1 month.
- CCPA/CPRA: Respond within 45 days; extend by 45 days with notice.

Outputs to Requester
- Confirmation of receipt and verification.
- Response with data/confirmation, actions taken, or denial with reasons and appeal instructions.

Recordkeeping
- Maintain log of requests, verification steps, decisions, dates, and fulfillment artifacts for compliance.

Operational Runbook
- Owner: Privacy Lead; Backup: Security Lead.
- Weekly review of open DSRs; escalation for overdue items.
- Templates: receipt, verification, extension notice, denial, fulfillment.

Testing
- Quarterly tabletop: create a test account, submit access and deletion requests, validate end‑to‑end processing and retention exceptions.

