# ADR-0001: Edge Routing Strategy

- Status: Accepted
- Date: 2025-10-18

Context
- We need high-QPS redirects for rented domains and slugs with minimal latency, simple ops, and accurate click analytics. The redirector must preserve query strings, choose status codes (301/302) per contract, and scale cheaply.

Decision
- Use a Cloudflare Worker with Hono (minimal catch-all) for routing.
- Store hot routing state in Workers KV as `host + path → targetUrl + redirectCode`.
- Use a Durable Object only for coordinated writes/invalidations (e.g., updating popular slugs, cache bust), never on the hot read path.
- Emit click events asynchronously to Workers Analytics Engine from the redirect path and run deduplication off-path to avoid blocking the response.

Implementation sketch
- KV keys: `example.com/` → `https://brand.com/offer|302`; `example.com/deal` → `https://brand.com/deal|302`
- Fallback: if `host/path` not found, try `host/` root mapping; else 404
- Preserve query string; set `Location` accordingly
- Example entry point: my-better-t-app/apps/server/src/index.ts:1

Why this works
- KV provides extremely low-latency reads at the edge with global replication; suitable for read-heavy routing tables.
- DO lets us serialize route updates and purge/refresh KV entries without introducing cross-region races.
- Analytics Engine is designed for high-volume write ingestion from Workers and efficient time-series queries.

Alternatives considered
- D1 (SQLite at edge): easier relational queries but higher per-request latency and write contention on hot paths.
- External Redis (over network): adds egress latency/cost and external dependency; unnecessary for simple mapping.
- Origin-based routing (Next.js middleware, custom origin): increases TTFB; less resilient to global traffic spikes.

Consequences
- Eventual consistency in KV means recently updated routes may lag briefly; we mitigate with DO-coordinated writes and cache busting.
- Route sync between Postgres, KV, and Durable Objects is eventually consistent; CRUD APIs queue updates so DO outages do not impact writes.
- KV size/namespace limits apply; we need key hygiene and partitioning strategy for very large inventories.
- Simplicity on the hot path leaves room to add IVT heuristics and WAF gating without sacrificing latency.

POC and measurement
- POC implementation lives in Worker app skeleton: my-better-t-app/apps/server/src/index.ts:1
- Measurement: see performance-budgets.md for p95/p99 targets and k6/wrangler dev test approach.

Links
- performance-budgets.md
- openapi/domain-rental-marketplace.yaml

