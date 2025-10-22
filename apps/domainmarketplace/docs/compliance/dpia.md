# Data Protection Impact Assessment (DPIA)

Note: Working draft for privacy engineering. Final review required by counsel and DPO prior to launch.

Overview and Scope
- Service: Domain hire marketplace with DNS onboarding and HTTP redirects; click analytics; payments and payouts.
- Roles: Controller for marketplace accounts, routing configuration, analytics; Processor roles may apply where operating on behalf of Owners for billing analytics.
- Individuals affected: Owners, hirers, end visitors to rented domains.

Processing Purposes and Lawful Bases
- Provide service features (accounts, listings, routing, billing) — Contract (GDPR Art. 6(1)(b)).
- Fraud prevention and security (bot/IVT detection, rate limiting) — Legitimate interests (Art. 6(1)(f)).
- Analytics and product improvement (aggregated click metrics) — Legitimate interests; where cookies required, Consent (ePrivacy/Art. 6(1)(a)).
- Legal compliance (tax, accounting, takedowns) — Legal obligation (Art. 6(1)(c)).

Data Inventory (key items)
- Account: name, email, auth identifiers; Better‑Auth session details.
- Payments: limited billing info via Stripe; no full card data stored by us; Connect account IDs for Owners.
- Routing: domain, host, path, target URLs, redirect codes; timestamps of changes.
- Click telemetry: timestamp, host, path, hirerId/ownerId, country, ASN, user agent hash, referrer domain, bot score bucket, counts; IP treated via hashing/salting for deduplication and fraud analysis.
- Support: messages and attachments; dispute artifacts.

Special Categories and Children
- No special category data intended. Service not directed to children; minimum age policy enforced in ToS.

Data Minimization and Retention
- Collect only fields required for routing, billing, and security. Avoid storing full IP addresses where feasible; use hashed IP with rotation as needed for dedup windows.
- Retention: raw click events ≤ 13 months; aggregated analytics longer; billing/tax records per statutory periods; see data-classification-and-retention.md.

Security Measures
- Transport encryption; access controls and RBAC; least‑privilege API keys; webhook signature verification; audit logs for sensitive operations.
- Separation of duties for production access; incident response and DR runbooks; error budgets and monitoring.

Risk Assessment (selected)
- Re‑identification of visitors via telemetry linkage — Mitigation: hashing IPs; limit retention; aggregate reporting; avoid high‑cardinality identifiers.
- Unauthorised access to accounts or payouts — Mitigation: Better‑Auth hardening, 2FA option, Connect onboarding state checks, secret rotation.
- IVT misclassification harms billing integrity — Mitigation: conservative filters; review queue; credits and dispute process; audit trail.
- Data transfers to third countries — Mitigation: SCCs and vendor DPAs; regional storage options where available; vendor due diligence.

International Transfers and Processors
- Cloudflare (edge routing/analytics), Stripe (payments), Neon (DB), Resend (email). Transfers may occur to the US or other countries; ensure DPAs and appropriate safeguards are in place.

Data Subject Rights
- Access, deletion, correction, portability, restriction, objection where applicable. See dsr-process.md for verification and SLAs.

Cookies and Consent
- Essential cookies for auth; optional analytics/marketing subject to regional consent. See cookie-consent.md.

DPIA Outcome
- Residual risks considered low to medium with mitigations above. Proceed with go‑live contingent on completion of vendor DPAs, SCCs where needed, and operationalization of DSR and consent mechanisms.

Approvals and Review
- Owner: Privacy Lead [name]
- DPO/Counsel: [name]
- Review cadence: at major product changes or annually, whichever comes first.
