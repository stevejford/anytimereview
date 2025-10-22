import type {
	AnalyticsEngineDataset,
	DurableObjectNamespace,
	KVNamespace,
} from "@cloudflare/workers-types";

export interface CloudflareBindings {
	DATABASE_URL: string;
	VERIFIED_BOT_ALLOWLIST?: string;
	ROUTES_KV: KVNamespace;
	CLICKS_AE: AnalyticsEngineDataset;
	ROUTE_COORDINATOR: DurableObjectNamespace;
	CLICK_DEDUPLICATOR: DurableObjectNamespace;
}


