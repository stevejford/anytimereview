/// <reference types="@cloudflare/workers-types" />
export {};

/// <reference path="../worker-configuration.d.ts" />

declare module "cloudflare:workers" {
	interface CloudflareBindings extends Cloudflare.Env {
		CLOUDFLARE_API_TOKEN: string;
		CLOUDFLARE_ZONE_ID: string;
		CLOUDFLARE_FALLBACK_ORIGIN: string;
		CORS_ORIGIN: string;
		BETTER_AUTH_SECRET: string;
		BETTER_AUTH_URL: string;
		DATABASE_URL: string;
		CLERK_PUBLISHABLE_KEY: string;
		CLERK_SECRET_KEY: string;
		CLERK_WEBHOOK_SECRET: string;
	}

	const env: CloudflareBindings;

	export { env };
	export type { CloudflareBindings };
}

