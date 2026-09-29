CREATE TABLE "vaccine_reminders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"child_id" uuid NOT NULL,
	"catalog_key" text NOT NULL,
	"remind_on" date NOT NULL,
	"remind_time" time NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "vaccine_reminders" ADD CONSTRAINT "vaccine_reminders_child_id_children_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."children"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "vaccine_reminders_child_id_idx" ON "vaccine_reminders" USING btree ("child_id");--> statement-breakpoint
CREATE UNIQUE INDEX "vaccine_reminders_child_catalog_unique" ON "vaccine_reminders" USING btree ("child_id","catalog_key");