CREATE TABLE IF NOT EXISTS "pt_designer_settings" (
  "owner_profile_id" text PRIMARY KEY NOT NULL REFERENCES "profiles"("auth_user_id") ON DELETE CASCADE,
  "quality_rules" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "pt_programmes_one_active_per_client" ON "pt_programmes" ("client_id") WHERE "status" = 'active';
