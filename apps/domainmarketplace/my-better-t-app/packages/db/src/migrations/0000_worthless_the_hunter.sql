CREATE TABLE "click_rollups" (
	"day" date NOT NULL,
	"rental_id" text NOT NULL,
	"valid_clicks" integer DEFAULT 0 NOT NULL,
	"invalid_clicks" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "click_rollups_pk" PRIMARY KEY("day","rental_id")
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"role" text DEFAULT 'renter' NOT NULL,
	"email_verified" boolean NOT NULL,
	"image" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email"),
	CONSTRAINT "user_role_check" CHECK ("user"."role" in ('owner', 'renter', 'admin'))
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" text PRIMARY KEY NOT NULL,
	"rental_id" text,
	"stripe_invoice_id" text,
	"amount_cents" integer NOT NULL,
	"type" text NOT NULL,
	"status" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invoices_stripe_invoice_id_unique" UNIQUE("stripe_invoice_id"),
	CONSTRAINT "invoices_type_check" CHECK ("invoices"."type" in ('period', 'usage')),
	CONSTRAINT "invoices_status_check" CHECK ("invoices"."status" in ('draft', 'open', 'paid', 'void', 'uncollectible'))
);
--> statement-breakpoint
CREATE TABLE "payouts" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_id" text NOT NULL,
	"amount_cents" integer NOT NULL,
	"stripe_transfer_id" text,
	"period_start" timestamp with time zone,
	"period_end" timestamp with time zone,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payouts_stripe_transfer_id_unique" UNIQUE("stripe_transfer_id"),
	CONSTRAINT "payouts_status_check" CHECK ("payouts"."status" in ('pending', 'paid', 'failed'))
);
--> statement-breakpoint
CREATE TABLE "disputes" (
	"id" text PRIMARY KEY NOT NULL,
	"rental_id" text,
	"claimant_id" text NOT NULL,
	"claimant_role" text NOT NULL,
	"reason" text NOT NULL,
	"category" text,
	"status" text DEFAULT 'open' NOT NULL,
	"resolution" text,
	"credit_amount_cents" integer,
	"resolved_at" timestamp with time zone,
	"resolved_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "disputes_claimant_role_check" CHECK ("disputes"."claimant_role" in ('owner', 'renter')),
	CONSTRAINT "disputes_status_check" CHECK ("disputes"."status" in ('open', 'investigating', 'resolved', 'rejected'))
);
--> statement-breakpoint
CREATE TABLE "domains" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_id" text NOT NULL,
	"fqdn" text NOT NULL,
	"verification_method" text,
	"verification_status" text DEFAULT 'pending' NOT NULL,
	"verified_at" timestamp with time zone,
	"onboarding_method" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "domains_fqdn_unique" UNIQUE("fqdn"),
	CONSTRAINT "domains_verification_method_check" CHECK ("domains"."verification_method" is null or "domains"."verification_method" in ('cf_saas', 'domain_connect', 'manual')),
	CONSTRAINT "domains_verification_status_check" CHECK ("domains"."verification_status" in ('pending', 'verified', 'failed')),
	CONSTRAINT "domains_verification_consistency_check" CHECK (("domains"."verification_status" <> 'verified') or ("domains"."verified_at" is not null and "domains"."verification_method" is not null))
);
--> statement-breakpoint
CREATE TABLE "listings" (
	"id" text PRIMARY KEY NOT NULL,
	"domain_id" text NOT NULL,
	"mode" text NOT NULL,
	"price_period_cents" integer,
	"price_click_cents" integer,
	"currency" text DEFAULT 'USD' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "listings_mode_check" CHECK ("listings"."mode" in ('exclusive', 'shared_slugs')),
	CONSTRAINT "listings_status_check" CHECK ("listings"."status" in ('draft', 'active', 'paused')),
	CONSTRAINT "listings_price_check" CHECK (("listings"."price_period_cents" is not null) or ("listings"."price_click_cents" is not null)),
	CONSTRAINT "listings_currency_check" CHECK ("listings"."currency" in ('USD', 'EUR', 'GBP'))
);
--> statement-breakpoint
CREATE TABLE "rentals" (
	"id" text PRIMARY KEY NOT NULL,
	"listing_id" text NOT NULL,
	"renter_id" text NOT NULL,
	"type" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"start_at" timestamp with time zone DEFAULT now() NOT NULL,
	"end_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rentals_type_check" CHECK ("rentals"."type" in ('period', 'per_click')),
	CONSTRAINT "rentals_status_check" CHECK ("rentals"."status" in ('active', 'ended', 'suspended'))
);
--> statement-breakpoint
CREATE TABLE "routes" (
	"id" text PRIMARY KEY NOT NULL,
	"rental_id" text NOT NULL,
	"host" text NOT NULL,
	"path" text DEFAULT '/' NOT NULL,
	"target_url" text NOT NULL,
	"redirect_code" integer DEFAULT 302 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "routes_redirect_code_check" CHECK ("routes"."redirect_code" in (301, 302, 307, 308))
);
--> statement-breakpoint
ALTER TABLE "click_rollups" ADD CONSTRAINT "click_rollups_rental_id_rentals_id_fk" FOREIGN KEY ("rental_id") REFERENCES "public"."rentals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_rental_id_rentals_id_fk" FOREIGN KEY ("rental_id") REFERENCES "public"."rentals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_rental_id_rentals_id_fk" FOREIGN KEY ("rental_id") REFERENCES "public"."rentals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_claimant_id_user_id_fk" FOREIGN KEY ("claimant_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_resolved_by_user_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "domains" ADD CONSTRAINT "domains_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_domain_id_domains_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."domains"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rentals" ADD CONSTRAINT "rentals_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rentals" ADD CONSTRAINT "rentals_renter_id_user_id_fk" FOREIGN KEY ("renter_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routes" ADD CONSTRAINT "routes_rental_id_rentals_id_fk" FOREIGN KEY ("rental_id") REFERENCES "public"."rentals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "click_rollups_rental_id_idx" ON "click_rollups" USING btree ("rental_id");--> statement-breakpoint
CREATE INDEX "click_rollups_day_idx" ON "click_rollups" USING btree ("day");--> statement-breakpoint
CREATE INDEX "invoices_rental_id_idx" ON "invoices" USING btree ("rental_id");--> statement-breakpoint
CREATE INDEX "payouts_owner_id_idx" ON "payouts" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "domains_owner_id_idx" ON "domains" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "listings_domain_id_idx" ON "listings" USING btree ("domain_id");--> statement-breakpoint
CREATE INDEX "listings_status_idx" ON "listings" USING btree ("status");--> statement-breakpoint
CREATE INDEX "rentals_listing_id_idx" ON "rentals" USING btree ("listing_id");--> statement-breakpoint
CREATE INDEX "rentals_renter_id_idx" ON "rentals" USING btree ("renter_id");--> statement-breakpoint
CREATE UNIQUE INDEX "routes_rental_host_path_unique" ON "routes" USING btree ("rental_id","host","path");--> statement-breakpoint
CREATE INDEX "routes_rental_id_idx" ON "routes" USING btree ("rental_id");
--> statement-breakpoint
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
	NEW."updated_at" = now();
	RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER "domains_set_updated_at"
	BEFORE UPDATE ON "domains"
	FOR EACH ROW
	EXECUTE FUNCTION set_updated_at();
--> statement-breakpoint
CREATE TRIGGER "listings_set_updated_at"
	BEFORE UPDATE ON "listings"
	FOR EACH ROW
	EXECUTE FUNCTION set_updated_at();
--> statement-breakpoint
CREATE TRIGGER "rentals_set_updated_at"
	BEFORE UPDATE ON "rentals"
	FOR EACH ROW
	EXECUTE FUNCTION set_updated_at();
--> statement-breakpoint
CREATE TRIGGER "routes_set_updated_at"
	BEFORE UPDATE ON "routes"
	FOR EACH ROW
	EXECUTE FUNCTION set_updated_at();
--> statement-breakpoint
CREATE TRIGGER "invoices_set_updated_at"
	BEFORE UPDATE ON "invoices"
	FOR EACH ROW
	EXECUTE FUNCTION set_updated_at();
--> statement-breakpoint
CREATE TRIGGER "payouts_set_updated_at"
	BEFORE UPDATE ON "payouts"
	FOR EACH ROW
	EXECUTE FUNCTION set_updated_at();
--> statement-breakpoint
CREATE TRIGGER "click_rollups_set_updated_at"
	BEFORE UPDATE ON "click_rollups"
	FOR EACH ROW
	EXECUTE FUNCTION set_updated_at();
--> statement-breakpoint
CREATE TRIGGER "disputes_set_updated_at"
	BEFORE UPDATE ON "disputes"
	FOR EACH ROW
	EXECUTE FUNCTION set_updated_at();