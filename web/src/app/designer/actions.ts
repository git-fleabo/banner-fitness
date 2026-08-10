"use server";

import { and, asc, desc, eq, isNull, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getAccountAccess } from "@/lib/authorization/server";
import { getDb } from "@/lib/db/client";
import { ptAssessments, ptClients, ptExercisePrescriptions, ptExercises, ptGoals, ptLocations, ptPreferences, ptProgrammeEvents, ptProgrammeWeeks, ptProgrammes, ptSessions, ptWorkoutResultSets, ptWorkoutResults } from "@/lib/db/schema";
import { getScreeningFlags } from "@/lib/pt-programming";
import { caseStudyFixtures, type CaseStudySlug } from "@/lib/case-study-fixtures";

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

const exerciseDraftSchema = z.object({ name: z.string().trim().min(1), pattern: z.string().trim().min(1), sets: z.number().int().min(1).max(20), repsMin: z.number().int().min(1).max(100).optional(), repsMax: z.number().int().min(1).max(100).optional(), intensityValue: z.string().trim().min(1), restSeconds: z.number().int().min(0).max(1800).optional(), tempo: z.string().trim().max(30).optional(), technique: z.string().trim().max(80).optional(), notes: z.string().trim().max(500).optional(), groupKey: z.string().trim().max(80).optional(), progressionRule: z.string().trim().max(500).optional() });
const clientUpdateSchema = z.object({ clientId: z.string().uuid(), goalType: z.string().trim().min(1).max(120), trainingDays: z.number().int().min(1).max(7), sessionDurationMinutes: z.number().int().min(15).max(180) });
const caseStudySchema = z.object({ slug: z.enum(["ciara", "jessica", "kevin", "paul"]) });
const caseStudyDraftSchema = z.object({ clientId: z.string().uuid() });
const programmeOverrideSchema = z.object({ programmeId: z.string().uuid(), warningCodes: z.array(z.string().trim().min(1).max(80)).max(20), reason: z.string().trim().min(3).max(1000) });
const programmeTransitionSchema = z.object({ programmeId: z.string().uuid(), status: z.enum(["draft", "reviewed", "assigned", "active", "paused", "completed", "archived"]), reason: z.string().trim().max(1000).optional() });

const programmeInputSchema = z.object({
  clientName: z.string().trim().min(1).max(160),
  goalSummary: z.string().trim().min(1).max(200),
  trainingDays: z.number().int().min(1).max(7),
  sessionDurationMinutes: z.number().int().min(15).max(180),
  exercises: z.array(exerciseDraftSchema).min(1).max(100),
  sessionExercises: z.record(z.string(), z.array(exerciseDraftSchema)).optional(),
  sessionNames: z.record(z.string(), z.string().trim().min(1).max(120)).optional(),
  sessionDays: z.array(z.number().int().min(1).max(7)).min(1).max(7).optional(),
  methodology: z.string().trim().max(300).optional(),
  rationale: z.string().trim().max(2000).optional(),
});

const workoutInputSchema = z.object({
  clientId: z.string().uuid(),
  sessionId: z.string().uuid(),
  scheduledDate: z.string().min(10).max(10),
  status: z.enum(["completed", "partial", "missed", "skipped"]),
  sessionRpe: z.number().int().min(1).max(10).optional(),
  energy: z.number().int().min(1).max(5).optional(),
  painReported: z.boolean(),
  enjoyment: z.number().int().min(1).max(5).optional(),
  durationMinutes: z.number().int().min(1).max(240).optional(),
  notes: z.string().trim().max(2000).optional(),
  sets: z.array(z.object({ prescriptionId: z.string().uuid(), setNumber: z.number().int().min(1).max(20), reps: z.number().int().min(0).max(100).optional(), loadKg: z.number().int().min(0).max(1000).optional(), rpe: z.number().int().min(1).max(10).optional(), rir: z.number().int().min(0).max(10).optional(), techniqueAcceptable: z.boolean(), painReported: z.boolean() })).max(100).optional(),
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

export async function seedCaseStudyAction(rawInput: z.input<typeof caseStudySchema>) {
  const owner = await requireDesignerAccess();
  const input = caseStudySchema.parse(rawInput);
  const fixture = caseStudyFixtures[input.slug as CaseStudySlug];
  const db = getDb();
  const existing = await db.select({ id: ptClients.id }).from(ptClients).where(and(eq(ptClients.ownerProfileId, owner.authUserId), eq(ptClients.firstName, fixture.name), eq(ptClients.lastName, "Case Study"))).limit(1);
  if (existing[0]) return { clientId: existing[0].id, name: fixture.name, existing: true, riskFlags: getScreeningFlags(fixture.screening) };
  const dateOfBirth = `${new Date().getFullYear() - fixture.age}-01-01`;
  const [client] = await db.insert(ptClients).values({ ownerProfileId: owner.authUserId, firstName: fixture.name, lastName: "Case Study", dateOfBirth, sexOrGender: fixture.sex, heightCm: fixture.heightCm, weightKg: fixture.weightKg, occupation: "Module 7 case-study profile", dailyActivity: fixture.notes, sessionDurationMinutes: fixture.sessionDurationMinutes, preferredDays: Array.from({ length: fixture.trainingDays }, (_, index) => index + 1), notes: `[CASE STUDY FIXTURE: ${input.slug}] ${fixture.notes}` }).returning({ id: ptClients.id });
  if (!client) throw new Error("Case-study client could not be created.");
  const riskFlags = getScreeningFlags(fixture.screening);
  await db.insert(ptAssessments).values({ clientId: client.id, assessmentDate: new Date().toISOString().slice(0, 10), responses: fixture.screening, riskFlags, clearanceRequired: riskFlags.some((flag) => flag.action === "clearance"), ptNotes: "Imported from Module 7 case-study source. Verify the PAR-Q responses and professional screening decision before assigning a programme." });
  await db.insert(ptGoals).values({ clientId: client.id, goalType: fixture.goal, priority: "primary" });
  await db.insert(ptPreferences).values({ clientId: client.id, preferredEquipment: fixture.equipment });
  await db.insert(ptLocations).values({ clientId: client.id, name: fixture.location, locationType: fixture.locationType, equipment: fixture.equipment });
  revalidatePath("/designer");
  return { clientId: client.id, name: fixture.name, existing: false, riskFlags };
}

export async function generateCaseStudyDraftAction(rawInput: z.input<typeof caseStudyDraftSchema>) {
  const owner = await requireDesignerAccess();
  const input = caseStudyDraftSchema.parse(rawInput);
  const db = getDb();
  const [client] = await db.select({ id: ptClients.id, firstName: ptClients.firstName, lastName: ptClients.lastName, notes: ptClients.notes, sessionDurationMinutes: ptClients.sessionDurationMinutes, preferredDays: ptClients.preferredDays }).from(ptClients).where(and(eq(ptClients.id, input.clientId), eq(ptClients.ownerProfileId, owner.authUserId))).limit(1);
  if (!client) throw new Error("Case-study client could not be found.");
  const slug = client.notes?.match(/CASE STUDY FIXTURE: ([a-z]+)/i)?.[1]?.toLowerCase();
  const plans: Record<string, { goal: string; days: number; duration: number; exercises: string[]; sessionExercises: Record<string, string[]>; sessionNames: Record<string, string>; sessionDays: number[]; methodology: string; rationale: string }> = {
    ciara: { goal: "Fat loss and tone", days: 3, duration: 60, exercises: ["Leg Press", "DB Bench Press", "Seated Cable Row", "DB Romanian Deadlift", "Cable Lateral Raise", "Incline Treadmill Walk"], sessionExercises: { "1": ["Leg Press", "DB Bench Press", "Seated Cable Row", "DB Romanian Deadlift"], "3": ["Goblet Squat", "Machine Chest Press", "One-Arm Dumbbell Row", "Split Squat"], "5": ["Step-Up", "Push-Up", "Band Row", "Incline Treadmill Walk"] }, sessionNames: { "1": "Full Body Stability", "3": "Full Body Endurance", "5": "Full Body Conditioning" }, sessionDays: [1, 3, 5], methodology: "Full-body phased progression with aerobic intervals and RIR-based resistance training", rationale: "Three practical full-body sessions balance fat-loss support, muscle retention and confidence with weights. Low-impact conditioning is used instead of forcing a disliked running modality, with gradual progression across the eight-week draft." },
    jessica: { goal: "Power gain", days: 3, duration: 75, exercises: ["Trap-Bar Deadlift", "Barbell Bench Press", "Dumbbell Shoulder Press", "Chest-Supported DB Row", "Broad Jump", "Cable Pallof Press"], sessionExercises: { "1": ["Trap-Bar Deadlift", "Barbell Bench Press", "Chest-Supported DB Row"], "3": ["Broad Jump", "Dumbbell Shoulder Press", "Split Squat", "Cable Pallof Press"], "5": ["Barbell Deadlift", "Incline Dumbbell Press", "One-Arm Dumbbell Row"] }, sessionNames: { "1": "Strength Foundation", "3": "Power and Athletic Transfer", "5": "Deadlift Strength" }, sessionDays: [1, 3, 5], methodology: "Concurrent strength-power programme alongside athletics training", rationale: "Power work is placed alongside strength development and athletic transfer, while the known ankle limitation requires conservative landing exposure, crisp repetitions and PT review before progression." },
    kevin: { goal: "Strength gain", days: 5, duration: 60, exercises: ["Barbell Back Squat", "Barbell Deadlift", "Barbell Bench Press", "Seated Cable Row", "Barbell Overhead Press", "Split Squat"], sessionExercises: { "1": ["Barbell Back Squat", "Barbell Bench Press", "Seated Cable Row"], "2": ["Split Squat", "Dumbbell Bench Press", "Lat Pulldown"], "3": ["Barbell Deadlift", "Barbell Overhead Press", "One-Arm Dumbbell Row"], "4": ["Leg Press", "Machine Chest Press", "Cable Face Pull"], "5": ["Barbell Back Squat", "Barbell Bench Press", "Split Squat"] }, sessionNames: { "1": "Squat Strength", "2": "Upper / Lower Volume", "3": "Deadlift Strength", "4": "Technique and Recovery", "5": "Competition Lift Practice" }, sessionDays: [1, 2, 3, 4, 5], methodology: "Five-day strength split using primary-lift practice, supplementary volume and a lower-fatigue technique day", rationale: "Five sessions reflect the client’s established training age and strength goal. The main lifts receive repeated practice, while supplementary and technique days distribute fatigue rather than repeating maximal work every session." },
    paul: { goal: "Muscle and strength gain", days: 2, duration: 60, exercises: ["Leg Press", "Machine Chest Press", "Seated Cable Row", "Barbell Hip Thrust", "Dead Bug", "Incline Treadmill Walk"], sessionExercises: { "1": ["Leg Press", "Machine Chest Press", "Seated Cable Row", "Dead Bug"], "3": ["Barbell Hip Thrust", "Machine Chest Press", "Band Row", "Incline Treadmill Walk"] }, sessionNames: { "1": "Full Body Foundation", "3": "Full Body Strength" }, sessionDays: [1, 3], methodology: "Two-day full-body strength foundation with conservative loading, trunk control and low-impact aerobic work", rationale: "Two full-body sessions fit the stated availability and support muscle and strength without unnecessary complexity. Back history and cardiovascular screening flags require PT review, conservative loading and appropriate clearance decisions before assignment." },
  };
  const plan = slug ? plans[slug] : undefined;
  if (!plan) throw new Error("This client is not one of the labelled Module 7 case-study fixtures.");
  const allExercises = await db.select({ name: ptExercises.name, movementPattern: ptExercises.movementPattern }).from(ptExercises).where(or(isNull(ptExercises.ownerProfileId), eq(ptExercises.ownerProfileId, owner.authUserId)));
  const selected = plan.exercises.map((name) => { const match = allExercises.find((exercise) => exercise.name.toLowerCase() === name.toLowerCase()); if (!match) throw new Error(`Exercise missing from library: ${name}`); const isConditioning = /walk/i.test(name); const isPower = /jump/i.test(name); return { name: match.name, pattern: match.movementPattern, sets: isConditioning || isPower ? 2 : 3, repsMin: isConditioning ? 1 : isPower ? 3 : 8, repsMax: isConditioning ? 15 : isPower ? 5 : 12, intensityValue: isPower ? "RPE 6 · crisp reps" : "2 RIR", restSeconds: isPower || /deadlift|squat/i.test(name) ? 120 : 90, tempo: "", technique: isPower ? "Power / crisp reps" : isConditioning ? "Interval / aerobic" : undefined, notes: isConditioning ? "Progress duration and intensity gradually; use RPE if no heart-rate data." : undefined, groupKey: isConditioning ? "conditioning" : undefined, progressionRule: "Progress when the top of the range is achieved with acceptable technique, target effort and no pain; otherwise hold or regress." }; });
  const sessionExercises = Object.fromEntries(Object.entries(plan.sessionExercises).map(([day, names]) => [day, names.map((name) => selected.find((exercise) => exercise.name.toLowerCase() === name.toLowerCase())).filter((exercise): exercise is NonNullable<typeof exercise> => Boolean(exercise))]));
  const result = await saveProgrammeAction({ clientName: `${client.firstName} ${client.lastName}`, goalSummary: plan.goal, trainingDays: plan.days, sessionDurationMinutes: plan.duration, exercises: selected, sessionExercises, sessionNames: plan.sessionNames, sessionDays: plan.sessionDays, methodology: plan.methodology, rationale: plan.rationale });
  return { ...result, slug, programmeLabel: `${plan.goal} case-study draft` };
}

export async function updateClientAction(rawInput: z.input<typeof clientUpdateSchema>) {
  const owner = await requireDesignerAccess();
  const input = clientUpdateSchema.parse(rawInput);
  const db = getDb();
  const [client] = await db.update(ptClients).set({ sessionDurationMinutes: input.sessionDurationMinutes, preferredDays: Array.from({ length: input.trainingDays }, (_, index) => index + 1), updatedAt: new Date() }).where(and(eq(ptClients.id, input.clientId), eq(ptClients.ownerProfileId, owner.authUserId))).returning({ id: ptClients.id });
  if (!client) throw new Error("Client could not be updated.");
  const [goal] = await db.select({ id: ptGoals.id }).from(ptGoals).where(and(eq(ptGoals.clientId, client.id), eq(ptGoals.priority, "primary"))).limit(1);
  if (goal) await db.update(ptGoals).set({ goalType: input.goalType, updatedAt: new Date() }).where(eq(ptGoals.id, goal.id));
  else await db.insert(ptGoals).values({ clientId: client.id, goalType: input.goalType, priority: "primary" });
  revalidatePath("/designer");
  return { clientId: client.id };
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
  const [previousProgramme] = await db.select({ version: ptProgrammes.version }).from(ptProgrammes).where(and(eq(ptProgrammes.ownerProfileId, owner.authUserId), eq(ptProgrammes.clientId, client.id))).orderBy(desc(ptProgrammes.version)).limit(1);
  const [programme] = await db.insert(ptProgrammes).values({ ownerProfileId: owner.authUserId, clientId: client.id, name: `${input.goalSummary} foundation`, goalSummary: input.goalSummary, durationWeeks: 8, methodology: input.methodology || "Full-body foundation with RIR-based double progression", status: "draft", version: (previousProgramme?.version ?? 0) + 1, rationale: input.rationale || "Draft saved for PT review. Finalise only after screening, equipment and quality checks have been reviewed." }).returning({ id: ptProgrammes.id, version: ptProgrammes.version });
  if (!programme) throw new Error("Programme could not be saved.");
  const allExercises = await db.select({ id: ptExercises.id, name: ptExercises.name }).from(ptExercises).where(or(isNull(ptExercises.ownerProfileId), eq(ptExercises.ownerProfileId, owner.authUserId))).orderBy(asc(ptExercises.name));
  const exerciseRows = input.exercises.map((exercise, index) => {
    const match = allExercises.find((candidate) => candidate.name.toLowerCase() === exercise.name.toLowerCase());
    return match ? { exerciseId: match.id, orderIndex: index, sets: exercise.sets, repsMin: exercise.repsMin ?? null, repsMax: exercise.repsMax ?? null, intensityType: "rir" as const, intensityValue: exercise.intensityValue, restSeconds: exercise.restSeconds ?? null, tempo: exercise.tempo || null, technique: exercise.technique || null, notes: exercise.notes || null, groupKey: exercise.groupKey || null, progressionRule: exercise.progressionRule || "When all sets reach the top of the range at target RIR with acceptable technique, add a small load increment." } : null;
  }).filter((row): row is NonNullable<typeof row> => row !== null);
  const rowsByDay: Record<string, typeof exerciseRows> = {};
  for (const [day, exercises] of Object.entries(input.sessionExercises ?? {})) {
    rowsByDay[day] = exercises.map((exercise, index) => {
      const match = allExercises.find((candidate) => candidate.name.toLowerCase() === exercise.name.toLowerCase());
      return match ? { exerciseId: match.id, orderIndex: index, sets: exercise.sets, repsMin: exercise.repsMin ?? null, repsMax: exercise.repsMax ?? null, intensityType: "rir" as const, intensityValue: exercise.intensityValue, restSeconds: exercise.restSeconds ?? null, tempo: exercise.tempo || null, technique: exercise.technique || null, notes: exercise.notes || null, groupKey: exercise.groupKey || null, progressionRule: exercise.progressionRule || "When all sets reach the top of the range at target RIR with acceptable technique, add a small load increment." } : null;
    }).filter((row): row is NonNullable<typeof row> => row !== null);
  }
  let savedPrescriptionCount = 0;
  const sessionDays = input.sessionDays ?? [1, 3, 5];
  for (let weekNumber = 1; weekNumber <= 8; weekNumber += 1) {
    const [week] = await db.insert(ptProgrammeWeeks).values({ programmeId: programme.id, weekNumber, focus: weekNumber <= 2 ? "Foundation / familiarisation" : weekNumber <= 6 ? "Build / progressive overload" : "Consolidate / review", volumeTarget: weekNumber <= 2 ? "Moderate" : "Moderate-high", intensityTarget: "RIR 2–3" }).returning({ id: ptProgrammeWeeks.id });
    if (!week) throw new Error("Programme week could not be saved.");
    for (const dayOfWeek of sessionDays) {
      const sessionName = input.sessionNames?.[String(dayOfWeek)] || `Day ${dayOfWeek} - Full body`;
      const sessionType = /conditioning|interval|aerobic/i.test(sessionName) ? "conditioning" : /power|athletic/i.test(sessionName) ? "strength" : /strength/i.test(sessionName) ? "strength" : "mixed";
      const [session] = await db.insert(ptSessions).values({ programmeWeekId: week.id, dayOfWeek, name: sessionName, sessionType, durationMinutes: input.sessionDurationMinutes, warmupMinutes: 5 }).returning({ id: ptSessions.id });
      if (!session) throw new Error("Programme session could not be saved.");
      const rowsForDay = rowsByDay[String(dayOfWeek)] ?? (dayOfWeek === 1 ? exerciseRows : []);
      if (rowsForDay.length) {
        const rows = rowsForDay.map((row) => ({ ...row, sessionId: session.id }));
        await db.insert(ptExercisePrescriptions).values(rows);
        savedPrescriptionCount += rows.length;
      }
    }
  }
  await db.insert(ptProgrammeEvents).values({ programmeId: programme.id, actorProfileId: owner.authUserId, action: "draft_saved", details: { exerciseCount: savedPrescriptionCount, weekCount: 8, version: programme.version } });
  revalidatePath("/designer");
  return { programmeId: programme.id, version: programme.version, exerciseCount: savedPrescriptionCount, weekCount: 8 };
}

export async function recordProgrammeOverrideAction(rawInput: z.input<typeof programmeOverrideSchema>) {
  const owner = await requireDesignerAccess();
  const input = programmeOverrideSchema.parse(rawInput);
  const db = getDb();
  const [programme] = await db.select({ id: ptProgrammes.id, overrideReasons: ptProgrammes.overrideReasons }).from(ptProgrammes).where(and(eq(ptProgrammes.id, input.programmeId), eq(ptProgrammes.ownerProfileId, owner.authUserId))).limit(1);
  if (!programme) throw new Error("Programme could not be found.");
  const override = { warningCodes: input.warningCodes, reason: input.reason, recordedAt: new Date().toISOString() };
  const previous = Array.isArray(programme.overrideReasons) ? programme.overrideReasons : [];
  await db.update(ptProgrammes).set({ overrideReasons: [...previous, override], updatedAt: new Date() }).where(eq(ptProgrammes.id, programme.id));
  await db.insert(ptProgrammeEvents).values({ programmeId: programme.id, actorProfileId: owner.authUserId, action: "quality_override", details: override });
  revalidatePath("/designer");
  return { programmeId: programme.id };
}

export async function transitionProgrammeAction(rawInput: z.input<typeof programmeTransitionSchema>) {
  const owner = await requireDesignerAccess();
  const input = programmeTransitionSchema.parse(rawInput);
  const db = getDb();
  const [programme] = await db.select({ id: ptProgrammes.id, clientId: ptProgrammes.clientId, status: ptProgrammes.status }).from(ptProgrammes).where(and(eq(ptProgrammes.id, input.programmeId), eq(ptProgrammes.ownerProfileId, owner.authUserId))).limit(1);
  if (!programme) throw new Error("Programme could not be found.");
  if (programme.status === input.status) return { programmeId: programme.id, status: programme.status };
  if (input.status === "assigned") {
    const [assessment] = await db.select({ clearanceRequired: ptAssessments.clearanceRequired }).from(ptAssessments).where(eq(ptAssessments.clientId, programme.clientId)).orderBy(desc(ptAssessments.assessmentDate)).limit(1);
    if (assessment?.clearanceRequired) throw new Error("Resolve the screening or clearance flag before assigning this programme.");
  }
  if ((input.status === "paused" || input.status === "archived") && !input.reason?.trim()) throw new Error("Record a reason when pausing or archiving a programme.");
  const now = new Date();
  await db.update(ptProgrammes).set({ status: input.status, startDate: input.status === "assigned" ? now.toISOString().slice(0, 10) : undefined, updatedAt: now }).where(eq(ptProgrammes.id, programme.id));
  await db.insert(ptProgrammeEvents).values({ programmeId: programme.id, actorProfileId: owner.authUserId, action: "status_changed", details: { from: programme.status, to: input.status, reason: input.reason ?? null, changedAt: now.toISOString() } });
  revalidatePath("/designer");
  return { programmeId: programme.id, status: input.status };
}

export async function logWorkoutResultAction(rawInput: z.input<typeof workoutInputSchema>) {
  const owner = await requireDesignerAccess();
  const input = workoutInputSchema.parse(rawInput);
  const db = getDb();
  const [client] = await db.select({ id: ptClients.id }).from(ptClients).where(and(eq(ptClients.ownerProfileId, owner.authUserId), eq(ptClients.id, input.clientId))).limit(1);
  if (!client) throw new Error("Save the client profile before logging a workout.");
  const [session] = await db.select({ id: ptSessions.id }).from(ptSessions).innerJoin(ptProgrammeWeeks, eq(ptProgrammeWeeks.id, ptSessions.programmeWeekId)).innerJoin(ptProgrammes, eq(ptProgrammes.id, ptProgrammeWeeks.programmeId)).where(and(eq(ptSessions.id, input.sessionId), eq(ptProgrammes.clientId, client.id), eq(ptProgrammes.ownerProfileId, owner.authUserId))).limit(1);
  if (!session) throw new Error("The selected session could not be found for this client.");
  const [result] = await db.insert(ptWorkoutResults).values({ ownerProfileId: owner.authUserId, clientId: client.id, sessionId: session.id, scheduledDate: input.scheduledDate, completedAt: input.status === "completed" || input.status === "partial" ? new Date() : null, status: input.status, sessionRpe: input.sessionRpe ?? null, energy: input.energy ?? null, painReported: input.painReported, enjoyment: input.enjoyment ?? null, durationMinutes: input.durationMinutes ?? null, notes: input.notes || null }).returning({ id: ptWorkoutResults.id });
  if (!result) throw new Error("Workout result could not be saved.");
  if (input.sets?.length) {
    const prescriptions = await db.select({ id: ptExercisePrescriptions.id }).from(ptExercisePrescriptions).where(eq(ptExercisePrescriptions.sessionId, session.id));
    const allowed = new Set(prescriptions.map((prescription) => prescription.id));
    const setRows = input.sets.filter((set) => allowed.has(set.prescriptionId)).map((set) => ({ workoutResultId: result.id, prescriptionId: set.prescriptionId, setNumber: set.setNumber, actualReps: set.reps ?? null, actualLoadKg: set.loadKg ?? null, actualRpe: set.rpe ?? null, actualRir: set.rir ?? null, techniqueAcceptable: set.techniqueAcceptable, painReported: set.painReported }));
    if (setRows.length) await db.insert(ptWorkoutResultSets).values(setRows);
  }
  revalidatePath("/designer");
  return { resultId: result.id };
}
