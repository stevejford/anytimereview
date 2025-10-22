# Edge Testing Guide

Objective
- Verify redirect behavior at the edge with minimal overhead and high fidelity to production bindings.

Setup
- Local runner: Miniflare or `wrangler dev --local` (workerd).
- Bindings:
  - KV: `ROUTES` mapping `host/path → target|code`
  - AE: stub implementation that records calls (don’t block redirects)
  - Optional DO: mocked or omitted (not on hot read path)
- Seeds (example)
  - `example.com/` → `https://brand.com/offer|302`
  - `example.com/deal` → `https://brand.com/deal|301`

Example test (Vitest + Miniflare pseudo)
```ts
import { Miniflare } from 'miniflare';
import { expect, it, beforeAll } from 'vitest';

let mf: Miniflare;
beforeAll(async () => {
  mf = new Miniflare({
    modules: true,
    scriptPath: 'apps/server/dist/index.mjs',
    kvNamespaces: ['ROUTES'],
    bindings: {
      AE: { writeDataPoint: async (..._args: any[]) => {/* no-op */} },
    },
  });
  const ns = await mf.getKVNamespace('ROUTES');
  await ns.put('example.com/', 'https://brand.com/offer|302');
  await ns.put('example.com/deal', 'https://brand.com/deal|301');
});

it('302 preserves query', async () => {
  const res = await mf.dispatchFetch('https://example.com/?utm=1', { headers: { host: 'example.com' } });
  expect(res.status).toBe(302);
  expect(res.headers.get('location')).toBe('https://brand.com/offer/?utm=1');
});

it('301 for permanent route', async () => {
  const res = await mf.dispatchFetch('https://example.com/deal?x=y', { headers: { host: 'example.com' } });
  expect(res.status).toBe(301);
  expect(res.headers.get('location')).toBe('https://brand.com/deal?x=y');
});

it('404 for missing', async () => {
  const res = await mf.dispatchFetch('https://example.com/missing');
  expect(res.status).toBe(404);
});
```

Test cases checklist
- Redirect codes
  - 302 default; 301 when configured; support for 307/308 if allowed.
- Query preservation
  - UTM and arbitrary query string preserved; ensure `?` placement after path.
- Host handling
  - Uses `Host` header primarily; fallback to URL host if absent; `www` fallback mapping.
- Path handling
  - Trailing slash normalization as defined; case sensitivity rules; URL‑encoded characters.
- Fallbacks
  - No `host/path` → try `host/` root; else 404.
- Negative caching
  - Optional: brief in‑memory cache for misses; ensure cache TTL respected.
- Analytics write
  - AE stub invoked; redirect returns without awaiting.
- Error resilience
  - KV error → return 502 with minimal body; log error path.

Performance hints (local)
- Use k6/autocannon against `wrangler dev --local` to approximate latency and confirm budgets (see performance-budgets.md).

Tips
- Keep bundle small; avoid JSON parsing on hot path.
- Prefer a single catch‑all route in Hono to minimize middleware overhead.

