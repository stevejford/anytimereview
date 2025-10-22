# Abuse Escalation SLAs — Reports, Mitigation, and Appeals

Purpose
- Ensure timely, consistent handling of abuse reports (security threats, policy violations, legal notices) with clear ownership and customer communication.

Intake Channels
- Email: `abuse@<company>.com` (24×7 monitored for P0/P1)
- Portal: Support ticket form (category: Abuse/Policy/Legal)
- Legal: DMCA agent inbox (see legal docs) and `legal@<company>.com`

Severity Matrix
- P0 — Critical harm or widespread impact
  - Phishing/malware distribution; active exploitation; widespread redirect hijack; significant legal exposure.
- P1 — High impact
  - AUP violation with user harm, large tenant impact, child safety concerns, brand impersonation at scale.
- P2 — Medium
  - Content/policy violations with limited impact; repeated IVT abuse patterns.
- P3 — Low/Informational
  - Single‑tenant issues; minor policy concerns; requests for clarification.

SLA Targets (acknowledge/mitigate)
- P0: acknowledge ≤ 15 minutes; mitigate/contain ≤ 2 hours; continuous updates ≤ 30 minutes.
- P1: acknowledge ≤ 2 hours; mitigate ≤ 8 hours; updates ≤ 2 hours.
- P2: acknowledge ≤ 1 business day; decision ≤ 3 business days.
- P3: acknowledge ≤ 3 business days; decision ≤ 10 business days.

Contact Tree (24×7 for P0/P1)
- Primary: Trust & Safety on‑call
- Technical: SRE on‑call (routing, takedowns), Security Engineer (if security risk)
- Legal: Legal counsel for DMCA/UDRP/defamation/privacy
- Communications: Comms/PR for external statements if needed

Standard Process
1) Intake & Triage
   - Log ticket; classify severity; collect URLs, evidence, timelines, reporter contact.
2) Containment
   - Disable offending route(s), suspend listings/contracts per AUP, enable stricter filters, or block sources.
3) Investigation
   - Gather logs (edge, app), screenshots, ownership and contract details; consult SEO/Legal if search/social policy implications.
4) Decision
   - Action taken, timeframe, notification plan; document policy/rationale and evidence.
5) Communication
   - Notify affected customers and reporter as appropriate; for legal notices, follow statutory requirements.
6) Post‑action Review
   - Record in abuse register; add detections or policy updates; link to incident if applicable.

Special Workflows
- DMCA Notices
  - Follow docs/legal/acceptable-use-policy.md and DMCA agent process; acknowledge within statutory timelines; remove or disable access to infringing content; notify counter‑notice path.
- UDRP/Trademark
  - Escalate to Legal; follow docs/legal/udrp-workflow.md; do not adjudicate ownership claims; preserve logs.
- Security Threats (phishing/malware)
  - Immediate P0; disable routing; add WAF rules; coordinate with hosting and destinations; notify customers.
- IVT Abuse
  - Tighten filters; suspend abusive accounts; coordinate credits with payments team (see disputes-and-credits.md and ivt-policy.md).

Appeals
- Customers may appeal enforcement within 14 days of notice.
- Appeal must include new evidence or clear refutation of findings.
- T&S lead reviews with Legal/SRE as needed; decision within 10 business days; decision communicated in writing.

Evidence & Audit
- Keep all artifacts (tickets, logs, comms, screenshots) ≥ 12 months.
- Use unique case IDs and maintain chain‑of‑custody for legal matters.

References
- AUP: docs/legal/acceptable-use-policy.md
- UDRP Workflow: docs/legal/udrp-workflow.md
- Disputes & Credits: docs/payments/disputes-and-credits.md
- IVT Policy: docs/trust-safety/ivt-policy.md
