CREATE TYPE "public"."pt_invite_status" AS ENUM('pending', 'claimed', 'revoked');--> statement-breakpoint
ALTER TYPE "public"."account_role" ADD VALUE IF NOT EXISTS 'pt' BEFORE 'learner';--> statement-breakpoint
CREATE TABLE "pt_invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"invited_by" text NOT NULL,
	"status" "pt_invite_status" DEFAULT 'pending' NOT NULL,
	"claimed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pt_invitations" ADD CONSTRAINT "pt_invitations_invited_by_profiles_auth_user_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."profiles"("auth_user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "pt_invitations_email_status_idx" ON "pt_invitations" USING btree ("email","status");--> statement-breakpoint
