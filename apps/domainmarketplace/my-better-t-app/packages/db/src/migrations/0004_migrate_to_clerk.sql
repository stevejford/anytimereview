-- Migration: Better-Auth to Clerk
-- This migration removes Better-Auth specific tables and updates the user table for Clerk compatibility

-- Drop Better-Auth tables (these are managed externally by Clerk)
DROP TABLE IF EXISTS verification CASCADE;
DROP TABLE IF EXISTS account CASCADE;
DROP TABLE IF EXISTS session CASCADE;

-- Add Clerk timestamp fields to user table
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS clerk_created_at BIGINT;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS clerk_updated_at BIGINT;

-- Note: Existing user data migration
-- For production deployments, you should:
-- 1. Export existing users from the database
-- 2. Create corresponding users in Clerk via the Clerk API
-- 3. Update the user.id column with the new Clerk user IDs
-- 4. Update all foreign key references across the database
-- 
-- For development/MVP, it's recommended to start fresh with Clerk users.
-- Any existing users will need to re-register through Clerk.

-- The user table now uses Clerk user IDs (format: user_xxxxx)
-- All custom fields (role, Stripe Connect, moderation flags) are preserved

