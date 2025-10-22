# Verification Comments Implementation Status

## ✅ Comment 1: COMPLETED
**Issue**: useQuery still triggers API calls for seed IDs; add enabled guard to prevent unnecessary requests.

**Solution**: Updated `apps/web/src/app/browse/[id]/hire/page.tsx`
- Changed `enabled` from `Boolean(listingId)` to `Boolean(listingId) && !isSeedListing(listingId as string)`
- This prevents the query from executing for seed IDs
- The early-return demo UI remains intact

**Files Modified**:
- `apps/web/src/app/browse/[id]/hire/page.tsx`

---

## ✅ Comment 2: COMPLETED
**Issue**: Wrangler config still lacks build/watch; db changes won't rebuild. Add build block with watch_dirs.

**Solution**: Updated `apps/redirector/wrangler.jsonc`
- Added `build` block with:
  - `command`: `esbuild src/index.ts --bundle --format=esm --outfile=dist/index.js --external:cloudflare:*`
  - `watch_dirs`: `["src", "../../packages/db/src"]`
- This ensures Wrangler rebuilds when either redirector or DB package changes

**Files Modified**:
- `apps/redirector/wrangler.jsonc`

---

## ✅ Comment 3: COMPLETED
**Issue**: TS paths map to dist; prefer source mapping for DX or remove if exports suffice.

**Solution**: Updated `apps/redirector/tsconfig.json`
- Removed the `paths` mappings entirely
- Module resolution now uses the package `exports` from `packages/db/package.json`
- This provides better editor navigation while keeping builds stable

**Files Modified**:
- `apps/redirector/tsconfig.json`

---

## ✅ Comment 4: COMPLETED
**Issue**: Listing fetch logic is duplicated; extract shared helper to handle seed vs API consistently.

**Solution**: Created shared helper function
- Created new file `apps/web/src/lib/listings.ts` with `getListingById(id)` function
- Updated detail page to use `queryFn: () => getListingById(listingId!)`
- Rent page continues to use `enabled` guard to skip fetching for seed IDs
- Centralized seed handling logic in one place

**Files Created**:
- `apps/web/src/lib/listings.ts`

**Files Modified**:
- `apps/web/src/app/browse/[id]/page.tsx`
- `apps/web/src/app/browse/[id]/hire/page.tsx`

---

## ⚠️ KNOWN ISSUE: DB Package Build Crash

**Problem**: The `@my-better-t-app/db` package build crashes with exit code `3221225786` (0xC000013A - STATUS_CONTROL_C_EXIT) when run via `turbo dev` in parallel with other tasks.

**Root Cause**: This is a Windows-specific issue with tsdown/rolldown when run in concurrent/parallel mode via Turborepo. The process is being terminated unexpectedly.

**Workaround**: The db package builds successfully when run manually:
```bash
pnpm --filter @my-better-t-app/db build
```

**Current Status**: 
- Added `aggregator#dev` and `server#dev` tasks to `turbo.json` with dependency on `@my-better-t-app/db#build`
- This ensures proper build order, but the parallel execution still causes crashes
- Services can be started individually after building the db package manually

**Recommended Solutions**:
1. **Option A**: Always build db package manually before starting dev servers
2. **Option B**: Investigate tsdown/rolldown Windows compatibility issues
3. **Option C**: Consider alternative build tool for the db package (e.g., tsup, unbuild)
4. **Option D**: Run services individually instead of using `pnpm dev`

---

## Summary

All 4 verification comments have been successfully implemented:
1. ✅ Prevented unnecessary API calls for seed listings on rent page
2. ✅ Added build configuration with watch_dirs to Wrangler config
3. ✅ Optimized TypeScript resolution by removing paths mapping
4. ✅ Created shared helper to centralize listing fetch logic

The only remaining issue is the db package build crash when run via `turbo dev`, which is a known Windows/tsdown compatibility issue that requires a workaround.

