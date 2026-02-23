-- Migration to add missing profile fields to amz_users
ALTER TABLE "amz_users" ADD COLUMN IF NOT EXISTS "full_name" text;
ALTER TABLE "amz_users" ADD COLUMN IF NOT EXISTS "profile_image" text;
ALTER TABLE "amz_users" ADD COLUMN IF NOT EXISTS "address_street" text;
ALTER TABLE "amz_users" ADD COLUMN IF NOT EXISTS "address_city" text;
ALTER TABLE "amz_users" ADD COLUMN IF NOT EXISTS "address_state" text;
ALTER TABLE "amz_users" ADD COLUMN IF NOT EXISTS "address_zip" text;
