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

export function normalizeQualitySettings(value: unknown): QualitySettings {
  const source = value && typeof value === "object" ? value as Partial<QualitySettings> : {};
  const numberInRange = (candidate: unknown, fallback: number, min: number, max: number) => {
    const number = typeof candidate === "number" && Number.isFinite(candidate) ? Math.round(candidate) : fallback;
    return Math.min(max, Math.max(min, number));
  };
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

type QualitySession = {
  durationMinutes: number;
  exercises: Array<{ pattern: string; prescription: string; progressionRule?: string | null }>;
};

export function buildQualityWarnings({ sessions, trainingDays, screening, settings }: { sessions: QualitySession[]; trainingDays: number; screening: boolean; settings?: QualitySettings }) {
  const rules = normalizeQualitySettings(settings);
  const allExercises = sessions.flatMap((session) => session.exercises);
  const totalSets = allExercises.reduce((sum, exercise) => sum + Number(exercise.prescription.match(/^\d+/)?.[0] ?? 0), 0);
  const presses = allExercises.filter((exercise) => /push|press/i.test(exercise.pattern)).length;
  const pulls = allExercises.filter((exercise) => /pull|row/i.test(exercise.pattern)).length;
  const missingProgression = allExercises.filter((exercise) => !exercise.progressionRule).length;
  const warnings = [
    rules.checkScreening && screening ? "Screening flag present: review referral or clearance requirements before assigning this draft." : "",
    rules.checkFrequency && sessions.length < trainingDays ? `Only ${sessions.length} session${sessions.length === 1 ? "" : "s"} saved for the selected ${trainingDays}-day target.` : "",
    rules.checkBalance && presses > pulls + rules.pressPullTolerance ? "Pressing volume is high relative to pulling volume." : "",
    rules.checkVolume && sessions.some((session) => session.exercises.reduce((sum, exercise) => sum + Number(exercise.prescription.match(/^\d+/)?.[0] ?? 0), 0) > rules.maxSetsPerSession) ? `At least one session exceeds the ${rules.maxSetsPerSession}-set advisory threshold.` : "",
    rules.checkProgression && missingProgression ? `${missingProgression} exercise${missingProgression === 1 ? " lacks" : "s lack"} a documented progression rule.` : "",
    rules.checkDuration && sessions.some((session) => { const sets = session.exercises.reduce((sum, exercise) => sum + Number(exercise.prescription.match(/^\d+/)?.[0] ?? 0), 0); return sets * 2 + 5 > session.durationMinutes; }) ? "At least one session may run over its saved duration at the current prescription." : "",
  ].filter(Boolean);
  return { warnings, totalSets, score: Math.max(0, 100 - warnings.length * 8) };
}
