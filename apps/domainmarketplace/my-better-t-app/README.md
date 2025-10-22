# my-better-t-app

This project was created with [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack), a modern TypeScript stack that combines Next.js, Hono, and more.

## Features

- **TypeScript** - For type safety and improved developer experience
- **Next.js** - Full-stack React framework
- **TailwindCSS** - Utility-first CSS for rapid UI development
- **shadcn/ui** - Reusable UI components
- **Hono** - Lightweight, performant server framework
- **workers** - Runtime environment
- **Drizzle** - TypeScript-first ORM
- **PostgreSQL** - Database engine
- **Authentication** - Clerk
- **Biome** - Linting and formatting
- **Husky** - Git hooks for code quality
- **Turborepo** - Optimized monorepo build system

## Getting Started

First, install the dependencies:

```bash
pnpm install
```

## Environment Setup

This project requires environment variables for both the frontend and backend applications.

### Frontend Environment (apps/web/.env)

Copy the template and configure your variables:
```bash
cp apps/web/env.template apps/web/.env
```

Key variables to configure:
- `NEXT_PUBLIC_SERVER_URL`: Your backend API URL (default: http://localhost:3000)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Your Stripe publishable key from [Stripe Dashboard → Developers → API keys](https://dashboard.stripe.com/test/apikeys)
  - Use test keys (`pk_test_...`) for development
  - Use live keys (`pk_live_...`) for production
  - This is required for the billing/payment form to initialize Stripe Elements
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Your Clerk publishable key from [Clerk Dashboard](https://dashboard.clerk.com)
- `CLERK_SECRET_KEY`: Your Clerk secret key (keep this secure!)
- `CLERK_WEBHOOK_SECRET`: Webhook signing secret for user sync from Clerk dashboard webhook configuration

### Backend Environment (apps/server/.env)

Copy the template and configure your variables:
```bash
cp apps/server/env.template apps/server/.env
```

Key variables to configure:
- `DATABASE_URL`: PostgreSQL connection string
- `CLERK_PUBLISHABLE_KEY`: Your Clerk publishable key from [Clerk Dashboard](https://dashboard.clerk.com)
- `CLERK_SECRET_KEY`: Your Clerk secret key
  - For production, set securely with: `wrangler secret put CLERK_SECRET_KEY`
- `CLERK_WEBHOOK_SECRET`: Webhook signing secret from Clerk dashboard
  - Create a webhook endpoint pointing to `/api/webhooks/clerk`
  - Configure these events: `user.created`, `user.updated`
  - For production, set securely with: `wrangler secret put CLERK_WEBHOOK_SECRET`
- `STRIPE_SECRET_KEY`: Your Stripe secret key from [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
  - Use test keys (`sk_test_...`) for development
  - For production, set securely with: `wrangler secret put STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`: Webhook signing secret from [Stripe Webhooks](https://dashboard.stripe.com/test/webhooks)
  - Create a webhook endpoint and configure these events:
    - `payment_intent.succeeded`
    - `payment_intent.payment_failed`
    - `customer.subscription.created`
    - `invoice.paid`
    - `charge.refunded`
- `STRIPE_PLATFORM_FEE_PERCENT`: Platform fee percentage (optional, defaults to 4%)

## Authentication Setup

This project uses Clerk for authentication:

1. Create a Clerk account at [clerk.com](https://clerk.com)
2. Create a new application in the Clerk dashboard
3. Copy the publishable and secret keys to your `.env` files (both web and server)
4. Configure a webhook endpoint pointing to `/api/webhooks/clerk`:
   - Use ngrok or similar for local development: `ngrok http 3001`
   - Configure the webhook to listen for `user.created` and `user.updated` events
   - Copy the webhook signing secret to your `.env` files as `CLERK_WEBHOOK_SECRET`

Note: Clerk will auto-generate development keys on first run, but production keys must be obtained from the Clerk dashboard.

## Database Setup

This project uses PostgreSQL with Drizzle ORM.

1. Make sure you have a PostgreSQL database set up.
2. Update your `apps/server/.env` and `apps/web/.env` files with your PostgreSQL connection details.

3. Apply the schema to your database:
```bash
pnpm db:push
```


Then, run the development server:

```bash
pnpm dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser to see the web application.
The API is running at [http://localhost:3000](http://localhost:3000).




## Before Deploying to Cloudflare

When you are ready to deploy your app to Cloudflare Workers:

1. Update your environment variables to match your `*.workers.dev` domains:

```bash
# apps/web/.env
NEXT_PUBLIC_SERVER_URL={your-production-server-domain}

# apps/server/.env (or via wrangler.jsonc)
CORS_ORIGIN={your-production-web-domain}
```

2. Set sensitive secrets using Wrangler:

```bash
cd apps/server
wrangler secret put CLERK_SECRET_KEY
wrangler secret put CLERK_WEBHOOK_SECRET
wrangler secret put STRIPE_SECRET_KEY
wrangler secret put STRIPE_WEBHOOK_SECRET
```

3. Update Clerk webhook endpoint:
   - In Clerk dashboard, update your webhook endpoint URL to point to your production domain: `https://{your-production-server-domain}/api/webhooks/clerk`
   - Ensure the webhook is configured for `user.created` and `user.updated` events

4. Update Clerk allowed origins:
   - In Clerk dashboard, add your production domains to the allowed origins list




## Deployment (Cloudflare Wrangler)
- Web deploy: cd apps/web && pnpm deploy
- Server dev: cd apps/server && pnpm dev
- Server deploy: cd apps/server && pnpm deploy


## Project Structure

```
my-better-t-app/
├── apps/
│   ├── web/         # Frontend application (Next.js)
│   │   └── README.md  # Detailed web app documentation
│   └── server/      # Backend API (Hono)
├── packages/
│   └── db/          # Database schema & queries
```

Note: Authentication is managed by Clerk, so there's no separate auth package. User data is synced to the local database via webhooks for foreign key relationships and custom fields (role, Stripe Connect IDs, moderation flags).

### Documentation

- **[Web Application Documentation](apps/web/README.md)** - Comprehensive guide covering:
  - Custom color palette and usage
  - Mode switching system (Browse vs Host)
  - Navigation architecture
  - Onboarding flow
  - Accessibility guidelines (WCAG 2.1 AA)
  - Development guidelines
  - Component usage examples
  - User flow diagrams

## Available Scripts

- `pnpm dev`: Start all applications in development mode
- `pnpm build`: Build all applications
- `pnpm dev:web`: Start only the web application
- `pnpm dev:server`: Start only the server
- `pnpm check-types`: Check TypeScript types across all apps
- `pnpm db:push`: Push schema changes to database
- `pnpm db:studio`: Open database studio UI
- `pnpm check`: Run Biome formatting and linting
