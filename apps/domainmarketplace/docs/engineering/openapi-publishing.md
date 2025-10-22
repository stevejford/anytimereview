# OpenAPI Publishing

Source of truth
- `docs/openapi/domain-rental-marketplace.yaml` (OpenAPI 3.1)

Goals
- Validate spec in CI, publish HTML docs, and optionally generate a TS client SDK

Recommended tooling
- Validation: Redocly CLI or swagger-cli
- Docs site: Redocly CLI (static HTML) or Swagger UI bundle
- Type client: `openapi-typescript` (types) or `orval` (client + hooks)

Suggested scripts (add to root package.json)
- Validate: `redocly lint docs/openapi/domain-rental-marketplace.yaml`
- Build HTML docs: `redocly build-docs docs/openapi/domain-rental-marketplace.yaml -o docs/openapi/dist/index.html`
- Generate TS types: `openapi-typescript docs/openapi/domain-rental-marketplace.yaml -o packages/types/src/openapi.d.ts`

Install dev deps
- `pnpm add -D @redocly/cli openapi-typescript swagger-cli`

CI idea (GitHub Actions)
- On PRs touching `docs/openapi/**`:
  - Run validation
  - Upload HTML artifact
  - Fail build if lint errors

Serving docs
- Commit `docs/openapi/dist/index.html` or host via Pages
- Link the HTML from your main README or internal wiki

Keeping spec in sync
- Require PRs changing API handlers to also update the YAML
- Reviewer checklist includes OpenAPI examples updated and accurate status codes

