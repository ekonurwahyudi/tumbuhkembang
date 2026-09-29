CREATE TYPE "public"."share_status" AS ENUM('PENDING', 'ACCEPTED');--> statement-breakpoint
CREATE TABLE "child_shares" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"child_id" uuid NOT NULL,
	"owner_id" uuid NOT NULL,
	"invitee_email" text NOT NULL,
	"token" text NOT NULL,
	"status" "share_status" DEFAULT 'PENDING' NOT NULL,
	"invitee_user_id" uuid,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "phone" text;--> statement-breakpoint
ALTER TABLE "child_shares" ADD CONSTRAINT "child_shares_child_id_children_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."children"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "child_shares" ADD CONSTRAINT "child_shares_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "child_shares" ADD CONSTRAINT "child_shares_invitee_user_id_users_id_fk" FOREIGN KEY ("invitee_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "child_shares_token_unique" ON "child_shares" USING btree ("token");--> statement-breakpoint
CREATE INDEX "child_shares_child_id_idx" ON "child_shares" USING btree ("child_id");--> statement-breakpoint
CREATE INDEX "child_shares_invitee_user_id_idx" ON "child_shares" USING btree ("invitee_user_id");