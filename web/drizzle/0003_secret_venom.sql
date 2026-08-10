CREATE TYPE "public"."pt_client_status" AS ENUM('active', 'archived');--> statement-breakpoint
CREATE TYPE "public"."pt_goal_priority" AS ENUM('primary', 'secondary');--> statement-breakpoint
CREATE TYPE "public"."pt_intensity_type" AS ENUM('rir', 'rpe', 'percent_1rm', 'load', 'pace', 'heart_rate', 'duration');--> statement-breakpoint
CREATE TYPE "public"."pt_programme_status" AS ENUM('draft', 'active', 'paused', 'completed', 'archived');--> statement-breakpoint
CREATE TYPE "public"."pt_session_type" AS ENUM('strength', 'hypertrophy', 'conditioning', 'mobility', 'mixed', 'recovery');--> statement-breakpoint
CREATE TABLE "pt_assessments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"assessment_date" date NOT NULL,
	"review_date" date,
	"responses" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"risk_flags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"clearance_required" boolean DEFAULT false NOT NULL,
	"pt_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pt_clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_profile_id" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text,
	"date_of_birth" date,
	"sex_or_gender" text,
	"height_cm" integer,
	"weight_kg" integer,
	"body_composition" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"occupation" text,
	"daily_activity" text,
	"sleep_hours" text,
	"stress_level" text,
	"session_duration_minutes" smallint,
	"preferred_days" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"notes" text,
	"status" "pt_client_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pt_exercise_prescriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"exercise_id" uuid NOT NULL,
	"order_index" smallint NOT NULL,
	"sets" smallint NOT NULL,
	"reps_min" smallint,
	"reps_max" smallint,
	"intensity_type" "pt_intensity_type" NOT NULL,
	"intensity_value" text NOT NULL,
	"rest_seconds" smallint,
	"tempo" text,
	"progression_rule" text,
	"group_key" text,
	"technique" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pt_exercises" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_profile_id" text,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"movement_pattern" text NOT NULL,
	"primary_muscles" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"secondary_muscles" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"equipment" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"difficulty" text NOT NULL,
	"technical_complexity" text NOT NULL,
	"suitability" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"compound" boolean DEFAULT true NOT NULL,
	"unilateral" boolean DEFAULT false NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"regressions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"progressions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"alternatives" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"coaching_cues" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"common_errors" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"caution_tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pt_exercises_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "pt_goals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"goal_type" text NOT NULL,
	"priority" "pt_goal_priority" DEFAULT 'secondary' NOT NULL,
	"target" text,
	"metric" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pt_locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"name" text NOT NULL,
	"location_type" text NOT NULL,
	"equipment" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pt_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"liked_exercises" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"disliked_exercises" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"preferred_style" text,
	"preferred_structure" text,
	"preferred_equipment" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"cardio_modalities" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"variety_preference" text,
	"confidence_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pt_programme_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"programme_id" uuid NOT NULL,
	"actor_profile_id" text NOT NULL,
	"action" text NOT NULL,
	"details" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pt_programme_weeks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"programme_id" uuid NOT NULL,
	"week_number" smallint NOT NULL,
	"focus" text NOT NULL,
	"volume_target" text,
	"intensity_target" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pt_programmes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_profile_id" text NOT NULL,
	"client_id" uuid NOT NULL,
	"name" text NOT NULL,
	"goal_summary" text NOT NULL,
	"duration_weeks" smallint NOT NULL,
	"methodology" text NOT NULL,
	"status" "pt_programme_status" DEFAULT 'draft' NOT NULL,
	"start_date" date,
	"end_date" date,
	"current_week" smallint DEFAULT 1 NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"rationale" text,
	"override_reasons" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pt_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"programme_week_id" uuid NOT NULL,
	"location_id" uuid,
	"day_of_week" smallint NOT NULL,
	"name" text NOT NULL,
	"session_type" "pt_session_type" NOT NULL,
	"duration_minutes" smallint NOT NULL,
	"warmup_minutes" smallint DEFAULT 5 NOT NULL,
	"cooldown_minutes" smallint DEFAULT 0 NOT NULL,
	"notes" text,
	"sort_order" smallint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pt_assessments" ADD CONSTRAINT "pt_assessments_client_id_pt_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."pt_clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pt_clients" ADD CONSTRAINT "pt_clients_owner_profile_id_profiles_auth_user_id_fk" FOREIGN KEY ("owner_profile_id") REFERENCES "public"."profiles"("auth_user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pt_exercise_prescriptions" ADD CONSTRAINT "pt_exercise_prescriptions_session_id_pt_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."pt_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pt_exercise_prescriptions" ADD CONSTRAINT "pt_exercise_prescriptions_exercise_id_pt_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."pt_exercises"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pt_exercises" ADD CONSTRAINT "pt_exercises_owner_profile_id_profiles_auth_user_id_fk" FOREIGN KEY ("owner_profile_id") REFERENCES "public"."profiles"("auth_user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pt_goals" ADD CONSTRAINT "pt_goals_client_id_pt_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."pt_clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pt_locations" ADD CONSTRAINT "pt_locations_client_id_pt_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."pt_clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pt_preferences" ADD CONSTRAINT "pt_preferences_client_id_pt_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."pt_clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pt_programme_events" ADD CONSTRAINT "pt_programme_events_programme_id_pt_programmes_id_fk" FOREIGN KEY ("programme_id") REFERENCES "public"."pt_programmes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pt_programme_events" ADD CONSTRAINT "pt_programme_events_actor_profile_id_profiles_auth_user_id_fk" FOREIGN KEY ("actor_profile_id") REFERENCES "public"."profiles"("auth_user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pt_programme_weeks" ADD CONSTRAINT "pt_programme_weeks_programme_id_pt_programmes_id_fk" FOREIGN KEY ("programme_id") REFERENCES "public"."pt_programmes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pt_programmes" ADD CONSTRAINT "pt_programmes_owner_profile_id_profiles_auth_user_id_fk" FOREIGN KEY ("owner_profile_id") REFERENCES "public"."profiles"("auth_user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pt_programmes" ADD CONSTRAINT "pt_programmes_client_id_pt_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."pt_clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pt_sessions" ADD CONSTRAINT "pt_sessions_programme_week_id_pt_programme_weeks_id_fk" FOREIGN KEY ("programme_week_id") REFERENCES "public"."pt_programme_weeks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pt_sessions" ADD CONSTRAINT "pt_sessions_location_id_pt_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."pt_locations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "pt_assessments_client_date_idx" ON "pt_assessments" USING btree ("client_id","assessment_date");--> statement-breakpoint
CREATE INDEX "pt_clients_owner_status_idx" ON "pt_clients" USING btree ("owner_profile_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "pt_prescriptions_session_order_unique" ON "pt_exercise_prescriptions" USING btree ("session_id","order_index");--> statement-breakpoint
CREATE INDEX "pt_prescriptions_exercise_idx" ON "pt_exercise_prescriptions" USING btree ("exercise_id");--> statement-breakpoint
CREATE INDEX "pt_exercises_pattern_idx" ON "pt_exercises" USING btree ("movement_pattern");--> statement-breakpoint
CREATE INDEX "pt_exercises_owner_idx" ON "pt_exercises" USING btree ("owner_profile_id");--> statement-breakpoint
CREATE INDEX "pt_goals_client_priority_idx" ON "pt_goals" USING btree ("client_id","priority");--> statement-breakpoint
CREATE INDEX "pt_locations_client_idx" ON "pt_locations" USING btree ("client_id");--> statement-breakpoint
CREATE UNIQUE INDEX "pt_preferences_client_unique" ON "pt_preferences" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "pt_programme_events_programme_time_idx" ON "pt_programme_events" USING btree ("programme_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "pt_programme_weeks_number_unique" ON "pt_programme_weeks" USING btree ("programme_id","week_number");--> statement-breakpoint
CREATE INDEX "pt_programmes_owner_status_idx" ON "pt_programmes" USING btree ("owner_profile_id","status");--> statement-breakpoint
CREATE INDEX "pt_programmes_client_idx" ON "pt_programmes" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "pt_sessions_week_day_idx" ON "pt_sessions" USING btree ("programme_week_id","day_of_week");
--> statement-breakpoint
INSERT INTO "pt_exercises" ("slug", "name", "movement_pattern", "primary_muscles", "secondary_muscles", "equipment", "difficulty", "technical_complexity", "suitability", "compound", "unilateral", "tags", "regressions", "progressions", "alternatives", "coaching_cues", "common_errors", "caution_tags") VALUES
('leg-press', 'Leg Press', 'Squat', '["quads","glutes"]', '["hamstrings"]', '["Machine"]', 'beginner', 'low', '["strength","hypertrophy","endurance"]', true, false, '["lower-body","stable"]', '["goblet-squat"]', '["hack-squat"]', '["goblet-squat","split-squat","hack-squat"]', '["Keep the whole foot connected","Control the depth"]', '["Knees collapsing inward","Lumbar rounding"]', '[]'),
('dumbbell-bench-press', 'DB Bench Press', 'Horizontal push', '["chest"]', '["triceps","shoulders"]', '["Dumbbells","Bench"]', 'beginner', 'moderate', '["strength","hypertrophy"]', true, false, '["upper-body","preferred"]', '["incline-push-up"]', '["barbell-bench-press"]', '["machine-chest-press","incline-push-up","barbell-bench-press"]', '["Set the shoulder blades","Use a controlled lower"]', '["Bouncing the dumbbells","Losing shoulder position"]', '[]'),
('seated-cable-row', 'Seated Cable Row', 'Horizontal pull', '["back"]', '["biceps","rear-delts"]', '["Cable"]', 'beginner', 'low', '["strength","hypertrophy","endurance"]', true, false, '["upper-body","pull"]', '["band-row"]', '["chest-supported-row"]', '["chest-supported-row","band-row","machine-row"]', '["Reach without rounding","Pull elbows toward the ribs"]', '["Shrugging","Using momentum"]', '[]'),
('dumbbell-romanian-deadlift', 'DB Romanian Deadlift', 'Hinge', '["hamstrings","glutes"]', '["back"]', '["Dumbbells"]', 'intermediate', 'moderate', '["strength","hypertrophy"]', true, false, '["posterior-chain"]', '["kettlebell-deadlift"]', '["barbell-romanian-deadlift"]', '["kettlebell-deadlift","cable-pull-through","barbell-romanian-deadlift"]', '["Hinge from the hips","Keep the weights close"]', '["Squatting the movement","Rounding under load"]', '["recent-surgery"]'),
('cable-lateral-raise', 'Cable Lateral Raise', 'Shoulder accessory', '["lateral-delts"]', '[]', '["Cable"]', 'beginner', 'low', '["hypertrophy","endurance"]', false, true, '["accessory"]', '["dumbbell-lateral-raise"]', '["lean-away-lateral-raise"]', '["dumbbell-lateral-raise","machine-lateral-raise"]', '["Lead with the elbow","Use a controlled range"]', '["Swinging","Shrugging"]', '[]'),
('bike-intervals', 'Bike Intervals', 'Conditioning', '["cardiovascular"]', '["legs"]', '["Bike"]', 'intermediate', 'low', '["conditioning","endurance"]', false, false, '["cardio","time-efficient"]', '["incline-walk"]', '["sprint-intervals"]', '["incline-walk","rowing-intervals"]', '["Build intensity progressively","Use RPE if no heart-rate data"]', '["Starting too hard","Ignoring recovery"]', '["cardiovascular-symptoms"]'),
('goblet-squat', 'Goblet Squat', 'Squat', '["quads","glutes"]', '["core"]', '["Dumbbell","Kettlebell"]', 'beginner', 'low', '["strength","hypertrophy","endurance"]', true, false, '["lower-body","regression"]', '["bodyweight-squat"]', '["front-squat"]', '["bodyweight-squat","leg-press","split-squat"]', '["Brace before descent","Keep the torso tall"]', '["Collapsing knees","Losing foot pressure"]', '[]'),
('chest-supported-row', 'Chest-Supported DB Row', 'Horizontal pull', '["back"]', '["biceps","rear-delts"]', '["Dumbbells","Bench"]', 'beginner', 'low', '["strength","hypertrophy"]', true, false, '["upper-body","pull"]', '["band-row"]', '["one-arm-dumbbell-row"]', '["seated-cable-row","machine-row","band-row"]', '["Keep the chest supported","Pause at the top"]', '["Lifting the chest","Shrugging"]', '[]')
ON CONFLICT ("slug") DO NOTHING;
