# Vercel Migration Guide

## Overview

This document describes the migration from Railway to Vercel for the Domain Marketplace application.

## Architecture Transformation

### Before (Railway)
- **Web App**: Next.js application (Railway service)
- **API Server**: Hono API server (Railway service)
- **Redirector**: Hono redirector (Railway service)
- **Aggregator**: Analytics aggregator (Railway service)
- **Usage Reporter**: Usage reporting (Railway service)
- **Database**: Neon PostgreSQL
- **Cache**: Railway TCP Redis

### After (Vercel)
- **Web App**: Next.js with integrated Hono API routes (Vercel serverless)
- **Redirector Edge**: Edge function for redirects (Vercel Edge Runtime)
- **Cron Jobs**: Vercel Cron (aggregator, usage-reporter)
- **Database**: Neon PostgreSQL (HTTP driver)
- **Cache**: Upstash Redis (HTTP/REST)

## Component Mapping

| Railway Service | Vercel Equivalent | Runtime |
|----------------|-------------------|---------|
| web | web/ (Next.js app) | Node.js serverless |
| server | web/src/app/api/v1/ (integrated) | Node.js serverless |
| redirector | redirector-edge/ (Edge Function) | Edge Runtime |
| aggregator | web/src/app/api/cron/aggregator | Node.js serverless |
| usage-reporter | web/src/app/api/cron/usage-reporter | Node.js serverless |

## Key Changes

### 1. API Integration
- **Before**: Separate server service with internal DNS (`server.railway.internal`)
- **After**: Integrated Hono routes at `/api/v1/*` in Next.js app
- **Benefit**: Simpler architecture, no proxy needed, better cold start performance

### 2. Redis Migration
- **Before**: TCP Redis (Railway)
- **After**: Upstash Redis (HTTP/REST)
- **Changes**:
  - Updated `@my-better-t-app/redis` package with Upstash adapter
  - RouteCoordinator accepts optional Upstash credentials
  - ClickDeduplicator supports external Redis client injection

### 3. Redirector Deployment
- **Before**: Node.js service on Railway
- **After**: Edge Function on Vercel Edge Runtime
- **Benefits**: Global edge deployment, lower latency, automatic scaling

### 4. Scheduled Tasks
- **Before**: Railway cron jobs (separate services)
- **After**: Vercel Cron (integrated API routes)
- **Configuration**: Defined in `web/vercel.json`

### 5. Webhooks
- **Before**: Handled by server service
- **After**: Integrated Next.js API routes
- **Routes**:
  - `/api/webhooks/stripe` - Stripe events
  - `/api/webhooks/clerk` - Clerk user sync

## Migration Steps

### Phase 1: Preparation
- [x] Create Upstash Redis instance
- [x] Update Redis client to support Upstash
- [x] Integrate Hono API routes into Next.js app
- [x] Port webhook handlers to Next.js
- [x] Create redirector Edge Function project
- [x] Update environment variables

### Phase 2: Testing
- [x] Test API routes locally with `vercel dev`
- [x] Test webhooks with Stripe CLI
- [x] Test redirector Edge Function
- [x] Verify database connections
- [x] Test cron jobs

### Phase 3: Deployment
- [ ] Deploy web app to Vercel
- [ ] Deploy redirector Edge Function
- [ ] Configure environment variables
- [ ] Install Neon integration
- [ ] Install Upstash integration
- [ ] Configure custom domains
- [ ] Test production deployment

### Phase 4: Cutover
- [ ] Update DNS records
- [ ] Monitor logs and errors
- [ ] Verify all functionality
- [ ] Decommission Railway services

## Environment Variables

### Removed (Railway-specific)
- `INTERNAL_API_URL` - No longer needed (integrated API)
- `REDIS_URL` - Replaced by Upstash variables
- `PORT` - Vercel manages ports automatically

### Added (Vercel-specific)
- `UPSTASH_REDIS_REST_URL` - Upstash Redis HTTP endpoint
- `UPSTASH_REDIS_REST_TOKEN` - Upstash Redis token
- `CRON_SECRET` - Authentication for cron endpoints

### Unchanged
- `DATABASE_URL` - Neon PostgreSQL (auto-injected by integration)
- `CLERK_*` - Clerk authentication
- `STRIPE_*` - Stripe payments
- `CLOUDFLARE_*` - Cloudflare DNS management

## Vercel Projects

### 1. Web App (`web/`)
- **Framework**: Next.js 15
- **Build Command**: `pnpm turbo build --filter=web`
- **Output Directory**: `.next`
- **Root Directory**: `apps/domainmarketplace/web`

### 2. Redirector Edge (`redirector-edge/`)
- **Framework**: Other
- **Build Command**: None (Edge Function)
- **Output Directory**: `api`
- **Root Directory**: `apps/domainmarketplace/redirector-edge`

## Integrations

### Neon PostgreSQL
- Auto-injects `DATABASE_URL`
- HTTP driver compatible with serverless
- Connection pooling handled by Neon

### Upstash Redis
- Auto-injects `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`
- HTTP/REST API (no TCP connections)
- Global edge network

## Monitoring

### Vercel Dashboard
- **Deployments**: View deployment history and logs
- **Logs**: Real-time function logs
- **Analytics**: Performance metrics
- **Cron**: Cron job execution history

### External Monitoring
- **Neon**: Database metrics and query performance
- **Upstash**: Redis metrics and usage
- **Stripe**: Payment events and webhooks
- **Clerk**: User authentication events

## Rollback Plan

If issues arise during migration:

1. **Immediate**: Revert DNS to Railway
2. **Short-term**: Keep Railway services running for 30 days
3. **Long-term**: Maintain Railway backup until Vercel is stable

## Cost Comparison

### Railway (Before)
- Web: $5/month
- Server: $5/month
- Redirector: $5/month
- Aggregator: $5/month
- Usage Reporter: $5/month
- Redis: $5/month
- **Total**: ~$30/month

### Vercel (After)
- Pro Plan: $20/month
- Neon: Free tier (or $19/month for Pro)
- Upstash: Free tier (or $10/month for Pro)
- **Total**: ~$20-50/month

## Performance Improvements

- **Cold Start**: Faster with integrated API (no proxy hop)
- **Redirects**: Global edge deployment (lower latency)
- **Scaling**: Automatic with Vercel serverless
- **Caching**: Upstash global edge network

## Known Limitations

### Edge Runtime
- No Node.js APIs (fs, child_process, etc.)
- 4MB response size limit
- 30-second execution timeout

### Serverless Functions
- 10-second execution timeout (Hobby)
- 60-second execution timeout (Pro)
- 4.5MB request/response size limit

## Support Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Neon Documentation](https://neon.tech/docs)
- [Upstash Documentation](https://upstash.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)

## Migration Checklist

- [x] Update Redis client for Upstash
- [x] Integrate API routes into Next.js
- [x] Port webhook handlers
- [x] Create Edge Function project
- [x] Update environment variables
- [x] Test locally
- [ ] Deploy to Vercel staging
- [ ] Test staging deployment
- [ ] Deploy to production
- [ ] Update DNS
- [ ] Monitor production
- [ ] Decommission Railway

## Next Steps

1. Review `VERCEL_DEPLOYMENT_GUIDE.md` for deployment instructions
2. Review `VERCEL_TESTING_GUIDE.md` for testing procedures
3. Deploy to Vercel staging environment
4. Validate all functionality
5. Deploy to production

