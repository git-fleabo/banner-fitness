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
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const accountRole = pgEnum("account_role", ["owner", "pt", "learner"]);
export const accountStatus = pgEnum("account_status", ["invited", "active", "blocked"]);
export const ptInviteStatus = pgEnum("pt_invite_status", ["pending", "claimed", "revoked"]);
export const ptClientStatus = pgEnum("pt_client_status", ["active", "archived"]);
export const ptProgrammeStatus = pgEnum("pt_programme_status", ["draft", "reviewed", "assigned", "active", "paused", "completed", "archived"]);
export const ptGoalPriority = pgEnum("pt_goal_priority", ["primary", "secondary"]);
export const ptSessionType = pgEnum("pt_session_type", ["strength", "hypertrophy", "conditioning", "mobility", "mixed", "recovery"]);
export const ptSessionManagement = pgEnum("pt_session_management", ["pt_managed", "self_managed"]);
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
  clientColour: text("client_colour").default("emerald").notNull(),
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
  scheduledTime: text("scheduled_time"),
  managementMode: ptSessionManagement("management_mode").default("pt_managed").notNull(),
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
