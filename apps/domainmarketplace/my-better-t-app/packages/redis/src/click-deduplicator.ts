import type { RedisClient } from "./index";

/**
 * Build fingerprint from IP and user agent
 * 
 * @param ip - Client IP address
 * @param userAgent - Client user agent string
 * @returns Fingerprint string
 */
function fingerprint(ip: string, userAgent: string): string {
  return `${ip.trim().toLowerCase()}::${userAgent.trim().toLowerCase()}`;
}

/**
 * Build storage key for deduplication
 * 
 * @param routeId - Route ID
 * @param fp - Fingerprint string
 * @returns Redis key
 */
function buildStorageKey(routeId: string, fp: string): string {
  return `dedup:${routeId}:${fp}`;
}

/**
 * TTL for deduplication window (30 minutes in seconds)
 */
const TTL_SECONDS = 30 * 60; // 1800 seconds

/**
 * Redis-backed ClickDeduplicator service
 * 
 * Replaces the Cloudflare Durable Object with Redis for click deduplication.
 * Uses Redis TTL for automatic expiration (no need for alarm-based cleanup).
 * 
 * Deduplication window: 30 minutes
 * Fingerprinting strategy: IP address + User Agent (case-insensitive)
 * 
 * Redis key pattern: `dedup:{routeId}:{fingerprint}`
 * 
 * Fail-open strategy: If Redis operation fails, returns false (not duplicate)
 * to avoid blocking legitimate traffic.
 */
export class ClickDeduplicatorService {
  private redis: RedisClient;

  constructor(redisClient: RedisClient) {
    this.redis = redisClient;
  }

  /**
   * Check if a click is a duplicate
   * 
   * @param routeId - Route ID
   * @param ip - Client IP address
   * @param userAgent - Client user agent string
   * @returns true if duplicate, false if not duplicate
   */
  async checkDuplicate(
    routeId: string,
    ip: string,
    userAgent: string,
  ): Promise<boolean> {
    try {
      const fp = fingerprint(ip, userAgent);
      const key = buildStorageKey(routeId, fp);

      // Check if key exists
      const exists = await this.redis.exists(key);

      if (exists) {
        // Duplicate click
        return true;
      }

      // Not a duplicate - set key with TTL
      await this.redis.set(key, "1", {
        EX: TTL_SECONDS,
      });

      return false;
    } catch (error) {
      // Fail open - if Redis fails, treat as not duplicate
      // This prevents blocking legitimate traffic due to Redis issues
      console.error("ClickDeduplicator checkDuplicate error:", error);
      return false;
    }
  }
}

