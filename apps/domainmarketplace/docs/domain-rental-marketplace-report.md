 # Campaign Domain Rental Marketplace — Research, MVP, Architecture, Risk, and Roadmap

 Author: Stephen Ford • Date: 2025-10-18

 ## Executive Summary
 Your marketplace enables domain owners to rent entire domains (exclusive) or share them via path slugs to renters who want high‑relevance, “vanity” destinations without buying the domain. The platform provides: (a) listings and matching, (b) DNS onboarding and secure edge redirects, (c) click tracking and fraud controls, and (d) flexible monetization (per‑period or per‑click) with a 4% platform take.

 Recommended stack and approach:
 - Edge/DNS: Cloudflare for SaaS custom hostnames + Workers for routing/metrics; Domain Connect for one‑click DNS where available [1][2][3][4][5].
 - App: Next.js (App Router) with Neon Postgres + Prisma for core data; Workers KV/Durable Objects for fast routing state; Analytics Engine for click logs [6][8][9][10][27][28].
 - Payments: Stripe Connect. Per‑period rentals via Direct Charges (owner pays Stripe fees; platform collects 4% app fee). Per‑click via platform‑billed usage (Stripe Billing meters) with periodic transfers to owners; 4% platform margin [11][12][13][14][15].
 - Fraud & Abuse: Cloudflare WAF/Bot Management/Turnstile; IAB Spiders & Bots List; MRC IVT guidance; rate‑limits/dedup at edge [7][22][23][24].
 - SEO: 302/307 for temporary rentals; 301/308 for true permanent moves; canonical controls by contract type [16].
 - Legal: UDRP awareness; DMCA designated agent; TOS/AUP; US Section 230 posture [17][18][20][21][19].

 Outcome: MVP can be delivered rapidly with Cloudflare + Neon + Stripe while preserving scale‑out pathways for high‑volume clickstream.

 ## Scope and Assumptions
 - Users: creators, marketers, agencies, SMBs, enterprises (both B2B/B2C).
 - Hosting: Marketplace provides listing, DNS onboarding, and redirect/routing; renters host their own landing pages; renters can also create and manage shortlinks (path slugs) under rented domains.
 - Domain integration: Prefer Cloudflare for SaaS custom hostnames; additionally support Domain Connect across registrars for one‑click DNS updates where available [1][2][3][4][5].
 - Rental modes: (a) Exclusive apex/domain, optionally sell at term end; (b) Shared via path slugs under a domain, assigned to multiple renters concurrently.
 - Pricing: Owners can set period rental price and/or per‑click price; platform fee fixed at 4%.
 - Payments: Stripe Connect (Express/Standard), USD to start.
 - Tech preferences: Next.js + Neon + Cloudflare; research validated below; recommended as MVP baseline.

 ## Market Landscape and Differentiation
 - Domain Parking (Bodis, ParkingCrew, Sedo, Namecheap overview): monetizes with ads; owners split ad PPC revenue; typically requires nameserver change and shows ad landers [25]. Your model monetizes the domain itself as a campaign destination, not ads.
 - Rank‑and‑Rent: SEOers rank sites then lease to local businesses for leads [26]. Your model productizes domain relevance (and optionally authority) for campaigns without needing you to rank/host the site.
 - Unique position: “Airbnb for domains” at the campaign level—self‑serve, time‑boxed, exclusive or shared path slugs, multiple pricing modes, with low‑friction DNS onboarding.

 ## MVP Feature Set
 1) Owner portal
 - List domains; set availability: exclusive vs shared (slug pool); owner‑defined pricing per period and/or per click; optional “sell at end of term”.
 - DNS onboarding flow: (a) Cloudflare for SaaS custom hostnames; (b) Domain Connect when supported; (c) fallback manual A/ALIAS/CNAME instructions [1][2][3][4][5].
 - Payouts: Stripe Connect onboarding; tax/KYC; payout schedule and reporting.

 2) Renter portal
 - Search/browse by keyword/vertical/geo; view domain metrics, policies, and pricing.
 - Rent exclusive (entire domain) or reserve slugs (e.g., example.com/offer, /john, /city); manage target URLs and UTM; bulk upload slugs; link health and analytics.
 - Billing choices: period (prepaid) or metered per‑click; card on file; top‑ups.

 3) Edge routing and analytics
 - Hostname + path routing table at the edge; 301/302 policy per contract; redirects with signed link IDs.
 - Click measurement: human‑filtered unique clicks; geo/device/referrer; timestamped; renter‑visible analytics [7][8][9][10][22][24].

 4) Trust & Safety
 - AUP/TOS enforcement; category blocklists; abuse reporting; automated bot filtering and rate limits; appeal workflow [7][22][24].

 5) Admin
 - Dispute tools, make‑good credits, refunds, chargeback handling; fraud queues.

 ## Pricing and Payments Design (4% platform share)
 Two complementary flows with Stripe Connect:
 - Period rentals (exclusive or slug bundles): Direct Charges on the owner’s connected account with `application_fee_amount = 4%` to the platform. Owner bears Stripe fees; platform receipts are fee‑free on app fee [13].
 - Per‑click rentals (shared or exclusive): Platform bills renters on usage using Stripe Billing meters; at cycle end, transfer gross proceeds minus platform fee to owners via Connect Transfers (“collect then transfer”) [12][14][15].

 Notes and rationale
 - Direct Charges fit “owner is merchant of record” for fixed rentals with predictable amounts, aligning Stripe fees to the owner side [13].
 - Usage billing avoids per‑click micro‑charges by aggregating click events into monthly invoices; supports tiered pricing (graduated) if desired [14][15].
 - For cross‑region cases, follow `on_behalf_of` and settlement‑merchant rules when applicable [11].

 ## Click Tracking and Fraud Controls
 - Measurement pipeline
   - At redirect edge (Cloudflare Worker): resolve host+path → target; write click event (host, path, renterId, ownerId, ip hash, UA, referrer, CF bot score, geo, timestamp) to Analytics Engine; async dedup (e.g., H(ip/16 + UA + target, 24h)) and finalize counts [8][9][10].
   - Enrich with bot signals (Cloudflare Bot Management), WAF rules, Turnstile on suspicious sequences [7].
   - Exclude known crawlers with IAB Spiders & Bots list; adhere to MRC IVT practices favoring back‑end filtration; add data‑center IP exclusions [22][23][24].
 - Heuristics
   - Frequency caps per IP/UA; burst/velocity thresholds; referer integrity checks; headless hints; ASN/geo anomalies; link‑farm suppression.
 - Disputes and credits
   - Flag IVT for review; auto‑credit invalid clicks; preserve audit trail in Neon for billing evidence.

 Storage choices
 - Fast routing metadata: Workers KV/Durable Objects for host+slug → target mapping [6][10].
 - Click events/time‑series: Workers Analytics Engine with SQL API for dashboards and billing jobs [8][9].
 - System of record: Neon (Postgres) for contracts, accounts, invoices/payouts, disputes [27][28].

 ## SEO Strategy and Redirect Semantics
 - Temporary rentals: 302/307 from rented domain/slug to renter page; signals canonical weakly; avoids unintended equity transfer [16].
 - Permanent/exclusive rentals: 301/308 only when contractually “permanent”; stronger canonicalization; document site‑move expectations [16].
 - Micro‑pages (future option): if hosting a lander, emit `rel=canonical` to renter’s primary URL; provide `robots` controls per contract.

 ## Domain Onboarding and DNS
 - Preferred: Cloudflare for SaaS “custom hostnames.” Owner adds CNAME to your zone CNAME‑target; Cloudflare automates TLS and proxies traffic to your edge [3][4].
 - Zero‑downtime options: Pre‑validation (TXT/HTTP token) before cutover; then owner flips CNAME when ready [5].
 - Registrar automation: Adopt Domain Connect to program DNS updates at participating DNS providers with end‑user consent; fallback manual instructions where unsupported [1][2].

 Owner UX tiers
 - One‑click (Domain Connect); Guided (CNAME/ALIAS); Managed (invite owner’s domain into your Cloudflare account when appropriate).

 ## Legal, Policy, and Compliance
 - Trademarks/UDRP: Publish clear policy; quickly disable/hold disputed names/slugs; cooperate with approved UDRP providers; reserve right to suspend abusive use [17][18].
 - DMCA: Register a designated agent; implement takedown process and repeat‑infringer policy [20][21].
 - Section 230 (US): Maintain marketplace posture and moderation; note carve‑outs (e.g., FOSTA/SESTA) [19].
 - Payments/KYC: Use Stripe Connect onboarding/KYC; limit risky categories per AUP; block sanctioned regions/payment methods.
 - Data: Log retention windows; IP hashing/salting; GDPR/CCPA disclosures; cookie and privacy policy alignment.

 ## Technical Architecture
 - App: Next.js (App Router) on Vercel or Cloudflare Pages. Neon Postgres + Prisma for core data; Auth.js optional; Resend for email (org standard).
 - Edge: Cloudflare Worker handles host/path routing, redirect status policy, and analytics writes. KV for hot routes; Durable Objects for atomic updates/contention [6][10].
 - Analytics: Workers Analytics Engine for click telemetry; nightly ETL aggregates to owner/renter dashboards and Stripe usage meters [8][9].
 - Payments: Stripe Connect (Direct Charges for period rentals; Billing meters + Transfers for per‑click).

 ```mermaid
 flowchart LR
   R[Visitor] -->|HTTP GET domain/slug| CF[(Cloudflare Edge)]
   CF -->|Lookup host+path| KV[(Workers KV/Durable Object)]
   CF -->|Write click event| AE[(Workers Analytics Engine)]
   CF -->|301/302 redirect| TGT[Target Landing Page]
   AE -->|SQL queries| APP[Next.js App]
   APP -->|Contracts/Users/Disputes| DB[(Neon Postgres)]
   APP -->|Usage records| STRB[Stripe Billing]
   APP -->|Payouts & Fees| STRC[Stripe Connect]
 ```

 ## Risk Matrix (selected)
 - Abuse/spam hosting via redirects → AUP, automated WAF/Bot filtering, manual review, throttles, link freeze/escalation [7][22][24].
 - Click inflation/IVT → IAB list, MRC back‑end filtration, Cloudflare bot scores, dedup rules, audits, clawbacks [22][23][24].
 - SEO expectations → Contractual redirect policy (temporary vs permanent), explicit no guarantees; canonical guidance [16].
 - DNS onboarding friction → Domain Connect support; Cloudflare for SaaS with pre‑validation; rich guides [1][3][5].
 - Payments/chargebacks → Usage invoices with dispute windows; holdbacks/reserves for new renters; refunds tooling [12][14].
 - Legal disputes (UDRP/DMCA) → Takedown/hold workflows; registered DMCA agent; counsel escalation [17][20].

 ## Unit Economics (illustrative)
 - Per‑click: Renter price $1.00/click; 1,000 valid clicks → $1,000 gross. Platform 4% = $40. Owner payout = $960 minus Stripe processing (depending on flow; with platform‑billed usage + transfer, Stripe fee borne by platform; with direct charges the owner bears fees) [11][12][13].
 - Period: $500/month exclusive rental. Platform takes $20 via application fee (Direct Charge). Owner net = $500 − Stripe fees (charged to owner) − $20 app fee [13].

 ## Go‑to‑Market
 - Supply (owners): Domain investor forums, marketplaces (Sedo/Afternic), portfolio APIs; offer higher liquidity vs parking; easy DNS onboarding; early‑adopter reduced fee tier.
 - Demand (renters): Performance marketers, agencies, SMB lead‑gen; integrations with link managers; free trials for slug‑only rentals; simple analytics.
 - Liquidity: Start with verticals (home services, legal, healthcare), geographic niches, and exact‑match terms.

 ## Implementation Roadmap
 - Phase 0 (1–2 weeks): Data model; Stripe Connect onboarding; Cloudflare for SaaS setup; basic Worker with host/path → redirect; Neon schema; Prisma scaffolding; owner/renter auth.
 - Phase 1 (3–5 weeks): Owner listing + DNS onboarding flows (custom hostname + pre‑validation); renter search and booking; Direct Charges for period; KV routing; basic analytics; AUP/TOS; DMCA agent registration.
 - Phase 2 (4–6 weeks): Per‑click metered billing (Stripe Billing meters); Analytics Engine aggregation; IVT filtration (IAB list integration workflow); admin disputes; automated payouts; rate‑limits/Turnstile triggers.
 - Phase 3 (2–4 weeks): Advanced pricing tiers; offer‑to‑buy workflow at term end; dashboards; marketing site; SOC2‑friendly logging policy.

## References / Sources
 1. Domain Connect IETF Draft (DNS provisioning) — IETF Datatracker: draft‑kowalik‑domainconnect [https://datatracker.ietf.org/doc/draft-kowalik-domainconnect/]
 2. Domain Connect overview — domainconnect.org [https://www.domainconnect.org/]
 3. Cloudflare for SaaS: Custom Hostnames [https://developers.cloudflare.com/cloudflare-for-platforms/cloudflare-for-saas/domain-support/]
 4. Cloudflare for SaaS: Getting Started/Configuring [https://developers.cloudflare.com/cloudflare-for-platforms/cloudflare-for-saas/start/getting-started/]
 5. Cloudflare for SaaS: Pre‑validation methods [https://developers.cloudflare.com/cloudflare-for-platforms/cloudflare-for-saas/domain-support/hostname-validation/pre-validation/]
 6. Cloudflare Durable Objects docs [https://developers.cloudflare.com/durable-objects/]
 7. Cloudflare Turnstile + WAF + Bot Management [https://developers.cloudflare.com/turnstile/tutorials/integrating-turnstile-waf-and-bot-management/]
 8. Workers Analytics Engine overview [https://developers.cloudflare.com/analytics/analytics-engine/]
 9. Analytics Engine: Get started / SQL API [https://developers.cloudflare.com/analytics/analytics-engine/get-started/]
 10. Cloudflare storage options (KV/DO/R2/D1/Analytics) [https://developers.cloudflare.com/workers/platform/storage-options/]
 11. Stripe Connect: Destination Charges [https://docs.stripe.com/connect/destination-charges]
 12. Stripe Connect: Collect then Transfer (marketplace guide) [https://docs.stripe.com/connect/collect-then-transfer-guide]
 13. Stripe Connect: Direct Charges [https://docs.stripe.com/connect/direct-charges]
 14. Stripe Billing: Record usage (metered) [https://docs.stripe.com/billing/subscriptions/usage-based/recording-usage]
 15. Stripe Billing: Choose a usage‑based setup [https://docs.stripe.com/billing/subscriptions/usage-based/set-up]
 16. Google Search Central: Redirects and Google Search [https://developers.google.cn/search/docs/crawling-indexing/301-redirects]
 17. ICANN UDRP Policy [https://www.icann.org/en/contracted-parties/consensus-policies/uniform-domain-name-dispute-resolution-policy/uniform-domain-name-dispute-resolution-policy-25-02-2012-en]
 18. WIPO Guide to UDRP [https://www.wipo.int/amc/en/domains/guide/]
 19. 47 U.S.C. §230 (Cornell LII) [https://www.law.cornell.edu/uscode/text/47/230]
 20. DMCA Designated Agent Registration (USCO) [https://www.copyright.gov/dmca-directory/transcripts/register.pdf]
 21. DMCA Directory FAQs (USCO) [https://www.copyright.gov/dmca-directory/faq.html]
 22. IAB Tech Lab: Spiders & Bots List [https://iabtechlab.com/software/iababc-international-spiders-and-bots-list/]
 23. IAB Spiders & Bots List Best Practices (PDF) [https://www.iab.com/wp-content/uploads/2019/06/IAB_SpidersBots_Best_Practices_2019.pdf]
 24. MRC IVT Requirements (statement) [https://mediaratingcouncil.org/sites/default/files/News/MRC%20Statement%20on%20pre%20bid%20IVT%20requirements%20and%20processes.pdf]
 25. Namecheap: What is domain parking (overview) [https://www.namecheap.com/blog/what-is-domain-parking/]
26. Diggity Marketing: Rank & Rent Guide [https://diggitymarketing.com/rank-and-rent/]

---

# MVP Product Requirements Document (PRD)

This section converts the research above into a concrete, execution-ready MVP guide. It covers scope, user stories with acceptance criteria, data model, API contracts, onboarding flows, security/ops, QA, and launch checklist.

## 1) Goals, Non‑Goals, Assumptions

- Goals
  - Enable owners to list domains and start earning via rentals (period or per‑click) with low DNS friction.
  - Enable renters to discover, rent, and route traffic from domains or slugs with trustworthy analytics and billing.
  - Establish a secure, auditable foundation for payouts, disputes, and abuse handling.

- Non‑Goals (MVP)
  - No registrar transfer or ownership change; this is rentals only.
  - No multi‑currency or multi‑region tax engines; start with USD and Stripe defaults.
  - No hosted site builder; renters point to their own destinations.
  - No complex auctions; fixed price with optional offers is sufficient later.

- Assumptions
  - DNS integration via Cloudflare for SaaS with pre‑validation; Domain Connect where available; manual fallback.
  - Stripe Connect Express for owners; Stripe Billing for usage metering; Direct Charges for fixed rentals.
  - Next.js app with Neon Postgres; Cloudflare Worker for routing and click measurement.

## 2) Personas and JTBD

- Domain Owner (supply)
  - JTBD: Monetize domains without parking ads; retain ownership; simple DNS and dependable payouts.

- Performance Marketer / Agency (demand)
  - JTBD: Acquire high‑relevance domain/slug for campaigns; manage redirects and UTM; measure validated clicks.

- Admin / Trust & Safety
  - JTBD: Moderate listings, handle disputes/abuse, manage payouts and chargebacks, maintain platform health.

## 3) Core User Journeys (MVP)

- Owner onboarding: sign up → Connect Stripe → add domain → DNS onboarding → set pricing → publish listing → start receiving rentals.
- Renter booking: search → view listing → checkout (period or per‑click) → configure target URL(s) → traffic flows → analytics → renewal/cancel.
- Admin moderation: review new listings → approve/suspend → review IVT and disputes → process refunds/credits.

## 4) Feature Requirements and Acceptance Criteria

- Owner
  - Add domain and prove control
    - Accept: Owner can choose one validation method: Cloudflare SaaS custom hostname pre‑validation (TXT/HTTP), Domain Connect, or manual DNS. System records verification status and timestamp.
  - Configure listing
    - Accept: Owner sets availability (exclusive or shared slugs), price per period (e.g., monthly) and/or per‑click rate, minimum term (optional).
  - Stripe onboarding and payouts
    - Accept: Owner completes Connect onboarding; status must be `charges_enabled` before receiving funds.
  - Listing lifecycle
    - Accept: Owner can pause/unpublish; active rentals remain until term end; new bookings disabled.

- Renter
  - Discovery and details
    - Accept: Search by keyword/vertical/geo; listing page shows price(s), availability, allowed categories, sample traffic/SEO notes.
  - Checkout
    - Period rentals: Accept fixed price, set start date, card capture, invoice/receipt; contract created.
    - Per‑click: Start plan; card capture; usage is billed monthly; clear display of rate and fraud policy.
  - Configure routing
    - Accept: For exclusive rentals, set redirect policy (301/302) and target URL for apex and common hostnames (www). For slug rentals, create one or more slugs mapping to URLs.
  - Analytics
    - Accept: Clicks shown with dedup rules; show geo/device/referrer counts; export CSV.

- Admin
  - Moderation
    - Accept: Approve/suspend listings; block prohibited categories; freeze routing on abuse.
  - Disputes
    - Accept: View claimed IVT; adjust valid/invalid counts; issue credits/refunds.
  - Finance
    - Accept: View fees, payouts, reserves; handle chargebacks with evidence export.

## 5) UX Surface and Navigation (MVP)

- Public: Home, Browse/Search, Listing details, About/Fees, TOS/AUP/Privacy.
- Owner: Dashboard, Domains, Listings, Payouts, Settings (KYC), Support.
- Renter: Dashboard, Rentals, Slugs, Analytics, Billing, Support.
- Admin: Review Queue, Abuse/Disputes, Finance, System Health.

## 6) Data Model (Initial)

High‑level entities and key fields. Pseudocode DDL for clarity.

```sql
-- Users and Accounts
create table users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  role text not null check (role in ('owner','renter','admin')),
  created_at timestamptz not null default now()
);

create table accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id),
  stripe_customer_id text,
  stripe_connect_account_id text, -- for owners
  country text,
  kyc_status text default 'pending'
);

-- Domains and Listings
create table domains (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references users(id),
  fqdn text unique not null,
  verification_method text,
  verification_status text not null default 'pending',
  verified_at timestamptz,
  onboarding_method text, -- cf_saas | domain_connect | manual
  created_at timestamptz not null default now()
);

create table listings (
  id uuid primary key default gen_random_uuid(),
  domain_id uuid not null references domains(id),
  mode text not null check (mode in ('exclusive','shared_slugs')),
  price_period_cents int, -- nullable if per-click only
  price_click_cents int,  -- nullable if period only
  currency text not null default 'usd',
  status text not null default 'draft' -- draft|active|paused
);

-- Rentals and Routes
create table rentals (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings(id),
  renter_id uuid not null references users(id),
  type text not null check (type in ('period','per_click')),
  status text not null default 'active', -- active|ended|suspended
  start_at timestamptz not null default now(),
  end_at timestamptz
);

create table routes (
  id uuid primary key default gen_random_uuid(),
  rental_id uuid not null references rentals(id),
  host text not null, -- e.g., apex or www
  path text not null default '/',
  target_url text not null,
  redirect_code int not null default 302,
  unique (rental_id, host, path)
);

-- Billing
create table invoices (
  id uuid primary key default gen_random_uuid(),
  rental_id uuid references rentals(id),
  stripe_invoice_id text,
  amount_cents int not null,
  type text not null check (type in ('period','usage')),
  status text not null -- draft|open|paid|void|uncollectible
);

create table payouts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references users(id),
  amount_cents int not null,
  stripe_transfer_id text,
  period_start timestamptz,
  period_end timestamptz
);

-- Analytics (rolled-up); raw click events stay in Analytics Engine
create table click_rollups (
  day date not null,
  rental_id uuid not null references rentals(id),
  valid_clicks int not null default 0,
  invalid_clicks int not null default 0,
  primary key (day, rental_id)
);

-- Disputes
create table disputes (
  id uuid primary key default gen_random_uuid(),
  rental_id uuid references rentals(id),
  claimant_role text check (claimant_role in ('owner','renter')),
  reason text,
  status text not null default 'open'
);
```

## 7) API Contracts (MVP)

Representative HTTP endpoints and shapes. Auth via session/JWT; all webhooks signature‑verified.

- Domains
  - POST `/api/domains` { fqdn }
  - POST `/api/domains/{id}/verify` { method: 'cf_saas'|'domain_connect'|'manual', token? }
  - GET `/api/domains/{id}`

- Listings
  - POST `/api/listings` { domainId, mode, pricePeriodCents?, priceClickCents? }
  - PATCH `/api/listings/{id}` { status }
  - GET `/api/listings/{id}`
  - GET `/api/listings?search=...`

- Rentals
  - POST `/api/rentals` { listingId, type }
  - GET `/api/rentals/{id}`
  - POST `/api/rentals/{id}/routes` { host, path, targetUrl, redirectCode }
  - GET `/api/rentals/{id}/analytics?range=30d`

- Billing
  - POST `/api/billing/period/checkout` { rentalId }
  - POST `/api/billing/usage/report` (internal job) { rentalId, clicks }
  - POST `/api/webhooks/stripe` (verify signature)

Sample response: GET `/api/rentals/{id}`
```json
{
  "id": "rntl_123",
  "type": "period",
  "status": "active",
  "listing": { "id": "lst_123", "mode": "exclusive", "domain": "example.com" },
  "routes": [
    { "host": "@", "path": "/", "targetUrl": "https://brand.com/offer", "redirectCode": 302 },
    { "host": "www", "path": "/", "targetUrl": "https://brand.com/offer", "redirectCode": 302 }
  ],
  "metrics": { "validClicks30d": 842 }
}
```

## 8) DNS Onboarding Flows (Step‑By‑Step)

- Cloudflare for SaaS (preferred)
  1) Owner enters domain on listing wizard; system generates pre‑validation token (TXT or HTTP).
  2) Owner completes pre‑validation; system polls Cloudflare until `pending_validation=false`.
  3) System issues Custom Hostname in Cloudflare; serve edge; TLS auto‑provisioned.
  4) Owner flips CNAME/ALIAS to Cloudflare target; dashboard shows propagation status.

- Domain Connect (where supported)
  1) Owner selects provider from list; system redirects through Domain Connect auth.
  2) On consent, system programs required records (CNAME/ALIAS/TXT) automatically.
  3) Verification succeeds; listing can go live.

- Manual fallback
  - Provide precise DNS instructions (A/AAAA/CNAME) with checks; require validation before enabling routing.

## 9) Payments Sequences

- Period rental (Direct Charges)
  1) Renter checkout → PaymentIntent on owner’s connected account with `application_fee_amount=4%`.
  2) On success, create contract; schedule renewal; send receipt.
  3) Owner payout per Stripe schedule; platform collects app fee.

- Per‑click (usage)
  1) Renter starts plan → create Subscription with metered price.
  2) Nightly job records usage from Analytics rollups to Stripe.
  3) Invoice finalizes monthly; platform transfers owner share (gross minus 4%).

## 10) Security, Privacy, Compliance

- AuthN/Z: Session or JWT with short TTL; role‑based access; 2FA optional; rate limits per IP/user.
- Webhooks: Verify Stripe signatures; idempotency keys on outbound create/update.
- Data: Encrypt at rest (Neon, Stripe); avoid storing card data; IP hashing for click logs (retain reversible salt only where needed for dedup windows).
- Abuse: AUP categories; automated blocks at edge; takedown SLAs; audit trails.
- Legal: TOS/Privacy/DMCA/UDRP policies published; DMCA agent registered; records retention policy documented.

## 11) Observability and Ops

- Metrics: clicks_valid, clicks_invalid, CTR, GMV, take_rate, listings_active, time_to_verify_dns, disputes_open.
- Dashboards: Owner, Renter, Admin views; edge health; Stripe failures; DNS verification lag.
- Alerts: SSL issuance failures; surge in invalid click rate; Stripe webhook errors; domain expired (whois lookup or DNS NXDOMAIN).
- Runbooks
  - SSL failure: check Custom Hostname status; retry issuance; confirm DNS CNAME; fall back to HTTP validation.
  - Click spike: confirm referrers/ASNs; enable stricter WAF; freeze suspect routes; reprocess IVT.
  - Chargeback: assemble evidence (click logs, IPs, referrers, consent); update dispute record; notify owner.

## 12) QA Plan (Key Test Cases)

- Owner: domain add → pre‑validation → CNAME flip; listing publish/pause; Stripe Connect onboarding states.
- Renter: search → checkout (period/per‑click) → configure routes → redirects function; analytics counts increment; CSV export.
- Edge: redirect codes correct per contract; UTM preserved; robots/canonical policy applied for hosted landers.
- Billing: Direct Charge app fee applied; usage meters aggregate correctly; refund/credit flows; webhook retries.
- Abuse: WAF blocks known bots; Turnstile challenge on suspicious behavior; dispute creates adjustments.

## 13) Launch Checklist

- Policies live: TOS, Privacy, AUP, DMCA agent registered; UDRP process documented.
- Stripe: Connect enabled, webhook endpoints configured; test accounts passed; fees verified.
- Cloudflare: Custom Hostnames configured; certificates auto‑issuing; KV/DO namespaces; WAF rulesets.
- Domain Connect: Providers configured or feature flagged off if not ready.
- Ops: Status page; alerting; on‑call rotation docs; incident templates.
- GTM: Seed supply (target 100+ domains), curated verticals, pricing page, docs/how‑to.

## 14) Roadmap (Next 90 Days)

- Offers/negotiation and rent‑to‑own add‑on.
- Multi‑currency, tax profiles, and regional Connect setups.
- Owner portfolios sync (Afternic/Sedo APIs) where available.
- Enhanced fraud models (ASN reputation, ML scoring, device graph).
- Registrar partnerships for one‑click DNS adoption.

## 15) Open Questions

- Exclusive vs shared conflicts: priority rules and limits per domain.
- Minimum viable IVT policy thresholds and auto‑credit caps.
- Owner fee options (owner absorbs Stripe fees vs platform‑billed usage path).
- Termination SLAs and grace periods at non‑payment.

---

## Pricing and Packaging (MVP Guidance)

- Models
  - Exclusive period rental: monthly term, optional multi‑month discounts (e.g., 10% off per additional committed month up to 30%).
  - Shared slug rental: monthly base plus per‑slug fee, or per‑click only with minimum monthly commit.
  - Per‑click: tiered (graduated) pricing by monthly valid clicks volume.

- Recommended guardrails
  - Minimums: period ≥ $99/mo; per‑click ≥ $0.35; slug minimum commit ≥ $25/mo.
  - Platform fee: fixed 4% of gross (already modeled in payments flows), shown transparently on owner payout screens.
  - Free trials: none for exclusive; for slugs, allow setup-only trials with no live routing until payment method on file.
  - Refunds: pro‑rata for exclusive only when platform‑caused downtime > 24h; per‑click credits only for validated IVT.

- Tier examples (illustrative)
  - Exclusive period (example.com): $500/mo, 3‑month commit → $1,350 (10% off months 2‑3).
  - Shared slugs: $29/mo base + $5/slug (up to 10 slugs), then $3/slug; or per‑click only with $50/mo minimum.
  - Per‑click: $0.50 for first 1,000 valid clicks, $0.40 for next 4,000, $0.30 thereafter.

- Policy snippets
  - Cancellation: exclusive rentals renew monthly; cancel before next cycle; grace 3 days; DNS/routing cut at term end.
  - Overages: usage invoices finalize monthly; suspend routing at 7‑day non‑payment; routes auto‑unfreeze on payment.
  - Content/AUP: prohibit categories per AUP; violations can trigger immediate suspension without refund.

## OpenAPI Overview

- Full spec file: `docs/openapi/domain-rental-marketplace.yaml`
- Coverage: domains, listings, rentals, routes, analytics, billing, and Stripe webhooks.
- Auth: session/JWT (Bearer); Stripe webhooks use signature verification only.

## UX Copy Library (MVP)

- Owner: Add Domain Wizard
  - Headline: “Connect your domain in minutes”
  - Helper: “Choose a verification method. We’ll guide you step by step and won’t go live until you confirm.”
  - Methods: “Cloudflare (recommended) • Domain Connect • Manual DNS”
  - Status (verifying): “We’re checking DNS… This can take up to 10 minutes.”
  - Success: “Domain verified. You can publish your listing anytime.”
  - Error: “We couldn’t verify your token yet. Please check the record and try again.”

- Owner: Pricing
  - Label: “Monthly price (exclusive)”
  - Hint: “You can also add per‑click pricing for shared slugs.”
  - Tooltip: “Platform fee is a fixed 4% of gross. Stripe processing fees may apply.”

- Renter: Checkout (Period)
  - Headline: “Reserve this domain for your campaign”
  - Sub: “Billing monthly. Cancel anytime before renewal.”
  - CTA: “Start rental”
  - Legal: “By continuing, you agree to the Terms and Acceptable Use Policy.”

- Renter: Configure Routing
  - Headline: “Where should visitors go?”
  - Fields: “Apex target URL • www target URL • Redirect type (302 recommended)”
  - Helper: “We’ll keep your UTM parameters intact.”

- Analytics
  - Title: “Validated Clicks”
  - Tooltip: “We filter known bots and invalid activity. Learn more about our validation policy.”
  - Empty: “No clicks yet. Share your link to start seeing data.”

- Abuse/Disputes
  - Notice: “We investigate click quality issues. Credits are issued for validated invalid traffic.”
  - CTA: “Report a concern”

---

## Tech Stack Decision (Cloudflare-first, Next.js + Neon)

- Summary picks
  - Web app: Next.js (App Router) deployed on Cloudflare Pages via `@cloudflare/next-on-pages`.
  - Edge redirector: Cloudflare Worker using Hono (Better‑T constraint); KV for hot routes, Durable Objects for atomic updates; Analytics Engine for click logs.
  - Database: Neon Postgres (serverless), Drizzle ORM with `neon-http` driver; Drizzle Kit for migrations.
  - Auth: Better-Auth (Worker/Edge friendly) with Drizzle adapter; session cookies + JWT for APIs.
  - Payments: Stripe Connect (Direct Charges for period; Billing meters + Transfers for per-click).
  - Queue/cron: Cloudflare Queues for IVT reviews/adjustments; Cron Triggers for nightly usage aggregation.
  - Observability: Sentry (Next + Workers SDKs), Cloudflare Analytics/Logs; Status page later.
  - Email: Resend (simple, reliable) for onboarding and receipts.

- Why these picks
  - Cost: Cloudflare Pages + Workers is among the cheapest for high-traffic redirects; Neon’s free tier and autoscaling keep DB spend low.
  - Compatibility: Prisma is not Worker-friendly; Drizzle + `@neondatabase/serverless` works on Edge and Node alike.
  - Separation of concerns: Next.js handles marketplace UX/admin; Worker handles high-QPS routing and click filtration.
  - Generator alignment: Better‑T requires Hono for Workers; we use a minimal Hono setup to keep overhead tiny.

- Deployment model
  - Monorepo (Turborepo):
    - `apps/web` (Next.js on Pages, App Router, Better-Auth UI)
    - `apps/edge` (Hono Worker: hostname+path routing, analytics write)
    - `packages/db` (Drizzle schema, migrations)
    - `packages/types` (shared zod/ts types and OpenAPI)
    - `packages/config` (env, constants)
  - CI: build `apps/web` with Next-on-Pages adapter; deploy `apps/edge` via Wrangler.

- Data paths
  - Writes: contracts/accounts in Neon (via Drizzle). Click events appended to Analytics Engine; nightly rollups persisted to Neon for billing.
  - Reads: routing lookups from KV/DO; dashboard analytics from Analytics Engine SQL API and Neon rollups.

## Better‑T‑Stack Generator Choices (recommended)

- Web Frontend: Next.js
- Backend: Fullstack Next.js (built-in API routes)
- Runtime: Cloudflare Workers with Hono (edge redirector) + Next-on-Pages for web
- API: No API (tRPC off) — use REST/OpenAPI in Next routes and Worker
- Database: PostgreSQL
- ORM: Drizzle
- DB Setup: Neon Postgres
- Web Deploy: Wrangler (usable for Pages too via `wrangler pages deploy`)
- Server Deploy: Wrangler (for the Worker)
- Auth: Better-Auth
- Payments: No Payments (add Stripe Connect manually per docs)
- Package Manager: pnpm (recommended for CI speed); bun acceptable locally
- Addons: Turborepo, Biome, Husky; PWA later if needed
- Examples: None
- Git: Git
- Install: Install Dependencies

Notes
- If you later switch web hosting to Vercel, you can keep Drizzle + Neon. For Node runtime features, Prisma becomes viable; however Workers-side code (redirector) stays Hono+Wrangler.
- If you prefer a vendor auth, Clerk works well on both Next and Workers but costs more than Better-Auth.

## Edge Worker with Hono (minimal redirector)

Keep the Hono surface minimal to match vanilla performance while satisfying the generator requirement.

Example: `apps/edge/src/index.ts`
```ts
import { Hono } from 'hono';

type Bindings = { ROUTES: KVNamespace };
const app = new Hono<{ Bindings: Bindings }>();

app.all('*', async (c) => {
  const reqUrl = new URL(c.req.url);
  const host = c.req.header('host') || reqUrl.host;
  const key = `${host}${reqUrl.pathname}`;
  const target =
    (await c.env.ROUTES.get(key)) ||
    (await c.env.ROUTES.get(`${host}/`)); // fallback to root

  if (!target) return c.text('Not found', 404);

  const to = new URL(target);
  to.search = reqUrl.search; // preserve UTM/query
  return c.redirect(to.toString(), 302);
});

// Optional lightweight health route (kept simple)
app.get('/health', (c) => c.text('ok'));

export default app;
```

`apps/edge/wrangler.toml`
```toml
name = "edge-redirector"
main = "src/index.ts"
compatibility_date = "2025-01-01"
kv_namespaces = [
  { binding = "ROUTES", id = "<your_kv_id>" }
]
```

Notes
- Avoid heavy middleware; handle redirects in the catch-all route.
- Use KV for hot map lookups; store writes/admin changes in Neon and sync to KV.
- For atomic updates of popular slugs, consider a small Durable Object to gate writes.

---

## Specialist Agent Plan

- Product Strategist → docs/research/market-landscape.md, docs/research/pricing-benchmarks.md, docs/product/kpis-and-dashboards.md
- Edge Architect → docs/architecture/performance-budgets.md, docs/architecture/adrs/adr-0001-edge-routing.md, docs/architecture/adrs/adr-0002-click-telemetry-store.md, docs/architecture/cloudflare-limits.md
- DNS Engineer → docs/research/domain-connect-matrix.md, docs/ops/runbooks/dns-cutover.md
- SEO Lead → docs/seo/redirect-policy.md
- Payments Specialist → docs/payments/stripe-connect-flows.md, docs/payments/usage-metering-design.md, docs/payments/disputes-and-credits.md, docs/payments/chargeback-evidence.md
- Trust & Safety Analyst → docs/trust-safety/ivt-policy.md, docs/trust-safety/bot-lists-process.md, docs/trust-safety/escalation-sla.md
- Security Engineer → docs/security/threat-model.md, docs/security/data-flow-diagrams.mmd, docs/security/data-classification-and-retention.md, docs/security/secrets-management.md
- Privacy/Compliance → docs/compliance/dpia.md, docs/compliance/dsr-process.md, docs/compliance/cookie-consent.md
- Legal Counsel → docs/legal/terms-of-service.md, docs/legal/privacy-policy.md, docs/legal/acceptable-use-policy.md, docs/legal/dmca-policy.md, docs/legal/udrp-workflow.md
- SRE/Ops → docs/ops/observability.md, docs/ops/runbooks/incident-response.md, docs/ops/error-budgets.md, docs/ops/disaster-recovery.md, docs/deployment/environments.md, docs/deployment/deploy-pipelines.md
- QA Lead → docs/testing/test-strategy.md, docs/testing/edge-testing-guide.md, docs/testing/payments-test-matrix.md
- DX Lead → docs/engineering/local-setup.md, docs/engineering/contributing.md, docs/engineering/api-guidelines.md, docs/engineering/openapi-publishing.md
- GTM/Support → docs/gtm/owner-onboarding.md, docs/gtm/renter-onboarding.md, docs/support/faq.md, docs/support/macros.md

See docs/agents for role briefs and acceptance criteria.

## Bootstrap Steps (high level)

- Web app (Next on Pages)
  - `pnpm dlx create-next-app@latest web --ts --eslint --tailwind` (or adapt your generator)
  - `pnpm add -w @cloudflare/next-on-pages@latest` and follow adapter setup; target Edge runtime where possible.
  - `pnpm add drizzle-orm @neondatabase/serverless drizzle-kit zod better-auth @hono/zod-validator` in workspace.

- Edge redirector
  - `pnpm dlx wrangler init apps/edge --yes` and add Hono: `pnpm add hono @cloudflare/workers-types`.
  - Bind KV, Durable Objects, and Analytics Engine in `wrangler.toml`.

- Database
  - Create Neon project; set `DATABASE_URL` (HTTP driver) for Edge and `DATABASE_URL_POOLED` for server actions if needed.
  - Drizzle Kit: generate and push migrations from `packages/db`.

- Auth & Payments
  - Better-Auth: configure cookie session + Drizzle adapter; providers: email + OAuth (Google) to start.
  - Stripe: set up Connect + Billing Meters; add webhook handler route in Next and verify signatures.

- Observability
  - Add Sentry SDKs (`@sentry/nextjs`, `@sentry/cloudflare-workers`); track errors and key metrics.
