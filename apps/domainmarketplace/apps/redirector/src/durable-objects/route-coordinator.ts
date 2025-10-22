import { DurableObject } from "cloudflare:workers";
import { db, routes, eq } from "@my-better-t-app/db";

import type { CloudflareBindings } from "../types/bindings";

interface RouteRecord {
  id: string;
  host: string;
  path: string;
  targetUrl: string;
  redirectCode: number;
  rentalId: string;
}

export class RouteCoordinator extends DurableObject<CloudflareBindings> {
  async syncRoute(routeId: string): Promise<void> {
    const [route] = await db
      .select()
      .from(routes)
      .where(eq(routes.id, routeId))
      .limit(1);

    if (!route) {
      return;
    }

    await this.persistRoute(route as RouteRecord);
  }

  async syncAllRoutes(rentalId: string): Promise<void> {
    const allRoutes = await db
      .select()
      .from(routes)
      .where(eq(routes.rentalId, rentalId));

    await Promise.all(allRoutes.map((route) => this.persistRoute(route as RouteRecord)));
  }

  async invalidateRoute(host: string, path: string): Promise<void> {
    const key = `${host}:${path}`;
    await this.env.ROUTES_KV.delete(key);
  }

  private async persistRoute(route: RouteRecord): Promise<void> {
    const key = `${route.host}:${route.path}`;
    const value = JSON.stringify({
      targetUrl: route.targetUrl,
      redirectCode: route.redirectCode,
      rentalId: route.rentalId,
      routeId: route.id,
    });

    await this.env.ROUTES_KV.put(key, value);
  }
}
