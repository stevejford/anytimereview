# Domain Connect & Registrar Matrix

- Purpose: Map one-click DNS support and common panel steps for MVP DNS onboarding.

Legend
- Support: Yes = listed by Domain Connect or confirmed docs; Partial = control panel or limited; Unknown = needs verification.

Matrix (seeded; verify during onboarding build)
- GoDaddy — Support: Yes — Source: domainconnect.org/dns-providers — Notes: Registrar + DNS; strong DC support.
- NameSilo — Support: Yes — Source: domainconnect.org/dns-providers — Notes: Registrar + DNS.
- WordPress.com (Domains) — Support: Yes — Source: domainconnect.org/dns-providers — Notes: DNS provider; Automattic.
- Plesk — Support: Yes — Source: domainconnect.org/dns-providers — Notes: Control panel DNS; often used by hosts.
- IONOS (1&1) — Support: Likely — Source: IONOS docs (verify) — Notes: Historical DC adopter; confirm current flow.
- Name.com — Support: Likely — Source: Provider docs (verify) — Notes: Historically supported DC templates.
- Squarespace Domains — Support: Unknown — Source: Provider docs (verify) — Notes: Took over Google Domains; confirm DC.
- Cloudflare Registrar/DNS — Support: Unknown — Source: Provider docs (verify) — Notes: Cloudflare for SaaS reduces need for DC; treat as manual.
- Dynadot — Support: Unknown — Source: Provider docs (verify) — Notes: Popular registrar; confirm DC.
- Porkbun — Support: Unknown — Source: Provider docs (verify) — Notes: Popular registrar; confirm DC.
- Hover (Tucows) — Support: Unknown — Source: Provider docs (verify) — Notes: Confirm DC.
- Gandi — Support: Unknown — Source: Provider docs (verify) — Notes: Confirm DC.
- OVHcloud — Support: Unknown — Source: Provider docs (verify) — Notes: Confirm DC.
- Bluehost — Support: Unknown — Source: Provider docs (verify) — Notes: Often uses cPanel; Plesk covers some; confirm DC.
- DreamHost — Support: Unknown — Source: Provider docs (verify) — Notes: Confirm DC.
- AWS Route53 — Support: No/Unknown — Source: AWS docs (verify) — Notes: Not a registrar UI for DC; likely manual.
- Google Domains (legacy) — Status: Sunset — Notes: Migrated to Squarespace; use Squarespace status.

How to verify support
- Check official list: https://www.domainconnect.org/dns-providers/
- Search provider docs for “Domain Connect”.
- If absent, assume manual with Cloudflare for SaaS instructions.

Panel steps (common)
- DC-enabled: user authorizes via provider OAuth-like flow, records are provisioned automatically.
- Manual fallback: add TXT/HTTP token for pre-validation, then CNAME/ALIAS to Cloudflare custom hostname target.

Notes
- Keep screenshots per provider in a private runbook until finalized.
- Maintain a JSON/YAML registry mapping provider → support status → help links.
