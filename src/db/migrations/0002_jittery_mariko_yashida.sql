CREATE TABLE "vaccination_skips" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"child_id" uuid NOT NULL,
	"catalog_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "children" ADD COLUMN "birth_weight_grams" integer;--> statement-breakpoint
ALTER TABLE "vaccination_skips" ADD CONSTRAINT "vaccination_skips_child_id_children_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."children"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "vaccination_skips_child_id_idx" ON "vaccination_skips" USING btree ("child_id");--> statement-breakpoint
CREATE UNIQUE INDEX "vaccination_skips_child_catalog_unique" ON "vaccination_skips" USING btree ("child_id","catalog_key");--> statement-breakpoint
ALTER TABLE "children" ADD CONSTRAINT "children_birth_weight_range" CHECK ("children"."birth_weight_grams" IS NULL OR ("children"."birth_weight_grams" >= 200 AND "children"."birth_weight_grams" <= 8000));