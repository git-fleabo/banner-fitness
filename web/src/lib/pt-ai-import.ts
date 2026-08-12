import { z } from "zod";

import type { EditorExercise, SavedSession } from "./programme-editor";

export const aiProgrammeImportFormat = "banner-fitness-programme-draft" as const;
export const aiProgrammeImportSchemaVersion = "1" as const;

const importedExerciseSchema = z.object({
  name: z.string().trim().min(1).max(160),
  pattern: z.string().trim().min(1).max(100),
  target: z.string().trim().max(200).optional(),
  equipment: z.string().trim().max(160).optional(),
  sets: z.number().int().min(1).max(20),
  repsMin: z.number().int().min(1).max(100),
  repsMax: z.number().int().min(1).max(100),
  intensityValue: z.string().trim().min(1).max(80),
  restSeconds: z.number().int().min(0).max(1800).optional(),
  tempo: z.string().trim().max(30).optional(),
  progressionRule: z.string().trim().max(500).optional(),
  note: z.string().trim().max(500).optional(),
});

const importedSessionSchema = z.object({
  dayOfWeek: z.number().int().min(1).max(7),
  name: z.string().trim().min(1).max(120),
  exercises: z.array(importedExerciseSchema).max(100),
});

const importedWeekPlanSchema = z.object({
  focus: z.string().trim().min(1).max(160),
  volumeTarget: z.string().trim().max(80).optional(),
  intensityTarget: z.string().trim().max(80).optional(),
});

export const aiProgrammeImportSchema = z.object({
  format: z.literal(aiProgrammeImportFormat),
  schemaVersion: z.literal(aiProgrammeImportSchemaVersion),
  source: z.object({ tool: z.string().trim().max(100).optional(), responseId: z.string().trim().max(160).optional(), generatedAt: z.string().trim().max(80).optional() }).optional(),
  client: z.object({ clientId: z.string().uuid().optional(), clientName: z.string().trim().max(160).optional() }).optional(),
  programme: z.object({
    goalSummary: z.string().trim().min(1).max(200),
    sessionDurationMinutes: z.number().int().min(15).max(180),
    methodology: z.string().trim().max(300).optional(),
    rationale: z.string().trim().max(2000).optional(),
    weekPlans: z.array(importedWeekPlanSchema).length(8).optional(),
    sessions: z.array(importedSessionSchema).min(1).max(7),
  }).superRefine((programme, context) => {
    const days = programme.sessions.map((session) => session.dayOfWeek);
    if (new Set(days).size !== days.length) context.addIssue({ code: "custom", path: ["sessions"], message: "Each session must use a different dayOfWeek." });
    programme.sessions.forEach((session, sessionIndex) => session.exercises.forEach((exercise, exerciseIndex) => {
      if (exercise.repsMin > exercise.repsMax) context.addIssue({ code: "custom", path: ["sessions", sessionIndex, "exercises", exerciseIndex, "repsMax"], message: "repsMax must be greater than or equal to repsMin." });
    }));
    if (!programme.sessions.some((session) => session.exercises.length > 0)) context.addIssue({ code: "custom", path: ["sessions"], message: "Add at least one exercise to the imported draft." });
  }),
});

export type AiProgrammeImport = z.infer<typeof aiProgrammeImportSchema>;

export type AiProgrammeImportAudit = {
  source: "ai_import";
  schemaVersion: typeof aiProgrammeImportSchemaVersion;
  tool?: string;
  responseId?: string;
  generatedAt?: string;
};

export type AiProgrammeImportApproval = {
  sessions: SavedSession[];
  goalSummary: string;
  sessionDurationMinutes: number;
  methodology?: string;
  rationale?: string;
  weekPlans?: Array<{ focus: string; volumeTarget: string; intensityTarget: string }>;
  audit: AiProgrammeImportAudit;
};

export type ImportDiff = {
  isNewProgramme: boolean;
  importedSessionCount: number;
  importedExerciseCount: number;
  existingSessionCount: number;
  existingExerciseCount: number;
  changedSessionCount: number;
  sessionSummaries: Array<{ dayOfWeek: number; name: string; exerciseCount: number; existingExerciseCount: number; changed: boolean }>;
};

function parseJsonText(raw: string) {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)?.[1]?.trim();
  const candidate = fenced || trimmed;
  try { return JSON.parse(candidate) as unknown; } catch {
    const firstBrace = candidate.indexOf("{");
    const lastBrace = candidate.lastIndexOf("}");
    if (firstBrace >= 0 && lastBrace > firstBrace) return JSON.parse(candidate.slice(firstBrace, lastBrace + 1)) as unknown;
    throw new Error("Paste the JSON object returned by the AI tool, including the format and schemaVersion fields.");
  }
}

export function parseAiProgrammeImport(raw: unknown) {
  const parsed = typeof raw === "string" ? parseJsonText(raw) : raw;
  return aiProgrammeImportSchema.parse(parsed);
}

function prescriptionFor(exercise: AiProgrammeImport["programme"]["sessions"][number]["exercises"][number]) {
  return `${exercise.sets} × ${exercise.repsMin}${exercise.repsMax !== exercise.repsMin ? `–${exercise.repsMax}` : ""}`;
}

export function toEditorSessions(imported: AiProgrammeImport): SavedSession[] {
  return imported.programme.sessions.map((session) => ({
    dayOfWeek: session.dayOfWeek,
    name: session.name,
    exercises: session.exercises.map((exercise): EditorExercise => ({
      name: exercise.name,
      pattern: exercise.pattern,
      prescription: prescriptionFor(exercise),
      target: exercise.target || "",
      equipment: exercise.equipment || "",
      sets: exercise.sets,
      repsMin: exercise.repsMin,
      repsMax: exercise.repsMax,
      intensityValue: exercise.intensityValue,
      restSeconds: exercise.restSeconds ?? 90,
      tempo: exercise.tempo || "",
      progressionRule: exercise.progressionRule || "",
      note: exercise.note || "",
    })),
  }));
}

type DiffSession = { dayOfWeek: number; name: string; exercises: Array<{ name: string }> };

export function buildImportDiff(existing: DiffSession[] | undefined, imported: SavedSession[]): ImportDiff {
  const current = existing ?? [];
  const currentByDay = new Map(current.map((session) => [session.dayOfWeek, session]));
  const importedExerciseCount = imported.reduce((total, session) => total + session.exercises.length, 0);
  const existingExerciseCount = current.reduce((total, session) => total + session.exercises.length, 0);
  const sessionSummaries = imported.map((session) => {
    const existingSession = currentByDay.get(session.dayOfWeek);
    const importedNames = session.exercises.map((exercise) => exercise.name.toLowerCase()).join("|");
    const existingNames = existingSession?.exercises.map((exercise) => exercise.name.toLowerCase()).join("|") ?? "";
    return { dayOfWeek: session.dayOfWeek, name: session.name, exerciseCount: session.exercises.length, existingExerciseCount: existingSession?.exercises.length ?? 0, changed: !existingSession || existingSession.name !== session.name || importedNames !== existingNames };
  });
  return { isNewProgramme: current.length === 0, importedSessionCount: imported.length, importedExerciseCount, existingSessionCount: current.length, existingExerciseCount, changedSessionCount: sessionSummaries.filter((session) => session.changed).length, sessionSummaries };
}
