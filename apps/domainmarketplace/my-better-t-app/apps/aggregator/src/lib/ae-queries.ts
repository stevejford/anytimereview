import type { AnalyticsEngineDataset } from '@cloudflare/workers-types';
import type { CloudflareBindings } from '../types/bindings';

const DATE_TIME_FORMAT = 'T00:00:00Z';

function sanitizeValue(value: string): string {
  return value.replace(/'/g, "''");
}

function formatTimestamp(date: string, endOfDay = false): string {
  return `${date}${endOfDay ? 'T23:59:59Z' : DATE_TIME_FORMAT}`;
}

export interface DailyRollup {
  rentalId: string;
  validClicks: number;
  invalidClicks: number;
}

export interface GeoBreakdown {
  country: string;
  clicks: number;
}

export interface ReferrerBreakdown {
  referrer: string;
  clicks: number;
}

export interface BotBreakdown {
  botBucket: string;
  clicks: number;
}

function parseNumber(value: unknown): number {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }
  throw new TypeError(`Unable to parse numeric value: ${value}`);
}

function parseString(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }
  throw new TypeError(`Expected string value but received: ${value}`);
}

async function runQuery<T>(
  bindings: CloudflareBindings,
  sql: string,
  parser: (row: Record<string, unknown>) => T,
): Promise<T[]> {
  const dataset = bindings.CLICKS_AE as AnalyticsEngineDataset | undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (dataset && typeof (dataset as any).query === 'function') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await (dataset as any).query(sql);
    if (!response.success) {
      throw new Error(`Analytics Engine query failed: ${response.errors?.join(', ') ?? 'unknown error'}`);
    }
    return response.rows.map((row: unknown) => parser(row as Record<string, unknown>));
  }

  if (!bindings.CLOUDFLARE_API_TOKEN || !bindings.CLOUDFLARE_ACCOUNT_ID) {
    throw new Error('Analytics Engine not configured: missing CLOUDFLARE_API_TOKEN or CLOUDFLARE_ACCOUNT_ID');
  }
  if (!bindings.CLICKS_DATASET_ID) {
    throw new Error('Analytics Engine not configured: missing CLICKS_DATASET_ID');
  }

  const url = `https://api.cloudflare.com/client/v4/accounts/${bindings.CLOUDFLARE_ACCOUNT_ID}/analytics_engine/sql`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${bindings.CLOUDFLARE_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ dataset: bindings.CLICKS_DATASET_ID, query: sql }),
  });

  if (!response.ok) {
    throw new Error(`Analytics Engine API request failed with status ${response.status}`);
  }

  const result = (await response.json()) as {
    result?: Array<Record<string, unknown>>;
    errors?: Array<{ message: string }>;
  };

  if (result.errors?.length) {
    throw new Error(`Analytics Engine API error: ${result.errors.map((error) => error.message).join(', ')}`);
  }

  return (result.result ?? []).map((row) => parser(row));
}

export async function queryDailyRollups(
  bindings: CloudflareBindings,
  date: string,
): Promise<DailyRollup[]> {
  const sanitizedDate = sanitizeValue(date);
  const sql = `
    SELECT
      blob4 AS rentalId,
      SUM(_sample_interval * (1 - double2)) AS validClicks,
      SUM(_sample_interval * double2) AS invalidClicks
    FROM clicks
    WHERE toStartOfInterval(timestamp, INTERVAL '1' DAY) = TIMESTAMP '${sanitizedDate}${DATE_TIME_FORMAT}'
    GROUP BY rentalId
    ORDER BY rentalId
  `;

  return runQuery(bindings, sql, (row) => ({
    rentalId: parseString(row.rentalId),
    validClicks: parseNumber(row.validclicks ?? row.validClicks),
    invalidClicks: parseNumber(row.invalidclicks ?? row.invalidClicks),
  }));
}

export async function queryGeoBreakdown(
  bindings: CloudflareBindings,
  rentalId: string,
  startDate: string,
  endDate: string,
): Promise<GeoBreakdown[]> {
  const sanitizedRentalId = sanitizeValue(rentalId);
  const sql = `
    SELECT
      blob5 AS country,
      SUM(_sample_interval) AS clicks
    FROM clicks
    WHERE blob4 = '${sanitizedRentalId}'
      AND timestamp BETWEEN TIMESTAMP '${formatTimestamp(startDate)}' AND TIMESTAMP '${formatTimestamp(endDate, true)}'
    GROUP BY country
    ORDER BY clicks DESC
    LIMIT 50
  `;

  return runQuery(bindings, sql, (row) => ({
    country: parseString(row.country),
    clicks: parseNumber(row.clicks),
  }));
}

export async function queryReferrerBreakdown(
  bindings: CloudflareBindings,
  rentalId: string,
  startDate: string,
  endDate: string,
): Promise<ReferrerBreakdown[]> {
  const sanitizedRentalId = sanitizeValue(rentalId);
  const sql = `
    SELECT
      blob8 AS referrer,
      SUM(_sample_interval) AS clicks
    FROM clicks
    WHERE blob4 = '${sanitizedRentalId}'
      AND timestamp BETWEEN TIMESTAMP '${formatTimestamp(startDate)}' AND TIMESTAMP '${formatTimestamp(endDate, true)}'
    GROUP BY referrer
    ORDER BY clicks DESC
    LIMIT 50
  `;

  return runQuery(bindings, sql, (row) => ({
    referrer: parseString(row.referrer),
    clicks: parseNumber(row.clicks),
  }));
}

export async function queryBotBreakdown(
  bindings: CloudflareBindings,
  rentalId: string,
  startDate: string,
  endDate: string,
): Promise<BotBreakdown[]> {
  const sanitizedRentalId = sanitizeValue(rentalId);
  const sql = `
    SELECT
      blob7 AS botBucket,
      SUM(_sample_interval) AS clicks
    FROM clicks
    WHERE blob4 = '${sanitizedRentalId}'
      AND timestamp BETWEEN TIMESTAMP '${formatTimestamp(startDate)}' AND TIMESTAMP '${formatTimestamp(endDate, true)}'
    GROUP BY botBucket
    ORDER BY clicks DESC
    LIMIT 50
  `;

  return runQuery(bindings, sql, (row) => ({
    botBucket: parseString(row.botbucket ?? row.botBucket),
    clicks: parseNumber(row.clicks),
  }));
}

export async function queryTimeSeriesData(
  bindings: CloudflareBindings,
  rentalId: string,
  startDate: string,
  endDate: string,
): Promise<Array<{ date: string; validClicks: number; invalidClicks: number }>> {
  const sanitizedRentalId = sanitizeValue(rentalId);
  const sql = `
    SELECT
      toStartOfInterval(timestamp, INTERVAL '1' DAY) AS day,
      SUM(_sample_interval * (1 - double2)) AS validClicks,
      SUM(_sample_interval * double2) AS invalidClicks
    FROM clicks
    WHERE blob4 = '${sanitizedRentalId}'
      AND timestamp BETWEEN TIMESTAMP '${formatTimestamp(startDate)}' AND TIMESTAMP '${formatTimestamp(endDate, true)}'
    GROUP BY day
    ORDER BY day ASC
  `;

  return runQuery(bindings, sql, (row) => ({
    date: parseString(row.day),
    validClicks: parseNumber(row.validclicks ?? row.validClicks),
    invalidClicks: parseNumber(row.invalidclicks ?? row.invalidClicks),
  }));
}


