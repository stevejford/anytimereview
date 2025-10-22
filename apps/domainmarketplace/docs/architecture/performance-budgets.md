# Performance Budgets — Edge and App

Purpose
- Bound latency and resource usage to ensure UX and cost goals for the redirect hot path and the web app.

Edge redirector (Cloudflare Worker)
- Latency
  - P95 ≤ 20 ms, P99 ≤ 50 ms (edge compute time)
  - Cold start budget ≤ 10 ms on average (min deps, single bundle)
- I/O
  - KV lookups: ≤ 1 per request (host+path → target)
  - Analytics write: async fire-and-forget (no await on the hot path)
- CPU/memory
  - CPU time within Worker limits; keep middleware minimal (Hono catch-all only)
  - Bundle size ≤ 100 KB gzipped (no heavy deps)
- Redirect semantics
  - Preserve query string; configurable status 301/302 per contract

Web app (Next.js)
- RUM metrics (Core Web Vitals)
  - P75 LCP ≤ 2.5 s (desktop) / ≤ 3.0 s (mobile)
  - TTFB ≤ 800 ms (SSR routes)
  - CLS ≤ 0.1; INP ≤ 200 ms
- Server targets (during SSR/fetch)
  - API p95 ≤ 150 ms for simple reads, ≤ 300 ms for heavier queries
  - Avoid DB N+1; prefer single batched fetch per view

Operational budgets
- Error rate for redirects: ≤ 0.01% 5xx over 24h
- Invalid click false-positives: ≤ 1% of valid traffic (adjust over time)

Measurement plan (POC)
- Local: `wrangler dev --local` + k6 for synthetic load; measure latency with/without KV
- Edge: deploy canary Worker; use Cloudflare Analytics and logs to derive p95/p99
- Code references
  - Worker app entry: my-better-t-app/apps/server/src/index.ts:1

Techniques to meet budgets
- Keep Worker catch-all route minimal; avoid extra JSON/URL parsing
- Cache negative lookups briefly in memory (if acceptable) to avoid repeated KV misses
- Use Durable Object only for write coordination; never on hot read path
- In Next.js, cache layout/data where safe; prefer edge runtime for light pages

