CREATE TYPE "public"."birth_type" AS ENUM('TERM', 'PRETERM');--> statement-breakpoint
CREATE TYPE "public"."feeding_type" AS ENUM('BREAST_DIRECT', 'EXPRESSED_BREAST_MILK', 'FORMULA');--> statement-breakpoint
CREATE TYPE "public"."sex" AS ENUM('MALE', 'FEMALE');--> statement-breakpoint
CREATE TABLE "children" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"sex" "sex" NOT NULL,
	"date_of_birth" date NOT NULL,
	"birth_type" "birth_type" NOT NULL,
	"gestational_age_weeks" integer,
	"gestational_age_days" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "children_gestational_age_consistency" CHECK (("children"."birth_type" = 'PRETERM' AND "children"."gestational_age_weeks" IS NOT NULL AND "children"."gestational_age_days" IS NOT NULL)
          OR ("children"."birth_type" = 'TERM' AND "children"."gestational_age_weeks" IS NULL AND "children"."gestational_age_days" IS NULL)),
	CONSTRAINT "children_gestational_age_days_range" CHECK ("children"."gestational_age_days" IS NULL OR ("children"."gestational_age_days" >= 0 AND "children"."gestational_age_days" <= 6)),
	CONSTRAINT "children_gestational_age_weeks_range" CHECK ("children"."gestational_age_weeks" IS NULL OR ("children"."gestational_age_weeks" >= 22 AND "children"."gestational_age_weeks" <= 36))
);
--> statement-breakpoint
CREATE TABLE "feeding_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"child_id" uuid NOT NULL,
	"feeding_type" "feeding_type" NOT NULL,
	"amount_ml" numeric(6, 1),
	"fed_at" timestamp with time zone NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "feeding_logs_amount_positive" CHECK ("feeding_logs"."amount_ml" IS NULL OR "feeding_logs"."amount_ml" > 0)
);
--> statement-breakpoint
CREATE TABLE "growth_measurements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"child_id" uuid NOT NULL,
	"measured_at" date NOT NULL,
	"weight_kg" numeric(6, 3),
	"length_height_cm" numeric(6, 2),
	"head_circumference_cm" numeric(6, 2),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "growth_measurements_weight_positive" CHECK ("growth_measurements"."weight_kg" IS NULL OR "growth_measurements"."weight_kg" > 0),
	CONSTRAINT "growth_measurements_length_positive" CHECK ("growth_measurements"."length_height_cm" IS NULL OR "growth_measurements"."length_height_cm" > 0),
	CONSTRAINT "growth_measurements_head_positive" CHECK ("growth_measurements"."head_circumference_cm" IS NULL OR "growth_measurements"."head_circumference_cm" > 0),
	CONSTRAINT "growth_measurements_at_least_one_value" CHECK ("growth_measurements"."weight_kg" IS NOT NULL OR "growth_measurements"."length_height_cm" IS NOT NULL OR "growth_measurements"."head_circumference_cm" IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "children" ADD CONSTRAINT "children_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feeding_logs" ADD CONSTRAINT "feeding_logs_child_id_children_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."children"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "growth_measurements" ADD CONSTRAINT "growth_measurements_child_id_children_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."children"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "children_user_id_idx" ON "children" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "feeding_logs_child_fed_at_idx" ON "feeding_logs" USING btree ("child_id","fed_at");--> statement-breakpoint
CREATE INDEX "growth_measurements_child_measured_idx" ON "growth_measurements" USING btree ("child_id","measured_at");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" USING btree (lower("email"));