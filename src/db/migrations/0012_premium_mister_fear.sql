ALTER TABLE "users" ADD COLUMN "ship_name" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "ship_phone" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "ship_province" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "ship_city" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "ship_district" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "ship_address" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "bank_name" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "bank_holder" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "bank_account" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "bank_public" boolean DEFAULT false NOT NULL;