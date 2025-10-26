# Vercel Deployment Guide

Complete step-by-step guide for deploying the Domain Marketplace to Vercel.

## Prerequisites

Before deploying, ensure you have:

- [ ] Vercel account ([sign up](https://vercel.com/signup))
- [ ] Neon PostgreSQL database ([create](https://neon.tech))
- [ ] Upstash Redis instance ([create](https://upstash.com))
- [ ] Clerk account with application configured
- [ ] Stripe account with API keys
- [ ] Cloudflare account (for DNS management)
- [ ] Vercel CLI installed: `npm i -g vercel`

## Project Structure

Two Vercel projects are required:

1. **Web App** (`apps/domainmarketplace/web/`)
   - Next.js application with integrated API routes
   - Serverless functions for API endpoints
   - Vercel Cron jobs for scheduled tasks

2. **Redirector Edge** (`apps/domainmarketplace/redirector-edge/`)
   - Edge function for custom domain redirects
   - Global edge deployment for low latency

## Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

Verify installation:
```bash
vercel --version
```

## Step 2: Prepare Environment Variables

Create a `.env.production` file with all required variables:

```bash
# Database
DATABASE_URL=postgresql://user:pass@host/db

# Redis
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# Stripe Payments
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_CONNECT_CLIENT_ID=ca_...
STRIPE_PLATFORM_FEE_PERCENT=4

# Cloudflare (optional)
CLOUDFLARE_API_TOKEN=your-token
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_ZONE_ID=your-zone-id
CLOUDFLARE_FALLBACK_ORIGIN=https://yourdomain.com

# Cron Authentication
CRON_SECRET=your-random-secret

# App Configuration
CORS_ORIGIN=https://yourdomain.com
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

## Step 3: Deploy Web App

### 3.1 Navigate to Web Directory

```bash
cd apps/domainmarketplace/web
```

### 3.2 Link to Vercel Project

```bash
vercel link
```

Follow the prompts:
- **Set up and deploy**: Yes
- **Which scope**: Select your team/personal account
- **Link to existing project**: No (first time) or Yes (subsequent)
- **Project name**: domain-marketplace-web
- **Directory**: `./` (current directory)

### 3.3 Configure Project Settings

In Vercel Dashboard → Project Settings:

**Build & Development Settings**:
- Framework Preset: `Next.js`
- Build Command: `pnpm turbo build --filter=web`
- Output Directory: `.next`
- Install Command: `pnpm install`
- Root Directory: `apps/domainmarketplace/web`

**Environment Variables**:
Add all variables from `.env.production` (see Step 2)

### 3.4 Deploy to Production

```bash
vercel --prod
```

This will:
1. Build the Next.js application
2. Deploy to Vercel's global network
3. Return a production URL

## Step 4: Deploy Redirector Edge

### 4.1 Navigate to Redirector Directory

```bash
cd ../redirector-edge
```

### 4.2 Link to Vercel Project

```bash
vercel link
```

Follow the prompts:
- **Set up and deploy**: Yes
- **Which scope**: Select your team/personal account
- **Link to existing project**: No (first time) or Yes (subsequent)
- **Project name**: domain-marketplace-redirector
- **Directory**: `./` (current directory)

### 4.3 Configure Project Settings

In Vercel Dashboard → Project Settings:

**Build & Development Settings**:
- Framework Preset: `Other`
- Build Command: (leave empty)
- Output Directory: `api`
- Install Command: `pnpm install`
- Root Directory: `apps/domainmarketplace/redirector-edge`

**Environment Variables**:
```bash
DATABASE_URL=postgresql://...
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

### 4.4 Deploy to Production

```bash
vercel --prod
```

## Step 5: Install Vercel Integrations

### 5.1 Neon PostgreSQL Integration

1. Go to Vercel Dashboard → Integrations
2. Search for "Neon"
3. Click "Add Integration"
4. Select your projects (web and redirector)
5. Authorize Neon access
6. Link to your Neon database

This automatically injects `DATABASE_URL` into your projects.

### 5.2 Upstash Redis Integration

1. Go to Vercel Dashboard → Integrations
2. Search for "Upstash"
3. Click "Add Integration"
4. Select your projects (web and redirector)
5. Authorize Upstash access
6. Link to your Upstash Redis instance

This automatically injects `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.

## Step 6: Configure Custom Domains

### 6.1 Add Domain to Web App

1. Go to Vercel Dashboard → Web Project → Settings → Domains
2. Add your domain: `yourdomain.com`
3. Configure DNS records in Cloudflare:
   - Type: `A`
   - Name: `@`
   - Value: `76.76.21.21` (Vercel's IP)
   - Or use CNAME: `cname.vercel-dns.com`

### 6.2 Add Domain to Redirector

1. Go to Vercel Dashboard → Redirector Project → Settings → Domains
2. Add wildcard domain: `*.yourdomain.com`
3. Configure DNS records in Cloudflare:
   - Type: `CNAME`
   - Name: `*`
   - Value: `cname.vercel-dns.com`

## Step 7: Configure Vercel Cron

Cron jobs are configured in `web/vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/aggregator",
      "schedule": "0 * * * *"
    },
    {
      "path": "/api/cron/usage-reporter",
      "schedule": "0 0 * * *"
    }
  ]
}
```

Verify cron jobs in Vercel Dashboard → Web Project → Cron.

## Step 8: Test Deployment

### 8.1 Test API Routes

```bash
curl https://yourdomain.com/api/health
curl https://yourdomain.com/api/v1/domains
```

### 8.2 Test Webhooks

#### Stripe Webhooks

1. Install Stripe CLI: `brew install stripe/stripe-cli/stripe`
2. Login: `stripe login`
3. Forward webhooks:
   ```bash
   stripe listen --forward-to https://yourdomain.com/api/webhooks/stripe
   ```
4. Trigger test event:
   ```bash
   stripe trigger payment_intent.succeeded
   ```

#### Clerk Webhooks

1. Go to Clerk Dashboard → Webhooks
2. Add endpoint: `https://yourdomain.com/api/webhooks/clerk`
3. Select events: `user.created`, `user.updated`
4. Copy webhook secret to `CLERK_WEBHOOK_SECRET`

### 8.3 Test Cron Jobs

```bash
curl -H "Authorization: Bearer ${CRON_SECRET}" \
  https://yourdomain.com/api/cron/aggregator
```

### 8.4 Test Redirector

1. Create a test route in the database
2. Configure custom domain to point to redirector
3. Visit custom domain and verify redirect

## Step 9: Monitor Deployment

### 9.1 View Logs

```bash
vercel logs <deployment-url>
```

Or in Vercel Dashboard → Deployments → Logs

### 9.2 Monitor Cron Jobs

Vercel Dashboard → Web Project → Cron → View execution history

### 9.3 Check Analytics

Vercel Dashboard → Web Project → Analytics

## Step 10: Rollback (if needed)

If deployment fails or has issues:

### Option 1: Promote Previous Deployment

1. Go to Vercel Dashboard → Deployments
2. Find previous working deployment
3. Click "..." → "Promote to Production"

### Option 2: Redeploy

```bash
vercel --prod --force
```

## Environment Variables Reference

### Web App Required Variables

```bash
# Auto-injected by integrations
DATABASE_URL
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN

# Manual configuration
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
CLERK_WEBHOOK_SECRET
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_CONNECT_CLIENT_ID
STRIPE_PLATFORM_FEE_PERCENT
CRON_SECRET
NEXT_PUBLIC_APP_URL
```

### Redirector Edge Required Variables

```bash
# Auto-injected by integrations
DATABASE_URL
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
```

## Troubleshooting

### Build Failures

**Issue**: Build fails with module not found
**Solution**: Ensure all dependencies are in `package.json` and run `pnpm install`

**Issue**: Build timeout
**Solution**: Optimize build process or upgrade to Pro plan (longer timeout)

### Runtime Errors

**Issue**: Database connection fails
**Solution**: Verify `DATABASE_URL` is set and Neon integration is installed

**Issue**: Redis connection fails
**Solution**: Verify Upstash variables are set and integration is installed

### Webhook Failures

**Issue**: Stripe webhook signature verification fails
**Solution**: Verify `STRIPE_WEBHOOK_SECRET` matches Stripe Dashboard

**Issue**: Clerk webhook fails
**Solution**: Verify `CLERK_WEBHOOK_SECRET` matches Clerk Dashboard

## Best Practices

1. **Use Preview Deployments**: Test changes in preview before promoting to production
2. **Monitor Logs**: Regularly check logs for errors and warnings
3. **Set Up Alerts**: Configure Vercel alerts for deployment failures
4. **Use Environment Variables**: Never hardcode secrets in code
5. **Test Webhooks**: Always test webhooks with CLI tools before production
6. **Monitor Cron Jobs**: Verify cron jobs execute successfully
7. **Keep Dependencies Updated**: Regularly update dependencies for security

## Next Steps

1. Review `VERCEL_TESTING_GUIDE.md` for comprehensive testing procedures
2. Set up monitoring and alerts
3. Configure backup and disaster recovery
4. Document custom domain configuration
5. Train team on Vercel deployment workflow

