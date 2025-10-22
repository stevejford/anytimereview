const CLOUDFLARE_DOH_ENDPOINT = "https://cloudflare-dns.com/dns-query";

export type DnsRecordType = "A" | "AAAA" | "CNAME" | "TXT";

interface DnsJsonAnswer {
	data: string;
}

interface DnsJsonResponse {
	Answer?: DnsJsonAnswer[];
}

export async function queryDnsRecords(
	name: string,
	type: DnsRecordType,
): Promise<string[]> {
	const endpoint = new URL(CLOUDFLARE_DOH_ENDPOINT);
	endpoint.searchParams.set("name", name);
	endpoint.searchParams.set("type", type);
	const response = await fetch(endpoint.toString(), {
		headers: {
			Accept: "application/dns-json",
		},
	});
	if (!response.ok) {
		throw new Error(
			`DNS query failed with status ${response.status} for ${name} (${type})`,
		);
	}
	const payload = (await response.json()) as DnsJsonResponse;
	return (payload.Answer ?? []).map((answer) => answer.data);
}

export function normalizeHostname(value: string): string {
	let host = value.trim().toLowerCase();
	if (host.startsWith("http://") || host.startsWith("https://")) {
		try {
			host = new URL(host).hostname;
		} catch (error) {
			// Ignore URL parsing errors and fall back to the original string
		}
	}
	host = stripWrappingQuotes(host);
	return host.replace(/\.$/, "");
}

export function stripWrappingQuotes(value: string): string {
	if (value.startsWith("\"") && value.endsWith("\"")) {
		return value.slice(1, -1);
	}
	return value;
}

export function normalizeDnsTarget(value: string): string {
	return normalizeHostname(value);
}

export function matchesExpectedCname(
	records: string[],
	expectedTarget?: string | null,
): boolean {
	if (!expectedTarget) {
		return false;
	}
	const normalizedExpected = normalizeDnsTarget(expectedTarget);
	return records.some(
		(record) => normalizeDnsTarget(record) === normalizedExpected,
	);
}

