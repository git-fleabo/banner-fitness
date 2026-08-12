import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const accountRole = pgEnum("account_role", ["owner", "pt", "learner"]);
export const accountStatus = pgEnum("account_status", ["invited", "active", "blocked"]);
export const ptInviteStatus = pgEnum("pt_invite_status", ["pending", "claimed", "revoked"]);
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
export const ptClientStatus = pgEnum("pt_client_status", ["active", "archived"]);
export const ptProgrammeStatus = pgEnum("pt_programme_status", ["draft", "reviewed", "assigned", "active", "paused", "completed", "archived"]);
export const ptGoalPriority = pgEnum("pt_goal_priority", ["primary", "secondary"]);
export const ptSessionType = pgEnum("pt_session_type", ["strength", "hypertrophy", "conditioning", "mobility", "mixed", "recovery"]);
export const ptIntensityType = pgEnum("pt_intensity_type", ["rir", "rpe", "percent_1rm", "load", "pace", "heart_rate", "duration"]);
export const ptWorkoutStatus = pgEnum("pt_workout_status", ["completed", "partial", "missed", "skipped"]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
};

export const ptClients = pgTable("pt_clients", {
  id: uuid("id").defaultRandom().primaryKey(),
  ownerProfileId: text("owner_profile_id").notNull().references(() => profiles.authUserId, { onDelete: "cascade" }),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email"),
  dateOfBirth: date("date_of_birth"),
  sexOrGender: text("sex_or_gender"),
  heightCm: integer("height_cm"),
  weightKg: integer("weight_kg"),
  bodyComposition: jsonb("body_composition").default({}).notNull(),
  occupation: text("occupation"),
  dailyActivity: text("daily_activity"),
  trainingExperience: text("training_experience"),
  sleepHours: text("sleep_hours"),
  stressLevel: text("stress_level"),
  sessionDurationMinutes: smallint("session_duration_minutes"),
  preferredDays: jsonb("preferred_days").default([]).notNull(),
  notes: text("notes"),
  status: ptClientStatus("status").default("active").notNull(),
  ...timestamps,
}, (table) => [index("pt_clients_owner_status_idx").on(table.ownerProfileId, table.status)]);

export const ptAssessments = pgTable("pt_assessments", {
  id: uuid("id").defaultRandom().primaryKey(),
  clientId: uuid("client_id").notNull().references(() => ptClients.id, { onDelete: "cascade" }),
  assessmentDate: date("assessment_date").notNull(),
  reviewDate: date("review_date"),
  responses: jsonb("responses").default({}).notNull(),
  riskFlags: jsonb("risk_flags").default([]).notNull(),
  clearanceRequired: boolean("clearance_required").default(false).notNull(),
  ptNotes: text("pt_notes"),
  ...timestamps,
}, (table) => [index("pt_assessments_client_date_idx").on(table.clientId, table.assessmentDate)]);

export const ptDesignerSettings = pgTable("pt_designer_settings", {
  ownerProfileId: text("owner_profile_id").primaryKey().references(() => profiles.authUserId, { onDelete: "cascade" }),
  qualityRules: jsonb("quality_rules").default({}).notNull(),
  ...timestamps,
});

export const ptGoals = pgTable("pt_goals", {
  id: uuid("id").defaultRandom().primaryKey(),
  clientId: uuid("client_id").notNull().references(() => ptClients.id, { onDelete: "cascade" }),
  goalType: text("goal_type").notNull(),
  priority: ptGoalPriority("priority").default("secondary").notNull(),
  target: text("target"),
  metric: text("metric"),
  ...timestamps,
}, (table) => [index("pt_goals_client_priority_idx").on(table.clientId, table.priority)]);

export const ptPreferences = pgTable("pt_preferences", {
  id: uuid("id").defaultRandom().primaryKey(),
  clientId: uuid("client_id").notNull().references(() => ptClients.id, { onDelete: "cascade" }),
  likedExercises: jsonb("liked_exercises").default([]).notNull(),
  dislikedExercises: jsonb("disliked_exercises").default([]).notNull(),
  preferredStyle: text("preferred_style"),
  preferredStructure: text("preferred_structure"),
  preferredEquipment: jsonb("preferred_equipment").default([]).notNull(),
  cardioModalities: jsonb("cardio_modalities").default([]).notNull(),
  varietyPreference: text("variety_preference"),
  confidenceNotes: text("confidence_notes"),
  ...timestamps,
}, (table) => [uniqueIndex("pt_preferences_client_unique").on(table.clientId)]);

export const ptLocations = pgTable("pt_locations", {
  id: uuid("id").defaultRandom().primaryKey(),
  clientId: uuid("client_id").notNull().references(() => ptClients.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  locationType: text("location_type").notNull(),
  equipment: jsonb("equipment").default([]).notNull(),
  ...timestamps,
}, (table) => [index("pt_locations_client_idx").on(table.clientId)]);

export const ptProgrammeTemplates = pgTable("pt_programme_templates", {
  id: uuid("id").defaultRandom().primaryKey(),
  ownerProfileId: text("owner_profile_id").notNull().references(() => profiles.authUserId, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  goalSummary: text("goal_summary").notNull(),
  sessionDurationMinutes: smallint("session_duration_minutes").default(45).notNull(),
  experienceLevel: text("experience_level").default("varied").notNull(),
  frameworkType: text("framework_type").default("original").notNull(),
  sessions: jsonb("sessions").default([]).notNull(),
  ...timestamps,
}, (table) => [index("pt_programme_templates_owner_updated_idx").on(table.ownerProfileId, table.updatedAt)]);

export const ptExercises = pgTable("pt_exercises", {
  id: uuid("id").defaultRandom().primaryKey(),
  ownerProfileId: text("owner_profile_id").references(() => profiles.authUserId, { onDelete: "cascade" }),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  movementPattern: text("movement_pattern").notNull(),
  primaryMuscles: jsonb("primary_muscles").default([]).notNull(),
  secondaryMuscles: jsonb("secondary_muscles").default([]).notNull(),
  equipment: jsonb("equipment").default([]).notNull(),
  difficulty: text("difficulty").notNull(),
  technicalComplexity: text("technical_complexity").notNull(),
  suitability: jsonb("suitability").default([]).notNull(),
  compound: boolean("compound").default(true).notNull(),
  unilateral: boolean("unilateral").default(false).notNull(),
  tags: jsonb("tags").default([]).notNull(),
  regressions: jsonb("regressions").default([]).notNull(),
  progressions: jsonb("progressions").default([]).notNull(),
  alternatives: jsonb("alternatives").default([]).notNull(),
  coachingCues: jsonb("coaching_cues").default([]).notNull(),
  commonErrors: jsonb("common_errors").default([]).notNull(),
  cautionTags: jsonb("caution_tags").default([]).notNull(),
  ...timestamps,
}, (table) => [index("pt_exercises_pattern_idx").on(table.movementPattern), index("pt_exercises_owner_idx").on(table.ownerProfileId)]);

export const ptClientPerformanceRecords = pgTable("pt_client_performance_records", {
  id: uuid("id").defaultRandom().primaryKey(),
  clientId: uuid("client_id").notNull().references(() => ptClients.id, { onDelete: "cascade" }),
  exerciseId: uuid("exercise_id").references(() => ptExercises.id, { onDelete: "set null" }),
  metricType: text("metric_type").notNull(),
  metricName: text("metric_name"),
  performanceDate: date("performance_date").notNull(),
  value: numeric("value", { precision: 10, scale: 2 }).notNull(),
  unit: text("unit").notNull(),
  repetitions: smallint("repetitions"),
  loadKg: numeric("load_kg", { precision: 10, scale: 2 }),
  source: text("source").notNull(),
  confidence: text("confidence"),
  techniqueAcceptable: boolean("technique_acceptable").default(true).notNull(),
  painReported: boolean("pain_reported").default(false).notNull(),
  notes: text("notes"),
  ...timestamps,
}, (table) => [index("pt_client_performance_client_date_idx").on(table.clientId, table.performanceDate), index("pt_client_performance_exercise_idx").on(table.exerciseId), check("pt_client_performance_value_positive", sql`${table.value} > 0`)]);

export const ptProgrammes = pgTable("pt_programmes", {
  id: uuid("id").defaultRandom().primaryKey(),
  ownerProfileId: text("owner_profile_id").notNull().references(() => profiles.authUserId, { onDelete: "cascade" }),
  clientId: uuid("client_id").notNull().references(() => ptClients.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  goalSummary: text("goal_summary").notNull(),
  durationWeeks: smallint("duration_weeks").notNull(),
  methodology: text("methodology").notNull(),
  status: ptProgrammeStatus("status").default("draft").notNull(),
  startDate: date("start_date"),
  endDate: date("end_date"),
  currentWeek: smallint("current_week").default(1).notNull(),
  version: integer("version").default(1).notNull(),
  rationale: text("rationale"),
  overrideReasons: jsonb("override_reasons").default([]).notNull(),
  ...timestamps,
}, (table) => [index("pt_programmes_owner_status_idx").on(table.ownerProfileId, table.status), index("pt_programmes_client_idx").on(table.clientId)]);

export const ptProgrammeWeeks = pgTable("pt_programme_weeks", {
  id: uuid("id").defaultRandom().primaryKey(),
  programmeId: uuid("programme_id").notNull().references(() => ptProgrammes.id, { onDelete: "cascade" }),
  weekNumber: smallint("week_number").notNull(),
  focus: text("focus").notNull(),
  volumeTarget: text("volume_target"),
  intensityTarget: text("intensity_target"),
  ...timestamps,
}, (table) => [uniqueIndex("pt_programme_weeks_number_unique").on(table.programmeId, table.weekNumber)]);

export const ptSessions = pgTable("pt_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  programmeWeekId: uuid("programme_week_id").notNull().references(() => ptProgrammeWeeks.id, { onDelete: "cascade" }),
  locationId: uuid("location_id").references(() => ptLocations.id, { onDelete: "set null" }),
  dayOfWeek: smallint("day_of_week").notNull(),
  name: text("name").notNull(),
  sessionType: ptSessionType("session_type").notNull(),
  durationMinutes: smallint("duration_minutes").notNull(),
  warmupMinutes: smallint("warmup_minutes").default(5).notNull(),
  cooldownMinutes: smallint("cooldown_minutes").default(0).notNull(),
  notes: text("notes"),
  sortOrder: smallint("sort_order").default(0).notNull(),
  ...timestamps,
}, (table) => [index("pt_sessions_week_day_idx").on(table.programmeWeekId, table.dayOfWeek)]);

export const ptExercisePrescriptions = pgTable("pt_exercise_prescriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionId: uuid("session_id").notNull().references(() => ptSessions.id, { onDelete: "cascade" }),
  exerciseId: uuid("exercise_id").notNull().references(() => ptExercises.id, { onDelete: "restrict" }),
  orderIndex: smallint("order_index").notNull(),
  sets: smallint("sets").notNull(),
  repsMin: smallint("reps_min"),
  repsMax: smallint("reps_max"),
  intensityType: ptIntensityType("intensity_type").notNull(),
  intensityValue: text("intensity_value").notNull(),
  restSeconds: smallint("rest_seconds"),
  tempo: text("tempo"),
  progressionRule: text("progression_rule"),
  groupKey: text("group_key"),
  technique: text("technique"),
  notes: text("notes"),
  ...timestamps,
}, (table) => [uniqueIndex("pt_prescriptions_session_order_unique").on(table.sessionId, table.orderIndex), index("pt_prescriptions_exercise_idx").on(table.exerciseId)]);

export const ptProgrammeEvents = pgTable("pt_programme_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  programmeId: uuid("programme_id").notNull().references(() => ptProgrammes.id, { onDelete: "cascade" }),
  actorProfileId: text("actor_profile_id").notNull().references(() => profiles.authUserId, { onDelete: "restrict" }),
  action: text("action").notNull(),
  details: jsonb("details").default({}).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [index("pt_programme_events_programme_time_idx").on(table.programmeId, table.createdAt)]);

export const ptWorkoutResults = pgTable("pt_workout_results", {
  id: uuid("id").defaultRandom().primaryKey(),
  ownerProfileId: text("owner_profile_id").notNull().references(() => profiles.authUserId, { onDelete: "cascade" }),
  clientId: uuid("client_id").notNull().references(() => ptClients.id, { onDelete: "cascade" }),
  sessionId: uuid("session_id").notNull().references(() => ptSessions.id, { onDelete: "cascade" }),
  scheduledDate: date("scheduled_date").notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  status: ptWorkoutStatus("status").notNull(),
  sessionRpe: smallint("session_rpe"),
  energy: smallint("energy"),
  painReported: boolean("pain_reported").default(false).notNull(),
  enjoyment: smallint("enjoyment"),
  durationMinutes: smallint("duration_minutes"),
  volumeLoadKg: integer("volume_load_kg").default(0).notNull(),
  repetitionLoad: integer("repetition_load").default(0).notNull(),
  averageRpe: smallint("average_rpe"),
  averageRir: smallint("average_rir"),
  notes: text("notes"),
  ...timestamps,
}, (table) => [index("pt_workout_results_client_date_idx").on(table.clientId, table.scheduledDate), index("pt_workout_results_owner_status_idx").on(table.ownerProfileId, table.status)]);

export const ptWorkoutResultSets = pgTable("pt_workout_result_sets", {
  id: uuid("id").defaultRandom().primaryKey(),
  workoutResultId: uuid("workout_result_id").notNull().references(() => ptWorkoutResults.id, { onDelete: "cascade" }),
  prescriptionId: uuid("prescription_id").notNull().references(() => ptExercisePrescriptions.id, { onDelete: "restrict" }),
  setNumber: smallint("set_number").notNull(),
  actualReps: smallint("actual_reps"),
  actualLoadKg: integer("actual_load_kg"),
  actualRpe: smallint("actual_rpe"),
  actualRir: smallint("actual_rir"),
  techniqueAcceptable: boolean("technique_acceptable").default(true).notNull(),
  painReported: boolean("pain_reported").default(false).notNull(),
  ...timestamps,
}, (table) => [uniqueIndex("pt_workout_result_sets_number_unique").on(table.workoutResultId, table.prescriptionId, table.setNumber)]);

export const ptProgrammeQualityReviews = pgTable("pt_programme_quality_reviews", {
  programmeId: uuid("programme_id").primaryKey().references(() => ptProgrammes.id, { onDelete: "cascade" }),
  rulesetVersion: text("ruleset_version").notNull(),
  evidenceVersion: text("evidence_version").notNull(),
  evaluatedAt: timestamp("evaluated_at", { withTimezone: true }).defaultNow().notNull(),
  score: smallint("score").notNull(),
  approvalReadiness: text("approval_readiness").notNull(),
  blockingCount: smallint("blocking_count").notNull(),
  significantCount: smallint("significant_count").notNull(),
  advisoryCount: smallint("advisory_count").notNull(),
  infoCount: smallint("info_count").notNull(),
  scheduledSessions: smallint("scheduled_sessions").notNull(),
  emptySessions: smallint("empty_sessions").notNull(),
  totalSets: integer("total_sets").notNull(),
  sourceFingerprint: text("source_fingerprint").notNull(),
  findings: jsonb("findings").default([]).notNull(),
  passedRuleIds: jsonb("passed_rule_ids").default([]).notNull(),
  ...timestamps,
}, (table) => [index("pt_quality_reviews_readiness_idx").on(table.approvalReadiness)]);

export const ptProgrammeQualityAcknowledgements = pgTable("pt_programme_quality_acknowledgements", {
  id: uuid("id").defaultRandom().primaryKey(),
  programmeId: uuid("programme_id").notNull().references(() => ptProgrammes.id, { onDelete: "cascade" }),
  ruleId: text("rule_id").notNull(),
  findingKey: text("finding_key").notNull(),
  decision: text("decision").notNull(),
  reason: text("reason").notNull(),
  rulesetVersion: text("ruleset_version").notNull(),
  evidenceVersion: text("evidence_version").notNull(),
  sourceFingerprint: text("source_fingerprint").notNull(),
  ...timestamps,
}, (table) => [uniqueIndex("pt_quality_acknowledgements_finding_unique").on(table.programmeId, table.findingKey), index("pt_quality_acknowledgements_programme_idx").on(table.programmeId)]);

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

export const ptInvitations = pgTable("pt_invitations", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull(),
  invitedBy: text("invited_by").notNull().references(() => profiles.authUserId, { onDelete: "cascade" }),
  status: ptInviteStatus("status").default("pending").notNull(),
  claimedAt: timestamp("claimed_at", { withTimezone: true }),
  ...timestamps,
}, (table) => [index("pt_invitations_email_status_idx").on(table.email, table.status)]);

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
