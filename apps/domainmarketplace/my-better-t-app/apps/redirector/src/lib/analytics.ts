import type { AnalyticsEngineDataset } from "@cloudflare/workers-types";

export interface ClickEvent {
  timestamp: number;
  host: string;
  path: string;
  routeId: string;
  rentalId: string;
  country: string;
  asn: string;
  botBucket: string;
  referrer: string;
  isInvalid: boolean;
}

export function logClick(
  dataset: AnalyticsEngineDataset,
  event: ClickEvent,
): void {
  const blobs = [
    event.host,
    event.path,
    event.routeId,
    event.rentalId,
    event.country,
    event.asn,
    event.botBucket,
    event.referrer,
  ];

  const doubles = [1, event.isInvalid ? 1 : 0];

  // Index clicks by timestamp for efficient time-series queries.
  dataset.writeDataPoint({
    blobs,
    doubles,
    indexes: [event.timestamp],
  });
}

export function extractReferrer(request: Request): string {
  const ref = request.headers.get("referer") || "";
  if (!ref) {
    return "direct";
  }

  try {
    const url = new URL(ref);
    return url.hostname || "direct";
  } catch (error) {
    return "unknown";
  }
}

export function normalizeCountry(country?: string): string {
  if (!country) {
    return "unknown";
  }
  return country.toLowerCase();
}
