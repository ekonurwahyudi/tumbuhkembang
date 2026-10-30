CREATE TYPE "public"."blog_category" AS ENUM('NUTRISI', 'TUMBUH_KEMBANG', 'IMUNISASI', 'KESEHATAN', 'PERAWATAN', 'IBU');--> statement-breakpoint
CREATE TABLE "blog_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"excerpt" text NOT NULL,
	"content_html" text NOT NULL,
	"category" "blog_category" DEFAULT 'TUMBUH_KEMBANG' NOT NULL,
	"source_name" text NOT NULL,
	"source_url" text NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "blog_posts_slug_unique" ON "blog_posts" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "blog_posts_published_idx" ON "blog_posts" USING btree ("is_published","sort_order");