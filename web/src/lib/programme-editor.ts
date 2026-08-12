export type EditorExercise = { name: string; pattern: string; prescription: string; target: string; equipment: string; sets?: number; repsMin?: number; repsMax?: number; intensityValue?: string; restSeconds?: number; tempo?: string; progressionRule?: string; note?: string };
export type SavedSession = { dayOfWeek: number; name: string; exercises: EditorExercise[] };
export type ProgrammeTemplateDefinition = { id: string; label: string; description: string; goal: string; sessionDurationMinutes?: number; experienceLevel?: string; frameworkType?: string; sessions: Array<{ name: string; exercises: EditorExercise[] }> };
export type StarterProgrammeTemplate = ProgrammeTemplateDefinition;

export const weekdayLabels = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const progressionRule = "When all sets reach the top of the range at target RIR with acceptable technique, add a small load increment.";
const starterExercise = (name: string, pattern: string, target: string, equipment: string, repsMin = 8, repsMax = 12, sets = 3): EditorExercise => ({ name, pattern, target, equipment, sets, repsMin, repsMax, prescription: `${sets} × ${repsMin}–${repsMax}`, intensityValue: "2 RIR", restSeconds: 90, tempo: "", progressionRule });

export const starterProgrammeTemplates: StarterProgrammeTemplate[] = [
  {
    id: "general-strength",
    label: "General strength",
    description: "Three balanced full-body sessions with repeatable compound lifts.",
    goal: "General strength",
    sessions: [
      { name: "Full body · Strength A", exercises: [starterExercise("Goblet Squat", "Squat", "Quads · glutes", "Dumbbells", 6, 10), starterExercise("DB Bench Press", "Horizontal push", "Chest · triceps", "Dumbbells", 6, 10), starterExercise("Seated Cable Row", "Horizontal pull", "Back · biceps", "Cable", 8, 12), starterExercise("DB Romanian Deadlift", "Hinge", "Hamstrings · glutes", "Dumbbells", 8, 12, 2)] },
      { name: "Full body · Strength B", exercises: [starterExercise("Split Squat", "Lunge", "Quads · glutes", "Dumbbells", 8, 12), starterExercise("Barbell Bench Press", "Horizontal push", "Chest · triceps", "Barbell", 6, 10), starterExercise("Lat Pulldown", "Vertical pull", "Lats · biceps", "Cable", 8, 12), starterExercise("Trap-Bar Deadlift", "Hinge", "Glutes · hamstrings", "Trap bar", 5, 8, 2)] },
      { name: "Full body · Strength C", exercises: [starterExercise("Leg Press", "Squat", "Quads · glutes", "Machines", 8, 12), starterExercise("Push-Up", "Horizontal push", "Chest · triceps", "Bodyweight", 8, 15), starterExercise("Ring Row", "Horizontal pull", "Back · biceps", "Gymnastic rings", 8, 12), starterExercise("Cable Pallof Press", "Anti-rotation", "Core", "Cable", 8, 12, 2)] },
    ],
  },
  {
    id: "home-dumbbell",
    label: "Home dumbbell",
    description: "A practical home starting point using dumbbells and bodyweight.",
    goal: "General fitness",
    sessions: [
      { name: "Home · Full body A", exercises: [starterExercise("Goblet Squat", "Squat", "Quads · glutes", "Dumbbells", 8, 12), starterExercise("DB Bench Press", "Horizontal push", "Chest · triceps", "Dumbbells", 8, 12), starterExercise("DB Romanian Deadlift", "Hinge", "Hamstrings · glutes", "Dumbbells", 8, 12), starterExercise("Push-Up", "Horizontal push", "Chest · triceps", "Bodyweight", 6, 15, 2)] },
      { name: "Home · Full body B", exercises: [starterExercise("Split Squat", "Lunge", "Quads · glutes", "Dumbbells", 8, 12), starterExercise("Push-Up", "Horizontal push", "Chest · triceps", "Bodyweight", 8, 15), starterExercise("Suitcase Deadlift", "Hinge", "Glutes · hamstrings", "Dumbbells", 8, 12), starterExercise("Half-Kneeling Pallof Press", "Anti-rotation", "Core", "Band", 8, 12, 2)] },
      { name: "Home · Full body C", exercises: [starterExercise("Goblet Squat", "Squat", "Quads · glutes", "Dumbbells", 10, 15), starterExercise("DB Bench Press", "Horizontal push", "Chest · triceps", "Dumbbells", 8, 12), starterExercise("Split Squat", "Lunge", "Quads · glutes", "Dumbbells", 8, 12), starterExercise("Dead Bug", "Anti-extension", "Core", "Bodyweight", 8, 12, 2)] },
    ],
  },
  {
    id: "hypertrophy-full-body",
    label: "Full-body hypertrophy",
    description: "Moderate-volume sessions with varied compound and accessory work.",
    goal: "Hypertrophy",
    sessions: [
      { name: "Hypertrophy · A", exercises: [starterExercise("Leg Press", "Squat", "Quads · glutes", "Machines", 8, 15), starterExercise("DB Bench Press", "Horizontal push", "Chest · triceps", "Dumbbells", 8, 15), starterExercise("Seated Cable Row", "Horizontal pull", "Back · biceps", "Cable", 8, 15), starterExercise("Cable Lateral Raise", "Accessory", "Lateral delts", "Cable", 12, 20, 2)] },
      { name: "Hypertrophy · B", exercises: [starterExercise("Split Squat", "Lunge", "Quads · glutes", "Dumbbells", 8, 15), starterExercise("Lat Pulldown", "Vertical pull", "Lats · biceps", "Cable", 8, 15), starterExercise("DB Romanian Deadlift", "Hinge", "Hamstrings · glutes", "Dumbbells", 8, 15), starterExercise("Cable Lateral Raise", "Accessory", "Lateral delts", "Cable", 12, 20, 2)] },
      { name: "Hypertrophy · C", exercises: [starterExercise("Goblet Squat", "Squat", "Quads · glutes", "Dumbbells", 10, 15), starterExercise("Barbell Bench Press", "Horizontal push", "Chest · triceps", "Barbell", 8, 12), starterExercise("Ring Row", "Horizontal pull", "Back · biceps", "Gymnastic rings", 8, 15), starterExercise("Cable Pallof Press", "Anti-rotation", "Core", "Cable", 10, 15, 2)] },
    ],
  },
];

export function getEditorSessionDays(preferredDays: number[] | undefined, trainingDays: number) {
  const selected = Array.from(new Set((preferredDays ?? []).filter((day) => Number.isInteger(day) && day >= 1 && day <= 7))).sort((a, b) => a - b);
  if (selected.length) return selected;
  return Array.from({ length: Math.min(Math.max(trainingDays, 1), 7) }, (_, index) => index + 1);
}

function templateSessionName(name: string, day: number) {
  const suffix = name.split("·").slice(1).join("·").trim();
  return `${weekdayLabels[day]} · ${suffix || name.trim()}`;
}

export function buildStarterTemplateState(templateId: string, preferredDays: number[] | undefined, trainingDays: number) {
  const template = starterProgrammeTemplates.find((candidate) => candidate.id === templateId);
  if (!template) return null;
  return buildProgrammeTemplateState(template, preferredDays, trainingDays);
}

export function buildProgrammeTemplateState(template: ProgrammeTemplateDefinition, preferredDays: number[] | undefined, trainingDays: number) {
  const days = getEditorSessionDays(preferredDays, Math.min(trainingDays, template.sessions.length));
  const sessions = Object.fromEntries(days.map((day, index) => [String(day), template.sessions[index % template.sessions.length].exercises]));
  const names = Object.fromEntries(days.map((day, index) => [String(day), templateSessionName(template.sessions[index % template.sessions.length].name, day)]));
  return { days, sessions, names, template };
}

export function buildEditorSessionState({ preferredDays, trainingDays, week, savedSessions }: { preferredDays?: number[]; trainingDays: number; week: EditorExercise[]; savedSessions?: SavedSession[] }) {
  if (savedSessions?.length) {
    return {
      days: savedSessions.map((session) => session.dayOfWeek),
      sessions: Object.fromEntries(savedSessions.map((session) => [String(session.dayOfWeek), session.exercises])),
      names: Object.fromEntries(savedSessions.map((session) => [String(session.dayOfWeek), session.name])),
    };
  }
  const days = getEditorSessionDays(preferredDays, trainingDays);
  const sessions = Object.fromEntries(days.map((day, index) => [String(day), index === 0 ? week : week.slice(index * 2, index * 2 + 4)]));
  const names = Object.fromEntries(days.map((day, index) => [String(day), `${weekdayLabels[day]} - ${index === days.length - 1 ? "Conditioning" : index === 0 ? "Strength / Hypertrophy" : "Full body"}`]));
  return { days, sessions, names };
}

export function copySessionToDay({ days, sessions, names, sourceDay, targetDay }: { days: number[]; sessions: Record<string, EditorExercise[]>; names: Record<string, string>; sourceDay: number; targetDay: number }) {
  if (!days.includes(sourceDay) || !days.includes(targetDay) || sourceDay === targetDay) return { sessions, names };
  const sourceName = names[String(sourceDay)]?.trim() || `${weekdayLabels[sourceDay]} session`;
  const suffix = sourceName.split("·").slice(1).join("·").trim() || sourceName.replace(new RegExp(`^${weekdayLabels[sourceDay]}\\s*[·-]?\\s*`, "i"), "").trim();
  return {
    sessions: { ...sessions, [String(targetDay)]: [...(sessions[String(sourceDay)] ?? [])] },
    names: { ...names, [String(targetDay)]: `${weekdayLabels[targetDay]} · ${suffix || "Copied session"}` },
  };
}

export function buildWeekPreview({ days, sessions, names }: { days: number[]; sessions: Record<string, EditorExercise[]>; names: Record<string, string> }) {
  return days.map((day) => {
    const exercises = sessions[String(day)] ?? [];
    return {
      day,
      label: weekdayLabels[day],
      name: names[String(day)] || `${weekdayLabels[day]} session`,
      exercises,
      exerciseCount: exercises.length,
      totalSets: exercises.reduce((sum, exercise) => sum + (exercise.sets ?? Number(exercise.prescription.match(/^\d+/)?.[0] ?? 0)), 0),
    };
  });
}
