import type {
  AnalyticsEngineDataset,
  DurableObjectNamespace,
  KVNamespace,
} from "@cloudflare/workers-types";

export interface CloudflareBindings {
  DATABASE_URL: string;
  ROUTES_KV: KVNamespace;
  CLICKS_AE: AnalyticsEngineDataset;
  ROUTE_COORDINATOR: DurableObjectNamespace;
}


