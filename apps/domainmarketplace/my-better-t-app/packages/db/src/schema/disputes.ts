import { createId } from "@paralleldrive/cuid2";
import { sql } from "drizzle-orm";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { check, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { user } from "./auth";
import { hires } from "./hires";

export const disputes = pgTable("disputes", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => createId()),
	hireId: text("hire_id").references(() => hires.id, {
		onDelete: "set null",
	}),
	claimantId: text("claimant_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	claimantRole: text("claimant_role").notNull(),
	reason: text("reason").notNull(),
	category: text("category"),
	status: text("status").notNull().default("open"),
	resolution: text("resolution"),
	creditAmountCents: integer("credit_amount_cents"),
	stripeReferenceId: text("stripe_reference_id"),
	resolvedAt: timestamp("resolved_at", { withTimezone: true }),
	resolvedBy: text("resolved_by").references(() => user.id, { onDelete: "set null" }),
	createdAt: timestamp("created_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date()),
}, (table) => ({
	claimantRoleCheck: check(
		"disputes_claimant_role_check",
		sql`${table.claimantRole} in ('owner', 'renter', 'hirer')`,
	),
	statusCheck: check(
		"disputes_status_check",
		sql`${table.status} in ('open', 'investigating', 'resolved', 'rejected')`,
	),
}));

export type Dispute = InferSelectModel<typeof disputes>;
export type NewDispute = InferInsertModel<typeof disputes>;

