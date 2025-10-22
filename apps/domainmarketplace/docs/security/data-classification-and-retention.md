# Data Classification & Retention

Classification
- Public — marketing site content, public docs
- Internal — configuration, non‑sensitive logs, feature flags
- Confidential — business plans, non‑public metrics
- Sensitive — personal data (accounts, payouts), click telemetry, secrets

Inventory and Windows
- Accounts (Sensitive): name, email, auth IDs — retain while account active + 24 months; then delete/pseudonymize
- Payouts/Billing (Sensitive): Stripe IDs, invoices — retain 7 years (statutory)
- Routing configs (Internal): host/path → target, codes — retain term + 12 months (for audits/disputes)
- Click telemetry (Sensitive): hashed IP, UA hash, geo, referrer, counts — raw ≤ 13 months; aggregates longer
- Audit logs (Sensitive): admin actions, disputes — retain 24 months
- Support tickets (Sensitive): retain 24 months (unless legal hold)

Storage Locations
- Neon (SoR): accounts, listings, rentals, payouts, disputes, rollups
- Workers KV: hot route maps (no PII)
- Analytics Engine: raw click events (pseudonymized identifiers)
- Stripe: payments and payouts
- Support: ticketing system (separate DPA)

Backups and DR
- Neon managed backups and branching; do not export secrets to plaintext backups; test restores quarterly

DSR Handling
- Access: compile from Neon, Stripe, support; avoid exposing raw telemetry identifiers (aggregate where feasible)
- Deletion: delete/pseudonymize Neon rows; schedule deletion in support; telemetry de‑identification within 30 days

Safeguards
- Encryption in transit; platform secrets storage; least‑privilege DB roles; audit access

