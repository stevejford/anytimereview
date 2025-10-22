# Threat Model (STRIDE)

Scope and Trust Boundaries
- Surfaces: Web app (Next.js), Edge Worker (Cloudflare), Neon Postgres, Stripe webhooks, Workers KV/DO, Analytics Engine.
- Trust boundaries: Browser ↔ Web, Visitor ↔ Edge, Web ↔ Neon/Stripe, Edge ↔ KV/AE.

Assets
- Account and payout data, routing tables (host/path → target), click telemetry, API/webhook secrets, DNS verification tokens.

STRIDE Analysis (per surface)

Web app (Next.js)
- Spoofing
  - Risks: session hijack, CSRF on state‑changing endpoints.
  - Controls: HTTPOnly, SameSite=Lax/Strict cookies; CSRF tokens or SameSite enforcement; session rotation on privilege change; optional 2FA for admins.
- Tampering
  - Risks: schema injection, route config corruption.
  - Controls: Drizzle parameterized queries; zod validation; RBAC; immutable audit log for route/admin changes.
- Repudiation
  - Risks: disputes about who changed pricing/routes.
  - Controls: audit logs with userId, routeId, diff, timestamp, requestId; clock sync.
- Information disclosure
  - Risks: PII leakage in logs, error pages; oversharing telemetry.
  - Controls: structured logging without PII; generic error messages; CSP, Referrer‑Policy, security headers.
- Denial of Service
  - Risks: API abuse, login brute force.
  - Controls: per‑IP/user rate limits, captcha/Turnstile on abuse signals; exponential backoff.
- Elevation of Privilege
  - Risks: role escalation via IDOR or missing checks.
  - Controls: centralized authorization middleware; least‑privilege roles (owner, renter, admin); deny‑by‑default.

Edge Worker (redirector)
- Spoofing
  - Risks: forged Host header; custom hostname claim misuse.
  - Controls: derive host from request/CF metadata; validate host against onboarded domains; require pre‑validation before enabling.
- Tampering
  - Risks: unauthorized KV writes; route poisoning.
  - Controls: separate control‑plane with auth; DO‑serialized writes; restricted API tokens for KV writes; read‑only on hot path.
- Repudiation
  - Controls: signed admin API calls; append‑only change log in Neon with actor and requestId.
- Information disclosure
  - Risks: leaking secrets in Location; reflecting dangerous schemes.
  - Controls: validate target URLs to `http/https` only; prohibit `javascript:`, `data:`, `file:`; never include secrets in query params; minimal 404 body.
- Denial of Service
  - Risks: burst traffic, bot floods.
  - Controls: Cloudflare WAF/Bot Management; IP/ASN throttles; simple fallback for KV errors; health checks.
- Elevation of Privilege
  - Risks: hidden admin routes in Worker.
  - Controls: no admin endpoints on redirector; separate management API with auth.

Neon Postgres
- Spoofing/Tampering
  - Controls: separate users/roles (read/write/migrate); no superuser in app; TLS required; prepared statements only.
- Information disclosure
  - Controls: row‑level access via app; limit columns returned; backup encryption.
- Repudiation
  - Controls: audit tables for sensitive mutations.

Stripe webhooks
- Spoofing
  - Controls: verify webhook signatures; reject invalid; rotate secrets.
- Tampering/Repudiation
  - Controls: idempotency store keyed by event id + action; audit trail of processed events.
- DoS
  - Controls: bounded retries; queue if downstream failure; idempotent handlers.

Cross‑cutting Controls
- OWASP ASVS
  - V2 Authn: Better‑Auth hardened sessions; optional 2FA for admins.
  - V4 Access Control: RBAC, deny‑by‑default, no client‑side authz.
  - V5 Validation: zod validation; strict URL allowlist for redirects.
  - V6 Crypto: HTTPS everywhere; no custom crypto; hashed IPs with salt rotation.
  - V7 Errors/Logging: no secrets/PII; correlation IDs.
  - V9 Communications: TLS; HSTS; secure cookies; CSP, X‑Frame‑Options, Referrer‑Policy.
  - V14 Config: secrets via platform stores; no secrets in repo; least privilege keys.

Open Redirect Considerations
- Redirect is the core feature; however, restrict protocols to `https?` and validate absolute URLs. Consider optional domain allowlists per renter if abuse observed.

Residual Risks
- Eventual consistency in KV causing brief mismatch; mitigated via DO‑coordinated writes.
- IVT scoring false positives/negatives; mitigated via review + credits.

Monitoring & Response
- Sentry error alerts; WAF anomalies; elevated IVT rate; SSL issuance failures.
- Incident runbooks: see docs/ops/runbooks/incident-response.md.
