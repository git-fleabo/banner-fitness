export type QualitySettings = {
  checkScreening: boolean;
  checkFrequency: boolean;
  checkBalance: boolean;
  checkVolume: boolean;
  checkProgression: boolean;
  checkDuration: boolean;
  maxSetsPerSession: number;
  pressPullTolerance: number;
};

export const defaultQualitySettings: QualitySettings = {
  checkScreening: true,
  checkFrequency: true,
  checkBalance: true,
  checkVolume: true,
  checkProgression: true,
  checkDuration: true,
  maxSetsPerSession: 28,
  pressPullTolerance: 2,
};

export const QUALITY_EVIDENCE = {
  source: "ACSM",
  sourceTitle: "Resistance Training Prescription for Muscle Function, Hypertrophy, and Physical Performance in Healthy Adults: An Overview of Reviews",
  evidenceVersion: "2026",
  published: "2026-03",
} as const;

export const QUALITY_RULESET = {
  version: "engine-pt-2026.1",
  evidence: QUALITY_EVIDENCE,
} as const;

export type QualitySeverity = "blocking" | "significant" | "advisory" | "info";
export type QualityCategory = "screening" | "completeness" | "schedule" | "equipment" | "goal" | "balance" | "client-context" | "progression" | "duration" | "experience" | "preferences" | "performance";
export type QualityFindingRequirement = "requirement" | "uncertainty" | "optimisation";

export type QualityRuleDefinition = {
  id: string;
  category: QualityCategory;
  defaultSeverity: QualitySeverity;
  dependencies: string[];
  requirement: QualityFindingRequirement;
  evidence?: typeof QUALITY_EVIDENCE;
};

export type QualityExerciseContext = {
  id?: string;
  name: string;
  pattern: string;
  primaryMuscles?: string[];
  equipment?: string[];
  cautionTags?: string[];
  tags?: string[];
  technicalComplexity?: string | null;
  compound?: boolean;
  sets: number;
  repsMin?: number | null;
  repsMax?: number | null;
  intensityType?: string | null;
  intensityValue?: string | null;
  restSeconds?: number | null;
  progressionRule?: string | null;
};

export type QualitySessionContext = {
  id?: string;
  weekNumber?: number;
  dayOfWeek: number;
  name: string;
  sessionType?: string | null;
  durationMinutes?: number | null;
  exercises: QualityExerciseContext[];
};

export type QualityContext = {
  client: {
    preferredDays?: number[];
    trainingExperience?: string | null;
    dailyActivity?: string | null;
    sessionDurationMinutes?: number | null;
    sleepHours?: string | null;
    stressLevel?: string | null;
  };
  assessment?: {
    responses?: Record<string, unknown> | null;
    riskFlags?: Array<{ code?: string; action?: string; label?: string }> | null;
    clearanceRequired?: boolean;
    reviewDate?: string | null;
    ptNotes?: string | null;
    injuryNotes?: string | null;
    contraindicationNotes?: string | null;
  } | null;
  goal?: { goalType?: string | null; target?: string | null; metric?: string | null } | null;
  location?: { name?: string | null; locationType?: string | null; equipment?: string[] | null } | null;
  preferences?: { likedExercises?: string[]; dislikedExercises?: string[]; preferredEquipment?: string[]; confidenceNotes?: string | null } | null;
  programme: {
    id?: string;
    goalSummary?: string | null;
    durationWeeks: number;
    trainingDays?: number;
    sessions: QualitySessionContext[];
  };
  performanceRecords?: Array<{ exerciseId?: string | null; metricType?: string | null; value?: string | number | null; performanceDate?: string | null; painReported?: boolean; techniqueAcceptable?: boolean }>;
  recentResults?: Array<{ painReported?: boolean; energy?: number | null; sessionRpe?: number | null; notes?: string | null }>;
};

export type QualityFinding = {
  key: string;
  ruleId: string;
  category: QualityCategory;
  severity: QualitySeverity;
  title: string;
  message: string;
  rationale: string;
  suggestedActions: string[];
  requirement: QualityFindingRequirement;
  dependencies: string[];
  evidence?: typeof QUALITY_EVIDENCE;
  acknowledged?: boolean;
  acknowledgementDecision?: "acknowledged" | "overridden";
};

export type QualityReview = {
  score: number;
  approvalReadiness: "blocked" | "needs_review" | "pt_consideration" | "ready";
  findings: QualityFinding[];
  passedRuleIds: string[];
  totalSets: number;
  scheduledSessions: number;
  emptySessions: number;
  evaluatedAt: string;
  rulesetVersion: string;
  evidence: typeof QUALITY_EVIDENCE;
  sourceFingerprint: string;
  counts: { blocking: number; significant: number; advisory: number; info: number };
};

const numberInRange = (candidate: unknown, fallback: number, min: number, max: number) => {
  const number = typeof candidate === "number" && Number.isFinite(candidate) ? Math.round(candidate) : fallback;
  return Math.min(max, Math.max(min, number));
};

export function normalizeQualitySettings(value: unknown): QualitySettings {
  const source = value && typeof value === "object" ? value as Partial<QualitySettings> : {};
  return {
    checkScreening: source.checkScreening !== false,
    checkFrequency: source.checkFrequency !== false,
    checkBalance: source.checkBalance !== false,
    checkVolume: source.checkVolume !== false,
    checkProgression: source.checkProgression !== false,
    checkDuration: source.checkDuration !== false,
    maxSetsPerSession: numberInRange(source.maxSetsPerSession, defaultQualitySettings.maxSetsPerSession, 1, 100),
    pressPullTolerance: numberInRange(source.pressPullTolerance, defaultQualitySettings.pressPullTolerance, 0, 10),
  };
}

const asText = (value: unknown) => typeof value === "string" ? value.trim() : "";
const lower = (value: unknown) => asText(value).toLowerCase();
const list = (value: unknown) => Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
const unique = (values: string[]) => Array.from(new Set(values));
const hasText = (...values: unknown[]) => values.some((value) => asText(value).length > 0);
const isRecovery = (session: QualitySessionContext) => lower(session.sessionType) === "recovery" || /rest|recovery|off day/i.test(session.name);
const activeSessions = (context: QualityContext) => context.programme.sessions.filter((session) => !isRecovery(session));
const allExercises = (context: QualityContext) => activeSessions(context).flatMap((session) => session.exercises);
const goalText = (context: QualityContext) => lower(`${context.programme.goalSummary ?? ""} ${context.goal?.goalType ?? ""}`);
const isStrengthGoal = (context: QualityContext) => /strength|strong|powerlifting/.test(goalText(context));
const isHypertrophyGoal = (context: QualityContext) => /hypertrophy|muscle|size/.test(goalText(context));
const isPowerGoal = (context: QualityContext) => /power|explosive|athletic performance|jump/.test(goalText(context));
const isGeneralFullBodyGoal = (context: QualityContext) => /strength|fitness|hypertrophy|muscle|general|tone/.test(goalText(context));

function normaliseEquipment(value: string) {
  return lower(value).replace(/[._-]/g, " ").replace(/\s+/g, " ").trim();
}

function equipmentState(context: QualityContext, required: string) {
  const available = list(context.location?.equipment).map(normaliseEquipment);
  const requiredValue = normaliseEquipment(required);
  if (!requiredValue) return "unknown" as const;
  if (available.includes(requiredValue)) return "available" as const;
  const closedLocation = /home|minimal|outdoor/i.test(asText(context.location?.locationType));
  return closedLocation ? "unavailable" as const : "unknown" as const;
}

function bodyRegion(text: string) {
  const value = lower(text);
  return ["shoulder", "knee", "back", "hip", "ankle", "wrist", "elbow", "neck"].find((region) => value.includes(region)) ?? null;
}

function movementFamily(pattern: string) {
  const value = lower(pattern);
  if (/squat|knee|lunge|split|step.?up|leg press/.test(value)) return "knee-dominant";
  if (/hinge|deadlift|hip thrust|bridge|pull.?through/.test(value)) return "hip-dominant";
  if (/horizontal push|bench|chest press|push.?up/.test(value)) return "horizontal-push";
  if (/vertical push|overhead|shoulder press/.test(value)) return "vertical-push";
  if (/horizontal pull|row|face pull/.test(value)) return "horizontal-pull";
  if (/vertical pull|pull.?up|lat pulldown|climb/.test(value)) return "vertical-pull";
  return null;
}

function stableFingerprint(context: QualityContext) {
  const canonicalise = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(canonicalise);
    if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, canonicalise(item)]));
    return value;
  };
  const canonical = JSON.stringify(canonicalise(context));
  let hash = 2166136261;
  for (let index = 0; index < canonical.length; index += 1) {
    hash ^= canonical.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `fnv1a-${(hash >>> 0).toString(16)}`;
}

export const qualityRuleDefinitions: QualityRuleDefinition[] = [
  { id: "screening-clearance", category: "screening", defaultSeverity: "blocking", dependencies: ["assessment.clearanceRequired", "assessment.riskFlags", "assessment.ptNotes"], requirement: "requirement" },
  { id: "screening-review", category: "screening", defaultSeverity: "significant", dependencies: ["assessment.responses", "assessment.riskFlags", "assessment.reviewDate", "assessment.ptNotes"], requirement: "requirement" },
  { id: "screening-contradiction", category: "screening", defaultSeverity: "significant", dependencies: ["assessment.responses", "assessment.injuryNotes", "assessment.contraindicationNotes", "assessment.riskFlags", "assessment.ptNotes"], requirement: "requirement" },
  { id: "programme-completeness", category: "completeness", defaultSeverity: "significant", dependencies: ["programme.sessions", "programme.durationWeeks", "programme.trainingDays"], requirement: "requirement" },
  { id: "programme-thin-session", category: "completeness", defaultSeverity: "advisory", dependencies: ["programme.sessions"], requirement: "uncertainty" },
  { id: "schedule-alignment", category: "schedule", defaultSeverity: "advisory", dependencies: ["client.preferredDays", "programme.sessions"], requirement: "uncertainty" },
  { id: "equipment-compatibility", category: "equipment", defaultSeverity: "advisory", dependencies: ["location.equipment", "location.locationType", "programme.exercises", "exercise.equipment"], requirement: "uncertainty" },
  { id: "goal-strength-optimisation", category: "goal", defaultSeverity: "info", dependencies: ["goal.goalType", "programme.exercises.intensityValue", "programme.exercises.reps", "programme.exercises.sets", "programme.exercises.progressionRule"], requirement: "optimisation", evidence: QUALITY_EVIDENCE },
  { id: "goal-hypertrophy-volume", category: "goal", defaultSeverity: "advisory", dependencies: ["goal.goalType", "programme.exercises.primaryMuscles", "programme.exercises.sets", "programme.durationWeeks"], requirement: "optimisation", evidence: QUALITY_EVIDENCE },
  { id: "goal-power-intent", category: "goal", defaultSeverity: "advisory", dependencies: ["goal.goalType", "programme.exercises.tags", "programme.exercises.pattern", "programme.exercises.intensityValue"], requirement: "optimisation", evidence: QUALITY_EVIDENCE },
  { id: "muscle-frequency", category: "goal", defaultSeverity: "info", dependencies: ["goal.goalType", "programme.exercises.primaryMuscles", "programme.sessions"], requirement: "optimisation", evidence: QUALITY_EVIDENCE },
  { id: "movement-balance", category: "balance", defaultSeverity: "advisory", dependencies: ["programme.exercises.pattern", "programme.exercises.primaryMuscles", "client.dailyActivity", "goal.goalType"], requirement: "optimisation" },
  { id: "push-pull-balance", category: "balance", defaultSeverity: "advisory", dependencies: ["programme.exercises.pattern", "programme.exercises.sets", "client.dailyActivity"], requirement: "optimisation" },
  { id: "activity-recovery-context", category: "client-context", defaultSeverity: "info", dependencies: ["client.dailyActivity", "client.sleepHours", "client.stressLevel", "workoutResults"], requirement: "uncertainty" },
  { id: "missing-training-experience", category: "experience", defaultSeverity: "advisory", dependencies: ["client.trainingExperience", "programme.exercises.technicalComplexity", "goal.goalType"], requirement: "uncertainty" },
  { id: "missing-goal-specificity", category: "client-context", defaultSeverity: "info", dependencies: ["goal.goalType", "goal.target", "goal.metric"], requirement: "uncertainty" },
  { id: "missing-performance-baseline", category: "performance", defaultSeverity: "info", dependencies: ["goal.goalType", "client.performanceRecords"], requirement: "uncertainty" },
  { id: "exercise-pain-context", category: "client-context", defaultSeverity: "advisory", dependencies: ["assessment.injuryNotes", "assessment.contraindicationNotes", "assessment.ptNotes", "programme.exercises.name", "programme.exercises.cautionTags"], requirement: "uncertainty" },
  { id: "exercise-preference", category: "preferences", defaultSeverity: "info", dependencies: ["preferences.dislikedExercises", "programme.exercises.name"], requirement: "optimisation" },
  { id: "progression-rule", category: "progression", defaultSeverity: "advisory", dependencies: ["programme.exercises.progressionRule"], requirement: "optimisation" },
  { id: "session-duration", category: "duration", defaultSeverity: "advisory", dependencies: ["client.sessionDurationMinutes", "programme.sessions.durationMinutes", "programme.exercises.sets", "programme.exercises.restSeconds"], requirement: "uncertainty" },
  { id: "client-performance-signal", category: "performance", defaultSeverity: "significant", dependencies: ["workoutResults.painReported", "workoutResults.energy", "workoutResults.sessionRpe"], requirement: "requirement" },
];

const rule = (id: string) => qualityRuleDefinitions.find((definition) => definition.id === id) as QualityRuleDefinition;

function finding(ruleId: string, key: string, message: string, rationale: string, suggestedActions: string[], severity = rule(ruleId).defaultSeverity, extra: Partial<QualityFinding> = {}): QualityFinding {
  const definition = rule(ruleId);
  return { key, ruleId, category: definition.category, severity, title: key, message, rationale, suggestedActions, requirement: definition.requirement, dependencies: definition.dependencies, evidence: definition.evidence, ...extra };
}

export function evaluateProgrammeQuality(context: QualityContext, settings?: QualitySettings, evaluatedAt = new Date().toISOString()): QualityReview {
  const rules = normalizeQualitySettings(settings);
  const sessions = activeSessions(context);
  const exercises = allExercises(context);
  const findings: QualityFinding[] = [];
  const add = (item: QualityFinding) => findings.push(item);
  const screening = context.assessment;
  const injuryText = `${asText(screening?.injuryNotes)} ${asText(screening?.contraindicationNotes)} ${asText(screening?.ptNotes)}`.trim();
  const responses = screening?.responses ?? {};
  const riskFlags = screening?.riskFlags ?? [];
  const reviewed = Boolean(screening?.reviewDate) || /screening review recorded|pt screening review completed|professional clearance obtained/i.test(asText(screening?.ptNotes));

  if (rules.checkScreening && screening?.clearanceRequired) add(finding("screening-clearance", "Clearance status requires resolution", "A clearance requirement is recorded for this client. Resolve the appropriate screening, referral or professional-clearance process before approval.", "The quality system preserves the screening decision and does not diagnose or decide clearance on the PT’s behalf.", ["Review the current screening pathway and document the appropriate clearance or referral outcome."], "blocking", { title: "Clearance required before approval" }));
  const unresolvedFlags = riskFlags.length > 0 || Object.values(responses).some((value) => value === true);
  if (rules.checkScreening && unresolvedFlags && !reviewed && !screening?.clearanceRequired) add(finding("screening-review", "Screening review is not documented", "Screening or health-context information is present without a recorded PT screening decision. Document the scope, referral or clearance decision before approval.", "A positive screening response is an action record, not a diagnosis. The PT remains responsible for the decision and documentation.", ["Review the assessment and record the PT decision, referral boundary or appropriate professional clearance."], undefined, { title: "Screening review required" }));
  const musculoskeletalFalse = responses.injuryOrMusculoskeletalLimitation === false;
  const painRecorded = hasText(screening?.injuryNotes, screening?.contraindicationNotes) || /pain|injur|limitation|symptom|shoulder|knee|back|ankle|hip|wrist|elbow|neck/i.test(injuryText);
  if (rules.checkScreening && painRecorded && musculoskeletalFalse && !reviewed) add(finding("screening-contradiction", "Pain or injury information conflicts with screening", "Screening information requires clarification. Pain, injury or limitation is recorded while the musculoskeletal screening response indicates no injury or limitation. Confirm the current status and document the PT’s screening decision before programme approval.", "The engine identifies an inconsistent record; it does not diagnose the issue or automatically require medical clearance.", ["Confirm the current status, update the screening record if needed, and document the PT’s decision."], undefined, { title: "Screening information requires clarification" }));
  const unrestrictedMedicalResponse = responses.medicalIssue === false && responses.otherConcern === false && responses.medicationAffectingExercise === false && responses.recentSurgery === false;
  if (rules.checkScreening && hasText(screening?.contraindicationNotes) && unrestrictedMedicalResponse && !riskFlags.length && !reviewed && !(painRecorded && musculoskeletalFalse)) add(finding("screening-contradiction", "Recorded restriction conflicts with screening", "A contraindication or restriction is recorded while the health-context screening responses indicate no current concern. Confirm the current status and document the PT’s screening decision before approval.", "The engine identifies a contradictory record; it does not diagnose the concern or automatically decide that clearance is required.", ["Confirm the source information, update the screening record if needed, and document the PT’s decision."], undefined, { title: "Screening information requires clarification" }));
  const expectedSessions = context.programme.trainingDays && context.programme.durationWeeks ? context.programme.trainingDays * context.programme.durationWeeks : sessions.length;
  const emptySessions = sessions.filter((session) => session.exercises.length === 0).length;
  if (emptySessions > 0) add(finding("programme-completeness", "Programme incomplete", `${emptySessions} of ${expectedSessions || sessions.length} scheduled sessions contain no exercises.`, "Empty scheduled training sessions make the saved programme materially different from its intended frequency and cannot support approval without a PT decision.", ["Populate the sessions, mark intentional recovery sessions explicitly, or adjust the planned frequency."], undefined, { title: "Programme incomplete" }));
  const populatedCounts = sessions.filter((session) => session.exercises.length > 0).map((session) => session.exercises.length);
  const typicalCount = populatedCounts.length ? Math.max(...populatedCounts) : 0;
  const thin = sessions.filter((session) => session.exercises.length > 0 && typicalCount >= 3 && session.exercises.length < Math.max(2, Math.floor(typicalCount / 2)));
  if (thin.length) add(finding("programme-thin-session", "Some sessions are unusually sparse", `${thin.length} scheduled session${thin.length === 1 ? " is" : "s are"} much shorter than the programme’s other populated sessions.`, "A sparse session may be intentional, but the purpose should be clear relative to the planned structure.", ["Confirm whether the session is a deliberate lower-volume or technique exposure and record that rationale."], undefined, { title: "Check session structure" }));
  const preferredDays = Array.isArray(context.client.preferredDays) ? context.client.preferredDays.filter((day): day is number => typeof day === "number" && day >= 1 && day <= 7) : [];
  const programmeDays = unique(sessions.map((session) => String(session.dayOfWeek))).map(Number).sort((a, b) => a - b);
  if (rules.checkFrequency && preferredDays.length && programmeDays.length && preferredDays.join(",") !== programmeDays.join(",")) add(finding("schedule-alignment", "Training days differ from preference", "Programme training days differ from the client’s recorded preference. Confirm the schedule with the client.", "Preferred days support adherence, but the PT may intentionally choose another schedule.", ["Confirm the schedule with the client or record why the alternative days are appropriate."], undefined, { title: "Schedule alignment" }));
  const requiredEquipment = unique(exercises.flatMap((exercise) => list(exercise.equipment)));
  const unknownEquipment = requiredEquipment.filter((item) => equipmentState(context, item) === "unknown");
  const unavailableEquipment = requiredEquipment.filter((item) => equipmentState(context, item) === "unavailable");
  if (unknownEquipment.length || unavailableEquipment.length) add(finding("equipment-compatibility", "Equipment compatibility needs confirmation", `${unavailableEquipment.length ? `Some required equipment may be unavailable: ${unavailableEquipment.join(", ")}. ` : ""}${unknownEquipment.length ? `Availability is unverified for: ${unknownEquipment.join(", ")}.` : ""}`.trim(), "Equipment is checked by exact recorded requirement. A general label such as Barbell is not treated as proof that a Trap bar is available.", ["Confirm the equipment at the selected location or choose an exercise with known availability."], undefined, { title: unavailableEquipment.length ? "Equipment may be unavailable" : "Equipment availability unknown" }));
  if (isStrengthGoal(context) && exercises.length && !exercises.some((exercise) => /%\s*1rm|1rm|heavy|load/i.test(asText(exercise.intensityValue)))) add(finding("goal-strength-optimisation", "Strength prescription is plausible but may be optimised", "Current loading can improve strength. If maximising strength is the priority, consider whether some major movements should progressively include heavier loading.", "The 2026 ACSM evidence supports a range of loading and effort strategies; heavier loading around or above 80% 1RM and approximately 2–3 sets per exercise can enhance strength, but traditional rep brackets are not pass/fail rules.", ["Consider heavier exposures for selected major movements if the client’s experience, technique, recovery and goal support them."], undefined, { title: "Strength optimisation opportunity" }));
  if (isHypertrophyGoal(context)) {
    const weeklySets = new Map<string, number>();
    exercises.forEach((exercise) => list(exercise.primaryMuscles).forEach((muscle) => {
      weeklySets.set(lower(muscle), (weeklySets.get(lower(muscle)) ?? 0) + exercise.sets / Math.max(1, context.programme.durationWeeks));
    }));
    const lowMuscles = Array.from(weeklySets.entries()).filter(([, sets]) => sets < 6);
    if (lowMuscles.length) add(finding("goal-hypertrophy-volume", "Weekly hypertrophy volume is uncertain", `Recorded weekly exposure is below a useful optimisation range for ${lowMuscles.slice(0, 3).map(([muscle]) => muscle).join(", ")}.`, "ACSM identifies approximately 10 sets per muscle group per week as a useful target for optimising hypertrophy, not a universal minimum.", ["Review weekly exposure, recovery and adherence before deciding whether to add or redistribute volume."], undefined, { title: "Hypertrophy volume review" }));
  }
  if (isPowerGoal(context) && !exercises.some((exercise) => /jump|throw|sprint|plyometric|power|explosive|rapid|velocity|crisp/i.test(`${exercise.name} ${exercise.pattern} ${exercise.tags?.join(" ")} ${exercise.intensityValue ?? ""}`))) add(finding("goal-power-intent", "Power intent is not explicit", "The stated power goal is not clearly supported by an exercise or prescription that permits rapid concentric intent.", "For power, ACSM supports moderate loading approximately 30–70% 1RM with maximal intended concentric velocity; rep count alone is not sufficient evidence of power intent.", ["Add or identify an appropriate power exposure and document the intended velocity and quality constraint."], undefined, { title: "Power intent review" }));
  const families = new Set(exercises.map((exercise) => movementFamily(exercise.pattern)).filter(Boolean));
  const pressCount = exercises.filter((exercise) => movementFamily(exercise.pattern)?.includes("push")).length;
  const pullCount = exercises.filter((exercise) => movementFamily(exercise.pattern)?.includes("pull")).length;
  if (rules.checkBalance && pressCount > pullCount + rules.pressPullTolerance) add(finding("push-pull-balance", "Pressing and pulling exposure is uneven", "Pressing exposure is higher than pulling exposure in the saved programme. Consider the client’s wider activity before changing the balance.", "This is a programme-balance prompt, not a universal press-to-pull prescription; climbing and other activity may add pulling load outside the gym.", ["Review weekly movement exposure and external activity, then adjust only if it supports the client’s goal and recovery."], undefined, { title: "Press / pull balance" }));
  if (rules.checkBalance && isGeneralFullBodyGoal(context) && !families.has("knee-dominant")) add(finding("movement-balance", "Weekly movement-pattern coverage is uneven", "The programme has no obvious knee-dominant exposure across the scheduled week. This is a programme-balance observation, not a statement that the programme is unsafe or invalid.", "Movement-pattern coverage should be considered across the week and alongside the client’s wider activity, rather than by counting exercises in isolation.", ["Consider a suitable knee-dominant option if it supports the goal, client context and available equipment."], undefined, { title: "Movement-pattern balance" }));
  const activity = lower(context.client.dailyActivity);
  if (/climb/.test(activity) && !/\b\d+\s*(x|times|sessions?|days?)\b|minute|hour|intens|volume|duration/.test(activity)) add(finding("activity-recovery-context", "External climbing load is not detailed", "The client records climbing, but its frequency, duration or intensity is not detailed. Recovery and pulling/grip load assessment is therefore uncertain.", "Non-gym activity can materially change weekly loading; it should not be treated as zero simply because it is outside the programme.", ["Record the climbing frequency and typical duration/intensity, then review pulling, grip and recovery demands."], undefined, { title: "Recovery context is incomplete" }));
  if (!asText(context.client.trainingExperience)) add(finding("missing-training-experience", "Training experience is not recorded", "Training experience or training age is missing, so exercise complexity, loading and recovery assumptions cannot be judged confidently.", "Experience is relevant context for interpreting the prescription; it is not a diagnosis or an automatic reason to reject the programme.", ["Record the client’s resistance-training experience or explain the basis for the current assumptions."], undefined, { title: "Training experience missing" }));
  if (!asText(context.goal?.target) && !asText(context.goal?.metric)) add(finding("missing-goal-specificity", "Goal interpretation is broad", "The programme goal is recorded, but no measurable target or metric is available for a confident review of programme construction.", "A broad goal can still guide programming; a target or metric makes the PT decision more auditable.", ["Add a measurable interpretation of the goal where useful, such as a lift, repetition, performance or adherence target."], undefined, { title: "Goal specificity opportunity" }));
  if (isStrengthGoal(context) && !(context.performanceRecords ?? []).length) add(finding("missing-performance-baseline", "No client performance baseline is recorded", "The client’s strength goal has no dated performance baseline, so current ability and loading assumptions are harder to interpret.", "A baseline can be useful context for strength programming, but a maximal 1RM test is not required and may not be appropriate for every client.", ["Consider recording a suitable submaximal rep max, estimated 1RM or other relevant performance measure if it will improve the PT decision."], undefined, { title: "Performance baseline opportunity" }));
  const painRegion = bodyRegion(injuryText);
  if (painRecorded && painRegion) {
    const related = exercises.filter((exercise) => lower(`${exercise.name} ${exercise.pattern} ${exercise.cautionTags?.join(" ")}`).includes(painRegion));
    const relatedNames = unique(related.map((exercise) => exercise.name));
    if (relatedNames.length) add(finding("exercise-pain-context", "Pain context intersects with exercise selection", `Recorded ${painRegion} pain may be relevant to ${relatedNames.join(" and ")}. Confirm tolerance/appropriateness or choose an alternative.`, "This is a PT decision prompt. The engine does not say that the exercise is unsafe, diagnose an injury or prescribe treatment.", ["Review the documented context and exercise tolerance, then confirm the choice or select an alternative."], undefined, { title: "Exercise choice needs PT confirmation" }));
    else if (!reviewed) add(finding("exercise-pain-context", "Pain context is not detailed enough", `Recorded ${painRegion} pain has not been connected to exercise tolerance or a documented movement decision.`, "The engine cannot infer tolerance from a body-region label alone.", ["Record the relevant context and the PT’s in-scope decision before approval."], undefined, { title: "Pain context needs clarification" }));
  }
  const disliked = list(context.preferences?.dislikedExercises).map(lower);
  const dislikedExercises = exercises.filter((exercise) => disliked.includes(lower(exercise.name)));
  if (dislikedExercises.length) add(finding("exercise-preference", "Exercise preference mismatch", `${dislikedExercises.map((exercise) => exercise.name).join(", ")} is recorded as disliked by the client.`, "Preferences can affect confidence and adherence, while the PT may have a documented reason to retain an exercise.", ["Confirm the client’s preference or record why the exercise remains appropriate."], undefined, { title: "Client preference review" }));
  const missingProgression = exercises.filter((exercise) => !asText(exercise.progressionRule));
  if (rules.checkProgression && missingProgression.length) add(finding("progression-rule", "Progression is not documented for every exercise", `${missingProgression.length} prescribed exercise${missingProgression.length === 1 ? " lacks" : "s lack"} a progression rule.`, "Progression should be interpretable and gated by effort, technique, pain and recovery; complexity or failure training is not a quality requirement.", ["Add a clear progression, hold and regression decision for the affected exercises."], undefined, { title: "Progression rule missing" }));
  const durationLimit = context.client.sessionDurationMinutes;
  const overDuration = sessions.filter((session) => {
    const minutes = session.durationMinutes ?? durationLimit ?? 0;
    const estimated = session.exercises.reduce((total, exercise) => total + exercise.sets * 2 + Math.max(0, (exercise.sets - 1) * Math.ceil((exercise.restSeconds ?? 60) / 60)), 5);
    return minutes > 0 && estimated > minutes;
  });
  if (rules.checkDuration && overDuration.length) add(finding("session-duration", "Session duration may be exceeded", `${overDuration.length} scheduled session${overDuration.length === 1 ? " may" : "s may"} exceed the recorded duration at the current prescription.`, "Duration checks are estimates and should be interpreted with warm-up, coaching, transitions and client pace in mind.", ["Review exercise count, rest and session priorities, or update the recorded duration."], undefined, { title: "Session duration review" }));
  const recentPain = context.recentResults?.some((result) => result.painReported);
  if (recentPain) add(finding("client-performance-signal", "Recent workout pain was recorded", "A recent workout result includes reported pain. Review the result and programme response before treating the current prescription as ready for approval.", "Workout results are feedback signals, not diagnoses. They should inform PT review and progression decisions.", ["Review the result, document the PT decision and hold or adapt progression where appropriate."], undefined, { title: "Recent performance signal" }));
  const muscleExposure = new Map<string, number>();
  exercises.forEach((exercise) => list(exercise.primaryMuscles).forEach((muscle) => {
    muscleExposure.set(lower(muscle), (muscleExposure.get(lower(muscle)) ?? 0) + 1);
  }));
  if ((isStrengthGoal(context) || isHypertrophyGoal(context)) && sessions.length > 1 && muscleExposure.size && Math.max(...muscleExposure.values()) < 2) add(finding("muscle-frequency", "Weekly muscle exposure is concentrated", "Major-muscle exposure appears to occur once weekly in the saved structure. Consider whether approximately twice-weekly exposure would better support the stated goal and client adherence.", "ACSM supports considering frequency and weekly volume together; the engine does not require every muscle to have two isolated exercises.", ["Review compound exposure across the week before adding work solely to satisfy a count."], undefined, { title: "Frequency optimisation opportunity" }));

  const totalSets = exercises.reduce((sum, exercise) => sum + exercise.sets, 0);
  const counts = { blocking: 0, significant: 0, advisory: 0, info: 0 };
  findings.forEach((item) => { counts[item.severity] += 1; });
  const penalty = counts.blocking * 35 + counts.significant * 15 + counts.advisory * 5 + counts.info;
  const score = Math.max(0, Math.min(100, 100 - penalty));
  const approvalReadiness = counts.blocking ? "blocked" : counts.significant ? "needs_review" : counts.advisory ? "pt_consideration" : "ready";
  const activeRuleIds = new Set(findings.map((item) => item.ruleId));
  return { score, approvalReadiness, findings, passedRuleIds: qualityRuleDefinitions.map((item) => item.id).filter((id) => !activeRuleIds.has(id)), totalSets, scheduledSessions: sessions.length, emptySessions, evaluatedAt, rulesetVersion: QUALITY_RULESET.version, evidence: QUALITY_EVIDENCE, sourceFingerprint: stableFingerprint(context), counts };
}

// Compatibility helper for the older prompt/export surfaces. New UI and persistence use evaluateProgrammeQuality.
export function buildQualityWarnings({ sessions, trainingDays, screening, settings }: { sessions: Array<{ durationMinutes: number; exercises: Array<{ pattern: string; prescription: string; progressionRule?: string | null }> }>; trainingDays: number; screening: boolean; settings?: QualitySettings }) {
  const context: QualityContext = { client: { preferredDays: Array.from({ length: trainingDays }, (_, index) => index + 1) }, assessment: screening ? { riskFlags: [{ code: "screening", action: "assessment" }] } : null, programme: { durationWeeks: 1, trainingDays, sessions: sessions.map((session, index) => ({ dayOfWeek: index + 1, name: `Day ${index + 1}`, durationMinutes: session.durationMinutes, exercises: session.exercises.map((exercise) => ({ name: "Exercise", pattern: exercise.pattern, sets: Number(exercise.prescription.match(/^\d+/)?.[0] ?? 0), progressionRule: exercise.progressionRule })) })) } };
  const review = evaluateProgrammeQuality(context, settings);
  return { warnings: review.findings.map((item) => item.message), totalSets: review.totalSets, score: review.score };
}
