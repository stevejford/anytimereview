# Pricing Benchmarks — hires and Per‑Click

Purpose
- Establish initial pricing tiers and guardrails for exclusive domain hires and shared slug hires, plus per‑click usage rates.

Inputs
- Adjacent pricing: link management subscriptions (Bitly/Short.io); domain marketplaces with installment plans; domain parking yields.
- CPC context: industry CPC averages (e.g., legal/home services higher CPC).
- Costs: platform infra (Cloudflare Workers/AE, Neon), Stripe fees, support overhead.

Methodology
- Start with value‑based framing relative to CPC: vanity domains/slug relevance should command a fraction of campaign CPC while remaining attractive v. alternatives.
- Anchor with simple, transparent tiers; adjust per vertical/domain quality over time.

Exclusive Period hires (monthly)
- Tier A (Starter): $99–$199/mo — long‑tail domains, light relevance; proof‑of‑concept campaigns.
- Tier B (Core): $299–$599/mo — good relevance/brandability; SMB/agency campaigns.
- Tier C (Premium): $999–$2,500+/mo — high‑relevance, geo/EMD; enterprise/agency use.
- Guardrails: minimum $99/mo; multi‑month commit discounts up to 20% with 3–6 month terms.

Shared Slugs (monthly base + per‑slug)
- Base: $29/mo includes 1–3 slugs
- Additional slugs: $5/slug up to 10; then $3/slug (volume discount)
- Alternative: per‑click only with $50/mo minimum commit
- Guardrails: limit total slug count per domain to preserve quality; reserve protected slugs.

Per‑Click (validated clicks)
- Graduated tiers (monthly volume):
  - 0–1,000 clicks → $0.50 per click
  - 1,001–5,000 → $0.40 per click
  - 5,001+ → $0.30 per click
- Guardrails: minimum monthly commit $50; auto‑pause at 7‑day non‑payment; IVT auto‑credit caps 1–3%.

Illustrative economics
- Example: 1,000 clicks at $0.50 → $500 gross; platform 4% = $20; owner $480 minus Stripe fees (usage path: platform bears processing fees, then transfers owner share).
- Example: $500/mo exclusive: platform fee $20; owner receives $500 minus Stripe fees and app fee transfer.

Sensitivity: IVT and Seasonality
- Higher IVT → lower net valid clicks; usage tiers absorb some variance; IVT caps and manual dispute credits stabilize hirer ROI.
- Seasonality: allow hirers to scale slugs or switch domains; offer pause windows with minimums to preserve supply liquidity.

Assumptions & Notes
- Pricing flexible by vertical; legal/insurance trades at higher CPCs — adjust top tier accordingly.
- Owners may set reserves; platform can recommend tiers within ranges based on demand data.

References
- Bitly pricing: https://bitly.com/pages/pricing
- Short.io pricing: https://short.io/pricing
- Average CPC by industry (context): https://www.wordstream.com/blog/ws/average-cost-per-click
