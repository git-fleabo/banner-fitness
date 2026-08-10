"use server";

import { and, asc, desc, eq, isNull, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getAccountAccess } from "@/lib/authorization/server";
import { getDb } from "@/lib/db/client";
import { ptAssessments, ptClients, ptExercisePrescriptions, ptExercises, ptGoals, ptLocations, ptPreferences, ptProgrammeEvents, ptProgrammeWeeks, ptProgrammes, ptSessions, ptWorkoutResults } from "@/lib/db/schema";
import { getScreeningFlags } from "@/lib/pt-programming";

const clientInputSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.string().trim().email().optional().or(z.literal("")),
  dateOfBirth: z.string().optional(),
  sexOrGender: z.string().trim().max(80).optional(),
  goalType: z.string().trim().min(1).max(120),
  trainingDays: z.number().int().min(1).max(7),
  sessionDurationMinutes: z.number().int().min(15).max(180),
  locationName: z.string().trim().min(1).max(120),
  locationType: z.string().trim().min(1).max(80),
  equipment: z.array(z.string().trim().min(1)).max(40),
  screening: z.object({
    chestPain: z.boolean(), cardiovascularHistory: z.boolean(), dizzinessOrFainting: z.boolean(), unusualBreathlessness: z.boolean(), diagnosedDisease: z.boolean(), medicalIssue: z.boolean(), medicationAffectingExercise: z.boolean(), recentSurgery: z.boolean(), injuryOrMusculoskeletalLimitation: z.boolean(), pregnancyOrPostpartum: z.boolean(), otherConcern: z.boolean(),
  }),
  ptNotes: z.string().trim().max(2000).optional(),
});

const programmeInputSchema = z.object({
  clientName: z.string().trim().min(1).max(160),
  goalSummary: z.string().trim().min(1).max(200),
  trainingDays: z.number().int().min(1).max(7),
  sessionDurationMinutes: z.number().int().min(15).max(180),
  exercises: z.array(z.object({ name: z.string().trim().min(1), pattern: z.string().trim().min(1), sets: z.number().int().min(1).max(20), repsMin: z.number().int().min(1).max(100).optional(), repsMax: z.number().int().min(1).max(100).optional(), intensityValue: z.string().trim().min(1), restSeconds: z.number().int().min(0).max(1800).optional(), tempo: z.string().trim().max(30).optional() })).min(1).max(100),
});

const workoutInputSchema = z.object({
  clientName: z.string().trim().min(1).max(160),
  scheduledDate: z.string().min(10).max(10),
  status: z.enum(["completed", "partial", "missed", "skipped"]),
  sessionRpe: z.number().int().min(1).max(10).optional(),
  energy: z.number().int().min(1).max(5).optional(),
  painReported: z.boolean(),
  enjoyment: z.number().int().min(1).max(5).optional(),
  durationMinutes: z.number().int().min(1).max(240).optional(),
  notes: z.string().trim().max(2000).optional(),
});

async function requireDesignerAccess() {
  const access = await getAccountAccess();
  if (access.state !== "active" || access.account.role !== "owner") throw new Error("A signed-in PT owner account is required.");
  return access.account;
}

export async function createClientAction(rawInput: z.input<typeof clientInputSchema>) {
  const owner = await requireDesignerAccess();
  const input = clientInputSchema.parse(rawInput);
  const flags = getScreeningFlags(input.screening);
  const db = getDb();
  const [client] = await db.insert(ptClients).values({
    ownerProfileId: owner.authUserId,
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email || null,
    dateOfBirth: input.dateOfBirth || null,
    sexOrGender: input.sexOrGender || null,
    sessionDurationMinutes: input.sessionDurationMinutes,
    preferredDays: Array.from({ length: input.trainingDays }, (_, index) => index + 1),
    notes: input.ptNotes || null,
  }).returning({ id: ptClients.id });
  if (!client) throw new Error("Client could not be created.");
  await db.insert(ptAssessments).values({ clientId: client.id, assessmentDate: new Date().toISOString().slice(0, 10), responses: input.screening, riskFlags: flags, clearanceRequired: flags.some((flag) => flag.action === "clearance"), ptNotes: input.ptNotes || null });
  await db.insert(ptGoals).values({ clientId: client.id, goalType: input.goalType, priority: "primary" });
  await db.insert(ptPreferences).values({ clientId: client.id, preferredEquipment: input.equipment });
  await db.insert(ptLocations).values({ clientId: client.id, name: input.locationName, locationType: input.locationType, equipment: input.equipment });
  revalidatePath("/designer");
  return { clientId: client.id, riskFlags: flags };
}

export async function saveProgrammeAction(rawInput: z.input<typeof programmeInputSchema>) {
  const owner = await requireDesignerAccess();
  const input = programmeInputSchema.parse(rawInput);
  const db = getDb();
  const [firstName, ...lastParts] = input.clientName.split(" ");
  const lastName = lastParts.join(" ") || "Client";
  let [client] = await db.select({ id: ptClients.id }).from(ptClients).where(and(eq(ptClients.ownerProfileId, owner.authUserId), eq(ptClients.firstName, firstName), eq(ptClients.lastName, lastName))).limit(1);
  if (!client) [client] = await db.insert(ptClients).values({ ownerProfileId: owner.authUserId, firstName, lastName, sessionDurationMinutes: input.sessionDurationMinutes, preferredDays: Array.from({ length: input.trainingDays }, (_, index) => index + 1) }).returning({ id: ptClients.id });
  if (!client) throw new Error("Client could not be resolved.");
  const [programme] = await db.insert(ptProgrammes).values({ ownerProfileId: owner.authUserId, clientId: client.id, name: `${input.goalSummary} foundation`, goalSummary: input.goalSummary, durationWeeks: 8, methodology: "Full-body foundation with RIR-based double progression", status: "draft", rationale: "Draft saved for PT review. Finalise only after screening, equipment and quality checks have been reviewed." }).returning({ id: ptProgrammes.id, version: ptProgrammes.version });
  if (!programme) throw new Error("Programme could not be saved.");
  const allExercises = await db.select({ id: ptExercises.id, name: ptExercises.name }).from(ptExercises).where(or(isNull(ptExercises.ownerProfileId), eq(ptExercises.ownerProfileId, owner.authUserId))).orderBy(asc(ptExercises.name));
  const exerciseRows = input.exercises.map((exercise, index) => {
    const match = allExercises.find((candidate) => candidate.name.toLowerCase() === exercise.name.toLowerCase());
    return match ? { exerciseId: match.id, orderIndex: index, sets: exercise.sets, repsMin: exercise.repsMin ?? null, repsMax: exercise.repsMax ?? null, intensityType: "rir" as const, intensityValue: exercise.intensityValue, restSeconds: exercise.restSeconds ?? null, tempo: exercise.tempo || null, progressionRule: "When all sets reach the top of the range at target RIR with acceptable technique, add a small load increment." } : null;
  }).filter((row): row is NonNullable<typeof row> => row !== null);
  let savedPrescriptionCount = 0;
  for (let weekNumber = 1; weekNumber <= 8; weekNumber += 1) {
    const [week] = await db.insert(ptProgrammeWeeks).values({ programmeId: programme.id, weekNumber, focus: weekNumber <= 2 ? "Foundation / familiarisation" : weekNumber <= 6 ? "Build / progressive overload" : "Consolidate / review", volumeTarget: weekNumber <= 2 ? "Moderate" : "Moderate-high", intensityTarget: "RIR 2–3" }).returning({ id: ptProgrammeWeeks.id });
    if (!week) throw new Error("Programme week could not be saved.");
    for (const dayOfWeek of [1, 3, 5]) {
      const [session] = await db.insert(ptSessions).values({ programmeWeekId: week.id, dayOfWeek, name: dayOfWeek === 1 ? "Monday · Strength / Hypertrophy" : dayOfWeek === 3 ? "Wednesday · Full body" : "Friday · Conditioning", sessionType: dayOfWeek === 5 ? "conditioning" : "mixed", durationMinutes: input.sessionDurationMinutes, warmupMinutes: 5 }).returning({ id: ptSessions.id });
      if (!session) throw new Error("Programme session could not be saved.");
      if (dayOfWeek === 1 && exerciseRows.length) {
        const rows = exerciseRows.map((row) => ({ ...row, sessionId: session.id }));
        await db.insert(ptExercisePrescriptions).values(rows);
        savedPrescriptionCount += rows.length;
      }
    }
  }
  await db.insert(ptProgrammeEvents).values({ programmeId: programme.id, actorProfileId: owner.authUserId, action: "draft_saved", details: { exerciseCount: savedPrescriptionCount, weekCount: 8, version: programme.version } });
  revalidatePath("/designer");
  return { programmeId: programme.id, version: programme.version, exerciseCount: savedPrescriptionCount, weekCount: 8 };
}

export async function logWorkoutResultAction(rawInput: z.input<typeof workoutInputSchema>) {
  const owner = await requireDesignerAccess();
  const input = workoutInputSchema.parse(rawInput);
  const [firstName, ...lastParts] = input.clientName.split(" ");
  const lastName = lastParts.join(" ") || "Client";
  const db = getDb();
  const [client] = await db.select({ id: ptClients.id }).from(ptClients).where(and(eq(ptClients.ownerProfileId, owner.authUserId), eq(ptClients.firstName, firstName), eq(ptClients.lastName, lastName))).limit(1);
  if (!client) throw new Error("Save the client profile before logging a workout.");
  const [programme] = await db.select({ id: ptProgrammes.id }).from(ptProgrammes).where(and(eq(ptProgrammes.ownerProfileId, owner.authUserId), eq(ptProgrammes.clientId, client.id))).orderBy(desc(ptProgrammes.updatedAt)).limit(1);
  if (!programme) throw new Error("Save a programme before logging a workout.");
  const [week] = await db.select({ id: ptProgrammeWeeks.id }).from(ptProgrammeWeeks).where(eq(ptProgrammeWeeks.programmeId, programme.id)).orderBy(asc(ptProgrammeWeeks.weekNumber)).limit(1);
  if (!week) throw new Error("The programme has no week to log against.");
  const [session] = await db.select({ id: ptSessions.id }).from(ptSessions).where(and(eq(ptSessions.programmeWeekId, week.id), eq(ptSessions.dayOfWeek, 1))).limit(1);
  if (!session) throw new Error("The programme has no Monday session to log against.");
  const [result] = await db.insert(ptWorkoutResults).values({ ownerProfileId: owner.authUserId, clientId: client.id, sessionId: session.id, scheduledDate: input.scheduledDate, completedAt: input.status === "completed" || input.status === "partial" ? new Date() : null, status: input.status, sessionRpe: input.sessionRpe ?? null, energy: input.energy ?? null, painReported: input.painReported, enjoyment: input.enjoyment ?? null, durationMinutes: input.durationMinutes ?? null, notes: input.notes || null }).returning({ id: ptWorkoutResults.id });
  if (!result) throw new Error("Workout result could not be saved.");
  revalidatePath("/designer");
  return { resultId: result.id };
}
