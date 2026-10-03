CREATE TYPE "public"."shop_category" AS ENUM('MOM_PREGNANCY', 'MOM_NURSING', 'MOM_CARE', 'BABY_NUTRITION', 'BABY_DIAPERING', 'BABY_BATH', 'BABY_CLOTHING', 'BABY_SLEEP', 'BABY_TRANSPORT', 'CHILD_TOYS', 'CHILD_LEARNING', 'HEALTH_DEVICE', 'OTHER');--> statement-breakpoint
CREATE TABLE "shop_products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"photo_keys" text[] DEFAULT '{}' NOT NULL,
	"category" "shop_category" DEFAULT 'OTHER' NOT NULL,
	"price_min_idr" integer,
	"price_max_idr" integer,
	"url_shopee" text,
	"url_tokopedia" text,
	"url_tiktok" text,
	"is_published" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "shop_products_price_range" CHECK ("shop_products"."price_min_idr" IS NULL OR "shop_products"."price_max_idr" IS NULL OR "shop_products"."price_max_idr" >= "shop_products"."price_min_idr")
);
--> statement-breakpoint
CREATE INDEX "shop_products_published_idx" ON "shop_products" USING btree ("is_published","sort_order");