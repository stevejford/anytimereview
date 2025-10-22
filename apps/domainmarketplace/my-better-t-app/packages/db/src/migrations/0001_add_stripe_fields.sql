ALTER TABLE "user"
ADD COLUMN "stripe_connect_account_id" text,
ADD COLUMN "stripe_connect_onboarding_complete" boolean DEFAULT false NOT NULL,
ADD COLUMN "stripe_connect_charges_enabled" boolean DEFAULT false NOT NULL,
ADD COLUMN "stripe_connect_payouts_enabled" boolean DEFAULT false NOT NULL;
ALTER TABLE "rentals"
ADD COLUMN "stripe_customer_id" text,
ADD COLUMN "stripe_subscription_id" text,
ADD COLUMN "stripe_subscription_item_id" text;
CREATE INDEX IF NOT EXISTS "rentals_stripe_customer_id_idx"
ON "rentals" ("stripe_customer_id");
CREATE TABLE IF NOT EXISTS "usage_ledger" (
  "id" text PRIMARY KEY,
  "rental_id" text NOT NULL REFERENCES "rentals"("id") ON DELETE CASCADE,
  "subscription_item_id" text NOT NULL,
  "day" date NOT NULL,
  "clicks_sent" integer NOT NULL,
  "idempotency_key" text NOT NULL UNIQUE,
  "sent_at" timestamp with time zone DEFAULT now() NOT NULL,
  "status" text DEFAULT 'sent' NOT NULL,
  CONSTRAINT "usage_ledger_status_check" CHECK ("status" IN ('sent','failed','corrected'))
);
CREATE UNIQUE INDEX IF NOT EXISTS "usage_ledger_subscription_item_day_unique"
ON "usage_ledger" ("subscription_item_id", "day");
CREATE INDEX IF NOT EXISTS "usage_ledger_rental_id_idx"
ON "usage_ledger" ("rental_id");
CREATE TABLE IF NOT EXISTS "stripe_events" (
  "id" text PRIMARY KEY,
  "type" text NOT NULL,
  "processed" boolean DEFAULT false NOT NULL,
  "processed_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "payload" jsonb NOT NULL
);
CREATE INDEX IF NOT EXISTS "stripe_events_type_processed_idx"
ON "stripe_events" ("type", "processed");

