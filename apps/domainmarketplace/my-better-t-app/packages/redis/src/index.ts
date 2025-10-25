import { createClient, type RedisClientType } from "redis";

export type RedisClient = RedisClientType;

export interface RedisConnectionOptions {
  url: string;
  maxRetries?: number;
  retryDelay?: number;
}

/**
 * Detect if running in Cloudflare Workers environment
 *
 * @returns true if running in Cloudflare Workers, false otherwise
 */
export function isCloudflareWorkers(): boolean {
  // Check for Cloudflare Workers-specific globals
  return typeof globalThis !== "undefined" &&
         (typeof (globalThis as any).caches !== "undefined" ||
          typeof (globalThis as any).EdgeRuntime !== "undefined");
}

/**
 * Get Redis URL from environment variables
 *
 * WARNING: Redis connections from Cloudflare Workers are NOT supported.
 * This function will throw an error if called from Workers environment.
 *
 * @throws Error if called from Cloudflare Workers
 * @throws Error if REDIS_URL is not set in production
 * @returns Redis connection URL
 */
export function getRedisUrl(): string {
  // Prevent Redis usage in Cloudflare Workers
  if (isCloudflareWorkers()) {
    throw new Error(
      "Redis connections are not supported in Cloudflare Workers environment. " +
      "Deploy to Railway/Node.js or use Durable Objects instead."
    );
  }

  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl && process.env.NODE_ENV === "production") {
    throw new Error("REDIS_URL environment variable is required in production");
  }

  return redisUrl || "redis://localhost:6379";
}

/**
 * Create and connect a Redis client
 * 
 * Usage in Cloudflare Workers:
 * ```typescript
 * const client = await createRedisClient(env.REDIS_URL);
 * ```
 * 
 * Usage in Node.js:
 * ```typescript
 * const client = await createRedisClient(process.env.REDIS_URL);
 * // or
 * const client = await createRedisClient(getRedisUrl());
 * ```
 * 
 * @param url - Redis connection URL (e.g., redis://localhost:6379)
 * @param options - Optional connection options
 * @returns Connected Redis client instance
 */
export async function createRedisClient(
  url: string,
  options: Partial<RedisConnectionOptions> = {}
): Promise<RedisClient> {
  const maxRetries = options.maxRetries ?? 3;
  const retryDelay = options.retryDelay ?? 50;

  const client = createClient({
    url,
    socket: {
      reconnectStrategy: (retries) => {
        if (retries > maxRetries) {
          console.error(`Redis connection failed after ${maxRetries} retries`);
          return new Error("Max retries reached");
        }
        
        // Exponential backoff: 50ms, 100ms, 200ms, 400ms, 800ms, max 5000ms
        const delay = Math.min(retryDelay * Math.pow(2, retries), 5000);
        console.log(`Redis reconnecting in ${delay}ms (attempt ${retries + 1}/${maxRetries})`);
        return delay;
      },
    },
  });

  // Connection event listeners
  client.on("connect", () => {
    console.log("Redis client connected");
  });

  client.on("error", (err) => {
    console.error("Redis client error:", err);
  });

  client.on("reconnecting", () => {
    console.log("Redis client reconnecting...");
  });

  // Connect to Redis
  await client.connect();

  return client as RedisClient;
}

// Re-export service classes
export { RouteCoordinatorService } from "./route-coordinator.js";
export { ClickDeduplicatorService } from "./click-deduplicator.js";

// Re-export HTTP client for Cloudflare Workers
export { HttpRedisClient, createHttpRedisClient, type HttpRedisClientConfig } from "./http-client.js";

