import type { AnalyticsEngineDataset } from '@cloudflare/workers-types';

export interface CloudflareBindings {
  DATABASE_URL: string;
  CLICKS_AE?: AnalyticsEngineDataset;
  CLOUDFLARE_API_TOKEN?: string;
  CLOUDFLARE_ACCOUNT_ID?: string;
  CLICKS_DATASET_ID?: string;
}


