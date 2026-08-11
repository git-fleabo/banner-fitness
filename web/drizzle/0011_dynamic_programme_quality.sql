ALTER TABLE "pt_clients"
  ADD COLUMN IF NOT EXISTS "training_experience" text;

CREATE TABLE IF NOT EXISTS "pt_programme_quality_reviews" (
  "programme_id" uuid PRIMARY KEY NOT NULL REFERENCES "pt_programmes"("id") ON DELETE CASCADE,
  "ruleset_version" text NOT NULL,
  "evidence_version" text NOT NULL,
  "evaluated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "score" smallint NOT NULL,
  "approval_readiness" text NOT NULL,
  "blocking_count" smallint NOT NULL,
  "significant_count" smallint NOT NULL,
  "advisory_count" smallint NOT NULL,
  "info_count" smallint NOT NULL,
  "scheduled_sessions" smallint NOT NULL,
  "empty_sessions" smallint NOT NULL,
  "total_sets" integer NOT NULL,
  "source_fingerprint" text NOT NULL,
  "findings" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "passed_rule_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "pt_quality_reviews_readiness_idx" ON "pt_programme_quality_reviews" ("approval_readiness");

CREATE TABLE IF NOT EXISTS "pt_programme_quality_acknowledgements" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "programme_id" uuid NOT NULL REFERENCES "pt_programmes"("id") ON DELETE CASCADE,
  "rule_id" text NOT NULL,
  "finding_key" text NOT NULL,
  "decision" text NOT NULL,
  "reason" text NOT NULL,
  "ruleset_version" text NOT NULL,
  "evidence_version" text NOT NULL,
  "source_fingerprint" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "pt_quality_acknowledgements_finding_unique" ON "pt_programme_quality_acknowledgements" ("programme_id", "finding_key");
CREATE INDEX IF NOT EXISTS "pt_quality_acknowledgements_programme_idx" ON "pt_programme_quality_acknowledgements" ("programme_id");
