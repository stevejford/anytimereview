import { DurableObject } from "cloudflare:workers";
import { neon, drizzle, schema } from "@my-better-t-app/db";
import { routes, hires } from "@my-better-t-app/db/schema/hires";
import { listings } from "@my-better-t-app/db/schema/listings";
import { domains } from "@my-better-t-app/db/schema/domains";
import { eq } from "drizzle-orm";

import { normalizeHost, normalizePath } from "../lib/route-lookup";
import type { CloudflareBindings } from "../types/bindings";

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

export class RouteCoordinator extends DurableObject<CloudflareBindings> {
  private db: ReturnType<typeof drizzle>;

  constructor(ctx: DurableObjectState, env: CloudflareBindings) {
    super(ctx, env);
    const sql = neon(env.DATABASE_URL);
    this.db = drizzle(sql, { schema });
  }

  async syncRoute(
    routeId: string,
    previous?: { host: string; path: string; hireId: string },
  ): Promise<void> {
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
  }

  async syncAllRoutes(hireId: string): Promise<void> {
    const allRoutes = await this.loadRoutesForHire(hireId);

    await Promise.all(allRoutes.map((route) => this.persistRoute(route)));
  }

  async invalidateRoute(
    host: string,
    path: string,
    hireId: string,
    routeId?: string,
  ): Promise<void> {
    const fqdnKeys = await this.buildFqdnKeys(host, path, hireId);
    if (fqdnKeys.length > 0) {
      await Promise.all(fqdnKeys.map((key) => this.env.ROUTES_KV.delete(key)));
    }

    if (routeId) {
      await this.deleteRouteMeta(routeId);
    }
  }

  private async persistRoute(route: RouteRecord): Promise<void> {
    const keys = await this.buildFqdnKeys(route.host, route.path, route.hireId, route.baseDomain);
    if (keys.length === 0) {
      await this.deleteRouteMeta(route.id);
      return;
    }

    const value = JSON.stringify({
      targetUrl: route.targetUrl,
      redirectCode: route.redirectCode,
      hireId: route.hireId,
      routeId: route.id,
    });

    await Promise.all(keys.map((key) => this.env.ROUTES_KV.put(key, value)));
    await this.saveRouteMeta(route);
  }

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

  private resolveFqdn(host: string, baseDomain: string): string {
    if (host === "apex") {
      return baseDomain;
    }
    if (host === "www") {
      return `www.${baseDomain}`;
    }
    return `${host}.${baseDomain}`;
  }

  private getKvKey(fqdn: string, path: string): string {
    const normalizedHost = normalizeHost(fqdn);
    const normalizedPath = normalizePath(path);
    return `${normalizedHost}:${normalizedPath}`;
  }

  private routeMetaKey(routeId: string): string {
    return `route:${routeId}`;
  }

  private async saveRouteMeta(route: RouteRecord): Promise<void> {
    const meta: RouteMeta = {
      host: route.host,
      path: route.path,
      hireId: route.hireId,
    };
    await this.state.storage.put(this.routeMetaKey(route.id), meta);
  }

  private async loadRouteMeta(routeId: string): Promise<RouteMeta | undefined> {
    return this.state.storage.get<RouteMeta>(this.routeMetaKey(routeId));
  }

  private async deleteRouteMeta(routeId: string): Promise<void> {
    await this.state.storage.delete(this.routeMetaKey(routeId));
  }
}
