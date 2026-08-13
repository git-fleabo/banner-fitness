CREATE TYPE "public"."pt_session_management" AS ENUM('pt_managed', 'self_managed');--> statement-breakpoint
ALTER TABLE "pt_sessions" ADD COLUMN "scheduled_time" text;--> statement-breakpoint
ALTER TABLE "pt_sessions" ADD COLUMN "management_mode" "pt_session_management" DEFAULT 'pt_managed' NOT NULL;