import type { IncomingRequestCfProperties } from "@cloudflare/workers-types";

export type BotClassification =
  | "valid"
  | "tier_a_invalid"
  | "tier_b_suspected";

const DEFAULT_VERIFIED_BOTS = ["Google", "Bing", "LinkedIn", "Twitter", "Applebot", "Baidu", "Slackbot"];

function buildAllowlist(envValue?: string): Set<string> {
  const sources = envValue && envValue.trim().length > 0
    ? envValue.split(",").map((value) => value.trim())
    : DEFAULT_VERIFIED_BOTS;

  return new Set(sources.filter((value) => value.length > 0));
}

const USER_AGENT_PATTERNS: RegExp[] = [
  /headless/i,
  /puppeteer/i,
  /playwright/i,
  /selenium/i,
  /bot/i,
  /crawler/i,
  /spider/i,
  /httpclient/i,
];

const DATA_CENTER_ASNS = new Set([
  "8075", // Microsoft Azure
  "15169", // Google Cloud
  "16509", // AWS
  "13335", // Cloudflare
  "14618", // AWS legacy
  "20940", // Akamai
]);

export function classifyRequest(
  cf: IncomingRequestCfProperties | undefined,
  userAgent: string,
  allowlistValue?: string,
): BotClassification {
  const allowlist = buildAllowlist(allowlistValue);

  if (!cf || !cf.botManagement) {
    return "valid";
  }

  const { botManagement, asn } = cf;

  if (
    typeof botManagement.verifiedBot === "boolean" &&
    botManagement.verifiedBot
  ) {
    const brand = botManagement.verifiedBotCategory ?? "";
    if (!allowlist.has(brand)) {
      return "tier_b_suspected";
    }
  }

  if (typeof botManagement.score === "number") {
    if (botManagement.score <= 9) {
      return "tier_a_invalid";
    }
    if (botManagement.score <= 29) {
      return "tier_b_suspected";
    }
  }

  const normalizedUA = userAgent.toLowerCase();
  if (USER_AGENT_PATTERNS.some((pattern) => pattern.test(normalizedUA))) {
    return "tier_b_suspected";
  }

  if (asn && DATA_CENTER_ASNS.has(String(asn))) {
    return "tier_b_suspected";
  }

  return "valid";
}

export function getBotBucket(classification: BotClassification): string {
  switch (classification) {
    case "tier_a_invalid":
      return "tier_a";
    case "tier_b_suspected":
      return "tier_b";
    default:
      return "valid";
  }
}

export function isValidClick(classification: BotClassification): boolean {
  return classification === "valid";
}

