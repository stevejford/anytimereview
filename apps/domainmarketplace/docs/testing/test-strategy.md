# Test Strategy

Goals
- Ensure correctness of routing, billing, and analytics while keeping feedback fast. Cover the hot redirect path, API/Worker behavior, and payments with webhooks/idempotency.

Layers (test pyramid)
- Unit
  - Scope: helpers, URL/UTM handling, schema validators (zod), small Drizzle query builders.
  - Tools: Vitest + ts-node/tsup; mock external deps.
  - Targets: ~80% line coverage for core utils; avoid snapshot overuse.
- Integration (Edge Worker)
  - Scope: Worker fetch handler via Miniflare/workerd with KV/DO bindings; Hono routing catch‑all.
  - Verify: 301/302 codes, query preservation, host/path matching, 404 fallback, AE write is non‑blocking.
  - Tools: Vitest + Miniflare or wrangler dev --local.
- Integration (Web/API)
  - Scope: Next.js API routes if present; auth endpoints; OpenAPI example conformance.
  - Tools: Vitest or supertest‑style fetch against dev server.
- Contract/API
  - Scope: Response shapes and status codes match OpenAPI (`docs/openapi/domain-rental-marketplace.yaml`).
  - Tools: schemathesis or Dredd; minimal happy path assertions.
- E2E
  - Scope: Owner Stripe Connect onboarding (mock), add domain → pre‑validation flow (token), renter checkout (test keys), route config, link check, analytics render.
  - Tools: Playwright; test env with seeded DB and feature flags to bypass real DNS.
- Load/Perf
  - Scope: Redirect path only; validate p95/p99 budgets and no degradation under spike.
  - Tools: k6 or autocannon; run against wrangler dev local and canary in staging.

Environments & Data
- Neon branch per CI run (optional) or a shared DEV DB with cleanup scripts.
- Drizzle migrations run before tests; seed minimal fixtures (owner, renter, listing, routes).
- Secrets via CI store; Stripe test keys only in non‑prod.

Payments Testing
- Stripe test mode for Direct Charges and Billing usage; webhook handler under test with signature verification.
- Idempotency: stable keys for PaymentIntents, usage records, and transfers; assert single effect across retries.

CI/CD
- Jobs: lint/format (Biome), typecheck, unit/integration tests, contract tests on OpenAPI changes.
- Gates: main branch requires all green; deploy on tag after tests.

Reporting
- Coverage report for unit/integration; k6 summary artifacts; Stripe event logs collected in artifacts for payment tests.

