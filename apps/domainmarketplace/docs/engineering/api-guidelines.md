# API Guidelines

Principles
- Stability: Version external API under `/api/v1` (Worker and Web routes). Avoid breaking changes.
- Consistency: JSON only; snake_case in DB, camelCase in API; UTC ISO-8601 timestamps.
- Predictability: Standard pagination and filtering; typed enums; clear 4xx vs 5xx semantics.
- Safety: Idempotency keys for unsafe writes; rate limits; audit logs on sensitive actions.

Versioning
- Path-based version (`/api/v1/...`); new versions for breaking changes
- Minor, non-breaking additions (fields, endpoints) allowed within v1

Errors
- Use HTTP status codes appropriately: 400 (validation), 401/403 (auth), 404, 409 (conflict), 429, 5xx
- Error body shape (RFC 7807-style suggested):
  - `{ type?: string, title: string, detail?: string, status: number, code?: string, traceId?: string }`

Pagination
- Use cursor-based pagination
- Request: `?limit=50&cursor=<opaque>`; Response: `{ items: [...], nextCursor?: string, total?: number }`

Filtering & sorting
- Filter with query params (`?status=active&ownerId=...`); multi-value as comma-separated unless noted
- Sorting param: `sort=createdAt:desc`

Idempotency
- For POST/PUT/PATCH/DELETE that cause writes, accept `Idempotency-Key` header
- Server must store key + request hash for a TTL and return the first result for duplicates

Security
- Authn: Better‑Auth session/JWT; Bearer for API requests
- Authz: role-based checks (owner, hirer, admin)
- Rate limiting: per-IP/user with exponential backoff on 429
- Webhooks: Verify Stripe signatures; respond 2xx on success, non-2xx to trigger retry

Requests/Responses
- Content-Type: `application/json`; Accept: `application/json`
- Timestamps: UTC ISO 8601; numbers: integers for cents; decimals as strings if precision required
- Nullability: omit absent fields instead of null where possible

OpenAPI
- Source of truth: `docs/openapi/domain-hire-marketplace.yaml`
- Keep in sync with implementation; annotate examples; run CI validation (see openapi-publishing.md)

