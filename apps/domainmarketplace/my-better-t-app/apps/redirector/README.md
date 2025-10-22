# Redirector Worker

## Overview
The redirector worker serves the edge redirect layer for the domain hire marketplace. It resolves custom hosts and paths to hire destinations, applies bot detection safeguards, deduplicates rapid-fire clicks, and streams telemetry into the analytics engine as defined in [ADR-0001](../../../docs/architecture/adrs/adr-0001-edge-routing.md) and [ADR-0002](../../../docs/architecture/adrs/adr-0002-click-telemetry-store.md).

## Architecture
- Workers KV stores hot routing entries keyed by `host:path` with a root fallback.
- A Durable Object (`RouteCoordinator`) serializes updates from the API server, ensuring KV stays consistent with Postgres.
- Analytics Engine captures click events with dimensions for host, path, route, hire, geography, ASN, bot bucket, and referrer.
- Bot detection and IVT policy enforcement leverage Cloudflare bot management scores, ASN heuristics, and user-agent heuristics.
- Deduplication is handled by the `ClickDeduplicator` Durable Object which keeps transient state off the hot path, avoiding extra KV reads.

## Workspace Dependencies

The redirector depends on the `@my-better-t-app/db` workspace package for database access. The db package must be built before the redirector can build or run.

**Specific Imports Used:**
- `db` from `@my-better-t-app/db` - Database connection instance
- Schema exports from `@my-better-t-app/db/schema/hires`: `routes`, `hires`
- Schema exports from `@my-better-t-app/db/schema/listings`: `listings`
- Schema exports from `@my-better-t-app/db/schema/domains`: `domains`
- Drizzle ORM utilities: `eq` for query building

The `RouteCoordinator` durable object uses these imports to:
- Query route configurations from the PostgreSQL database
- Resolve domain information for FQDN construction
- Sync route changes to KV storage for fast lookups

## Local Development

### Build Order
1. Install dependencies via the workspace root: `pnpm install`.
2. Build the db package: `pnpm --filter @my-better-t-app/db build`
   - This step is automatically handled by the `predev` script
   - The db package is bundled into the redirector worker
3. Create a KV namespace: `wrangler kv:namespace create ROUTES_KV`.
4. Copy `.env.example` to `.env` and supply a Neon Postgres HTTP connection string.
5. Run the edge worker locally with `pnpm dev:redirector` (proxied via Turbo).

### Alternative Development Commands
- **From workspace root**: `pnpm dev --filter redirector`
- **From redirector directory**: `pnpm dev`
- **Manual db build**: `pnpm --filter @my-better-t-app/db build`
- **Clean build**: `pnpm clean` then `pnpm build`

### Build Scripts
The redirector includes automatic dependency management:
- `predev`: Automatically builds the db package before starting dev server
- `prebuild`: Automatically builds the db package before building redirector
- `build:deps`: Manually build the db package
- `clean`: Remove build artifacts (`.wrangler`, `dist`)

## Deployment
- Deploy with `pnpm deploy:redirector` once bindings and secrets exist.
- Configure `DATABASE_URL` via `wrangler secret put DATABASE_URL` before deploying; keep it out of `vars`.
- Provision the `CLICKS_AE` dataset with `wrangler analytics-engine create clicks` (or your chosen dataset name) and update `wrangler.jsonc`.
- Bind the Worker to production hostnames via the `routes` array in `wrangler.jsonc` or the Cloudflare dashboard (required for Custom Hostnames).
- Update the `VERIFIED_BOT_ALLOWLIST` var in Wrangler when bot policy changes.

## Performance
- Adheres to the sub-20ms p95 latency budget from [`performance-budgets.md`](../../../docs/architecture/performance-budgets.md).
- Hot path performs a single KV read followed by an immediate redirect response.
- Deduplication and analytics logging run asynchronously via `waitUntil`, keeping network calls off the response path while preserving accuracy.

## Bot Detection & Trust
- IVT policy tiers from [`ivt-policy.md`](../../../docs/trust-safety/ivt-policy.md) mark Tier A invalid traffic and Tier B suspected traffic.
- Duplicate clicks flagged via KV TTL keys are recorded but marked invalid in analytics.

## Monitoring
- Analytics Engine provides click observability; query guidelines live in [`observability.md`](../../../docs/ops/observability.md).
- Pair with runbooks in [`error-budgets.md`](../../../docs/ops/error-budgets.md) for remediation thresholds.

## Troubleshooting

### Build Errors

**Error: "Cannot find module '@my-better-t-app/db'"**
- **Cause**: The db package hasn't been built yet
- **Solution**: Run `pnpm --filter @my-better-t-app/db build`
- **Prevention**: The `predev` and `prebuild` scripts should handle this automatically

**Error: "Could not resolve '@my-better-t-app/db/schema/hires'"**
- **Cause**: Wrangler's bundler cannot resolve workspace packages
- **Solution**: Ensure `tsconfig.json` has path mappings and `wrangler.jsonc` has the `rules` configuration
- **Check**: Verify `node_compat: true` is set in `wrangler.jsonc`

### Type Errors

**Error: Type errors in route-coordinator.ts**
- **Cause**: TypeScript cannot find types from the db package
- **Solution**: Ensure TypeScript path mappings are configured in `tsconfig.json`
- **Check**: Verify `baseUrl` is set to `"."` and `paths` includes `@my-better-t-app/db`

### Wrangler Errors

**Error: "Build failed with esbuild errors"**
- **Cause**: esbuild cannot bundle the workspace package
- **Solution**: Check that `wrangler.jsonc` has the `rules` configuration for TypeScript files
- **Alternative**: Try running `pnpm clean` then `pnpm build:deps` then `pnpm build`

### Clean Build

If you encounter persistent build issues:
1. Run `pnpm clean` to remove build artifacts
2. Run `pnpm --filter @my-better-t-app/db build` to rebuild the db package
3. Run `pnpm build` or `pnpm dev` to rebuild the redirector
4. Check that `dist/` directory exists in `packages/db/`

## Architecture Notes

### Database Integration

The `RouteCoordinator` durable object integrates with the database to:
- **Query route configurations**: Fetches route records from the `routes` table
- **Resolve domain information**: Joins with `domains`, `listings`, and `hires` tables for FQDN construction
- **Sync route changes**: Updates KV storage when routes are created, updated, or deleted
- **Maintain consistency**: Ensures KV reflects the current database state

### Performance Considerations

- **Database queries only in Durable Objects**: The main request path uses KV lookups (no database queries)
- **Bundled db package**: The db package is bundled into the worker for zero-latency access
- **Async syncing**: Route updates happen asynchronously via `waitUntil`
- **KV for hot path**: Fast lookups with sub-20ms p95 latency
- **Database for consistency**: Single source of truth for route configuration

This architecture balances consistency (database) with performance (KV) while keeping the hot path fast.

