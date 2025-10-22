# IVT Policy — Measurement, Filtering, and Credits

Purpose
- Define how we detect Invalid Traffic (IVT), how it impacts billing, and how credits/disputes are handled. Aligns with IAB/MRC concepts of GIVT (general/known) and SIVT (sophisticated).

Scope
- Applies to per‑click metered billing and analytics. Period rentals are governed by availability SLAs (see disputes-and-credits.md).

Definitions
- GIVT (General/Known): traffic from known spiders/bots or deterministic non‑human sources (e.g., IAB list, verified bots, headless test tools).
- SIVT (Sophisticated): traffic that mimics human behavior or evades simple filters (data center spoofing, hijacked devices, automation frameworks).
- Billable click: a unique redirect event with successful 3xx status to the renter target that is not filtered as IVT and passes de‑duplication.

Signals (inputs)
- Cloudflare Bot Score (0–99): likelihood of bot automation (lower = more bot‑like).
- IAB Spiders & Bots UA signatures; Cloudflare Verified Bots.
- Network/ASN: known DC/hosting ranges, TOR/VPN reputation, residential vs DC.
- Behavior: inter‑arrival regularity, burst patterns, referrer integrity, cookie/JS presence, headless indicators, repeated link hits.
- Device/Geo: improbable device rotation, geo velocity, identical UA/IP clusters across many domains/links.

Scoring & Tiers
- Tier A — Definitely Invalid (GIVT/SIVT‑strong)
  - Any of: IAB/verified bot; CF Bot Score ≤ 9; headless flagged; known test tools; or ≥ 3 strong heuristics (e.g., DC ASN + referrer spoof + burst pattern).
  - Action: Exclude from billing and analytics KPIs; record for audit.
- Tier B — Suspected SIVT
  - CF Bot Score 10–29 with ≥ 2 heuristics; or 30–39 with ≥ 3 heuristics; or repeated de‑dup violations beyond thresholds.
  - Action: Not billed by default; quarantined in analytics (reported separately). Auto‑credit policy applies if any slip into billing.
- Tier C — Valid/Unknown
  - Not meeting the above; counted as billable if unique and successful redirect.

Counting & De‑duplication
- Uniqueness window: first qualifying click per (linkId × user key) every 30 minutes is billable.
  - User key precedence: cookie ID → stable fingerprint → (IP + UA) fallback.
- Burst guard: more than 5 events/sec for same (linkId × IP) flagged for review; subsequent events within the same second are non‑billable.
- Redirect success: require 3xx response with Location to renter target; 4xx/5xx are non‑billable.

Auto‑Credits (metered billing)
- Purpose: absorb small residual IVT/measurement error without manual casework.
- Default cap per invoice (renter):
  - Up to 2% of billed clicks automatically credited when subsequently classified as Tier A or Tier B, capped at 1,000 clicks or $500 equivalent (whichever is lower) per invoice.
  - Credits appear as a credit note on the same invoice if still open, or on the next invoice.
- Overrides: Trust & Safety may adjust caps for specific renters/sectors; document rationale in the case ticket.

Disputes & Manual Adjustments
- Renters may file a dispute within 30 days of invoice finalization (see disputes-and-credits.md).
- Evidence considered: event samples with bot scores, UA/ASN, timing diagrams, referrer integrity, JS/cookie presence, and IAB list matches.
- Outcomes: approve (additional credit), partial, or deny, each with written rationale and artifact links.

Controls & Enforcement
- Preventive: Cloudflare WAF/Bot Management, rate limits, Turnstile triggers on suspicious segments.
- Reactive: increase strictness thresholds regionally/temporarily during spikes; sample and investigate high‑risk sources.
- Customer controls: per‑listing optional strict mode (more aggressive filtering) with impact disclosed.

Measurement & Reporting
- Analytics separates: billable clicks, quarantined suspected SIVT, filtered GIVT.
- Monthly IVT report: rates by source, top ASNs/regions, actions taken, credits issued.

Audit & Retention
- Retain sampled evidence and aggregate metrics for ≥ 12 months, aligned with data‑classification policy.
- Every policy/version change is logged with effective date and sign‑off (T&S lead + SRE).

References
- IAB Spiders & Bots list; MRC IVT requirements
- Cloudflare WAF/Bot Management/Turnstile
- Disputes & Credits: docs/payments/disputes-and-credits.md
