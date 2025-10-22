# Cookie & Consent Policy

Purpose
- Provide compliant and clear consent for cookies and similar technologies.

Categories
- Essential: auth/session, security, load balancing.
- Functional: preferences, UI state.
- Analytics: product analytics and performance.
- Marketing: remarketing/ads (not used at MVP; future flag).

Regional Logic
- EU/UK: Opt‑in for non‑essential (analytics/marketing). No cookies until consent.
- US/CA/AU: Show notice with opt‑out or preferences where required; honor “Do Not Track/Global Privacy Control” where applicable.
- Rest of world: Follow local laws; default to conservative behavior similar to US.

Implementation (MVP)
- Store consent in `localStorage['consent.v1']` as JSON `{ essential: true, functional: <bool>, analytics: <bool>, marketing: <bool>, region: 'EU'|'US'|..., ts }`.
- On first visit, detect region (geo IP or accept user self‑selection) and show banner.
- Gate analytics scripts behind consent check; do not load before opt‑in in EU/UK.
- Provide a “Cookie Settings” link in footer to reopen preferences.

Banner Copy (example)
- Title: “We value your privacy”
- Body: “We use cookies to operate the site and, with your permission, for analytics. You can change your choices at any time.”
- Buttons: “Accept all”, “Reject non‑essential”, “Manage preferences”

Preferences Modal (example)
- Essential: “Always on” (disabled toggle)
- Functional: toggle + help text
- Analytics: toggle + help text
- Save/Close: Persist choices and apply immediately

Signals & Audit
- Record a consent event with timestamp and version; keep a short log for audit.
- Respect GPC/DNT headers by setting analytics=false by default when present.

Changes
- Treat changes to categories as a new version `consent.v2` and prompt users to review.

Vendors
- If using a CMP (e.g., OneTrust), map categories to CMP purposes and keep this doc in sync with CMP configuration.

