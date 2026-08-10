CREATE TYPE "public"."pt_workout_status" AS ENUM('completed', 'partial', 'missed', 'skipped');--> statement-breakpoint
CREATE TABLE "pt_workout_result_sets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workout_result_id" uuid NOT NULL,
	"prescription_id" uuid NOT NULL,
	"set_number" smallint NOT NULL,
	"actual_reps" smallint,
	"actual_load_kg" integer,
	"actual_rpe" smallint,
	"actual_rir" smallint,
	"technique_acceptable" boolean DEFAULT true NOT NULL,
	"pain_reported" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pt_workout_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_profile_id" text NOT NULL,
	"client_id" uuid NOT NULL,
	"session_id" uuid NOT NULL,
	"scheduled_date" date NOT NULL,
	"completed_at" timestamp with time zone,
	"status" "pt_workout_status" NOT NULL,
	"session_rpe" smallint,
	"energy" smallint,
	"pain_reported" boolean DEFAULT false NOT NULL,
	"enjoyment" smallint,
	"duration_minutes" smallint,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pt_workout_result_sets" ADD CONSTRAINT "pt_workout_result_sets_workout_result_id_pt_workout_results_id_fk" FOREIGN KEY ("workout_result_id") REFERENCES "public"."pt_workout_results"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pt_workout_result_sets" ADD CONSTRAINT "pt_workout_result_sets_prescription_id_pt_exercise_prescriptions_id_fk" FOREIGN KEY ("prescription_id") REFERENCES "public"."pt_exercise_prescriptions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pt_workout_results" ADD CONSTRAINT "pt_workout_results_owner_profile_id_profiles_auth_user_id_fk" FOREIGN KEY ("owner_profile_id") REFERENCES "public"."profiles"("auth_user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pt_workout_results" ADD CONSTRAINT "pt_workout_results_client_id_pt_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."pt_clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pt_workout_results" ADD CONSTRAINT "pt_workout_results_session_id_pt_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."pt_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "pt_workout_result_sets_number_unique" ON "pt_workout_result_sets" USING btree ("workout_result_id","prescription_id","set_number");--> statement-breakpoint
CREATE INDEX "pt_workout_results_client_date_idx" ON "pt_workout_results" USING btree ("client_id","scheduled_date");--> statement-breakpoint
CREATE INDEX "pt_workout_results_owner_status_idx" ON "pt_workout_results" USING btree ("owner_profile_id","status");