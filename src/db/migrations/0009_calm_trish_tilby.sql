CREATE TYPE "public"."registry_category" AS ENUM('NUTRITION', 'CLOTHING', 'BEDROOM', 'TOYS', 'TRANSPORT', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."registry_priority" AS ENUM('HIGH', 'NORMAL', 'EXTRA');--> statement-breakpoint
CREATE TABLE "registry_claims" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_id" uuid NOT NULL,
	"claimer_name" text NOT NULL,
	"qty" integer DEFAULT 1 NOT NULL,
	"message" text,
	"tracking_number" text,
	"claim_token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "registry_claims_qty_range" CHECK ("registry_claims"."qty" between 1 and 99)
);
--> statement-breakpoint
CREATE TABLE "registry_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"child_id" uuid,
	"name" text NOT NULL,
	"description" text,
	"photo_key" text,
	"priority" "registry_priority" DEFAULT 'NORMAL' NOT NULL,
	"category" "registry_category" DEFAULT 'OTHER' NOT NULL,
	"price_min_idr" integer,
	"price_max_idr" integer,
	"desired_qty" integer DEFAULT 1 NOT NULL,
	"allow_group" boolean DEFAULT false NOT NULL,
	"is_public" boolean DEFAULT true NOT NULL,
	"note" text,
	"url_shopee" text,
	"url_tokopedia" text,
	"url_tiktok" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "registry_items_qty_range" CHECK ("registry_items"."desired_qty" between 1 and 99),
	CONSTRAINT "registry_items_price_range" CHECK ("registry_items"."price_min_idr" IS NULL OR "registry_items"."price_max_idr" IS NULL OR "registry_items"."price_max_idr" >= "registry_items"."price_min_idr")
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "registry_token" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "registry_public" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "registry_claims" ADD CONSTRAINT "registry_claims_item_id_registry_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."registry_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registry_items" ADD CONSTRAINT "registry_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registry_items" ADD CONSTRAINT "registry_items_child_id_children_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."children"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "registry_claims_token_unique" ON "registry_claims" USING btree ("claim_token");--> statement-breakpoint
CREATE INDEX "registry_claims_item_id_idx" ON "registry_claims" USING btree ("item_id");--> statement-breakpoint
CREATE INDEX "registry_items_user_id_idx" ON "registry_items" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_registry_token_unique" ON "users" USING btree ("registry_token");