CREATE TYPE "public"."user_role" AS ENUM('USER', 'SUPERADMIN');--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "role" "user_role" DEFAULT 'USER' NOT NULL;