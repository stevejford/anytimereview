# Contributing

Monorepo layout
- apps/web: Next.js app (UI)
- apps/server: Cloudflare Worker (Hono API)
- packages/db: Drizzle ORM schema, config, migrations
- packages/auth: Better‑Auth package

Branching & commits
- Branch naming: `feat/<scope>`, `fix/<scope>`, `docs/<scope>`
- Commits: Prefer Conventional Commits (feat, fix, docs, chore, refactor)

Code quality
- Formatting/linting: Biome (configured at root); run `pnpm check` or rely on pre-commit
- Pre-commit: Husky + lint-staged auto-format changed files
- Type checks: `pnpm check-types` (or `turbo check-types`)

Running locally
- Install: `pnpm install`
- DB: set `apps/server/.env` then `pnpm db:generate && pnpm db:push`
- Dev servers: `pnpm dev:server` (http://localhost:3000), `pnpm dev:web` (http://localhost:3001)

API and schema changes
- If you add/change DB schema in `packages/db/src/schema`, regenerate/push migrations
- Update `.env.example` files if new env vars are introduced
- Update OpenAPI spec at `docs/openapi/domain-rental-marketplace.yaml` for public endpoints

PR checklist
- [ ] Code formatted and types checked
- [ ] `.env.example` updated (if required)
- [ ] DB migrations generated and applied
- [ ] OpenAPI updated (if API behavior changed)
- [ ] Docs updated (DX/Runbooks as needed)

Releases & deploy
- Worker deploys through Wrangler (`apps/server` → `pnpm deploy`) with environment bindings
- Web deploy via Cloudflare Pages (OpenNext for Cloudflare) scripts in `apps/web`

