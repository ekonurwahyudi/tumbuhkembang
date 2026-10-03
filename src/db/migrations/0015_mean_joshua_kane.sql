CREATE TABLE "shop_favorites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "shop_products" RENAME COLUMN "price_min_idr" TO "price_idr";--> statement-breakpoint
ALTER TABLE "shop_products" RENAME COLUMN "price_max_idr" TO "price_original_idr";--> statement-breakpoint
ALTER TABLE "shop_products" DROP CONSTRAINT "shop_products_price_range";--> statement-breakpoint
ALTER TABLE "shop_favorites" ADD CONSTRAINT "shop_favorites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_favorites" ADD CONSTRAINT "shop_favorites_product_id_shop_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."shop_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "shop_favorites_user_id_idx" ON "shop_favorites" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "shop_favorites_user_product_unique" ON "shop_favorites" USING btree ("user_id","product_id");--> statement-breakpoint
ALTER TABLE "shop_products" ADD CONSTRAINT "shop_products_price_discount" CHECK ("shop_products"."price_idr" IS NULL OR "shop_products"."price_original_idr" IS NULL OR "shop_products"."price_original_idr" >= "shop_products"."price_idr");