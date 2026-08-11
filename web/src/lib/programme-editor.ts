export type EditorExercise = { name: string; pattern: string; prescription: string; target: string; equipment: string; sets?: number; repsMin?: number; repsMax?: number; intensityValue?: string; restSeconds?: number; tempo?: string; progressionRule?: string; note?: string };
export type SavedSession = { dayOfWeek: number; name: string; exercises: EditorExercise[] };

export const weekdayLabels = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export function getEditorSessionDays(preferredDays: number[] | undefined, trainingDays: number) {
  const selected = Array.from(new Set((preferredDays ?? []).filter((day) => Number.isInteger(day) && day >= 1 && day <= 7))).sort((a, b) => a - b);
  if (selected.length) return selected;
  return Array.from({ length: Math.min(Math.max(trainingDays, 1), 7) }, (_, index) => index + 1);
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
