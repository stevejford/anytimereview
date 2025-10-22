const DOMAIN_CONNECT_PREFIX = "_domainconnect";

import { queryDnsRecords, stripWrappingQuotes } from "./dns";

export interface DomainConnectDiscoveryResult {
	supported: boolean;
	settingsUrl?: string;
	providerId?: string;
	serviceId?: string;
}

export async function discoverDomainConnectProvider(
	fqdn: string,
): Promise<DomainConnectDiscoveryResult> {
	const root = fqdn.replace(/\.$/, "");
	const lookupDomain = `${DOMAIN_CONNECT_PREFIX}.${root}`;
	try {
		const answers = await queryDnsRecords(lookupDomain, "TXT");
		for (const answer of answers) {
			const cleaned = stripWrappingQuotes(answer);
			const params = new URLSearchParams(
				cleaned.replace(/^v=domainconnect/, "").trim(),
			);
			const providerId = params.get("provider") ?? params.get("providerId");
			const serviceId = params.get("serviceId") ?? "DNS";
			if (providerId) {
				return {
					supported: true,
					providerId,
					serviceId,
					settingsUrl: generateDomainConnectRedirectUrl(
						fqdn,
						providerId,
						serviceId,
						"",
					),
				};
			}
		}
		return { supported: false };
	} catch (error) {
		console.warn("Domain Connect discovery failed", error);
		return { supported: false };
	}
}

export function generateDomainConnectRedirectUrl(
	fqdn: string,
	providerId: string,
	serviceId: string,
	returnUrl: string,
): string {
	const base = `https://domainconnect.${providerId}/v2/${providerId}/scripts/`;
	const url = new URL("templateRouter", base);
	url.searchParams.set("domain", fqdn);
	url.searchParams.set("provider", providerId);
	url.searchParams.set("serviceId", serviceId);
	if (returnUrl) {
		url.searchParams.set("return", returnUrl);
	}
	return url.toString();
}

