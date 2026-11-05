CREATE TYPE "public"."membership_tier" AS ENUM('FREE', 'VIP', 'VVIP');--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "membership_tier" "membership_tier" DEFAULT 'FREE' NOT NULL;