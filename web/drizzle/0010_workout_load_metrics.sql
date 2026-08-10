ALTER TABLE "pt_workout_results"
  ADD COLUMN IF NOT EXISTS "volume_load_kg" integer DEFAULT 0 NOT NULL;
ALTER TABLE "pt_workout_results"
  ADD COLUMN IF NOT EXISTS "repetition_load" integer DEFAULT 0 NOT NULL;
ALTER TABLE "pt_workout_results"
  ADD COLUMN IF NOT EXISTS "average_rpe" smallint;
ALTER TABLE "pt_workout_results"
  ADD COLUMN IF NOT EXISTS "average_rir" smallint;
