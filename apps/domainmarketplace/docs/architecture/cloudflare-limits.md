# Cloudflare Limits & Quotas (MVP Reference)

Goal
- Map product limits to our expected traffic patterns and define mitigations. Always confirm current quotas in vendor docs for your plan.

Traffic assumptions (tunable)
- Redirect QPS: peak 2k rps global, 95% read hits, 5% 404s
- Routing lookup: 1 KV read per request; writes rare (operator/admin)
- Click logging: 1 AE event per redirect

Workers (runtime)
- CPU time per request: bounded by plan; keep logic minimal and asynchronous (no blocking waits)
- Memory: avoid large objects; reuse URL parsing; avoid libraries that bloat bundle size
- Request/response limits: avoid large payloads on redirector (no bodies)
Mitigations
- Keep a single catch-all route; remove excess middleware; precompile regex/paths

Workers KV
- Characteristics: eventually consistent, globally distributed, fast reads, slower writes
- Key size/value size: confirm in docs; keep values small (target ≤ 1KB per route entry)
- Read pattern: 1 get on hot path; write pattern: updates via control plane/DO
Mitigations
- Write through a Durable Object to serialize updates for popular keys
- Negative caching for misses (short TTL in-memory) to limit repeated KV misses
- Partition keys by host to ease export/rotation

Durable Objects (DO)
- Characteristics: single-writer semantics per object; good for coordination, not hot reads
- Use cases here: route update coordination, cache busting, stats counters (non-critical)
Mitigations
- Keep DO off hot read path; use only for writes and invalidations
- Backpressure: rate-limit update bursts; queue via CF Queues if needed

Analytics Engine (AE)
- Characteristics: time-series columnar store; high ingest from Workers; SQL query API
- Ingest pattern: 1 event per redirect; dimensions concise; measures compact
Mitigations
- Batch writes where possible (but don’t block redirects); offload enrichments to rollup jobs
- Keep dimension cardinality in check (hash UAs; normalize referrers)

Pages/Functions (Web)
- Build and runtime constraints depend on adapter (OpenNext Cloudflare here)
Mitigations
- Prefer edge runtime for light pages; avoid server-only heavy modules on hot paths

Monitoring & alerts
- Redirect error rate 5xx > 0.01% over 10 min → alert
- KV write failures or elevated latency → alert and degrade to cached routes
- AE ingestion failures → alert; queue events or sample if necessary

Capacity planning worksheet (fill with current quotas)
- KV read latency target: < 1 ms median
- KV write budget: N writes/min (plan-specific) vs expected admin updates: M/min → OK if M << N
- AE ingest: expected events/day vs plan ingest quota → margin ≥ 2x
- Worker CPU: avg cpu time per request × rps < plan budget; p99 within headroom

References
- Cloudflare Workers, KV, Durable Objects, Analytics Engine docs (plan-specific limits)

