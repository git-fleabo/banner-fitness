import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const accountRole = pgEnum("account_role", ["owner", "learner"]);
export const accountStatus = pgEnum("account_status", ["invited", "active", "blocked"]);
export const mappingStatus = pgEnum("mapping_status", ["confirmed", "provisional", "needs_confirmation"]);
export const contentStatus = pgEnum("content_status", ["draft", "in_review", "approved", "published", "retired"]);
export const learningObjectType = pgEnum("learning_object_type", ["hook", "explain", "explore", "apply", "check", "close", "visual", "structured_text"]);
export const sourceType = pgEnum("source_type", ["origym_pdf", "public_video", "professional_guidance", "original_research", "other"]);
export const rightsStatus = pgEnum("rights_status", ["private_reference", "public_link", "original", "licensed", "unknown"]);
export const coverageState = pgEnum("coverage_state", ["not_started", "in_progress", "covered"]);
export const feedbackCategory = pgEnum("feedback_category", ["correct", "partly_correct", "misconception", "incorrect"]);
export const reviewReason = pgEnum("review_reason", ["incorrect", "partly_correct", "misconception", "low_confidence", "manual"]);
export const reviewQueueStatus = pgEnum("review_queue_status", ["queued", "scheduled", "completed", "dismissed"]);
export const reviewTargetType = pgEnum("review_target_type", ["lesson_version", "learning_object_version", "question_version", "glossary_version"]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
};

export const profiles = pgTable("profiles", {
  authUserId: text("auth_user_id").primaryKey(),
  email: text("email").notNull(),
  displayName: text("display_name"),
  role: accountRole("role").default("learner").notNull(),
  status: accountStatus("status").default("invited").notNull(),
  invitedBy: text("invited_by"),
  invitedAt: timestamp("invited_at", { withTimezone: true }).defaultNow().notNull(),
  activatedAt: timestamp("activated_at", { withTimezone: true }),
  ...timestamps,
}, (table) => [
  uniqueIndex("profiles_email_unique").on(sql`lower(${table.email})`),
  index("profiles_role_status_idx").on(table.role, table.status),
  check("profiles_active_timestamp", sql`${table.status} <> 'active' or ${table.activatedAt} is not null`),
]);

export const curriculumTopics = pgTable("curriculum_topics", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  recommendedOrder: integer("recommended_order").notNull(),
  origymModule: text("origym_module").notNull(),
  mappingStatus: mappingStatus("mapping_status").default("provisional").notNull(),
  ...timestamps,
}, (table) => [
  uniqueIndex("curriculum_topics_order_unique").on(table.recommendedOrder),
  check("curriculum_topics_order_positive", sql`${table.recommendedOrder} > 0`),
]);

export const lessons = pgTable("lessons", {
  id: uuid("id").defaultRandom().primaryKey(),
  curriculumTopicId: uuid("curriculum_topic_id").notNull().references(() => curriculumTopics.id, { onDelete: "restrict" }),
  slug: text("slug").notNull().unique(),
  recommendedOrder: integer("recommended_order").notNull(),
  ...timestamps,
}, (table) => [
  uniqueIndex("lessons_topic_order_unique").on(table.curriculumTopicId, table.recommendedOrder),
  check("lessons_order_positive", sql`${table.recommendedOrder} > 0`),
]);

export const lessonVersions = pgTable("lesson_versions", {
  id: uuid("id").defaultRandom().primaryKey(),
  lessonId: uuid("lesson_id").notNull().references(() => lessons.id, { onDelete: "cascade" }),
  versionNumber: integer("version_number").notNull(),
  title: text("title").notNull(),
  outcome: text("outcome").notNull(),
  estimatedMinutes: smallint("estimated_minutes").notNull(),
  status: contentStatus("status").default("draft").notNull(),
  createdBy: text("created_by").references(() => profiles.authUserId, { onDelete: "set null" }),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  ...timestamps,
}, (table) => [
  uniqueIndex("lesson_versions_number_unique").on(table.lessonId, table.versionNumber),
  uniqueIndex("lesson_versions_one_published").on(table.lessonId).where(sql`${table.status} = 'published'`),
  check("lesson_versions_number_positive", sql`${table.versionNumber} > 0`),
  check("lesson_versions_minutes_range", sql`${table.estimatedMinutes} between 5 and 10`),
  check("lesson_versions_publish_timestamp", sql`(${table.status} in ('published', 'retired')) = (${table.publishedAt} is not null)`),
]);

export const learningObjects = pgTable("learning_objects", {
  id: uuid("id").defaultRandom().primaryKey(),
  lessonId: uuid("lesson_id").notNull().references(() => lessons.id, { onDelete: "cascade" }),
  stableKey: text("stable_key").notNull(),
  type: learningObjectType("type").notNull(),
  ...timestamps,
}, (table) => [uniqueIndex("learning_objects_key_unique").on(table.lessonId, table.stableKey)]);

export const learningObjectVersions = pgTable("learning_object_versions", {
  id: uuid("id").defaultRandom().primaryKey(),
  learningObjectId: uuid("learning_object_id").notNull().references(() => learningObjects.id, { onDelete: "cascade" }),
  versionNumber: integer("version_number").notNull(),
  title: text("title"),
  content: jsonb("content").notNull(),
  structuredText: text("structured_text"),
  status: contentStatus("status").default("draft").notNull(),
  createdBy: text("created_by").references(() => profiles.authUserId, { onDelete: "set null" }),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  ...timestamps,
}, (table) => [
  uniqueIndex("learning_object_versions_number_unique").on(table.learningObjectId, table.versionNumber),
  uniqueIndex("learning_object_versions_one_published").on(table.learningObjectId).where(sql`${table.status} = 'published'`),
  check("learning_object_versions_number_positive", sql`${table.versionNumber} > 0`),
  check("learning_object_versions_publish_timestamp", sql`(${table.status} in ('published', 'retired')) = (${table.publishedAt} is not null)`),
]);

export const lessonVersionObjects = pgTable("lesson_version_objects", {
  lessonVersionId: uuid("lesson_version_id").notNull().references(() => lessonVersions.id, { onDelete: "cascade" }),
  learningObjectVersionId: uuid("learning_object_version_id").notNull().references(() => learningObjectVersions.id, { onDelete: "restrict" }),
  position: integer("position").notNull(),
}, (table) => [
  primaryKey({ columns: [table.lessonVersionId, table.learningObjectVersionId] }),
  uniqueIndex("lesson_version_objects_position_unique").on(table.lessonVersionId, table.position),
  check("lesson_version_objects_position_positive", sql`${table.position} > 0`),
]);

export const questions = pgTable("questions", {
  id: uuid("id").defaultRandom().primaryKey(),
  stableKey: text("stable_key").notNull().unique(),
  ...timestamps,
});

export const questionVersions = pgTable("question_versions", {
  id: uuid("id").defaultRandom().primaryKey(),
  questionId: uuid("question_id").notNull().references(() => questions.id, { onDelete: "cascade" }),
  versionNumber: integer("version_number").notNull(),
  prompt: text("prompt").notNull(),
  responseSchema: jsonb("response_schema").notNull(),
  scoringSchema: jsonb("scoring_schema").notNull(),
  feedbackRules: jsonb("feedback_rules").notNull(),
  status: contentStatus("status").default("draft").notNull(),
  createdBy: text("created_by").references(() => profiles.authUserId, { onDelete: "set null" }),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  ...timestamps,
}, (table) => [
  uniqueIndex("question_versions_number_unique").on(table.questionId, table.versionNumber),
  uniqueIndex("question_versions_one_published").on(table.questionId).where(sql`${table.status} = 'published'`),
  check("question_versions_number_positive", sql`${table.versionNumber} > 0`),
  check("question_versions_publish_timestamp", sql`(${table.status} in ('published', 'retired')) = (${table.publishedAt} is not null)`),
]);

export const learningObjectVersionQuestions = pgTable("learning_object_version_questions", {
  learningObjectVersionId: uuid("learning_object_version_id").notNull().references(() => learningObjectVersions.id, { onDelete: "cascade" }),
  questionVersionId: uuid("question_version_id").notNull().references(() => questionVersions.id, { onDelete: "restrict" }),
  position: integer("position").notNull(),
}, (table) => [
  primaryKey({ columns: [table.learningObjectVersionId, table.questionVersionId] }),
  uniqueIndex("learning_object_questions_position_unique").on(table.learningObjectVersionId, table.position),
  check("learning_object_questions_position_positive", sql`${table.position} > 0`),
]);

export const glossaryTerms = pgTable("glossary_terms", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").notNull().unique(),
  term: text("term").notNull(),
  ...timestamps,
}, (table) => [uniqueIndex("glossary_terms_term_unique").on(sql`lower(${table.term})`)]);

export const glossaryVersions = pgTable("glossary_versions", {
  id: uuid("id").defaultRandom().primaryKey(),
  glossaryTermId: uuid("glossary_term_id").notNull().references(() => glossaryTerms.id, { onDelete: "cascade" }),
  versionNumber: integer("version_number").notNull(),
  definition: text("definition").notNull(),
  status: contentStatus("status").default("draft").notNull(),
  createdBy: text("created_by").references(() => profiles.authUserId, { onDelete: "set null" }),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  ...timestamps,
}, (table) => [
  uniqueIndex("glossary_versions_number_unique").on(table.glossaryTermId, table.versionNumber),
  uniqueIndex("glossary_versions_one_published").on(table.glossaryTermId).where(sql`${table.status} = 'published'`),
  check("glossary_versions_number_positive", sql`${table.versionNumber} > 0`),
  check("glossary_versions_publish_timestamp", sql`(${table.status} in ('published', 'retired')) = (${table.publishedAt} is not null)`),
]);

export const sourceRecords = pgTable("source_records", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  sourceType: sourceType("source_type").notNull(),
  location: text("location").notNull(),
  pageRange: text("page_range"),
  retrievedAt: date("retrieved_at"),
  reviewedAt: date("reviewed_at"),
  rightsStatus: rightsStatus("rights_status").default("unknown").notNull(),
  notes: text("notes"),
  ...timestamps,
});

export const sourceLinks = pgTable("source_links", {
  id: uuid("id").defaultRandom().primaryKey(),
  sourceRecordId: uuid("source_record_id").notNull().references(() => sourceRecords.id, { onDelete: "cascade" }),
  lessonVersionId: uuid("lesson_version_id").references(() => lessonVersions.id, { onDelete: "cascade" }),
  learningObjectVersionId: uuid("learning_object_version_id").references(() => learningObjectVersions.id, { onDelete: "cascade" }),
  questionVersionId: uuid("question_version_id").references(() => questionVersions.id, { onDelete: "cascade" }),
  glossaryVersionId: uuid("glossary_version_id").references(() => glossaryVersions.id, { onDelete: "cascade" }),
  sourceExcerptNote: text("source_excerpt_note"),
  mappingUncertainty: text("mapping_uncertainty"),
  ...timestamps,
}, (table) => [
  check("source_links_exactly_one_target", sql`num_nonnulls(${table.lessonVersionId}, ${table.learningObjectVersionId}, ${table.questionVersionId}, ${table.glossaryVersionId}) = 1`),
  index("source_links_source_idx").on(table.sourceRecordId),
]);

export const reviewDecisions = pgTable("review_decisions", {
  id: uuid("id").defaultRandom().primaryKey(),
  targetType: reviewTargetType("target_type").notNull(),
  lessonVersionId: uuid("lesson_version_id").references(() => lessonVersions.id, { onDelete: "cascade" }),
  learningObjectVersionId: uuid("learning_object_version_id").references(() => learningObjectVersions.id, { onDelete: "cascade" }),
  questionVersionId: uuid("question_version_id").references(() => questionVersions.id, { onDelete: "cascade" }),
  glossaryVersionId: uuid("glossary_version_id").references(() => glossaryVersions.id, { onDelete: "cascade" }),
  decision: contentStatus("decision").notNull(),
  rationale: text("rationale"),
  reviewedBy: text("reviewed_by").notNull().references(() => profiles.authUserId, { onDelete: "restrict" }),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  check("review_decisions_exactly_one_target", sql`num_nonnulls(${table.lessonVersionId}, ${table.learningObjectVersionId}, ${table.questionVersionId}, ${table.glossaryVersionId}) = 1`),
  check("review_decisions_target_matches", sql`
    (${table.targetType} = 'lesson_version' and ${table.lessonVersionId} is not null)
    or (${table.targetType} = 'learning_object_version' and ${table.learningObjectVersionId} is not null)
    or (${table.targetType} = 'question_version' and ${table.questionVersionId} is not null)
    or (${table.targetType} = 'glossary_version' and ${table.glossaryVersionId} is not null)
  `),
]);

export const lessonProgress = pgTable("lesson_progress", {
  id: uuid("id").defaultRandom().primaryKey(),
  learnerId: text("learner_id").notNull().references(() => profiles.authUserId, { onDelete: "cascade" }),
  lessonId: uuid("lesson_id").notNull().references(() => lessons.id, { onDelete: "cascade" }),
  lessonVersionId: uuid("lesson_version_id").notNull().references(() => lessonVersions.id, { onDelete: "restrict" }),
  coverageState: coverageState("coverage_state").default("not_started").notNull(),
  lastObjectPosition: integer("last_object_position").default(1).notNull(),
  resumeState: jsonb("resume_state").default({}).notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  ...timestamps,
}, (table) => [
  uniqueIndex("lesson_progress_learner_lesson_unique").on(table.learnerId, table.lessonId),
  index("lesson_progress_learner_state_idx").on(table.learnerId, table.coverageState),
  check("lesson_progress_position_positive", sql`${table.lastObjectPosition} > 0`),
]);

export const practiceAttempts = pgTable("practice_attempts", {
  id: uuid("id").defaultRandom().primaryKey(),
  learnerId: text("learner_id").notNull().references(() => profiles.authUserId, { onDelete: "cascade" }),
  lessonVersionId: uuid("lesson_version_id").notNull().references(() => lessonVersions.id, { onDelete: "restrict" }),
  questionVersionId: uuid("question_version_id").notNull().references(() => questionVersions.id, { onDelete: "restrict" }),
  response: jsonb("response").notNull(),
  feedbackCategory: feedbackCategory("feedback_category").notNull(),
  misconceptionCode: text("misconception_code"),
  evidenceRecorded: boolean("evidence_recorded").default(true).notNull(),
  attemptedAt: timestamp("attempted_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("practice_attempts_learner_time_idx").on(table.learnerId, table.attemptedAt),
  check("practice_attempts_misconception_code", sql`${table.feedbackCategory} <> 'misconception' or ${table.misconceptionCode} is not null`),
]);

export const reviewQueue = pgTable("review_queue", {
  id: uuid("id").defaultRandom().primaryKey(),
  learnerId: text("learner_id").notNull().references(() => profiles.authUserId, { onDelete: "cascade" }),
  lessonId: uuid("lesson_id").notNull().references(() => lessons.id, { onDelete: "cascade" }),
  lessonVersionId: uuid("lesson_version_id").notNull().references(() => lessonVersions.id, { onDelete: "restrict" }),
  questionVersionId: uuid("question_version_id").references(() => questionVersions.id, { onDelete: "restrict" }),
  reason: reviewReason("reason").notNull(),
  evidence: jsonb("evidence").default({}).notNull(),
  dueAt: timestamp("due_at", { withTimezone: true }).notNull(),
  status: reviewQueueStatus("status").default("queued").notNull(),
  learnerOverride: jsonb("learner_override"),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  ...timestamps,
}, (table) => [
  index("review_queue_learner_due_idx").on(table.learnerId, table.status, table.dueAt),
  check("review_queue_completed_timestamp", sql`${table.status} <> 'completed' or ${table.completedAt} is not null`),
]);

export const bookmarks = pgTable("bookmarks", {
  id: uuid("id").defaultRandom().primaryKey(),
  learnerId: text("learner_id").notNull().references(() => profiles.authUserId, { onDelete: "cascade" }),
  lessonId: uuid("lesson_id").notNull().references(() => lessons.id, { onDelete: "cascade" }),
  learningObjectId: uuid("learning_object_id").references(() => learningObjects.id, { onDelete: "cascade" }),
  label: text("label"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex("bookmarks_target_unique").on(table.learnerId, table.lessonId, sql`coalesce(${table.learningObjectId}, '00000000-0000-0000-0000-000000000000'::uuid)`),
]);
