CREATE TYPE "public"."account_role" AS ENUM('owner', 'learner');--> statement-breakpoint
CREATE TYPE "public"."account_status" AS ENUM('invited', 'active', 'blocked');--> statement-breakpoint
CREATE TYPE "public"."content_status" AS ENUM('draft', 'in_review', 'approved', 'published', 'retired');--> statement-breakpoint
CREATE TYPE "public"."coverage_state" AS ENUM('not_started', 'in_progress', 'covered');--> statement-breakpoint
CREATE TYPE "public"."feedback_category" AS ENUM('correct', 'partly_correct', 'misconception', 'incorrect');--> statement-breakpoint
CREATE TYPE "public"."learning_object_type" AS ENUM('hook', 'explain', 'explore', 'apply', 'check', 'close', 'visual', 'structured_text');--> statement-breakpoint
CREATE TYPE "public"."mapping_status" AS ENUM('confirmed', 'provisional', 'needs_confirmation');--> statement-breakpoint
CREATE TYPE "public"."review_queue_status" AS ENUM('queued', 'scheduled', 'completed', 'dismissed');--> statement-breakpoint
CREATE TYPE "public"."review_reason" AS ENUM('incorrect', 'partly_correct', 'misconception', 'low_confidence', 'manual');--> statement-breakpoint
CREATE TYPE "public"."review_target_type" AS ENUM('lesson_version', 'learning_object_version', 'question_version', 'glossary_version');--> statement-breakpoint
CREATE TYPE "public"."rights_status" AS ENUM('private_reference', 'public_link', 'original', 'licensed', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."source_type" AS ENUM('origym_pdf', 'public_video', 'professional_guidance', 'original_research', 'other');--> statement-breakpoint
CREATE TABLE "bookmarks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"learner_id" text NOT NULL,
	"lesson_id" uuid NOT NULL,
	"learning_object_id" uuid,
	"label" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "curriculum_topics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"recommended_order" integer NOT NULL,
	"origym_module" text NOT NULL,
	"mapping_status" "mapping_status" DEFAULT 'provisional' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "curriculum_topics_slug_unique" UNIQUE("slug"),
	CONSTRAINT "curriculum_topics_order_positive" CHECK ("curriculum_topics"."recommended_order" > 0)
);
--> statement-breakpoint
CREATE TABLE "glossary_terms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"term" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "glossary_terms_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "glossary_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"glossary_term_id" uuid NOT NULL,
	"version_number" integer NOT NULL,
	"definition" text NOT NULL,
	"status" "content_status" DEFAULT 'draft' NOT NULL,
	"created_by" text,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "glossary_versions_number_positive" CHECK ("glossary_versions"."version_number" > 0),
	CONSTRAINT "glossary_versions_publish_timestamp" CHECK ("glossary_versions"."status" <> 'published' or "glossary_versions"."published_at" is not null)
);
--> statement-breakpoint
CREATE TABLE "learning_object_version_questions" (
	"learning_object_version_id" uuid NOT NULL,
	"question_version_id" uuid NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "learning_object_version_questions_learning_object_version_id_question_version_id_pk" PRIMARY KEY("learning_object_version_id","question_version_id"),
	CONSTRAINT "learning_object_questions_position_positive" CHECK ("learning_object_version_questions"."position" > 0)
);
--> statement-breakpoint
CREATE TABLE "learning_object_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"learning_object_id" uuid NOT NULL,
	"version_number" integer NOT NULL,
	"title" text,
	"content" jsonb NOT NULL,
	"structured_text" text,
	"status" "content_status" DEFAULT 'draft' NOT NULL,
	"created_by" text,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "learning_object_versions_number_positive" CHECK ("learning_object_versions"."version_number" > 0),
	CONSTRAINT "learning_object_versions_publish_timestamp" CHECK ("learning_object_versions"."status" <> 'published' or "learning_object_versions"."published_at" is not null)
);
--> statement-breakpoint
CREATE TABLE "learning_objects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lesson_id" uuid NOT NULL,
	"stable_key" text NOT NULL,
	"type" "learning_object_type" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lesson_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"learner_id" text NOT NULL,
	"lesson_id" uuid NOT NULL,
	"lesson_version_id" uuid NOT NULL,
	"coverage_state" "coverage_state" DEFAULT 'not_started' NOT NULL,
	"last_object_position" integer DEFAULT 1 NOT NULL,
	"resume_state" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lesson_progress_position_positive" CHECK ("lesson_progress"."last_object_position" > 0)
);
--> statement-breakpoint
CREATE TABLE "lesson_version_objects" (
	"lesson_version_id" uuid NOT NULL,
	"learning_object_version_id" uuid NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "lesson_version_objects_lesson_version_id_learning_object_version_id_pk" PRIMARY KEY("lesson_version_id","learning_object_version_id"),
	CONSTRAINT "lesson_version_objects_position_positive" CHECK ("lesson_version_objects"."position" > 0)
);
--> statement-breakpoint
CREATE TABLE "lesson_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lesson_id" uuid NOT NULL,
	"version_number" integer NOT NULL,
	"title" text NOT NULL,
	"outcome" text NOT NULL,
	"estimated_minutes" smallint NOT NULL,
	"status" "content_status" DEFAULT 'draft' NOT NULL,
	"created_by" text,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lesson_versions_number_positive" CHECK ("lesson_versions"."version_number" > 0),
	CONSTRAINT "lesson_versions_minutes_range" CHECK ("lesson_versions"."estimated_minutes" between 5 and 10),
	CONSTRAINT "lesson_versions_publish_timestamp" CHECK ("lesson_versions"."status" <> 'published' or "lesson_versions"."published_at" is not null)
);
--> statement-breakpoint
CREATE TABLE "lessons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"curriculum_topic_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"recommended_order" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lessons_slug_unique" UNIQUE("slug"),
	CONSTRAINT "lessons_order_positive" CHECK ("lessons"."recommended_order" > 0)
);
--> statement-breakpoint
CREATE TABLE "practice_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"learner_id" text NOT NULL,
	"lesson_version_id" uuid NOT NULL,
	"question_version_id" uuid NOT NULL,
	"response" jsonb NOT NULL,
	"feedback_category" "feedback_category" NOT NULL,
	"misconception_code" text,
	"evidence_recorded" boolean DEFAULT true NOT NULL,
	"attempted_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"auth_user_id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"display_name" text,
	"role" "account_role" DEFAULT 'learner' NOT NULL,
	"status" "account_status" DEFAULT 'invited' NOT NULL,
	"invited_by" text,
	"invited_at" timestamp with time zone DEFAULT now() NOT NULL,
	"activated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "question_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question_id" uuid NOT NULL,
	"version_number" integer NOT NULL,
	"prompt" text NOT NULL,
	"response_schema" jsonb NOT NULL,
	"scoring_schema" jsonb NOT NULL,
	"feedback_rules" jsonb NOT NULL,
	"status" "content_status" DEFAULT 'draft' NOT NULL,
	"created_by" text,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "question_versions_number_positive" CHECK ("question_versions"."version_number" > 0),
	CONSTRAINT "question_versions_publish_timestamp" CHECK ("question_versions"."status" <> 'published' or "question_versions"."published_at" is not null)
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"stable_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "questions_stable_key_unique" UNIQUE("stable_key")
);
--> statement-breakpoint
CREATE TABLE "review_decisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"target_type" "review_target_type" NOT NULL,
	"lesson_version_id" uuid,
	"learning_object_version_id" uuid,
	"question_version_id" uuid,
	"glossary_version_id" uuid,
	"decision" "content_status" NOT NULL,
	"rationale" text,
	"reviewed_by" text NOT NULL,
	"reviewed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "review_decisions_exactly_one_target" CHECK (num_nonnulls("review_decisions"."lesson_version_id", "review_decisions"."learning_object_version_id", "review_decisions"."question_version_id", "review_decisions"."glossary_version_id") = 1)
);
--> statement-breakpoint
CREATE TABLE "review_queue" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"learner_id" text NOT NULL,
	"lesson_id" uuid NOT NULL,
	"lesson_version_id" uuid NOT NULL,
	"question_version_id" uuid,
	"reason" "review_reason" NOT NULL,
	"evidence" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"due_at" timestamp with time zone NOT NULL,
	"status" "review_queue_status" DEFAULT 'queued' NOT NULL,
	"learner_override" jsonb,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "source_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_record_id" uuid NOT NULL,
	"lesson_version_id" uuid,
	"learning_object_version_id" uuid,
	"question_version_id" uuid,
	"glossary_version_id" uuid,
	"source_excerpt_note" text,
	"mapping_uncertainty" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "source_links_exactly_one_target" CHECK (num_nonnulls("source_links"."lesson_version_id", "source_links"."learning_object_version_id", "source_links"."question_version_id", "source_links"."glossary_version_id") = 1)
);
--> statement-breakpoint
CREATE TABLE "source_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"source_type" "source_type" NOT NULL,
	"location" text NOT NULL,
	"page_range" text,
	"retrieved_at" date,
	"reviewed_at" date,
	"rights_status" "rights_status" DEFAULT 'unknown' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_learner_id_profiles_auth_user_id_fk" FOREIGN KEY ("learner_id") REFERENCES "public"."profiles"("auth_user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_learning_object_id_learning_objects_id_fk" FOREIGN KEY ("learning_object_id") REFERENCES "public"."learning_objects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "glossary_versions" ADD CONSTRAINT "glossary_versions_glossary_term_id_glossary_terms_id_fk" FOREIGN KEY ("glossary_term_id") REFERENCES "public"."glossary_terms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "glossary_versions" ADD CONSTRAINT "glossary_versions_created_by_profiles_auth_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("auth_user_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_object_version_questions" ADD CONSTRAINT "learning_object_version_questions_learning_object_version_id_learning_object_versions_id_fk" FOREIGN KEY ("learning_object_version_id") REFERENCES "public"."learning_object_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_object_version_questions" ADD CONSTRAINT "learning_object_version_questions_question_version_id_question_versions_id_fk" FOREIGN KEY ("question_version_id") REFERENCES "public"."question_versions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_object_versions" ADD CONSTRAINT "learning_object_versions_learning_object_id_learning_objects_id_fk" FOREIGN KEY ("learning_object_id") REFERENCES "public"."learning_objects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_object_versions" ADD CONSTRAINT "learning_object_versions_created_by_profiles_auth_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("auth_user_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_objects" ADD CONSTRAINT "learning_objects_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_learner_id_profiles_auth_user_id_fk" FOREIGN KEY ("learner_id") REFERENCES "public"."profiles"("auth_user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_lesson_version_id_lesson_versions_id_fk" FOREIGN KEY ("lesson_version_id") REFERENCES "public"."lesson_versions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_version_objects" ADD CONSTRAINT "lesson_version_objects_lesson_version_id_lesson_versions_id_fk" FOREIGN KEY ("lesson_version_id") REFERENCES "public"."lesson_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_version_objects" ADD CONSTRAINT "lesson_version_objects_learning_object_version_id_learning_object_versions_id_fk" FOREIGN KEY ("learning_object_version_id") REFERENCES "public"."learning_object_versions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_versions" ADD CONSTRAINT "lesson_versions_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_versions" ADD CONSTRAINT "lesson_versions_created_by_profiles_auth_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("auth_user_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_curriculum_topic_id_curriculum_topics_id_fk" FOREIGN KEY ("curriculum_topic_id") REFERENCES "public"."curriculum_topics"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_attempts" ADD CONSTRAINT "practice_attempts_learner_id_profiles_auth_user_id_fk" FOREIGN KEY ("learner_id") REFERENCES "public"."profiles"("auth_user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_attempts" ADD CONSTRAINT "practice_attempts_lesson_version_id_lesson_versions_id_fk" FOREIGN KEY ("lesson_version_id") REFERENCES "public"."lesson_versions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_attempts" ADD CONSTRAINT "practice_attempts_question_version_id_question_versions_id_fk" FOREIGN KEY ("question_version_id") REFERENCES "public"."question_versions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_versions" ADD CONSTRAINT "question_versions_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_versions" ADD CONSTRAINT "question_versions_created_by_profiles_auth_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("auth_user_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_decisions" ADD CONSTRAINT "review_decisions_lesson_version_id_lesson_versions_id_fk" FOREIGN KEY ("lesson_version_id") REFERENCES "public"."lesson_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_decisions" ADD CONSTRAINT "review_decisions_learning_object_version_id_learning_object_versions_id_fk" FOREIGN KEY ("learning_object_version_id") REFERENCES "public"."learning_object_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_decisions" ADD CONSTRAINT "review_decisions_question_version_id_question_versions_id_fk" FOREIGN KEY ("question_version_id") REFERENCES "public"."question_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_decisions" ADD CONSTRAINT "review_decisions_glossary_version_id_glossary_versions_id_fk" FOREIGN KEY ("glossary_version_id") REFERENCES "public"."glossary_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_decisions" ADD CONSTRAINT "review_decisions_reviewed_by_profiles_auth_user_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."profiles"("auth_user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_queue" ADD CONSTRAINT "review_queue_learner_id_profiles_auth_user_id_fk" FOREIGN KEY ("learner_id") REFERENCES "public"."profiles"("auth_user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_queue" ADD CONSTRAINT "review_queue_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_queue" ADD CONSTRAINT "review_queue_lesson_version_id_lesson_versions_id_fk" FOREIGN KEY ("lesson_version_id") REFERENCES "public"."lesson_versions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_queue" ADD CONSTRAINT "review_queue_question_version_id_question_versions_id_fk" FOREIGN KEY ("question_version_id") REFERENCES "public"."question_versions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_links" ADD CONSTRAINT "source_links_source_record_id_source_records_id_fk" FOREIGN KEY ("source_record_id") REFERENCES "public"."source_records"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_links" ADD CONSTRAINT "source_links_lesson_version_id_lesson_versions_id_fk" FOREIGN KEY ("lesson_version_id") REFERENCES "public"."lesson_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_links" ADD CONSTRAINT "source_links_learning_object_version_id_learning_object_versions_id_fk" FOREIGN KEY ("learning_object_version_id") REFERENCES "public"."learning_object_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_links" ADD CONSTRAINT "source_links_question_version_id_question_versions_id_fk" FOREIGN KEY ("question_version_id") REFERENCES "public"."question_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_links" ADD CONSTRAINT "source_links_glossary_version_id_glossary_versions_id_fk" FOREIGN KEY ("glossary_version_id") REFERENCES "public"."glossary_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "bookmarks_target_unique" ON "bookmarks" USING btree ("learner_id","lesson_id",coalesce("learning_object_id", '00000000-0000-0000-0000-000000000000'::uuid));--> statement-breakpoint
CREATE UNIQUE INDEX "curriculum_topics_order_unique" ON "curriculum_topics" USING btree ("recommended_order");--> statement-breakpoint
CREATE UNIQUE INDEX "glossary_terms_term_unique" ON "glossary_terms" USING btree (lower("term"));--> statement-breakpoint
CREATE UNIQUE INDEX "glossary_versions_number_unique" ON "glossary_versions" USING btree ("glossary_term_id","version_number");--> statement-breakpoint
CREATE UNIQUE INDEX "glossary_versions_one_published" ON "glossary_versions" USING btree ("glossary_term_id") WHERE "glossary_versions"."status" = 'published';--> statement-breakpoint
CREATE UNIQUE INDEX "learning_object_questions_position_unique" ON "learning_object_version_questions" USING btree ("learning_object_version_id","position");--> statement-breakpoint
CREATE UNIQUE INDEX "learning_object_versions_number_unique" ON "learning_object_versions" USING btree ("learning_object_id","version_number");--> statement-breakpoint
CREATE UNIQUE INDEX "learning_object_versions_one_published" ON "learning_object_versions" USING btree ("learning_object_id") WHERE "learning_object_versions"."status" = 'published';--> statement-breakpoint
CREATE UNIQUE INDEX "learning_objects_key_unique" ON "learning_objects" USING btree ("lesson_id","stable_key");--> statement-breakpoint
CREATE UNIQUE INDEX "lesson_progress_learner_lesson_unique" ON "lesson_progress" USING btree ("learner_id","lesson_id");--> statement-breakpoint
CREATE INDEX "lesson_progress_learner_state_idx" ON "lesson_progress" USING btree ("learner_id","coverage_state");--> statement-breakpoint
CREATE UNIQUE INDEX "lesson_version_objects_position_unique" ON "lesson_version_objects" USING btree ("lesson_version_id","position");--> statement-breakpoint
CREATE UNIQUE INDEX "lesson_versions_number_unique" ON "lesson_versions" USING btree ("lesson_id","version_number");--> statement-breakpoint
CREATE UNIQUE INDEX "lesson_versions_one_published" ON "lesson_versions" USING btree ("lesson_id") WHERE "lesson_versions"."status" = 'published';--> statement-breakpoint
CREATE UNIQUE INDEX "lessons_topic_order_unique" ON "lessons" USING btree ("curriculum_topic_id","recommended_order");--> statement-breakpoint
CREATE INDEX "practice_attempts_learner_time_idx" ON "practice_attempts" USING btree ("learner_id","attempted_at");--> statement-breakpoint
CREATE UNIQUE INDEX "profiles_email_unique" ON "profiles" USING btree (lower("email"));--> statement-breakpoint
CREATE INDEX "profiles_role_status_idx" ON "profiles" USING btree ("role","status");--> statement-breakpoint
CREATE UNIQUE INDEX "question_versions_number_unique" ON "question_versions" USING btree ("question_id","version_number");--> statement-breakpoint
CREATE UNIQUE INDEX "question_versions_one_published" ON "question_versions" USING btree ("question_id") WHERE "question_versions"."status" = 'published';--> statement-breakpoint
CREATE INDEX "review_queue_learner_due_idx" ON "review_queue" USING btree ("learner_id","status","due_at");--> statement-breakpoint
CREATE INDEX "source_links_source_idx" ON "source_links" USING btree ("source_record_id");