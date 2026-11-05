CREATE TABLE "kpsp_answers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"child_id" uuid NOT NULL,
	"age_months" integer NOT NULL,
	"question_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "kpsp_answers" ADD CONSTRAINT "kpsp_answers_child_id_children_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."children"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "kpsp_answers_child_id_idx" ON "kpsp_answers" USING btree ("child_id");--> statement-breakpoint
CREATE UNIQUE INDEX "kpsp_answers_child_question_unique" ON "kpsp_answers" USING btree ("child_id","age_months","question_key");