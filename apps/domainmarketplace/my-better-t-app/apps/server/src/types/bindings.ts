import type { AnalyticsEngineDataset, DurableObjectNamespace } from "@cloudflare/workers-types";

export interface CloudflareBindings {
  DATABASE_URL: string;
  CORS_ORIGIN: string;
  CLERK_PUBLISHABLE_KEY: string;
  CLERK_SECRET_KEY: string;
  CLERK_WEBHOOK_SECRET: string;
  CLOUDFLARE_API_TOKEN?: string;
  CLOUDFLARE_ACCOUNT_ID?: string;
  CLICKS_DATASET_ID?: string;
  CLOUDFLARE_ZONE_ID: string;
  CLOUDFLARE_FALLBACK_ORIGIN: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  STRIPE_CONNECT_CLIENT_ID?: string;
  STRIPE_PLATFORM_FEE_PERCENT?: string;
  USAGE_REPORT_TOKEN?: string;
  ROUTE_COORDINATOR: DurableObjectNamespace;
  CLICKS_AE?: AnalyticsEngineDataset;
}

