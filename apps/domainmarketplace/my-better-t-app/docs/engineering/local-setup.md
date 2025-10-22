# Local Development Setup

This guide walks you through setting up the HireADomain marketplace for local development.

## Prerequisites

- Node.js 20+ and pnpm
- PostgreSQL database (local or cloud)
- Clerk account for authentication
- Stripe account for payments
- (Optional) Cloudflare account for domain verification

## Step-by-Step Setup

### 1. Clone and Install Dependencies

```bash
cd my-better-t-app
pnpm install
```

### 2. Set Up Clerk Authentication

1. **Create Clerk Application**
   - Go to [clerk.com](https://clerk.com) and create an account
   - Create a new application
   - Copy your Publishable Key and Secret Key

2. **Configure Environment Variables**

Create `apps/web/.env`:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/domainmarketplace
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

Create `apps/server/.env`:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/domainmarketplace
CORS_ORIGIN=http://localhost:3001
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PLATFORM_FEE_PERCENT=4
```

3. **Set Up Webhook for User Sync**

For local development, use ngrok to expose your local server:
```bash
ngrok http 3001
```

In Clerk dashboard:
- Go to Webhooks → Add Endpoint
- Enter your ngrok URL + `/api/webhooks/clerk` (e.g., `https://abc123.ngrok.io/api/webhooks/clerk`)
- Select events: `user.created`, `user.updated`
- Copy the signing secret to `CLERK_WEBHOOK_SECRET` in both `.env` files

### 3. Set Up Database

1. **Create PostgreSQL Database**
```bash
createdb domainmarketplace
```

2. **Apply Database Schema**
```bash
pnpm db:push
```

This will create all necessary tables including the user table that syncs with Clerk.

### 4. Set Up Stripe

1. **Get Stripe Keys**
   - Go to [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
   - Copy your Publishable Key and Secret Key (use test mode keys)

2. **Configure Stripe Webhook**
   - Go to [Stripe Webhooks](https://dashboard.stripe.com/test/webhooks)
   - Add endpoint: `http://localhost:3000/api/webhooks/stripe` (or use ngrok URL)
   - Select events:
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
     - `customer.subscription.created`
     - `invoice.paid`
     - `charge.refunded`
   - Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

### 5. Start Development Servers

```bash
# Start all services (web + server)
pnpm dev

# Or start individually:
pnpm dev:web    # Next.js on http://localhost:3001
pnpm dev:server # Hono API on http://localhost:3000
```

### 6. Verify Setup

1. **Test Authentication**
   - Navigate to `http://localhost:3001/sign-up`
   - Create a new account
   - Check that the user appears in your database `user` table
   - Try signing out and signing back in

2. **Test API Authentication**
   - After signing in, navigate to `http://localhost:3001/dashboard`
   - The page should load without errors
   - Check browser DevTools network tab for successful API calls

## Troubleshooting

### Clerk Webhook Not Triggering

**Symptoms**: User can sign up in Clerk but doesn't appear in local database

**Solutions**:
1. Verify ngrok is running and URL is correct in Clerk dashboard
2. Check Clerk dashboard → Webhooks → Recent Requests for errors
3. Verify `CLERK_WEBHOOK_SECRET` matches in both `.env` files
4. Check server logs for webhook verification errors

### User Role Not Appearing

**Symptoms**: User `publicMetadata.role` is undefined

**Solution**: Clerk doesn't set custom metadata by default. For development, you can:
1. Use Clerk dashboard → Users → Select user → Metadata → Public metadata
2. Add: `{ "role": "hirer" }` (or "owner" / "admin")
3. Or set it programmatically after user creation

### Stripe Webhook Verification Fails

**Symptoms**: `Invalid signature` errors in server logs

**Solutions**:
1. Verify `STRIPE_WEBHOOK_SECRET` matches the signing secret from Stripe dashboard
2. Use Stripe CLI for local testing: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
3. Check that webhook endpoint is receiving raw body (not parsed JSON)

### Database Connection Issues

**Symptoms**: `relation "user" does not exist` or connection errors

**Solutions**:
1. Verify `DATABASE_URL` is correct in both `.env` files
2. Run `pnpm db:push` to ensure schema is applied
3. Check PostgreSQL is running: `pg_isready`
4. Verify database exists: `psql -l | grep domainmarketplace`

## Development Workflow

1. **Making Schema Changes**
   ```bash
   # Edit packages/db/src/schema/*.ts
   pnpm db:push  # Apply changes to database
   ```

2. **Viewing Database**
   ```bash
   pnpm db:studio  # Opens Drizzle Studio
   ```

3. **Running Type Checks**
   ```bash
   pnpm check-types
   ```

4. **Linting and Formatting**
   ```bash
   pnpm check
   ```

## Next Steps

- **Add Admin Role**: Update a user's role to "admin" in Clerk metadata to access admin features
- **Configure Cloudflare**: Set up Cloudflare API tokens for domain verification (optional for MVP)
- **Test Payments**: Use Stripe test cards to verify payment flow
- **Explore API**: Check `apps/web/src/lib/api-client.ts` for available API methods

## Architecture Notes

- **Authentication Flow**: Clerk manages sessions → Next.js middleware validates → Hono API validates and fetches user from DB
- **User Sync**: Clerk webhooks create/update users in local database for foreign keys and custom fields
- **API Authentication**: Uses `@hono/clerk-auth` to validate Clerk JWTs and fetch user data from local DB
- **Database**: Local user table stores custom fields (role, Stripe Connect IDs, moderation flags) synced from Clerk

