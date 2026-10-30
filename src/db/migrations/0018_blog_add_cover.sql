DROP INDEX "blog_posts_published_idx";--> statement-breakpoint
ALTER TABLE "blog_posts" ADD COLUMN "cover_key" text;--> statement-breakpoint
CREATE INDEX "blog_posts_published_idx" ON "blog_posts" USING btree ("is_published","created_at");