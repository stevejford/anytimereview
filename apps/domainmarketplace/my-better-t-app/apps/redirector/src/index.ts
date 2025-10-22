import { Hono } from "hono";

import { logClick, extractReferrer, normalizeCountry } from "./lib/analytics";
import { classifyRequest, getBotBucket, isValidClick } from "./lib/bot-detection";
import {
  buildRedirectUrl,
  lookupRoute,
  normalizeHost,
  normalizePath,
} from "./lib/route-lookup";
import type { CloudflareBindings } from "./types/bindings";

const app = new Hono<{ Bindings: CloudflareBindings }>();

app.get("/health", (c) => c.text("ok"));

app.all("*", async (c) => {
  const url = new URL(c.req.url);
  const host = normalizeHost(c.req.header("host") || url.hostname);
  const rawPath = url.pathname || "/";
  const path = normalizePath(rawPath);
  const query = url.searchParams.toString();

  const route = await lookupRoute(c.env.ROUTES_KV, host, path);

  if (!route) {
    return c.json({ error: "Route not found" }, 404);
  }

  const cf = c.req.raw.cf ?? undefined;
  const userAgent = c.req.header("user-agent") || "";
  const ip = c.req.header("cf-connecting-ip") || "unknown";
  const classification = classifyRequest(cf, userAgent, c.env.VERIFIED_BOT_ALLOWLIST);
  const timestamp = Date.now();
  const botBucket = getBotBucket(classification);
  const country = normalizeCountry(cf?.country);
  const asn = cf?.asn ? String(cf.asn) : "unknown";
  const referrer = extractReferrer(c.req.raw);
  const baseInvalid = !isValidClick(classification);

  try {
    c.executionCtx.waitUntil(
      (async () => {
        let duplicate = false;

        try {
          const response = await c.env.CLICK_DEDUPLICATOR.fetch(
            `https://dedupe/${route.routeId}`,
            {
              method: "POST",
              headers: {
                "content-type": "application/json",
              },
              body: JSON.stringify({
                ip,
                userAgent,
              }),
            },
          );

          if (response.ok) {
            const payload = (await response.json()) as { duplicate?: boolean };
            duplicate = Boolean(payload.duplicate);
          } else {
            console.error("Click deduplication request failed", {
              routeId: route.routeId,
              status: response.status,
            });
          }
        } catch (error) {
          console.error("Click deduplication error", {
            routeId: route.routeId,
            error,
          });
        }

        try {
          logClick(c.env.CLICKS_AE, {
            timestamp,
            host,
            path,
            routeId: route.routeId,
            rentalId: route.rentalId,
            country,
            asn,
            botBucket,
            referrer,
            isInvalid: baseInvalid || duplicate,
          });
        } catch (error) {
          console.error("Click analytics logging error", {
            routeId: route.routeId,
            error,
          });
        }
      })(),
    );
  } catch (error) {
    console.error("Failed to schedule click processing", {
      routeId: route.routeId,
      error,
    });
  }

  const destination = buildRedirectUrl(route.targetUrl, query);
  return c.redirect(destination, route.redirectCode);
});

export default app;
export { RouteCoordinator } from "./durable-objects/route-coordinator";
export { ClickDeduplicator } from "./durable-objects/click-deduplicator";

