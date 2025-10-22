import { Hono, type Context } from "hono";
import { z } from "zod";

import { and, desc, eq, db } from "@my-better-t-app/db";
import { domains } from "@my-better-t-app/db/schema/domains";

import {
	authMiddleware,
	requireAuth,
	type AuthenticatedVariables,
} from "../middleware/auth";
import {
	checkDomainAvailability,
	normalizeDomain,
	validateFQDN,
} from "../lib/domain-validation";
import {
	CloudflareApiError,
	createCustomHostname,
	getCustomHostnameStatus,
} from "../lib/cloudflare";
import { queryDnsRecords, matchesExpectedCname } from "../lib/dns";
import {
	discoverDomainConnectProvider,
	generateDomainConnectRedirectUrl,
} from "../lib/domain-connect";
import type { CloudflareBindings } from "../types/bindings";

const createDomainSchema = z.object({
	fqdn: z.string(),
});

const verifyDomainSchema = z.object({
	method: z.enum(["cf_saas", "domain_connect", "manual"]),
	returnUrl: z.string().url().optional(),
});

function toResponse(domainRecord: typeof domains.$inferSelect) {
	return {
		id: domainRecord.id,
		fqdn: domainRecord.fqdn,
		verificationStatus: domainRecord.verificationStatus,
		verificationMethod: domainRecord.verificationMethod,
		verifiedAt: domainRecord.verifiedAt?.toISOString() ?? null,
		cnameTarget: domainRecord.cnameTarget ?? null,
	};
}

const router = new Hono<AuthenticatedVariables & { Bindings: CloudflareBindings }>();

router.use("*", authMiddleware);

router.post("/", requireAuth, async (c) => {
	const user = c.get("user")!;
	const body = await c.req.json().catch(() => ({}));
	const parsed = createDomainSchema.safeParse(body);
	if (!parsed.success) {
		return c.json({ error: "Invalid request" }, 400);
	}
	const normalized = normalizeDomain(parsed.data.fqdn);
	if (!validateFQDN(normalized)) {
		return c.json({ error: "Invalid domain name" }, 400);
	}
	const available = await checkDomainAvailability(normalized);
	if (!available) {
		return c.json({ error: "Domain already exists" }, 409);
	}
	const [newDomain] = await db
		.insert(domains)
		.values({
			ownerId: user.id,
			fqdn: normalized,
			verificationStatus: "pending",
		})
		.returning();
	if (!newDomain) {
		return c.json({ error: "Unable to create domain" }, 500);
	}
	return c.json(toResponse(newDomain), 201);
});

router.get("/", requireAuth, async (c) => {
	const user = c.get("user")!;
	const userDomains = await db
		.select()
		.from(domains)
		.where(eq(domains.ownerId, user.id))
		.orderBy(desc(domains.createdAt));
	return c.json(userDomains.map(toResponse));
});

router.get("/:id", requireAuth, async (c) => {
	const domainId = c.req.param("id");
	const user = c.get("user")!;
	const [domainRecord] = await db
		.select()
	.from(domains)
	.where(and(eq(domains.id, domainId), eq(domains.ownerId, user.id)))
		.limit(1);
	if (!domainRecord) {
		return c.json({ error: "Not Found" }, 404);
	}
	return c.json(toResponse(domainRecord));
});

router.post("/:id/verify", requireAuth, async (c) => {
	const domainId = c.req.param("id");
	const body = await c.req.json().catch(() => ({}));
	const parsed = verifyDomainSchema.safeParse(body);
	if (!parsed.success) {
		return c.json({ error: "Invalid request" }, 400);
	}
	const user = c.get("user")!;
	const [domainRecord] = await db
		.select()
		.from(domains)
		.where(and(eq(domains.id, domainId), eq(domains.ownerId, user.id)))
		.limit(1);
	if (!domainRecord) {
		return c.json({ error: "Not Found" }, 404);
	}
	if (domainRecord.verificationStatus === "verified") {
		return c.json({
			verificationMethod: domainRecord.verificationMethod,
			message: "Domain already verified",
		});
	}

	let responseBody: Record<string, unknown> = {};
	let statusCode = 202;
	let verificationMethod: string | null = parsed.data.method;

	switch (parsed.data.method) {
		case "cf_saas": {
			const zoneId = c.env.CLOUDFLARE_ZONE_ID;
			if (!zoneId) {
				return c.json({ error: "Cloudflare zone not configured" }, 500);
			}
			try {
				const result = await createCustomHostname(
					zoneId,
					domainRecord.fqdn,
					"txt",
				);
				responseBody = {
					verificationStatus: domainRecord.verificationStatus,
					txtRecord: result.verification.txt_name
						? {
							name: result.verification.txt_name,
							value: result.verification.txt_value,
						}
						: null,
					httpToken: result.verification.http_url
						? {
							url: result.verification.http_url,
							body: result.verification.http_body,
						}
						: null,
					cnameTarget:
						result.cnameTarget ?? env.CLOUDFLARE_FALLBACK_ORIGIN ?? null,
				};
				await db
					.update(domains)
					.set({
						verificationMethod: "cf_saas",
						cnameTarget: result.cnameTarget ?? null,
						updatedAt: new Date(),
					})
					.where(eq(domains.id, domainRecord.id));
			} catch (error) {
				return handleCloudflareError(c, error);
			}
			break;
		}
	case "domain_connect": {
		 const discovery = await discoverDomainConnectProvider(
			 domainRecord.fqdn,
		 );
		 if (!discovery.supported) {
			 return c.json(
				 { error: "Domain Connect not supported for this domain" },
				 400,
			 );
		 }
		const providerId = discovery.providerId ?? "";
		const serviceId = discovery.serviceId ?? "DNS";
		const redirectUrl = discovery.settingsUrl
			? discovery.settingsUrl
			: generateDomainConnectRedirectUrl(
					domainRecord.fqdn,
					providerId,
					serviceId,
					parsed.data.returnUrl ?? "",
			  );
		 responseBody = {
			 redirectUrl,
		 };
		 const updatePayload: {
			 verificationMethod: "domain_connect";
			 updatedAt: Date;
			 domainConnectProviderId?: string;
			 domainConnectServiceId?: string;
			 cnameTarget?: string | null;
		 } = {
			 verificationMethod: "domain_connect",
			 updatedAt: new Date(),
		 };
		 if (discovery.providerId && discovery.serviceId) {
			 updatePayload.domainConnectProviderId = discovery.providerId;
			 updatePayload.domainConnectServiceId = discovery.serviceId;
		 }
		 if (!domainRecord.cnameTarget && c.env.CLOUDFLARE_FALLBACK_ORIGIN) {
			 updatePayload.cnameTarget = c.env.CLOUDFLARE_FALLBACK_ORIGIN;
		 }
		 await db
			 .update(domains)
			 .set(updatePayload)
			 .where(eq(domains.id, domainRecord.id));
		 break;
	 }
		case "manual": {
			const zoneId = c.env.CLOUDFLARE_ZONE_ID;
			if (!zoneId) {
				return c.json({ error: "Cloudflare zone not configured" }, 500);
			}
			try {
				const result = await createCustomHostname(
					zoneId,
					domainRecord.fqdn,
					"txt",
				);
				responseBody = {
					instructions: {
						type: "dns",
						cnameTarget:
							result.cnameTarget ?? c.env.CLOUDFLARE_FALLBACK_ORIGIN ?? null,
					},
				};
				await db
					.update(domains)
					.set({
						verificationMethod: "manual",
						cnameTarget: result.cnameTarget ?? null,
						updatedAt: new Date(),
					})
					.where(eq(domains.id, domainRecord.id));
				statusCode = 200;
			} catch (error) {
				return handleCloudflareError(c, error);
			}
			break;
		}
		default: {
			verificationMethod = null;
			break;
		}
	}

return c.json(
	{
		verificationMethod,
		...responseBody,
	},
	{ status: statusCode as 200 | 202 }
);
});

router.get("/:id/status", requireAuth, async (c) => {
	const domainId = c.req.param("id");
	const user = c.get("user")!;
	const [domainRecord] = await db
		.select()
		.from(domains)
		.where(and(eq(domains.id, domainId), eq(domains.ownerId, user.id)))
		.limit(1);
	if (!domainRecord) {
		return c.json({ error: "Not Found" }, 404);
	}
	const zoneId = c.env.CLOUDFLARE_ZONE_ID;
	if (!zoneId) {
		return c.json({ error: "Cloudflare zone not configured" }, 500);
	}

	const now = new Date();

	if (domainRecord.verificationMethod === "cf_saas") {
		try {
			const status = await getCustomHostnameStatus(zoneId, domainRecord.fqdn);
			if (
				status.status === "active" &&
				domainRecord.verificationStatus !== "verified"
			) {
				const [updated] = await db
					.update(domains)
					.set({
						verificationStatus: "verified",
						verifiedAt: now,
						updatedAt: now,
					})
					.where(eq(domains.id, domainRecord.id))
					.returning();
				if (!updated) {
					return c.json({ error: "Unable to update domain" }, 500);
				}
				return c.json(toResponse(updated));
			}
			return c.json(toResponse(domainRecord));
		} catch (error) {
			console.error("Error checking Cloudflare custom hostname status", error);
			return c.json(toResponse(domainRecord));
		}
	}

	if (
		(domainRecord.verificationMethod === "manual" ||
			domainRecord.verificationMethod === "domain_connect") &&
		domainRecord.verificationStatus !== "verified"
	) {
		try {
			const expectedTarget = domainRecord.cnameTarget
				?? c.env.CLOUDFLARE_FALLBACK_ORIGIN
				?? null;
			if (!expectedTarget) {
				return c.json(toResponse(domainRecord));
			}
			const cnameRecords = await queryDnsRecords(domainRecord.fqdn, "CNAME");
			if (matchesExpectedCname(cnameRecords, expectedTarget)) {
				const [updated] = await db
					.update(domains)
					.set({
						verificationStatus: "verified",
						verifiedAt: now,
						updatedAt: now,
					})
					.where(eq(domains.id, domainRecord.id))
					.returning();
				if (!updated) {
					return c.json({ error: "Unable to update domain" }, 500);
				}
				return c.json(toResponse(updated));
			}
			return c.json(toResponse(domainRecord));
		} catch (error) {
			console.error("Error querying DNS records", error);
			return c.json(toResponse(domainRecord));
		}
	}

	return c.json(toResponse(domainRecord));
});

function toProblemJson({
	title,
	detail,
	status,
	code,
}: {
	title: string;
	detail?: string;
	status: number;
	code: string;
}) {
	return {
		type: undefined,
		title,
		detail,
		status,
		code,
	};
}

function handleCloudflareError(c: Context, error: unknown) {
	if (error instanceof CloudflareApiError) {
		const detail =
			typeof error.responseBody === "object" && error.responseBody !== null
				? JSON.stringify(error.responseBody)
				: String(error.responseBody ?? "");
		if (error.status === 409) {
			return c.json(
				toProblemJson({
					title: "Cloudflare hostname conflict",
					detail,
					status: 409,
					code: "CF_HOSTNAME_CONFLICT",
				}),
				409,
			);
		}
		if (error.status === 400) {
			return c.json(
				toProblemJson({
					title: "Cloudflare request rejected",
					detail,
					status: 400,
					code: "CF_BAD_REQUEST",
				}),
				400,
			);
		}
		return c.json(
			toProblemJson({
				title: "Cloudflare upstream error",
				detail,
				status: 502,
				code: "CF_UPSTREAM_ERROR",
			}),
			502,
		);
	}

	console.error("Unexpected Cloudflare integration error", error);
	return c.json(
		toProblemJson({
			title: "Internal Server Error",
			detail: "An unexpected error occurred during Cloudflare interaction.",
			status: 500,
			code: "INTERNAL_ERROR",
		}),
		500,
	);
}

export default router;

