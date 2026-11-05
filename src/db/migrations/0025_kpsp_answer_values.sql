ALTER TABLE "kpsp_answers" ADD COLUMN "answer" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "kpsp_answers" ADD COLUMN "catalog_version" text DEFAULT 'sdidtk-2022-08-22' NOT NULL;--> statement-breakpoint
ALTER TABLE "kpsp_answers" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;