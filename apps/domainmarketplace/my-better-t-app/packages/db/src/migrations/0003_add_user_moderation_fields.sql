-- Add moderation fields to user table
ALTER TABLE "user" ADD COLUMN "suspended" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "user" ADD COLUMN "suspended_at" TIMESTAMP WITH TIME ZONE;
ALTER TABLE "user" ADD COLUMN "suspended_reason" TEXT;
ALTER TABLE "user" ADD COLUMN "banned_at" TIMESTAMP WITH TIME ZONE;

-- Create index on suspended field for efficient filtering
CREATE INDEX "user_suspended_idx" ON "user" ("suspended");


