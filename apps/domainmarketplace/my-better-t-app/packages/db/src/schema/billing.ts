import { createId } from "@paralleldrive/cuid2";
import { sql } from "drizzle-orm";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
	boolean,
	check,
	date,
	index,
	integer,
	jsonb,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
} from "drizzle-orm/pg-core";

import { user } from "./auth";
import { hires } from "./hires";

export const invoices = pgTable("invoices", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => createId()),
	hireId: text("hire_id").references(() => hires.id, {
		onDelete: "set null",
	}),
	stripeInvoiceId: text("stripe_invoice_id").unique(),
	amountCents: integer("amount_cents").notNull(),
	type: text("type").notNull(),
	status: text("status").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date()),
}, (table) => ({
	typeCheck: check(
		"invoices_type_check",
		sql`${table.type} in ('period', 'usage')`,
	),
	statusCheck: check(
		"invoices_status_check",
		sql`${table.status} in ('draft', 'open', 'paid', 'void', 'uncollectible')`,
	),
	hireIdIdx: index("invoices_hire_id_idx").on(table.hireId),
}));

export type Invoice = InferSelectModel<typeof invoices>;
export type NewInvoice = InferInsertModel<typeof invoices>;

export const payouts = pgTable("payouts", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => createId()),
	ownerId: text("owner_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	amountCents: integer("amount_cents").notNull(),
	stripeTransferId: text("stripe_transfer_id").unique(),
	periodStart: timestamp("period_start", { withTimezone: true }),
	periodEnd: timestamp("period_end", { withTimezone: true }),
	status: text("status").notNull().default("pending"),
	createdAt: timestamp("created_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date()),
}, (table) => ({
	statusCheck: check(
		"payouts_status_check",
		sql`${table.status} in ('pending', 'paid', 'failed')`,
	),
	ownerIdIdx: index("payouts_owner_id_idx").on(table.ownerId),
}));

export type Payout = InferSelectModel<typeof payouts>;
export type NewPayout = InferInsertModel<typeof payouts>;

export const usageLedger = pgTable("usage_ledger", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => createId()),
	hireId: text("hire_id")
		.notNull()
		.references(() => hires.id, { onDelete: "cascade" }),
	subscriptionItemId: text("subscription_item_id").notNull(),
	day: date("day").notNull(),
	clicksSent: integer("clicks_sent").notNull(),
	idempotencyKey: text("idempotency_key").notNull().unique(),
	sentAt: timestamp("sent_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
	status: text("status").notNull().default("sent"),
}, (table) => ({
	statusCheck: check(
		"usage_ledger_status_check",
		sql`${table.status} in ('sent', 'failed', 'corrected')`,
	),
	subscriptionItemDayUnique: uniqueIndex("usage_ledger_subscription_item_day_unique").on(
		table.subscriptionItemId,
		table.day,
	),
	hireIdIdx: index("usage_ledger_hire_id_idx").on(table.hireId),
}));

export type UsageLedgerEntry = InferSelectModel<typeof usageLedger>;
export type NewUsageLedgerEntry = InferInsertModel<typeof usageLedger>;

export const stripeEvents = pgTable("stripe_events", {
	id: text("id").primaryKey(),
	type: text("type").notNull(),
	processed: boolean("processed").notNull().default(false),
	processedAt: timestamp("processed_at", { withTimezone: true }),
	createdAt: timestamp("created_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
	payload: jsonb("payload").notNull(),
}, (table) => ({
	typeProcessedIdx: index("stripe_events_type_processed_idx").on(
		table.type,
		table.processed,
	),
}));

export type StripeEventRecord = InferSelectModel<typeof stripeEvents>;
export type NewStripeEventRecord = InferInsertModel<typeof stripeEvents>;

