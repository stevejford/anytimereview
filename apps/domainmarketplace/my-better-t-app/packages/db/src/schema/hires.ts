import { createId } from "@paralleldrive/cuid2";
import { sql } from "drizzle-orm";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { check, index, integer, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

import { user } from "./auth";
import { listings } from "./listings";

export const hires = pgTable("hires", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => createId()),
	listingId: text("listing_id")
		.notNull()
		.references(() => listings.id, { onDelete: "cascade" }),
	hirerId: text("hirer_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	type: text("type").notNull(),
	status: text("status").notNull().default("active"),
	stripeCustomerId: text("stripe_customer_id"),
	stripeSubscriptionId: text("stripe_subscription_id"),
	stripeSubscriptionItemId: text("stripe_subscription_item_id"),
	startAt: timestamp("start_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
	endAt: timestamp("end_at", { withTimezone: true }),
	createdAt: timestamp("created_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date()),
}, (table) => ({
	typeCheck: check(
		"hires_type_check",
		sql`${table.type} in ('period', 'per_click')`,
	),
	statusCheck: check(
		"hires_status_check",
		sql`${table.status} in ('active', 'ended', 'suspended')`,
	),
	listingIdIdx: index("hires_listing_id_idx").on(table.listingId),
	hirerIdIdx: index("hires_hirer_id_idx").on(table.hirerId),
	stripeCustomerIdIdx: index("hires_stripe_customer_id_idx").on(
		table.stripeCustomerId,
	),
}));

export type Hire = InferSelectModel<typeof hires>;
export type NewHire = InferInsertModel<typeof hires>;

export const routes = pgTable("routes", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => createId()),
	hireId: text("hire_id")
		.notNull()
		.references(() => hires.id, { onDelete: "cascade" }),
	host: text("host").notNull(),
	path: text("path").notNull().default("/"),
	targetUrl: text("target_url").notNull(),
	redirectCode: integer("redirect_code").notNull().default(302),
	createdAt: timestamp("created_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date()),
}, (table) => ({
	redirectCodeCheck: check(
		"routes_redirect_code_check",
		sql`${table.redirectCode} in (301, 302, 307, 308)`
	),
	hireHostPathUnique: uniqueIndex("routes_hire_host_path_unique").on(
		table.hireId,
		table.host,
		table.path,
	),
	hireIdIdx: index("routes_hire_id_idx").on(table.hireId),
}));

export type Route = InferSelectModel<typeof routes>;
export type NewRoute = InferInsertModel<typeof routes>;

