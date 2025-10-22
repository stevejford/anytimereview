const HTTP_PROTOCOLS = new Set(["http:", "https:"]);

export function isValidRedirectUrl(url: string): boolean {
	try {
		const parsed = new URL(url.trim());
		return HTTP_PROTOCOLS.has(parsed.protocol);
	} catch {
		return false;
	}
}

export function normalizeUrl(url: string): string {
	const trimmed = url.trim();
	const parsed = new URL(trimmed);
	if (!HTTP_PROTOCOLS.has(parsed.protocol)) {
		throw new Error("Target URL must use http or https");
	}
	return parsed.toString();
}




