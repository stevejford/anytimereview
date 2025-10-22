import { sql } from "drizzle-orm";
import { bigint, boolean, check, index, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
	id: text("id").primaryKey(), // Clerk user ID (format: user_xxxxx)
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	role: text("role").notNull().default("hirer"),
	stripeConnectAccountId: text("stripe_connect_account_id"),
	stripeConnectOnboardingComplete: boolean("stripe_connect_onboarding_complete")
		.notNull()
		.default(false),
	stripeConnectChargesEnabled: boolean("stripe_connect_charges_enabled")
		.notNull()
		.default(false),
	stripeConnectPayoutsEnabled: boolean("stripe_connect_payouts_enabled")
		.notNull()
		.default(false),
	suspended: boolean("suspended").notNull().default(false),
	suspendedAt: timestamp("suspended_at", { withTimezone: true }),
	suspendedReason: text("suspended_reason"),
	bannedAt: timestamp("banned_at", { withTimezone: true }),
	emailVerified: boolean("email_verified").notNull(),
	image: text("image"),
	clerkCreatedAt: bigint("clerk_created_at", { mode: "number" }), // Clerk timestamp
	clerkUpdatedAt: bigint("clerk_updated_at", { mode: "number" }), // Clerk timestamp
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull(),
}, (table) => ({
	roleCheck: check(
		"user_role_check",
		sql`${table.role} in ('owner', 'hirer', 'admin')`,
	),
	suspendedIdx: index("user_suspended_idx").on(table.suspended),
}));
