# Deploy Pipelines

Goals
- Consistent, low‑risk deployments for web (Next.js on Cloudflare Pages) and edge redirector (Cloudflare Worker/Hono) with clear rollback paths.

Web — Next.js on Cloudflare Pages
- Build
  - Use `@cloudflare/next-on-pages` (or OpenNext) to build for Pages.
  - CI sets `NODE_VERSION`, `NEXT_TELEMETRY_DISABLED=1`, env vars per env.
- Previews
  - Every PR builds a preview; run smoke tests; gate merge on checks.
- Staging deploy
  - Merge to `main` triggers staging build/deploy; run e2e tests; verify dashboards.
- Production promotion
  - Manual approval step; promote the exact artifact to prod env; record release (git tag) and Sentry release.
- Health checks
  - Synthetic GET to `/healthz`; confirm SSR critical pages load; monitor Sentry for new errors.

Worker — Hono on Cloudflare Workers
- Build & config
  - Single entry; minimal deps; `wrangler.toml` with `[env.dev|staging|production]` bindings.
  - Bindings: `ROUTES_KV`, `ROUTE_DO` (if used), `AE` dataset, DB URL (fetch via secrets).
- Canary
  - Deploy version N to staging; in prod, canary via subset of routes or subdomain (e.g., `canary.<edge-host>`).
  - Watch edge metrics p95/p99, 5xx, IVT rate; hold for 10–30 minutes before full rollout.
- Full rollout
  - Promote canary artifact to full prod; keep previous as rollback target.
- Health checks
  - Synthetic redirect test (expected 301/302, query preserved); KV/AE write smoke.

CI/CD Skeleton (GitHub Actions example)
- Web
  - Jobs: `build`, `preview`, `deploy-staging`, `promote-prod`.
  - Cache deps; upload artifact; Pages deploy actions with env‑specific variables.
- Worker
  - Jobs: `build`, `deploy-staging`, `canary-prod`, `promote-prod`, `rollback`.
  - Use `wrangler action` or CLI; set `--env` appropriately.

Database Migrations (Neon + Prisma)
- Pre‑migration
  - Cut Neon branch from current prod; run migration against branch; smoke tests.
- Staging
  - Apply migration; verify app; performance test queries.
- Prod
  - Apply during deploy window; hold rollback plan using the pre‑cut branch.
  - If regression, point app to branch or revert migration per playbook.

Rollback Procedures
- Web
  - Promote previous Pages deployment; invalidate caches if needed.
- Worker
  - `wrangler versions` (or release tags) → redeploy previous version; verify canary first if time allows.
- Config
  - Revert binding changes via git + re‑deploy; if secret/env var change caused issue, re‑apply previous values.
- Database
  - Switch to Neon pre‑cut branch; or run `prisma migrate resolve`/revert as per migration plan.

Change Control
- Require ticket with:
  - Change description, risk, rollback plan, expected impact, owner on call, links to dashboards.
- Freeze windows
  - Respect error budget policy; block non‑urgent deploys during budget exhaustion.

References
- Environments: docs/deployment/environments.md
- Observability: docs/ops/observability.md
- Incident Response: docs/ops/runbooks/incident-response.md
