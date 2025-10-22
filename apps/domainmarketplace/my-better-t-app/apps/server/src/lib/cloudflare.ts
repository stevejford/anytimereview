import { env as runtimeEnv, type CloudflareBindings } from "cloudflare:workers";

const env = runtimeEnv as CloudflareBindings;

export interface CustomHostnameVerification {
	http_url?: string;
	cf_fallback_origin?: string;
	custom_origin_server?: string;
}

type VerificationMethod = "http" | "txt";

export class CloudflareApiError extends Error {
	status: number;
	responseBody: unknown;

	constructor(status: number, message: string, responseBody: unknown) {
		super(message);
		this.name = "CloudflareApiError";
		this.status = status;
		this.responseBody = responseBody;
	}
}

interface CloudflareResponse<T> {
	success: boolean;
	result: T;
	errors: Array<{ code: number; message: string }>;
}

interface ValidationRecords {
	txt_name?: string;
	txt_value?: string;
	http_url?: string;
	http_body?: string;
}

interface SSL {
	id: string;
	method: string;
	status: string;
}

interface CustomHostname {
	id: string;
	hostname: string;
	status: string;
	ssl: SSL;
	ownership_verification: {
		methods: Array<{
			method: VerificationMethod;
			type: "http" | "txt";
			http_url?: string;
			http_body?: string;
			txt_name?: string;
			txt_value?: string;
		}>;
	};
	verification_info?: ValidationRecords;
	custom_origin_server?: string;
}

export interface CreateCustomHostnameResult {
	requestId: string;
	verification: ValidationRecords;
	status: string;
	cnameTarget?: string;
}

export interface GetCustomHostnameStatusResult {
	status: string;
	sslStatus: string;
	verification: ValidationRecords;
	cnameTarget?: string;
}

const CLOUDFLARE_API_BASE = "https://api.cloudflare.com/client/v4";

async function cloudflareFetch<T>(
	input: Request | URL | string,
	init?: RequestInit,
) {
	const token = env.CLOUDFLARE_API_TOKEN;
	if (!token) {
		throw new Error("Cloudflare API token is not configured");
	}
	const request =
		typeof input === "string"
			? new Request(input, init)
			: input instanceof Request
				? input
				: new Request(input, init);
	const response = await fetch(request, {
		...init,
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${token}`,
			...(init?.headers ?? {}),
		},
	});
	const contentType = response.headers.get("content-type") ?? "";
	const raw = await response.text();
	const isJson = contentType.includes("application/json");
	const payload = isJson ? safeJsonParse(raw) : raw;
	if (!response.ok) {
		throw new CloudflareApiError(
			response.status,
			`Cloudflare API request failed with status ${response.status}`,
			payload,
		);
	}
	if (!isJson || payload === undefined) {
		throw new CloudflareApiError(
			502,
			"Cloudflare API returned an unexpected response format",
			raw,
		);
	}
	return payload as CloudflareResponse<T>;
}

function safeJsonParse(value: string) {
	try {
		return JSON.parse(value);
	} catch (error) {
		return undefined;
	}
}

export async function createCustomHostname(
	zoneId: string,
	hostname: string,
	method: VerificationMethod,
): Promise<CreateCustomHostnameResult> {
	const body: Record<string, unknown> = {
		hostname,
		ssl: {
			method,
			type: "dv",
			settings: {
				tls_1_2_only: false,
				min_tls_version: "1.0",
			},
		},
	};

	// Cloudflare expects the verification method to align between SSL verification
	// and ownership verification.
	body.ownership_verification = { method };

	if (!body.custom_origin_server && env.CLOUDFLARE_FALLBACK_ORIGIN) {
		body.custom_origin_server = env.CLOUDFLARE_FALLBACK_ORIGIN;
	}

	const response = await cloudflareFetch<CustomHostname>(
		`${CLOUDFLARE_API_BASE}/zones/${zoneId}/custom_hostnames`,
		{
			method: "POST",
			body: JSON.stringify(body),
		},
	);

	const verification = extractVerification(response.result);
	const cnameTarget =
		response.result.custom_origin_server || env.CLOUDFLARE_FALLBACK_ORIGIN || undefined;

	return {
		requestId: response.result.id,
		status: response.result.status,
		verification,
		cnameTarget,
	};
}

export async function getCustomHostnameStatus(
	zoneId: string,
	hostname: string,
): Promise<GetCustomHostnameStatusResult> {
	try {
		const response = await cloudflareFetch<CustomHostname[]>(
			`${CLOUDFLARE_API_BASE}/zones/${zoneId}/custom_hostnames?hostname=${encodeURIComponent(
				hostname,
			)}`,
		);
		const [result] = response.result;
		if (!result) {
			return {
				status: "pending",
				sslStatus: "unknown",
				verification: {},
			};
		}

		const verification = extractVerification(result);

		return {
			status: result.status,
			sslStatus: result.ssl?.status ?? "unknown",
			verification,
			cnameTarget:
				result.custom_origin_server || env.CLOUDFLARE_FALLBACK_ORIGIN || undefined,
		};
	} catch (error) {
		console.error("Error fetching Cloudflare custom hostname status", error);
		throw error;
	}
}

function extractVerification(hostname: CustomHostname): ValidationRecords {
	const records: ValidationRecords = {};

	const ownershipMethods = hostname.ownership_verification?.methods ?? [];
	for (const method of ownershipMethods) {
		if (method.method === "http") {
			records.http_url = method.http_url;
			records.http_body = method.http_body;
		}
		if (method.method === "txt") {
			records.txt_name = method.txt_name;
			records.txt_value = method.txt_value;
		}
	}

	if (hostname.verification_info) {
		records.txt_name = hostname.verification_info.txt_name ?? records.txt_name;
		records.txt_value = hostname.verification_info.txt_value ?? records.txt_value;
		records.http_url = hostname.verification_info.http_url ?? records.http_url;
		records.http_body = hostname.verification_info.http_body ?? records.http_body;
	}

	return records;
}

