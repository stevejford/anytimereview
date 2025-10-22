# Local Setup

Prerequisites
- Node.js 20+
- pnpm 10+
- Cloudflare Wrangler CLI (`pnpm dlx wrangler --version` to verify)
- Neon account (for Postgres)

Repo structure (monorepo)
- apps/web: Next.js app (port 3001)
- apps/server: Cloudflare Worker (Hono) dev on port 3000
- packages/db: Drizzle schema and migrations (Neon HTTP driver)
- packages/auth: Better‑Auth setup (used by server and web)

Environment variables
- apps/server/.env (copy from apps/server/.env.example)
  - DATABASE_URL=Neon Postgres connection string (Serverless/HTTP URL)
  - BETTER_AUTH_SECRET=generate a strong secret
  - BETTER_AUTH_URL=http://localhost:3000
  - CORS_ORIGIN=http://localhost:3001
- apps/web/.env (copy from apps/web/.env.example)
  - NEXT_PUBLIC_SERVER_URL=http://localhost:3000

Create a Neon database (manual)
- Create project and database at Neon
- In Project settings → Connection details → copy the HTTP (serverless) URL for DATABASE_URL
- Optional: create a branch per environment (dev, staging, prod) in Neon

Install deps
- From repo root: `pnpm install`

Generate and apply schema (Drizzle)
- Ensure `apps/server/.env` has `DATABASE_URL`
- From repo root:
  - `pnpm db:generate` (packages/db → generate migrations)
  - `pnpm db:push` (apply schema to Neon)
  - Optional: `pnpm db:studio` (browse schema locally)

Run locally
- Start Worker API: `pnpm dev:server` (wrangler dev on http://localhost:3000)
- Start Web app: `pnpm dev:web` (Next.js on http://localhost:3001)
- Or run both via Turborepo: `pnpm dev`

Seeding data (optional)
- No seed script included yet. If needed, add a `seed.ts` under packages/db and run via a small Node script using the Neon HTTP driver.

Common issues
- 403/401 CORS: ensure `CORS_ORIGIN` matches the web origin
- DB connect error: confirm Neon “Serverless driver” URL and allowlist; DATABASE_URL must be the HTTP form
- Auth callback URLs: use `http://localhost:3000` for the server in local

