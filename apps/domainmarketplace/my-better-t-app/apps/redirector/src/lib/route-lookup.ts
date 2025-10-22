import type { KVNamespace } from "@cloudflare/workers-types";

export interface RouteData {
  targetUrl: string;
  redirectCode: number;
  rentalId: string;
  routeId: string;
}

function stripPort(host: string): string {
  const colonIndex = host.indexOf(":");
  if (colonIndex === -1) {
    return host;
  }
  return host.slice(0, colonIndex);
}

export function normalizeHost(input: string): string {
  return stripPort(input).trim().toLowerCase();
}

export function normalizePath(input: string): string {
  try {
    const decoded = decodeURI(input);
    if (decoded === "") {
      return "/";
    }
    if (decoded === "/") {
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

export async function lookupRoute(
  kv: KVNamespace,
  host: string,
  path: string,
): Promise<RouteData | null> {
  const normalizedHost = normalizeHost(host);
  const normalizedPath = normalizePath(path);

  const key = `${normalizedHost}:${normalizedPath}`;
  const exact = await kv.get<RouteData>(key, {
    type: "json",
  });
  if (exact) {
    return exact;
  }

  const rootKey = `${normalizedHost}:/`;
  const root = await kv.get<RouteData>(rootKey, {
    type: "json",
  });
  return root ?? null;
}

export function buildRedirectUrl(
  targetUrl: string,
  queryString: string,
): string {
  const url = new URL(targetUrl);

  if (queryString) {
    const incomingParams = new URLSearchParams(queryString);
    incomingParams.forEach((value, key) => {
      url.searchParams.append(key, value);
    });
  }

  return url.toString();
}
