ALTER TABLE "pt_programme_templates" ADD COLUMN IF NOT EXISTS "experience_level" text DEFAULT 'varied' NOT NULL;
ALTER TABLE "pt_programme_templates" ADD COLUMN IF NOT EXISTS "framework_type" text DEFAULT 'original' NOT NULL;
