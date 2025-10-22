import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import * as analyticsSchema from "./schema/analytics";
import * as authSchema from "./schema/auth";
import * as billingSchema from "./schema/billing";
import * as disputesSchema from "./schema/disputes";
import * as domainsSchema from "./schema/domains";
import * as listingsSchema from "./schema/listings";
import * as hiresSchema from "./schema/hires";

export const schema = {
	...authSchema,
	...domainsSchema,
	...listingsSchema,
	...hiresSchema,
	...billingSchema,
	...analyticsSchema,
	...disputesSchema,
};

// Only configure WebSocket for Node.js environments
// Workers use fetch-based pooling automatically
if (typeof process !== 'undefined' && process.versions?.node) {
	// Dynamic import to avoid bundling ws in Workers
	import('ws').then((wsModule) => {
		neonConfig.webSocketConstructor = wsModule.default;
	}).catch(() => {
		// Ignore if ws is not available
	});
}

neonConfig.poolQueryViaFetch = true;

// Get DATABASE_URL from environment at runtime
// This will work in both Node.js and Cloudflare Workers contexts
// In Workers, the DATABASE_URL should be passed via bindings and accessed through the app
const getDatabaseUrl = (): string => {
	if (typeof process !== 'undefined' && process.env?.DATABASE_URL) {
		return process.env.DATABASE_URL;
	}
	// Return empty string as fallback - consumers should provide DATABASE_URL
	return "";
};

const sql = neon(getDatabaseUrl());
/**
 * Pre-configured database instance for Node.js environments.
 * Uses process.env.DATABASE_URL.
 *
 * For Cloudflare Workers, create your own connection:
 * ```typescript
 * const sql = neon(env.DATABASE_URL);
 * const db = drizzle(sql, { schema });
 * ```
 */
export const db = drizzle(sql, { schema });

// Export utilities for creating custom connections in Workers
export { neon } from "@neondatabase/serverless";
export { drizzle } from "drizzle-orm/neon-http";

export * from "./schema/auth";
export * from "./schema/domains";
export * from "./schema/listings";
export * from "./schema/hires";
export * from "./schema/billing";
export * from "./schema/analytics";
export * from "./schema/disputes";
export { and, desc, eq, ilike, sql } from "drizzle-orm";
