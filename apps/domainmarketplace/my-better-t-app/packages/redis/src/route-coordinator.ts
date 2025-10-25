import { neon, drizzle, schema } from "@my-better-t-app/db";
import { routes, hires } from "@my-better-t-app/db/schema/hires";
import { listings } from "@my-better-t-app/db/schema/listings";
import { domains } from "@my-better-t-app/db/schema/domains";
import { eq } from "drizzle-orm";
import type { RedisClient } from "./index";

interface RouteRecord {
  id: string;
  hireId: string;
  host: string;
  path: string;
  targetUrl: string;
  redirectCode: number;
  baseDomain: string;
}

interface RouteMeta {
  host: string;
  path: string;
  hireId: string;
}

/**
 * Normalize host by removing port and converting to lowercase
 */
function normalizeHost(input: string): string {
  const colonIndex = input.indexOf(":");
  const host = colonIndex === -1 ? input : input.slice(0, colonIndex);
  return host.trim().toLowerCase();
}

/**
 * Normalize path by decoding URI and removing trailing slashes
 */
function normalizePath(input: string): string {
  try {
    const decoded = decodeURI(input);
    if (decoded === "" || decoded === "/") {
      return "/";
    }
    const normalized = decoded.replace(/\/+$/g, "");
    return normalized === "" ? "/" : normalized;
  } catch {
    const fallback = input || "/";
    const normalized = fallback.replace(/\/+$/g, "");
    return normalized === "" ? "/" : normalized;
  }
}

/**
 * Redis-backed RouteCoordinator service
 *
 * Replaces the Cloudflare Durable Object with Redis for route synchronization.
 * Maintains the same API interface as the original Durable Object.
 *
 * This service writes route data to Redis only, replacing the previous KV-based storage.
 *
 * Redis key patterns:
 * - `route:meta:{routeId}` - Route metadata (hash)
 * - `{normalizedHost}:{normalizedPath}` - Route data (string, JSON)
 */
export class RouteCoordinatorService {
  private db: ReturnType<typeof drizzle>;
  private redis: RedisClient;

  constructor(redisClient: RedisClient, databaseUrl: string) {
    this.redis = redisClient;
    const sql = neon(databaseUrl);
    this.db = drizzle(sql, { schema });
  }

  /**
   * Sync a route to Redis
   * 
   * @param routeId - Route ID to sync
   * @param previous - Previous route data (for invalidation)
   */
  async syncRoute(
    routeId: string,
    previous?: { host: string; path: string; hireId: string },
  ): Promise<void> {
    try {
      const route = await this.loadRoute(routeId);

      if (!route) {
        const fallback = previous ?? (await this.loadRouteMeta(routeId));
        if (fallback) {
          await this.invalidateRoute(
            fallback.host,
            fallback.path,
            fallback.hireId,
            routeId,
          );
        }
        return;
      }

      if (previous && (previous.host !== route.host || previous.path !== route.path)) {
        await this.invalidateRoute(previous.host, previous.path, previous.hireId, routeId);
      }

      await this.persistRoute(route);
    } catch (error) {
      console.error("RouteCoordinator syncRoute error:", error);
      throw error;
    }
  }

  /**
   * Sync all routes for a hire to Redis
   * 
   * @param hireId - Hire ID
   */
  async syncAllRoutes(hireId: string): Promise<void> {
    try {
      const allRoutes = await this.loadRoutesForHire(hireId);
      await Promise.all(allRoutes.map((route) => this.persistRoute(route)));
    } catch (error) {
      console.error("RouteCoordinator syncAllRoutes error:", error);
      throw error;
    }
  }

  /**
   * Invalidate a route in Redis (and optionally KV during migration)
   *
   * @param host - Route host
   * @param path - Route path
   * @param hireId - Hire ID
   * @param routeId - Optional route ID
   */
  async invalidateRoute(
    host: string,
    path: string,
    hireId: string,
    routeId?: string,
  ): Promise<void> {
    try {
      const fqdnKeys = await this.buildFqdnKeys(host, path, hireId);
      if (fqdnKeys.length > 0) {
        // Delete from Redis
        await Promise.all(fqdnKeys.map((key) => this.redis.del(key)));
      }

      if (routeId) {
        await this.deleteRouteMeta(routeId);
      }
    } catch (error) {
      console.error("RouteCoordinator invalidateRoute error:", error);
      throw error;
    }
  }

  /**
   * Persist route to Redis
   */
  private async persistRoute(route: RouteRecord): Promise<void> {
    const keys = await this.buildFqdnKeys(route.host, route.path, route.hireId, route.baseDomain);
    if (keys.length === 0) {
      await this.deleteRouteMeta(route.id);
      return;
    }

    // Include both rentalId (for backward compatibility) and hireId
    const value = JSON.stringify({
      targetUrl: route.targetUrl,
      redirectCode: route.redirectCode,
      rentalId: route.hireId, // Redirector expects rentalId
      hireId: route.hireId,   // Keep for future use
      routeId: route.id,
    });

    // Write route data to Redis
    await Promise.all(keys.map((key) => this.redis.set(key, value)));

    // Save route metadata
    await this.saveRouteMeta(route);
  }

  /**
   * Load route from PostgreSQL
   */
  private async loadRoute(routeId: string): Promise<RouteRecord | null> {
    const [record] = await this.db
      .select({
        id: routes.id,
        hireId: routes.hireId,
        host: routes.host,
        path: routes.path,
        targetUrl: routes.targetUrl,
        redirectCode: routes.redirectCode,
        baseDomain: domains.fqdn,
      })
      .from(routes)
      .innerJoin(hires, eq(routes.hireId, hires.id))
      .innerJoin(listings, eq(hires.listingId, listings.id))
      .innerJoin(domains, eq(listings.domainId, domains.id))
      .where(eq(routes.id, routeId))
      .limit(1);

    return record ?? null;
  }

  /**
   * Load all routes for a hire from PostgreSQL
   */
  private async loadRoutesForHire(hireId: string): Promise<RouteRecord[]> {
    const records = await this.db
      .select({
        id: routes.id,
        hireId: routes.hireId,
        host: routes.host,
        path: routes.path,
        targetUrl: routes.targetUrl,
        redirectCode: routes.redirectCode,
        baseDomain: domains.fqdn,
      })
      .from(routes)
      .innerJoin(hires, eq(routes.hireId, hires.id))
      .innerJoin(listings, eq(hires.listingId, listings.id))
      .innerJoin(domains, eq(listings.domainId, domains.id))
      .where(eq(routes.hireId, hireId));

    return records;
  }

  /**
   * Resolve base domain for a hire
   */
  private async resolveBaseDomain(hireId: string): Promise<string | null> {
    const [record] = await this.db
      .select({ baseDomain: domains.fqdn })
      .from(hires)
      .innerJoin(listings, eq(hires.listingId, listings.id))
      .innerJoin(domains, eq(listings.domainId, domains.id))
      .where(eq(hires.id, hireId))
      .limit(1);

    return record?.baseDomain ?? null;
  }

  /**
   * Build FQDN keys for Redis
   */
  private async buildFqdnKeys(
    host: string,
    path: string,
    hireId: string,
    baseDomain?: string,
  ): Promise<string[]> {
    const domain = baseDomain ?? (await this.resolveBaseDomain(hireId));
    if (!domain) {
      return [];
    }

    const fqdn = this.resolveFqdn(host, domain);
    return [this.getKvKey(fqdn, path)];
  }

  /**
   * Resolve FQDN from host and base domain
   */
  private resolveFqdn(host: string, baseDomain: string): string {
    if (host === "apex") {
      return baseDomain;
    }
    if (host === "www") {
      return `www.${baseDomain}`;
    }
    return `${host}.${baseDomain}`;
  }

  /**
   * Get KV-compatible key
   */
  private getKvKey(fqdn: string, path: string): string {
    const normalizedHost = normalizeHost(fqdn);
    const normalizedPath = normalizePath(path);
    return `${normalizedHost}:${normalizedPath}`;
  }

  /**
   * Get route metadata key
   */
  private routeMetaKey(routeId: string): string {
    return `route:meta:${routeId}`;
  }

  /**
   * Save route metadata to Redis
   */
  private async saveRouteMeta(route: RouteRecord): Promise<void> {
    const meta: RouteMeta = {
      host: route.host,
      path: route.path,
      hireId: route.hireId,
    };
    await this.redis.hSet(this.routeMetaKey(route.id), meta as unknown as Record<string, string>);
  }

  /**
   * Load route metadata from Redis
   */
  private async loadRouteMeta(routeId: string): Promise<RouteMeta | undefined> {
    const meta = await this.redis.hGetAll(this.routeMetaKey(routeId));
    if (!meta || Object.keys(meta).length === 0) {
      return undefined;
    }
    return meta as unknown as RouteMeta;
  }

  /**
   * Delete route metadata from Redis
   */
  private async deleteRouteMeta(routeId: string): Promise<void> {
    await this.redis.del(this.routeMetaKey(routeId));
  }
}

