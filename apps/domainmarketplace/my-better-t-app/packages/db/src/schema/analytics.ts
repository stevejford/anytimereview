import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { date, index, integer, pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";

import { hires } from "./hires";

export const clickRollups = pgTable(
	"click_rollups",
	{
		day: date("day").notNull(),
		hireId: text("hire_id")
			.notNull()
			.references(() => hires.id, { onDelete: "cascade" }),
		validClicks: integer("valid_clicks").notNull().default(0),
		invalidClicks: integer("invalid_clicks").notNull().default(0),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => ({
		pk: primaryKey({ name: "click_rollups_pk", columns: [table.day, table.hireId] }),
		hireIdIdx: index("click_rollups_hire_id_idx").on(table.hireId),
		dayIdx: index("click_rollups_day_idx").on(table.day),
	})
);

export type ClickRollup = InferSelectModel<typeof clickRollups>;
export type NewClickRollup = InferInsertModel<typeof clickRollups>;

