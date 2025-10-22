import { db, eq } from "@my-better-t-app/db";
import { domains } from "@my-better-t-app/db/schema/domains";

const FQDN_REGEX =
	/^(?=.{1,253}$)(?!-)([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,63}$/i;

export function normalizeDomain(fqdn: string): string {
	return fqdn.trim().toLowerCase();
}

export function validateFQDN(fqdn: string): boolean {
	return FQDN_REGEX.test(normalizeDomain(fqdn));
}

export async function checkDomainAvailability(fqdn: string): Promise<boolean> {
	const normalized = normalizeDomain(fqdn);
	const existing = await db
		.select({ id: domains.id })
		.from(domains)
		.where(eq(domains.fqdn, normalized))
		.limit(1);
	return existing.length === 0;
}

