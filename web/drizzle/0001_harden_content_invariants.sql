ALTER TABLE "practice_attempts" ADD CONSTRAINT "practice_attempts_misconception_code" CHECK ("practice_attempts"."feedback_category" <> 'misconception' or "practice_attempts"."misconception_code" is not null);--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_active_timestamp" CHECK ("profiles"."status" <> 'active' or "profiles"."activated_at" is not null);--> statement-breakpoint
ALTER TABLE "review_decisions" ADD CONSTRAINT "review_decisions_target_matches" CHECK (
    ("review_decisions"."target_type" = 'lesson_version' and "review_decisions"."lesson_version_id" is not null)
    or ("review_decisions"."target_type" = 'learning_object_version' and "review_decisions"."learning_object_version_id" is not null)
    or ("review_decisions"."target_type" = 'question_version' and "review_decisions"."question_version_id" is not null)
    or ("review_decisions"."target_type" = 'glossary_version' and "review_decisions"."glossary_version_id" is not null)
  );--> statement-breakpoint
ALTER TABLE "review_queue" ADD CONSTRAINT "review_queue_completed_timestamp" CHECK ("review_queue"."status" <> 'completed' or "review_queue"."completed_at" is not null);