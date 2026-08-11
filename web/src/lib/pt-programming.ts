import { evaluateProgrammeQuality } from "./pt-quality";

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
  // Keep the legacy public shape for existing callers while routing evaluation through
  // the contextual engine used by the designer and persistence layer.
  const review = evaluateProgrammeQuality({
    client: { preferredDays: Array.from({ length: programme.trainingDays }, (_, index) => index + 1), trainingExperience: programme.experience },
    assessment: programme.screeningFlags?.length ? { riskFlags: programme.screeningFlags.map((flag) => ({ code: flag.code, action: flag.action })) } : null,
    goal: { goalType: programme.goal },
    location: { equipment: programme.availableEquipment },
    programme: { goalSummary: programme.goal, durationWeeks: 1, trainingDays: programme.trainingDays, sessions: programme.sessions.map((session) => ({ ...session, exercises: session.exercises.map((exercise) => ({ ...exercise, repsMin: 8, repsMax: 12, progressionRule: null })) })) },
  });
  return { score: review.score, warnings: review.findings.map((item) => ({ code: item.ruleId, severity: item.severity === "blocking" ? "critical" : item.severity === "significant" ? "warning" : "info", message: item.message })) };
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
