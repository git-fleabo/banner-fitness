CREATE TABLE IF NOT EXISTS "pt_programme_templates" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "owner_profile_id" text NOT NULL REFERENCES "profiles"("auth_user_id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "description" text,
  "goal_summary" text NOT NULL,
  "session_duration_minutes" smallint DEFAULT 45 NOT NULL,
  "sessions" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "pt_programme_templates_owner_updated_idx" ON "pt_programme_templates" ("owner_profile_id", "updated_at");
