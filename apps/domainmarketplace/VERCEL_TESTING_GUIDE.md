# Vercel Testing Guide

Comprehensive testing procedures for the Domain Marketplace on Vercel.

## Table of Contents

1. [Local Testing](#local-testing)
2. [API Testing](#api-testing)
3. [Webhook Testing](#webhook-testing)
4. [Edge Function Testing](#edge-function-testing)
5. [Cron Job Testing](#cron-job-testing)
6. [Performance Testing](#performance-testing)
7. [Integration Testing](#integration-testing)
8. [Production Testing](#production-testing)

## Local Testing

### Prerequisites

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm turbo build
```

### Start Vercel Dev Server

```bash
cd apps/domainmarketplace/web
vercel dev
```

This starts a local development server that simulates the Vercel environment.

### Environment Variables

Create `.env.local` in `web/` directory:

```bash
DATABASE_URL=postgresql://...
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_CONNECT_CLIENT_ID=ca_...
STRIPE_PLATFORM_FEE_PERCENT=4
CRON_SECRET=test-secret
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## API Testing

### Health Check

```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-01-..."
}
```

### Domain Endpoints

```bash
# List domains
curl http://localhost:3000/api/v1/domains

# Get domain by ID
curl http://localhost:3000/api/v1/domains/{id}

# Create domain (requires auth)
curl -X POST http://localhost:3000/api/v1/domains \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{"name": "example.com"}'
```

### Listing Endpoints

```bash
# List listings
curl http://localhost:3000/api/v1/listings

# Get listing by ID
curl http://localhost:3000/api/v1/listings/{id}
```

### Hire Endpoints

```bash
# List hires (requires auth)
curl -H "Authorization: Bearer ${TOKEN}" \
  http://localhost:3000/api/v1/hires

# Create hire (requires auth)
curl -X POST http://localhost:3000/api/v1/hires \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{"listingId": "..."}'
```

### Analytics Endpoints

```bash
# Get analytics (requires auth)
curl -H "Authorization: Bearer ${TOKEN}" \
  http://localhost:3000/api/v1/analytics?hireId={id}
```

## Webhook Testing

### Stripe Webhooks

#### Setup Stripe CLI

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login
```

#### Forward Webhooks to Local Server

```bash
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe
```

This will output a webhook signing secret. Update `STRIPE_WEBHOOK_SECRET` in `.env.local`.

#### Trigger Test Events

```bash
# Payment intent succeeded
stripe trigger payment_intent.succeeded

# Payment intent failed
stripe trigger payment_intent.payment_failed

# Subscription created
stripe trigger customer.subscription.created

# Invoice paid
stripe trigger invoice.paid

# Charge refunded
stripe trigger charge.refunded
```

#### Verify Event Processing

Check logs for:
```
Stripe webhook handling succeeded
Event ID: evt_...
Event Type: payment_intent.succeeded
```

Check database for:
- `stripeEvents` table: Event should be marked as processed
- `invoices` table: Invoice should be created/updated
- `payouts` table: Payout should be created (for metered billing)

### Clerk Webhooks

#### Setup Clerk Webhook

1. Go to Clerk Dashboard → Webhooks
2. Add endpoint: `http://localhost:3000/api/webhooks/clerk`
3. Select events: `user.created`, `user.updated`
4. Copy webhook secret to `CLERK_WEBHOOK_SECRET`

#### Trigger Test Events

Create or update a user in Clerk Dashboard and verify:
- User is synced to local database
- Event is logged in `stripeEvents` table

## Edge Function Testing

### Local Testing

```bash
cd apps/domainmarketplace/redirector-edge
vercel dev
```

### Test Redirect

```bash
# Test redirect endpoint
curl -I http://localhost:3000/api/redirect
```

Expected response:
```
HTTP/1.1 302 Found
Location: https://destination.com
```

### Test with Custom Domain

1. Add entry to `/etc/hosts`:
   ```
   127.0.0.1 test.local
   ```

2. Test redirect:
   ```bash
   curl -H "Host: test.local" http://localhost:3000/api/redirect
   ```

## Cron Job Testing

### Aggregator Cron

```bash
curl -X POST http://localhost:3000/api/cron/aggregator \
  -H "Authorization: Bearer ${CRON_SECRET}"
```

Expected response:
```json
{
  "status": "ok",
  "processed": 123
}
```

Verify:
- Analytics data is aggregated in database
- Logs show successful processing

### Usage Reporter Cron

```bash
curl -X POST http://localhost:3000/api/cron/usage-reporter \
  -H "Authorization: Bearer ${CRON_SECRET}"
```

Expected response:
```json
{
  "status": "ok",
  "reported": 45
}
```

Verify:
- Usage is reported to Stripe
- Logs show successful processing

### Test Cron Authentication

```bash
# Without auth (should fail)
curl -X POST http://localhost:3000/api/cron/aggregator

# Expected: 401 Unauthorized
```

## Performance Testing

### Response Time Targets

| Endpoint | Target | Acceptable |
|----------|--------|------------|
| /api/health | < 100ms | < 200ms |
| /api/v1/domains | < 500ms | < 1000ms |
| /api/v1/listings | < 500ms | < 1000ms |
| /api/webhooks/* | < 2000ms | < 5000ms |
| Edge redirect | < 50ms | < 100ms |

### Load Testing

```bash
# Install Apache Bench
brew install httpd

# Test API endpoint
ab -n 1000 -c 10 http://localhost:3000/api/health

# Test redirect endpoint
ab -n 1000 -c 10 http://localhost:3000/api/redirect
```

### Database Query Performance

Monitor slow queries in Neon Dashboard:
- Queries > 1000ms should be optimized
- Add indexes for frequently queried columns
- Use connection pooling

## Integration Testing

### End-to-End User Flow

1. **User Registration**:
   - Sign up via Clerk
   - Verify user synced to database
   - Check user role and permissions

2. **Domain Listing**:
   - Create domain
   - Create listing
   - Verify listing appears in API

3. **Hire Creation**:
   - Create hire
   - Initiate payment
   - Verify payment intent created

4. **Payment Processing**:
   - Complete payment
   - Verify webhook received
   - Check invoice created
   - Verify payout created (metered)

5. **Analytics**:
   - Track clicks
   - Run aggregator cron
   - Verify analytics data

### Database Integrity

```sql
-- Check for orphaned records
SELECT * FROM hires WHERE listingId NOT IN (SELECT id FROM listings);
SELECT * FROM listings WHERE domainId NOT IN (SELECT id FROM domains);

-- Check for missing Stripe IDs
SELECT * FROM hires WHERE stripeCustomerId IS NULL;
SELECT * FROM invoices WHERE stripeInvoiceId IS NULL;

-- Check payout status
SELECT status, COUNT(*) FROM payouts GROUP BY status;
```

## Production Testing

### Staging Deployment

```bash
# Deploy to preview
cd apps/domainmarketplace/web
vercel

# Test preview URL
curl https://your-preview-url.vercel.app/api/health
```

### Production Smoke Tests

After deploying to production:

```bash
# Health check
curl https://yourdomain.com/api/health

# API endpoints
curl https://yourdomain.com/api/v1/domains
curl https://yourdomain.com/api/v1/listings

# Webhook endpoints (use Stripe/Clerk test mode)
stripe trigger payment_intent.succeeded
```

### Monitor Production Logs

```bash
# View real-time logs
vercel logs --follow

# View logs for specific deployment
vercel logs <deployment-url>
```

### Check Vercel Analytics

1. Go to Vercel Dashboard → Analytics
2. Monitor:
   - Response times
   - Error rates
   - Traffic patterns
   - Geographic distribution

## Troubleshooting

### Common Issues

**Issue**: API returns 500 error
**Debug**:
```bash
# Check logs
vercel logs --follow

# Check environment variables
vercel env ls

# Test database connection
curl http://localhost:3000/api/health
```

**Issue**: Webhook signature verification fails
**Debug**:
- Verify `STRIPE_WEBHOOK_SECRET` matches Stripe Dashboard
- Check raw body is being used (not parsed JSON)
- Test with Stripe CLI

**Issue**: Cron job not executing
**Debug**:
- Verify `vercel.json` cron configuration
- Check Vercel Dashboard → Cron
- Test manually with curl

**Issue**: Edge function timeout
**Debug**:
- Check Redis connection
- Verify database query performance
- Monitor Edge function logs

## Test Checklist

### Pre-Deployment

- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] API endpoints return expected responses
- [ ] Webhooks process events correctly
- [ ] Cron jobs execute successfully
- [ ] Edge function redirects work
- [ ] Database migrations applied
- [ ] Environment variables configured

### Post-Deployment

- [ ] Health check returns 200
- [ ] API endpoints accessible
- [ ] Webhooks receiving events
- [ ] Cron jobs executing on schedule
- [ ] Edge function redirects working
- [ ] No errors in logs
- [ ] Analytics data flowing
- [ ] Performance within targets

### Ongoing Monitoring

- [ ] Daily log review
- [ ] Weekly performance review
- [ ] Monthly security audit
- [ ] Quarterly load testing
- [ ] Continuous error monitoring

## Performance Benchmarks

### API Response Times (p95)

```
/api/health: 50ms
/api/v1/domains: 300ms
/api/v1/listings: 400ms
/api/v1/hires: 500ms
/api/webhooks/stripe: 2000ms
```

### Edge Function Response Times (p95)

```
Redirect: 30ms (global average)
```

### Database Query Times (p95)

```
Simple SELECT: 10ms
JOIN queries: 50ms
Complex aggregations: 200ms
```

## Next Steps

1. Set up automated testing pipeline
2. Configure monitoring and alerts
3. Implement error tracking (Sentry)
4. Set up performance monitoring (Vercel Analytics)
5. Create runbook for common issues

