CREATE TABLE "vaccinations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"child_id" uuid NOT NULL,
	"catalog_key" text,
	"name" text NOT NULL,
	"given_at" date NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "vaccinations" ADD CONSTRAINT "vaccinations_child_id_children_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."children"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "vaccinations_child_id_idx" ON "vaccinations" USING btree ("child_id");--> statement-breakpoint
CREATE UNIQUE INDEX "vaccinations_child_catalog_unique" ON "vaccinations" USING btree ("child_id","catalog_key") WHERE "vaccinations"."catalog_key" IS NOT NULL;