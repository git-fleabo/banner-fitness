export type ScreeningAnswers = {
  chestPain?: boolean;
  cardiovascularHistory?: boolean;
  dizzinessOrFainting?: boolean;
  unusualBreathlessness?: boolean;
  diagnosedDisease?: boolean;
  medicalIssue?: boolean;
  medicationAffectingExercise?: boolean;
  recentSurgery?: boolean;
  injuryOrMusculoskeletalLimitation?: boolean;
  pregnancyOrPostpartum?: boolean;
  otherConcern?: boolean;
};

export type ScreeningFlag = {
  code: string;
  label: string;
  action: "clearance" | "assessment" | "scope";
};

export const screeningReviewMarker = "[SCREENING REVIEW RECORDED]";

export function hasRecordedScreeningReview(notes: string | null | undefined) {
  return notes?.includes(screeningReviewMarker) ?? false;
}

export function getScreeningFlags(answers: ScreeningAnswers): ScreeningFlag[] {
  const flags: ScreeningFlag[] = [];
  if (answers.chestPain || answers.cardiovascularHistory || answers.diagnosedDisease) {
    flags.push({ code: "medical-clearance", label: "Cardiovascular, metabolic or renal history/symptoms require appropriate clearance before exercise programming.", action: "clearance" });
  }
  if (answers.dizzinessOrFainting || answers.unusualBreathlessness) {
    flags.push({ code: "symptom-assessment", label: "Dizziness, fainting or unusual breathlessness should be assessed before higher-intensity exercise.", action: "assessment" });
  }
  if (answers.medicalIssue || answers.medicationAffectingExercise || answers.recentSurgery) {
    flags.push({ code: "health-review", label: "Current health, medication or recent surgery needs a documented PT scope and referral review.", action: "scope" });
  }
  if (answers.injuryOrMusculoskeletalLimitation) {
    flags.push({ code: "musculoskeletal-review", label: "Pain, injury or movement limitation needs appropriate assessment; do not assume an exercise workaround is safe.", action: "scope" });
  }
  if (answers.pregnancyOrPostpartum) {
    flags.push({ code: "pregnancy-review", label: "Pregnancy or postpartum considerations require appropriate screening and scope-aware programming.", action: "scope" });
  }
  if (answers.otherConcern) {
    flags.push({ code: "pt-review", label: "The PT should record the concern and decide whether additional screening or referral is appropriate.", action: "assessment" });
  }
  return flags;
}

export type QualityExercise = {
  name: string;
  pattern: string;
  equipment: string[];
  technicalComplexity: "low" | "moderate" | "high";
  primaryMuscles: string[];
  sets: number;
};

export type QualitySession = {
  name: string;
  durationMinutes: number;
  targetDurationMinutes: number;
  exercises: QualityExercise[];
  dayOfWeek: number;
};

export type QualityProgramme = {
  goal: string;
  trainingDays: number;
  experience: "beginner" | "intermediate" | "advanced";
  availableEquipment: string[];
  sessions: QualitySession[];
  screeningFlags?: ScreeningFlag[];
};

export type QualityWarning = {
  code: string;
  severity: "info" | "warning" | "critical";
  message: string;
};

export type QualityResult = { score: number; warnings: QualityWarning[] };

export function checkProgrammeQuality(programme: QualityProgramme): QualityResult {
  const warnings: QualityWarning[] = [];
  const patterns = programme.sessions.flatMap((session) => session.exercises.map((exercise) => exercise.pattern));
  const presses = patterns.filter((pattern) => /push|press/i.test(pattern)).length;
  const pulls = patterns.filter((pattern) => /pull|row/i.test(pattern)).length;
  const uniqueDays = new Set(programme.sessions.map((session) => session.dayOfWeek)).size;
  const totalSets = programme.sessions.reduce((sum, session) => sum + session.exercises.reduce((inner, exercise) => inner + exercise.sets, 0), 0);

  if (programme.screeningFlags?.some((flag) => flag.action === "clearance")) warnings.push({ code: "screening-clearance", severity: "critical", message: "Screening flags indicate that appropriate clearance should be resolved before finalising this programme." });
  else if (programme.screeningFlags?.length) warnings.push({ code: "screening-review", severity: "warning", message: "Screening flags are present. Record the PT decision and any referral or scope boundary before assigning." });
  if (uniqueDays < programme.trainingDays) warnings.push({ code: "frequency", severity: "warning", message: `The programme has ${uniqueDays} scheduled training day${uniqueDays === 1 ? "" : "s"}, below the selected ${programme.trainingDays}-day target.` });
  if (programme.experience === "beginner" && programme.sessions.some((session) => session.exercises.some((exercise) => exercise.technicalComplexity === "high"))) warnings.push({ code: "complexity", severity: "warning", message: "This programme uses technically demanding exercises for a beginner. Consider simpler alternatives or additional coaching." });
  if (presses > pulls + 2) warnings.push({ code: "push-pull-balance", severity: "warning", message: "This programme contains a high amount of pressing volume relative to pulling volume." });
  if (totalSets > programme.sessions.length * (programme.experience === "beginner" ? 18 : 28)) warnings.push({ code: "volume", severity: "warning", message: "Total prescribed set volume may be high for the selected training experience and recovery assumptions." });
  const unavailable = programme.sessions.flatMap((session) => session.exercises.flatMap((exercise) => exercise.equipment.filter((item) => !programme.availableEquipment.includes(item))));
  if (unavailable.length) warnings.push({ code: "equipment", severity: "warning", message: `Some exercises require equipment not listed for this location: ${[...new Set(unavailable)].join(", ")}.` });
  if (programme.goal.toLowerCase().includes("hypertrophy") && totalSets < programme.sessions.length * 6) warnings.push({ code: "goal-volume", severity: "info", message: "The selected hypertrophy goal may need more weekly stimulus or a documented reason for the lower volume." });
  const deduction = warnings.reduce((sum, warning) => sum + (warning.severity === "critical" ? 25 : warning.severity === "warning" ? 8 : 3), 0);
  return { score: Math.max(0, Math.min(100, 100 - deduction)), warnings };
}

export type ProgressionInput = {
  prescribedSets: number;
  repsMin: number;
  repsMax: number;
  targetRir: number;
  loadKg?: number;
  loadIncrementKg?: number;
  completed: Array<{ reps: number; rir?: number; techniqueAcceptable: boolean; painReported: boolean }>;
  readiness?: "low" | "usual" | "high";
};

export type ProgressionDecision = { action: "progress" | "hold" | "regress"; reason: string; nextLoadKg?: number };

export function evaluateProgression(input: ProgressionInput): ProgressionDecision {
  if (input.completed.some((set) => set.painReported)) return { action: "hold", reason: "Pain or discomfort was reported. Do not automatically progress; assess and document the appropriate next step." };
  if (input.completed.some((set) => !set.techniqueAcceptable)) return { action: "hold", reason: "Technique was not acceptable across every completed set. Repeat or regress with a coaching decision." };
  if (input.readiness === "low") return { action: "regress", reason: "Readiness was low. Reduce load, sets or complexity for this exposure." };
  const topRangeAchieved = input.completed.length >= input.prescribedSets && input.completed.every((set) => set.reps >= input.repsMax && (set.rir ?? input.targetRir) >= input.targetRir);
  if (topRangeAchieved) return { action: "progress", reason: "All prescribed sets reached the top of the rep range at or above the target RIR with acceptable technique.", nextLoadKg: input.loadKg === undefined ? undefined : input.loadKg + (input.loadIncrementKg ?? 2.5) };
  return { action: "hold", reason: "Keep the prescription until the client consistently reaches the top of the rep range at the target RIR." };
}
