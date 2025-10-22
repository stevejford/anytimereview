# KPIs and Dashboards (MVP)

Purpose
- Define success metrics, owners, and review cadence for the MVP. Emphasize marketplace liquidity, click integrity, and revenue health.

North‑Star and Core KPIs
- GMV (Gross Marketplace Volume) — total hirer spend (period + usage) before fees
  - Formula: `GMV = sum(period_charges) + sum(usage_charges)`
- Platform Revenue (Take Rate) — our 4% fee on GMV
  - Formula: `Revenue = GMV * 0.04`
- Owner Payouts — distributions to owners
  - Formula: `Payouts = GMV - platform_fee - processing_fees`
- Validated Clicks — total human clicks recorded
  - Formula: `ValidClicks = sum(click_rollups.valid_clicks)`
- IVT Rate — invalid traffic share
  - Formula: `IVT% = sum(invalid_clicks) / (sum(valid_clicks) + sum(invalid_clicks))`
- Active Supply — active listings and verified domains
  - Formula: `ActiveListings = count(listings where status='active')`
  - `VerifiedDomains = count(domains where verification_status='verified')`
- Time to DNS Verification — p50/p95 duration from domain add to verified
  - Formula: median/p95 of `verified_at - created_at`

Funnel Metrics
- Owner activation rate — `owners_connected_stripe / owners_signed_up`
- hirer activation rate — `first_checkout / hirers_signed_up`
- Listing engagement — `views_to_inquiry`, `views_to_checkout`

Dashboards
- Admin/Platform
  - GMV (by day/week), Revenue, Payouts
  - Valid vs Invalid Clicks (trend, IVT%)
  - Active Listings, Verified Domains, Time to Verify (p50/p95)
  - Disputes open/closed, credits issued
  - System health: redirect error rate, certificate issuance failures
- Owner
  - Earnings (period and usage), payouts scheduled
  - Clicks by route (valid/invalid), geo/device/referrer
  - DNS status and suggestions
- hirer
  - Validated clicks by route, CTR, cost per click (usage)
  - Invoice totals and upcoming charges; export CSV

Targets & Cadence (initial)
- Redirect error rate ≤ 0.01% (10‑min windows)
- IVT% ≤ 5% (tune by vertical)
- Time to DNS verification p50 ≤ 30 min; p95 ≤ 6 h
- Weekly KPI review; monthly business review (MBR) for GMV/payouts

Data Sources & Reliability
- Stripe (charges/invoices, payouts), Neon (contracts, listings, rollups), Workers Analytics Engine (clicks)
- Reconciliation tasks: nightly Stripe preview vs Neon; monthly variance report

