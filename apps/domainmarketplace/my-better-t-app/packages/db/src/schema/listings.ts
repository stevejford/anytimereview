import { createId } from "@paralleldrive/cuid2";
import { sql } from "drizzle-orm";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
	check,
	index,
	integer,
	pgTable,
	text,
	timestamp,
} from "drizzle-orm/pg-core";

import { domains } from "./domains";

export const listings = pgTable("listings", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => createId()),
	domainId: text("domain_id")
		.notNull()
		.references(() => domains.id, { onDelete: "cascade" }),
	mode: text("mode").notNull(),
	pricePeriodCents: integer("price_period_cents"),
	priceClickCents: integer("price_click_cents"),
	currency: text("currency").notNull().default("USD"),
	status: text("status").notNull().default("draft"),
	createdAt: timestamp("created_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date()),
}, (table) => ({
	modeCheck: check(
		"listings_mode_check",
		sql`${table.mode} in ('exclusive', 'shared_slugs')`,
	),
	statusCheck: check(
		"listings_status_check",
		sql`${table.status} in ('draft', 'active', 'paused')`,
	),
	priceCheck: check(
		"listings_price_check",
		sql`(${table.pricePeriodCents} is not null) or (${table.priceClickCents} is not null)`,
	),
	currencyCheck: check(
		"listings_currency_check",
		sql`${table.currency} in ('USD', 'EUR', 'GBP')`,
	),
	domainIdIdx: index("listings_domain_id_idx").on(table.domainId),
	statusIdx: index("listings_status_idx").on(table.status),
}));

export type Listing = InferSelectModel<typeof listings>;
export type NewListing = InferInsertModel<typeof listings>;

