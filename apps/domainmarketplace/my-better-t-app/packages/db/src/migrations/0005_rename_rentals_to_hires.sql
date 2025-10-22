-- Step 1: Drop dependent constraints and indexes
ALTER TABLE "click_rollups" DROP CONSTRAINT IF EXISTS "click_rollups_rental_id_rentals_id_fk";
ALTER TABLE "invoices" DROP CONSTRAINT IF EXISTS "invoices_rental_id_rentals_id_fk";
ALTER TABLE "usage_ledger" DROP CONSTRAINT IF EXISTS "usage_ledger_rental_id_rentals_id_fk";
ALTER TABLE "disputes" DROP CONSTRAINT IF EXISTS "disputes_rental_id_rentals_id_fk";
ALTER TABLE "routes" DROP CONSTRAINT IF EXISTS "routes_rental_id_rentals_id_fk";
--> statement-breakpoint
DROP INDEX IF EXISTS "click_rollups_rental_id_idx";
DROP INDEX IF EXISTS "invoices_rental_id_idx";
DROP INDEX IF EXISTS "usage_ledger_rental_id_idx";
DROP INDEX IF EXISTS "routes_rental_id_idx";
DROP INDEX IF EXISTS "routes_rental_host_path_unique";
DROP INDEX IF EXISTS "rentals_listing_id_idx";
DROP INDEX IF EXISTS "rentals_renter_id_idx";
DROP INDEX IF EXISTS "rentals_stripe_customer_id_idx";
--> statement-breakpoint
-- Defensive drop for routes unique constraint (in case it was created as constraint instead of index)
ALTER TABLE "routes" DROP CONSTRAINT IF EXISTS "routes_rental_host_path_unique";
--> statement-breakpoint
ALTER TABLE "rentals" DROP CONSTRAINT IF EXISTS "rentals_type_check";
ALTER TABLE "rentals" DROP CONSTRAINT IF EXISTS "rentals_status_check";
ALTER TABLE "disputes" DROP CONSTRAINT IF EXISTS "disputes_claimant_role_check";
ALTER TABLE "user" DROP CONSTRAINT IF EXISTS "user_role_check";
--> statement-breakpoint
DROP TRIGGER IF EXISTS "rentals_set_updated_at" ON "rentals";
--> statement-breakpoint
-- Step 1.5: Update existing data to use new enum values
UPDATE "user" SET "role" = 'hirer' WHERE "role" = 'renter';
UPDATE "disputes" SET "claimant_role" = 'hirer' WHERE "claimant_role" = 'renter';
--> statement-breakpoint
-- Step 2: Rename tables and columns
ALTER TABLE "rentals" RENAME TO "hires";
--> statement-breakpoint
ALTER TABLE "hires" RENAME COLUMN "renter_id" TO "hirer_id";
--> statement-breakpoint
ALTER TABLE "click_rollups" RENAME COLUMN "rental_id" TO "hire_id";
ALTER TABLE "invoices" RENAME COLUMN "rental_id" TO "hire_id";
ALTER TABLE "usage_ledger" RENAME COLUMN "rental_id" TO "hire_id";
ALTER TABLE "disputes" RENAME COLUMN "rental_id" TO "hire_id";
ALTER TABLE "routes" RENAME COLUMN "rental_id" TO "hire_id";
--> statement-breakpoint
-- Step 3: Recreate constraints with new names
ALTER TABLE "hires" ADD CONSTRAINT "hires_type_check" CHECK ("hires"."type" in ('period', 'per_click'));
ALTER TABLE "hires" ADD CONSTRAINT "hires_status_check" CHECK ("hires"."status" in ('active', 'ended', 'suspended'));
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_claimant_role_check" CHECK ("disputes"."claimant_role" in ('owner', 'hirer'));
ALTER TABLE "user" ADD CONSTRAINT "user_role_check" CHECK ("user"."role" in ('owner', 'hirer', 'admin'));
--> statement-breakpoint
-- Step 4: Recreate foreign key constraints
ALTER TABLE "click_rollups" ADD CONSTRAINT "click_rollups_hire_id_hires_id_fk" FOREIGN KEY ("hire_id") REFERENCES "public"."hires"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_hire_id_hires_id_fk" FOREIGN KEY ("hire_id") REFERENCES "public"."hires"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "usage_ledger" ADD CONSTRAINT "usage_ledger_hire_id_hires_id_fk" FOREIGN KEY ("hire_id") REFERENCES "public"."hires"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_hire_id_hires_id_fk" FOREIGN KEY ("hire_id") REFERENCES "public"."hires"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "routes" ADD CONSTRAINT "routes_hire_id_hires_id_fk" FOREIGN KEY ("hire_id") REFERENCES "public"."hires"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
-- Step 5: Recreate indexes with new names
CREATE INDEX "hires_listing_id_idx" ON "hires" USING btree ("listing_id");
CREATE INDEX "hires_hirer_id_idx" ON "hires" USING btree ("hirer_id");
CREATE INDEX "hires_stripe_customer_id_idx" ON "hires" USING btree ("stripe_customer_id");
CREATE INDEX "click_rollups_hire_id_idx" ON "click_rollups" USING btree ("hire_id");
CREATE INDEX "invoices_hire_id_idx" ON "invoices" USING btree ("hire_id");
CREATE INDEX "usage_ledger_hire_id_idx" ON "usage_ledger" USING btree ("hire_id");
CREATE INDEX "routes_hire_id_idx" ON "routes" USING btree ("hire_id");
CREATE UNIQUE INDEX "routes_hire_host_path_unique" ON "routes" USING btree ("hire_id","host","path");
--> statement-breakpoint
-- Step 6: Recreate trigger
CREATE TRIGGER "hires_set_updated_at"
	BEFORE UPDATE ON "hires"
	FOR EACH ROW
	EXECUTE FUNCTION set_updated_at();
--> statement-breakpoint
-- Step 7: Update user.role default value
ALTER TABLE "user" ALTER COLUMN "role" SET DEFAULT 'hirer';

