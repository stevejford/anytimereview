import { createId } from "@paralleldrive/cuid2";
import { sql } from "drizzle-orm";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { check, index, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { user } from "./auth";

export const domains = pgTable("domains", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => createId()),
	ownerId: text("owner_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	fqdn: text("fqdn").notNull().unique(),
	verificationMethod: text("verification_method"),
	verificationStatus: text("verification_status").notNull().default("pending"),
	verifiedAt: timestamp("verified_at", { withTimezone: true }),
	onboardingMethod: text("onboarding_method"),
	cnameTarget: text("cname_target"),
	domainConnectProviderId: text("domain_connect_provider_id"),
	domainConnectServiceId: text("domain_connect_service_id"),
	createdAt: timestamp("created_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date()),
}, (table) => ({
	verificationMethodCheck: check(
		"domains_verification_method_check",
		sql`${table.verificationMethod} is null or ${table.verificationMethod} in ('cf_saas', 'domain_connect', 'manual')`,
	),
	verificationStatusCheck: check(
		"domains_verification_status_check",
		sql`${table.verificationStatus} in ('pending', 'verified', 'failed')`,
	),
	verificationConsistencyCheck: check(
		"domains_verification_consistency_check",
		sql`(${table.verificationStatus} <> 'verified') or (${table.verifiedAt} is not null and ${table.verificationMethod} is not null)`
	),
	ownerIdIdx: index("domains_owner_id_idx").on(table.ownerId),
}));

export type Domain = InferSelectModel<typeof domains>;
export type NewDomain = InferInsertModel<typeof domains>;

