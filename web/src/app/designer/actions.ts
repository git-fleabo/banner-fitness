"use server";

 import { and, asc, desc, eq, isNull, ne, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getAccountAccess } from "@/lib/authorization/server";
import { getDb } from "@/lib/db/client";
import { ptAssessments, ptClientPerformanceRecords, ptClients, ptDesignerSettings, ptExercisePrescriptions, ptExercises, ptGoals, ptLocations, ptPreferences, ptProgrammeEvents, ptProgrammeQualityAcknowledgements, ptProgrammeWeeks, ptProgrammes, ptSessions, ptWorkoutResultSets, ptWorkoutResults } from "@/lib/db/schema";
import { getScreeningFlags, hasRecordedScreeningReview, screeningReviewMarker, type ScreeningAnswers } from "@/lib/pt-programming";
import { caseStudyFixtures, type CaseStudySlug } from "@/lib/case-study-fixtures";
import { defaultQualitySettings, normalizeQualitySettings, type QualitySettings } from "@/lib/pt-quality";
import { findingCanBeAcknowledged, getCurrentProgrammeQuality, refreshClientProgrammeQuality, refreshOwnerProgrammeQuality, refreshProgrammeQuality } from "@/lib/pt-quality-server";
import { defaultEffortForExperience, listText, performanceBaselineText, remapSessionDays } from "@/lib/pt-performance";

const clientInputSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.string().trim().email().optional().or(z.literal("")),
  dateOfBirth: z.string().optional(),
  sexOrGender: z.string().trim().max(80).optional(),
  trainingExperience: z.string().trim().max(80).optional(),
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
const clientProfileUpdateSchema = z.object({ clientId: z.string().uuid(), firstName: z.string().trim().min(1).max(80), lastName: z.string().trim().min(1).max(80), dateOfBirth: z.string().max(10).optional(), sexOrGender: z.string().trim().max(80).optional(), trainingExperience: z.string().trim().max(80).optional(), heightCm: z.number().int().min(50).max(260).optional(), weightKg: z.number().int().min(20).max(400).optional(), occupation: z.string().trim().max(160).optional(), dailyActivity: z.string().trim().max(500).optional(), sleepHours: z.string().trim().max(40).optional(), stressLevel: z.string().trim().max(40).optional(), sessionDurationMinutes: z.number().int().min(15).max(180), notes: z.string().trim().max(4000).optional() });
const deleteClientSchema = z.object({ clientId: z.string().uuid(), confirmation: z.literal("DELETE CLIENT") });
const clientPreferencesSchema = z.object({ clientId: z.string().uuid(), likedExercises: z.array(z.string().trim().min(1)).max(30), dislikedExercises: z.array(z.string().trim().min(1)).max(30), preferredStyle: z.string().trim().max(120).optional(), preferredStructure: z.string().trim().max(120).optional(), preferredEquipment: z.array(z.string().trim().min(1)).max(30), cardioModalities: z.array(z.string().trim().min(1)).max(20), varietyPreference: z.string().trim().max(80).optional(), confidenceNotes: z.string().trim().max(2000).optional() });
const performanceRecordSchema = z.object({ clientId: z.string().uuid(), exerciseId: z.string().uuid().optional(), metricType: z.enum(["one_rm", "estimated_one_rm", "rep_max", "other"]), metricName: z.string().trim().max(120).optional(), performanceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), value: z.number().positive().max(100000), unit: z.string().trim().min(1).max(20), repetitions: z.number().int().min(1).max(100).optional(), loadKg: z.number().positive().max(1000).optional(), source: z.enum(["tested", "estimated", "client_reported", "workout_result", "other"]), confidence: z.enum(["high", "moderate", "low"]).optional(), techniqueAcceptable: z.boolean(), painReported: z.boolean(), notes: z.string().trim().max(2000).optional() }).superRefine((input, context) => { if (!input.exerciseId && !input.metricName?.trim()) context.addIssue({ code: "custom", path: ["metricName"], message: "Add a metric name when no exercise is selected." }); if (input.metricType === "rep_max" && (!input.repetitions || !input.loadKg)) context.addIssue({ code: "custom", path: ["repetitions"], message: "Rep-max records need repetitions and load." }); });
const clientLocationSchema = z.object({ clientId: z.string().uuid(), name: z.string().trim().min(1).max(120), locationType: z.string().trim().min(1).max(80), equipment: z.array(z.string().trim().min(1)).max(40) });
const caseStudySchema = z.object({ slug: z.enum(["ciara", "jessica", "kevin", "paul"]) });
const caseStudyDraftSchema = z.object({ clientId: z.string().uuid() });
const programmeOverrideSchema = z.object({ programmeId: z.string().uuid(), warningCodes: z.array(z.string().trim().min(1).max(120)).max(20), reason: z.string().trim().min(3).max(1000), decision: z.enum(["acknowledged", "overridden"]).optional() });
const programmeTransitionSchema = z.object({ programmeId: z.string().uuid(), status: z.enum(["draft", "reviewed", "assigned", "active", "paused", "completed", "archived"]), reason: z.string().trim().max(1000).optional() });
const screeningReviewSchema = z.object({ clientId: z.string().uuid(), outcome: z.enum(["pt_review_completed", "professional_clearance_obtained"]), reason: z.string().trim().min(10).max(1000) });
const clientAssessmentUpdateSchema = z.object({ clientId: z.string().uuid(), screening: z.record(z.string(), z.boolean()).optional(), injuryNotes: z.string().trim().max(4000).optional(), contraindicationNotes: z.string().trim().max(4000).optional(), clearanceRequired: z.boolean(), ptNotes: z.string().trim().max(4000).optional() });
const qualitySettingsSchema = z.object({ checkScreening: z.boolean(), checkFrequency: z.boolean(), checkBalance: z.boolean(), checkVolume: z.boolean(), checkProgression: z.boolean(), checkDuration: z.boolean(), maxSetsPerSession: z.number().int().min(1).max(100), pressPullTolerance: z.number().int().min(0).max(10) });
const weekPlanSchema = z.object({ focus: z.string().trim().min(1).max(120), volumeTarget: z.string().trim().min(1).max(80), intensityTarget: z.string().trim().min(1).max(80) });

type WeekPlan = z.infer<typeof weekPlanSchema>;
const standardWeekPlans: Record<string, WeekPlan[]> = {
  general: [
    { focus: "Familiarisation / movement quality", volumeTarget: "Moderate", intensityTarget: "RIR 3" },
    { focus: "Foundation / technique consistency", volumeTarget: "Moderate", intensityTarget: "RIR 2–3" },
    { focus: "Accumulation / progressive overload", volumeTarget: "Moderate-high", intensityTarget: "RIR 2" },
    { focus: "Accumulation / density progression", volumeTarget: "Moderate-high", intensityTarget: "RIR 2" },
    { focus: "Build / load progression", volumeTarget: "Moderate-high", intensityTarget: "RIR 1–2" },
    { focus: "Build / rep-range progression", volumeTarget: "Moderate-high", intensityTarget: "RIR 1–2" },
    { focus: "Consolidation / fatigue management", volumeTarget: "Moderate", intensityTarget: "RIR 2–3" },
    { focus: "Review / next-block readiness", volumeTarget: "Moderate", intensityTarget: "RIR 3" },
  ],
  power: [
    { focus: "Technical familiarisation / landing quality", volumeTarget: "Low-moderate", intensityTarget: "RPE 6" },
    { focus: "Strength foundation / crisp intent", volumeTarget: "Moderate", intensityTarget: "RIR 3" },
    { focus: "Power accumulation / quality contacts", volumeTarget: "Moderate", intensityTarget: "RPE 6–7" },
    { focus: "Power development / reduced fatigue", volumeTarget: "Moderate", intensityTarget: "RPE 7" },
    { focus: "Intensification / force production", volumeTarget: "Moderate", intensityTarget: "RIR 2" },
    { focus: "Realisation / high-quality efforts", volumeTarget: "Low-moderate", intensityTarget: "RPE 7–8" },
    { focus: "Taper / athletics integration", volumeTarget: "Low", intensityTarget: "RPE 6" },
    { focus: "Performance review / next block", volumeTarget: "Low-moderate", intensityTarget: "RPE 6" },
  ],
  strength: [
    { focus: "Technique / baseline practice", volumeTarget: "Moderate", intensityTarget: "RIR 3" },
    { focus: "Volume accumulation", volumeTarget: "Moderate-high", intensityTarget: "RIR 2–3" },
    { focus: "Volume accumulation / lift practice", volumeTarget: "High", intensityTarget: "RIR 2" },
    { focus: "Overload / supplementary volume", volumeTarget: "High", intensityTarget: "RIR 1–2" },
    { focus: "Intensification / primary lifts", volumeTarget: "Moderate", intensityTarget: "RIR 1–2" },
    { focus: "Intensification / heavy practice", volumeTarget: "Moderate", intensityTarget: "RIR 1" },
    { focus: "Deload / fatigue reduction", volumeTarget: "Low", intensityTarget: "RIR 3–4" },
    { focus: "Test readiness / review", volumeTarget: "Moderate", intensityTarget: "RIR 2" },
  ],
  conservative: [
    { focus: "Familiarisation / symptom-free movement", volumeTarget: "Low-moderate", intensityTarget: "RIR 3–4" },
    { focus: "Foundation / technique consistency", volumeTarget: "Moderate", intensityTarget: "RIR 3" },
    { focus: "Gradual overload / recovery check", volumeTarget: "Moderate", intensityTarget: "RIR 2–3" },
    { focus: "Gradual overload / confidence", volumeTarget: "Moderate", intensityTarget: "RIR 2–3" },
    { focus: "Build / controlled progression", volumeTarget: "Moderate", intensityTarget: "RIR 2" },
    { focus: "Build / repeatable effort", volumeTarget: "Moderate", intensityTarget: "RIR 2" },
    { focus: "Consolidation / fatigue management", volumeTarget: "Low-moderate", intensityTarget: "RIR 3" },
    { focus: "Review / clearance and next block", volumeTarget: "Low-moderate", intensityTarget: "RIR 3" },
  ],
};

const programmeInputSchema = z.object({
  clientName: z.string().trim().min(1).max(160),
  goalSummary: z.string().trim().min(1).max(200),
  trainingDays: z.number().int().min(1).max(7),
  sessionDurationMinutes: z.number().int().min(15).max(180),
  exercises: z.array(exerciseDraftSchema).min(1).max(100),
  sessionExercises: z.record(z.string(), z.array(exerciseDraftSchema)).optional(),
  sessionExercisesByWeek: z.record(z.string(), z.record(z.string(), z.array(exerciseDraftSchema))).optional(),
  sessionNames: z.record(z.string(), z.string().trim().min(1).max(120)).optional(),
  sessionDays: z.array(z.number().int().min(1).max(7)).min(1).max(7).optional(),
  methodology: z.string().trim().max(300).optional(),
  rationale: z.string().trim().max(2000).optional(),
  weekPlans: z.array(weekPlanSchema).length(8).optional(),
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

function normalizePreferredDays(raw: unknown, trainingDays: number) {
  const values = Array.isArray(raw) ? raw.filter((value): value is number => typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 7) : [];
  const unique = Array.from(new Set(values)).sort((a, b) => a - b);
  return (unique.length ? unique : Array.from({ length: trainingDays }, (_, index) => index + 1)).slice(0, 7);
}

async function requireDesignerAccess() {
  const access = await getAccountAccess();
  if (access.state !== "active" || access.account.role !== "owner") throw new Error("A signed-in PT owner account is required.");
  return access.account;
}

export async function createClientAction(rawInput: z.input<typeof clientInputSchema> & { preferredDays?: number[] }) {
  const owner = await requireDesignerAccess();
  const input = clientInputSchema.parse(rawInput);
  const preferredDays = normalizePreferredDays((rawInput as { preferredDays?: unknown }).preferredDays, input.trainingDays);
  const flags = getScreeningFlags(input.screening);
  const db = getDb();
  const [client] = await db.insert(ptClients).values({
    ownerProfileId: owner.authUserId,
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email || null,
    dateOfBirth: input.dateOfBirth || null,
    sexOrGender: input.sexOrGender || null,
    trainingExperience: input.trainingExperience || null,
    sessionDurationMinutes: input.sessionDurationMinutes,
    preferredDays,
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
  if (existing[0]) {
    if (input.slug === "ciara") await db.update(ptLocations).set({ equipment: fixture.equipment, updatedAt: new Date() }).where(eq(ptLocations.clientId, existing[0].id));
    await refreshClientProgrammeQuality(db, owner.authUserId, existing[0].id);
    return { clientId: existing[0].id, name: fixture.name, existing: true, riskFlags: getScreeningFlags(fixture.screening) };
  }
  const dateOfBirth = `${new Date().getFullYear() - fixture.age}-01-01`;
  const [client] = await db.insert(ptClients).values({ ownerProfileId: owner.authUserId, firstName: fixture.name, lastName: "Case Study", dateOfBirth, sexOrGender: fixture.sex, trainingExperience: fixture.experience, heightCm: fixture.heightCm, weightKg: fixture.weightKg, occupation: "Module 7 case-study profile", dailyActivity: fixture.notes, sessionDurationMinutes: fixture.sessionDurationMinutes, preferredDays: Array.from({ length: fixture.trainingDays }, (_, index) => index + 1), notes: `[CASE STUDY FIXTURE: ${input.slug}] ${fixture.notes}` }).returning({ id: ptClients.id });
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
  const [client] = await db.select({ id: ptClients.id, firstName: ptClients.firstName, lastName: ptClients.lastName, notes: ptClients.notes, trainingExperience: ptClients.trainingExperience, dailyActivity: ptClients.dailyActivity, sleepHours: ptClients.sleepHours, stressLevel: ptClients.stressLevel, sessionDurationMinutes: ptClients.sessionDurationMinutes, preferredDays: ptClients.preferredDays }).from(ptClients).where(and(eq(ptClients.id, input.clientId), eq(ptClients.ownerProfileId, owner.authUserId))).limit(1);
  if (!client) throw new Error("Case-study client could not be found.");
  const slug = client.notes?.match(/CASE STUDY FIXTURE: ([a-z]+)/i)?.[1]?.toLowerCase();
  const [assessment] = await db.select({ responses: ptAssessments.responses, riskFlags: ptAssessments.riskFlags, clearanceRequired: ptAssessments.clearanceRequired, ptNotes: ptAssessments.ptNotes }).from(ptAssessments).where(eq(ptAssessments.clientId, client.id)).orderBy(desc(ptAssessments.assessmentDate)).limit(1);
  const [goal] = await db.select({ goalType: ptGoals.goalType, target: ptGoals.target, metric: ptGoals.metric }).from(ptGoals).where(and(eq(ptGoals.clientId, client.id), eq(ptGoals.priority, "primary"))).orderBy(desc(ptGoals.updatedAt)).limit(1);
  const [preferences] = await db.select({ likedExercises: ptPreferences.likedExercises, dislikedExercises: ptPreferences.dislikedExercises, preferredStyle: ptPreferences.preferredStyle, preferredStructure: ptPreferences.preferredStructure, preferredEquipment: ptPreferences.preferredEquipment, cardioModalities: ptPreferences.cardioModalities, confidenceNotes: ptPreferences.confidenceNotes }).from(ptPreferences).where(eq(ptPreferences.clientId, client.id)).limit(1);
  const [location] = await db.select({ name: ptLocations.name, locationType: ptLocations.locationType, equipment: ptLocations.equipment }).from(ptLocations).where(eq(ptLocations.clientId, client.id)).orderBy(desc(ptLocations.updatedAt)).limit(1);
  const performanceRecords = await db.select({ exerciseId: ptClientPerformanceRecords.exerciseId, exerciseName: ptExercises.name, metricType: ptClientPerformanceRecords.metricType, value: ptClientPerformanceRecords.value, unit: ptClientPerformanceRecords.unit, repetitions: ptClientPerformanceRecords.repetitions, loadKg: ptClientPerformanceRecords.loadKg, source: ptClientPerformanceRecords.source, confidence: ptClientPerformanceRecords.confidence, techniqueAcceptable: ptClientPerformanceRecords.techniqueAcceptable, painReported: ptClientPerformanceRecords.painReported, performanceDate: ptClientPerformanceRecords.performanceDate, notes: ptClientPerformanceRecords.notes }).from(ptClientPerformanceRecords).leftJoin(ptExercises, eq(ptClientPerformanceRecords.exerciseId, ptExercises.id)).where(eq(ptClientPerformanceRecords.clientId, client.id)).orderBy(desc(ptClientPerformanceRecords.performanceDate), desc(ptClientPerformanceRecords.createdAt)).limit(100);
  type CaseStudyPlan = { goal: string; days: number; duration: number; exercises: string[]; sessionExercises: Record<string, string[]>; sessionExercisesByWeek?: Record<string, Record<string, string[]>>; sessionNames: Record<string, string>; sessionDays: number[]; methodology: string; rationale: string; weekPlans: WeekPlan[] };
  const ciaraWeekSessionExercises: Record<string, Record<string, string[]>> = Object.fromEntries(Array.from({ length: 8 }, (_, index) => {
    const week = index + 1;
    const conditioning = week <= 4 ? "Cross-Trainer Intervals" : "Incline Treadmill Walk";
    return [String(week), {
      "1": ["Barbell Back Squat", "DB Bench Press", "Seated Cable Row", "DB Romanian Deadlift", conditioning],
      "3": ["Goblet Squat", "Machine Chest Press", "One-Arm Dumbbell Row", "Split Squat", conditioning],
      "5": ["Step-Up", "Push-Up", "Resistance Band Row", conditioning],
    }];
  }));
  const ciaraWeekPlans: WeekPlan[] = [
    { focus: "Familiarisation + aerobic base", volumeTarget: "3 full-body sessions; cross-trainer 12–15 min", intensityTarget: "Squat 30 kg × 8–10; RIR 3; CV RPE 5–6" },
    { focus: "Foundation + repeatable effort", volumeTarget: "Cross-trainer 15–18 min; hold resistance volume", intensityTarget: "Squat 30 kg × 8–10; RIR 2–3; CV RPE 6" },
    { focus: "Accumulation + interval introduction", volumeTarget: "Cross-trainer 18–20 min; controlled work:recovery", intensityTarget: "Squat 32.5 kg only if 30 kg target is repeatable; RIR 2–3" },
    { focus: "Block review + cross-trainer progression", volumeTarget: "Cross-trainer 20–22 min; confirm transition readiness", intensityTarget: "Squat 32.5 kg or hold; RIR 2; CV RPE 6–7" },
    { focus: "Treadmill familiarisation + build", volumeTarget: "Incline treadmill 15–20 min; resume resistance progression", intensityTarget: "Squat 35 kg if technique and RIR support; CV RPE 6" },
    { focus: "Treadmill duration progression", volumeTarget: "Incline treadmill 20–25 min toward sustainable pace", intensityTarget: "Squat 35 kg or hold; RIR 1–2; CV RPE 6–7" },
    { focus: "Treadmill pace + consolidation", volumeTarget: "Treadmill 25–30 min; maintain full-body volume", intensityTarget: "Squat 37.5 kg if repeatable; RIR 1–2; CV RPE 7" },
    { focus: "Test readiness + review", volumeTarget: "Treadmill benchmark toward 5 km under 30 min; review block", intensityTarget: "40 kg × 10 only if technique and RIR are acceptable; otherwise hold" },
  ];
  const plans: Record<string, CaseStudyPlan> = {
    ciara: { goal: "Fat loss and tone", days: 3, duration: 60, exercises: ["Barbell Back Squat", "DB Bench Press", "Seated Cable Row", "DB Romanian Deadlift", "Cable Lateral Raise", "Cross-Trainer Intervals", "Incline Treadmill Walk"], sessionExercises: ciaraWeekSessionExercises["1"], sessionExercisesByWeek: ciaraWeekSessionExercises, sessionNames: { "1": "Full Body Stability", "3": "Full Body Endurance", "5": "Full Body Conditioning" }, sessionDays: [1, 3, 5], methodology: "Full-body phased progression with a four-week cross-trainer block followed by a four-week treadmill block and RIR-based resistance training", rationale: "This draft mirrors the case-study requirements: three practical full-body sessions, a weekly resistance aim and a weekly cardiovascular aim. Cross-trainer work is used for weeks 1–4, then incline treadmill work for weeks 5–8, respecting the dislike of running while building toward the 5 km under-30-minute objective. The tested 30 kg × 10 barbell squat is the baseline, with a gated 40 kg × 10 target rather than an automatic promise.", weekPlans: ciaraWeekPlans },
    jessica: { goal: "Power gain", days: 3, duration: 75, exercises: ["Trap-Bar Deadlift", "Barbell Bench Press", "Dumbbell Shoulder Press", "Chest-Supported DB Row", "Broad Jump", "Cable Pallof Press"], sessionExercises: { "1": ["Trap-Bar Deadlift", "Barbell Bench Press", "Chest-Supported DB Row"], "3": ["Broad Jump", "Dumbbell Shoulder Press", "Split Squat", "Cable Pallof Press"], "5": ["Barbell Deadlift", "Incline Dumbbell Press", "One-Arm Dumbbell Row"] }, sessionNames: { "1": "Strength Foundation", "3": "Power and Athletic Transfer", "5": "Deadlift Strength" }, sessionDays: [1, 3, 5], methodology: "Concurrent strength-power programme alongside athletics training", rationale: "The draft accounts for three gym sessions plus two athletics sessions, the 115 kg deadlift baseline and the 55 cm jump target. Power exposure stays low-repetition and crisp rather than high-rep, with ankle symptoms, landing quality and the low-squat limitation treated as progression gates for PT review.", weekPlans: standardWeekPlans.power },
    kevin: { goal: "Strength gain", days: 5, duration: 60, exercises: ["Barbell Back Squat", "Barbell Deadlift", "Barbell Bench Press", "Seated Cable Row", "Barbell Overhead Press", "Split Squat"], sessionExercises: { "1": ["Barbell Back Squat", "Barbell Bench Press", "Seated Cable Row"], "2": ["Split Squat", "Dumbbell Bench Press", "Lat Pulldown"], "3": ["Barbell Deadlift", "Barbell Overhead Press", "One-Arm Dumbbell Row"], "4": ["Leg Press", "Machine Chest Press", "Cable Face Pull"], "5": ["Barbell Back Squat", "Barbell Bench Press", "Split Squat"] }, sessionNames: { "1": "Squat Strength", "2": "Upper / Lower Volume", "3": "Deadlift Strength", "4": "Technique and Recovery", "5": "Competition Lift Practice" }, sessionDays: [1, 2, 3, 4, 5], methodology: "Five-day strength split using primary-lift practice, supplementary volume and a lower-fatigue technique day", rationale: "The five-day structure suits an intermediate lifter preparing for possible powerlifting competition. High-bar squat practice is prioritised against the 110 kg 5RM baseline, with the 92.5 kg bench and 155 kg deadlift recorded as additional reference lifts; submaximal RIR-based progression distributes fatigue instead of repeating maximal work every session.", weekPlans: standardWeekPlans.strength },
    paul: { goal: "Muscle and strength gain", days: 2, duration: 60, exercises: ["Leg Press", "Machine Chest Press", "Seated Cable Row", "Barbell Hip Thrust", "Dead Bug", "Incline Treadmill Walk"], sessionExercises: { "1": ["Leg Press", "Machine Chest Press", "Seated Cable Row", "Dead Bug"], "3": ["Barbell Hip Thrust", "Machine Chest Press", "Resistance Band Row", "Incline Treadmill Walk"] }, sessionNames: { "1": "Full Body Foundation", "3": "Full Body Strength" }, sessionDays: [1, 3], methodology: "Two-day full-body strength foundation with conservative loading, trunk control and low-impact aerobic work", rationale: "Two full-body sessions fit the stated availability and build consistency toward the two-to-three-day goal. The 5-repetition press-up baseline and 29 cm sit-and-reach result are useful review measures, while back-pain history and previous pre-hypertension require screening review, appropriate clearance decisions and no automatic progression through pain or symptoms.", weekPlans: standardWeekPlans.conservative },
  };
  const plan = slug ? plans[slug] : undefined;
  if (!plan) throw new Error("This client is not one of the labelled Module 7 case-study fixtures.");
  const allExercises = await db.select({ id: ptExercises.id, name: ptExercises.name, movementPattern: ptExercises.movementPattern }).from(ptExercises).where(or(isNull(ptExercises.ownerProfileId), eq(ptExercises.ownerProfileId, owner.authUserId)));
  const configuredDays = Array.isArray(client.preferredDays) ? client.preferredDays.filter((day): day is number => typeof day === "number" && Number.isInteger(day) && day >= 1 && day <= 7) : [];
  const sessionDays = configuredDays.length ? Array.from(new Set(configuredDays)).sort((a, b) => a - b).slice(0, plan.sessionDays.length) : plan.sessionDays;
  const sessionDuration = client.sessionDurationMinutes ?? plan.duration;
  const currentGoal = goal?.goalType?.trim() || plan.goal;
  const currentGoalDetail = [goal?.target, goal?.metric].filter((value): value is string => Boolean(value?.trim())).join(" / ");
  const responses = assessment?.responses && typeof assessment.responses === "object" && !Array.isArray(assessment.responses) ? assessment.responses as Record<string, unknown> : {};
  const injuryNotes = String(responses.injuryNotes ?? "").trim();
  const contraindicationNotes = String(responses.contraindicationNotes ?? "").trim();
  const likedExercises = listText(preferences?.likedExercises);
  const dislikedExercises = listText(preferences?.dislikedExercises);
  const preferredEquipment = listText(preferences?.preferredEquipment);
  const cardioModalities = listText(preferences?.cardioModalities);
  const locationEquipment = listText(location?.equipment);
  const performanceFor = (exerciseId: string, exerciseName: string) => performanceRecords.find((record) => record.exerciseId === exerciseId || record.exerciseName?.toLowerCase() === exerciseName.toLowerCase());
  const caseStudyRule = slug === "ciara" ? "Use the weekly case-study target table: progress in small load or duration steps only after the prescribed reps, target RIR and acceptable technique; hold for pain, fatigue, poor recovery or missed sessions." : slug === "jessica" ? "Keep power reps crisp and low-repetition; progress only when ankle comfort, landing quality, technical position and athletics-session recovery are acceptable." : slug === "kevin" ? "Progress primary lifts in small increments only when the target RIR and technique are repeatable; use the tested lift baselines as reference points, not automatic loading instructions." : "Use conservative double progression and hold or regress for pain, symptoms, poor technique, fatigue or reduced recovery; review the press-up and sit-and-reach measures at the next block.";
  const contextSummary = [
    `Current goal: ${currentGoal}${currentGoalDetail ? ` (${currentGoalDetail})` : ""}`,
    `Training schedule: ${sessionDays.join(", ")} at ${sessionDuration} minutes`,
    client.trainingExperience ? `Training experience: ${client.trainingExperience}` : "Training experience is not recorded",
    client.dailyActivity ? `Daily/external activity: ${client.dailyActivity}` : "Daily/external activity is not recorded",
    client.sleepHours ? `Sleep: ${client.sleepHours}` : "Sleep is not recorded",
    client.stressLevel ? `Stress: ${client.stressLevel}` : "Stress is not recorded",
    location ? `Location: ${location.name} (${location.locationType}); equipment recorded: ${locationEquipment.join(", ") || "none"}` : "Training location/equipment is not recorded",
    preferences?.preferredStyle ? `Preferred style: ${preferences.preferredStyle}` : "",
    preferences?.preferredStructure ? `Preferred structure: ${preferences.preferredStructure}` : "",
    preferredEquipment.length ? `Preferred equipment: ${preferredEquipment.join(", ")}` : "",
    cardioModalities.length ? `Preferred cardio: ${cardioModalities.join(", ")}` : "",
    likedExercises.length ? `Liked exercises: ${likedExercises.join(", ")}` : "",
    dislikedExercises.length ? `Disliked exercises: ${dislikedExercises.join(", ")}` : "",
    preferences?.confidenceNotes ? `Confidence/adherence notes: ${preferences.confidenceNotes}` : "",
    assessment?.clearanceRequired ? "Clearance is currently marked as required; PT screening workflow remains in control." : "",
    Array.isArray(assessment?.riskFlags) && assessment.riskFlags.length ? `${assessment.riskFlags.length} screening flag(s) are recorded for PT review.` : "",
    injuryNotes ? `Recorded pain/injury context for PT review: ${injuryNotes}` : "",
    contraindicationNotes ? `Recorded restrictions/context for PT review: ${contraindicationNotes}` : "",
    assessment?.ptNotes ? `PT assessment notes: ${assessment.ptNotes}` : "",
    client.notes ? `Client notes: ${client.notes.replace(/\[CASE STUDY FIXTURE: [a-z]+\]/i, "").trim()}` : "",
    performanceRecords.slice(0, 10).map((record) => `${record.exerciseName ?? "General measure"}: ${performanceBaselineText(record)} on ${record.performanceDate}${record.painReported ? "; pain reported" : ""}`).join(" | "),
  ].filter(Boolean).join(". ").slice(0, 1800);
  const defaultEffort = defaultEffortForExperience(client.trainingExperience);
  const selected = plan.exercises.map((name) => {
    const match = allExercises.find((exercise) => exercise.name.toLowerCase() === name.toLowerCase());
    if (!match) throw new Error(`Exercise missing from library: ${name}`);
    const isConditioning = /walk|cross-trainer/i.test(name);
    const isPower = /jump/i.test(name);
    const isCiaraSquat = slug === "ciara" && /back squat/i.test(name);
    const baseline = performanceFor(match.id, match.name);
    const baselineText = baseline ? performanceBaselineText(baseline) : "";
    const baseIntensity = isCiaraSquat ? "30 kg 10RM baseline · 2–3 RIR" : isPower ? "RPE 6 · crisp reps" : isConditioning && /cross-trainer/i.test(name) ? "RPE 5–6 · aerobic base" : isConditioning ? "RPE 6–7 · sustainable pace" : defaultEffort;
    const baseNotes = isCiaraSquat ? "Tested baseline: 30 kg × 10. Aim toward 40 kg × 10 by week 8. Increase only when target RIR and technique are maintained; otherwise hold." : isConditioning && /cross-trainer/i.test(name) ? "Weeks 1–4: cross-trainer block. Progress duration or work:recovery before adding intensity." : isConditioning ? "Weeks 5–8: treadmill block. Build pace and duration toward the 5 km objective without forcing running." : undefined;
    return { name: match.name, pattern: match.movementPattern, sets: isConditioning || isPower ? 2 : 3, repsMin: isConditioning ? 1 : isPower ? 3 : 8, repsMax: isConditioning ? 15 : isPower ? 5 : isCiaraSquat ? 10 : 12, intensityValue: baselineText ? `${baselineText} · ${baseIntensity}` : baseIntensity, restSeconds: isPower || /deadlift|squat/i.test(name) ? 120 : 90, tempo: "", technique: isPower ? "Power / crisp reps" : isConditioning && /cross-trainer/i.test(name) ? "Continuous / interval aerobic" : isConditioning ? "Incline treadmill" : undefined, notes: [baseNotes, baselineText ? `Latest recorded baseline: ${baselineText}${baseline?.confidence ? ` (${baseline.confidence} confidence)` : ""}.` : "", baseline?.painReported ? "Pain was reported with this observation; review tolerance before progression." : "", baseline && !baseline.techniqueAcceptable ? "Technique was not marked acceptable; do not treat this as an automatic progression signal." : ""].filter(Boolean).join(" ") || undefined, groupKey: isConditioning ? "conditioning" : undefined, progressionRule: caseStudyRule };
  });
  const selectedByName = new Map(selected.map((exercise) => [exercise.name.toLowerCase(), exercise]));
  type SelectedExercise = (typeof selected)[number];
  const forWeek = (exercise: SelectedExercise, weekNumber: number) => {
    if (slug !== "ciara" || !/back squat/i.test(exercise.name)) return exercise;
    const squatTargets = [30, 30, 32.5, 32.5, 35, 35, 37.5, 40];
    const target = squatTargets[weekNumber - 1] ?? squatTargets[0];
    const baseline = performanceFor("", exercise.name);
    return { ...exercise, intensityValue: `${target} kg · ${weekNumber === 8 ? "10-rep target" : "2–3 RIR"}${baseline ? ` · ${performanceBaselineText(baseline)} recorded` : ""}`, notes: `${baseline ? `Latest recorded baseline: ${performanceBaselineText(baseline)}. ` : "Tested baseline 30 kg × 10; "}week ${weekNumber} target ${target} kg. Hold if technique, pain, recovery or target RIR are not acceptable.` };
  };
  const sessionExercisesForPlan = Object.fromEntries(Object.entries(plan.sessionExercises).map(([day, names]) => [day, names.map((name) => { const exercise = selectedByName.get(name.toLowerCase()); return exercise ? forWeek(exercise, 1) : undefined; }).filter((exercise): exercise is NonNullable<typeof exercise> => Boolean(exercise))]));
  const sessionExercises = remapSessionDays(sessionExercisesForPlan, plan.sessionDays, sessionDays);
  const sessionExercisesByWeek = plan.sessionExercisesByWeek ? Object.fromEntries(Object.entries(plan.sessionExercisesByWeek).map(([week, byDay]) => { const mapped = Object.fromEntries(Object.entries(byDay).map(([day, names]) => [day, names.map((name) => { const exercise = selectedByName.get(name.toLowerCase()); return exercise ? forWeek(exercise, Number(week)) : undefined; }).filter((exercise): exercise is NonNullable<typeof exercise> => Boolean(exercise))])); return [week, remapSessionDays(mapped, plan.sessionDays, sessionDays)]; })) : undefined;
  const sessionNames = Object.fromEntries(sessionDays.map((day, index) => [String(day), plan.sessionNames[String(plan.sessionDays[index])] ?? `Day ${day} - Full body` ]));
  const contextRule = `${caseStudyRule} Current client context was read when this version was generated. PT review remains responsible for screening, equipment fit, exercise tolerance and progression decisions.`;
  const result = await saveProgrammeAction({ clientName: `${client.firstName} ${client.lastName}`, goalSummary: currentGoal, trainingDays: sessionDays.length, sessionDurationMinutes: sessionDuration, exercises: selected, sessionExercises, sessionExercisesByWeek, sessionNames, sessionDays, methodology: `${plan.methodology}. Current preference: ${preferences?.preferredStyle || "not recorded"}.`, rationale: `${plan.rationale} Generated from current client information: ${contextSummary} ${contextRule}`, weekPlans: plan.weekPlans });
  return { ...result, slug, programmeLabel: `${currentGoal} case-study draft` };
}

export async function updateClientAction(rawInput: z.input<typeof clientUpdateSchema> & { preferredDays?: number[] }) {
  const owner = await requireDesignerAccess();
  const input = clientUpdateSchema.parse(rawInput);
  const preferredDays = normalizePreferredDays(rawInput.preferredDays, input.trainingDays);
  const db = getDb();
  const [client] = await db.update(ptClients).set({ sessionDurationMinutes: input.sessionDurationMinutes, preferredDays, updatedAt: new Date() }).where(and(eq(ptClients.id, input.clientId), eq(ptClients.ownerProfileId, owner.authUserId))).returning({ id: ptClients.id });
  if (!client) throw new Error("Client could not be updated.");
  const [goal] = await db.select({ id: ptGoals.id }).from(ptGoals).where(and(eq(ptGoals.clientId, client.id), eq(ptGoals.priority, "primary"))).limit(1);
  if (goal) await db.update(ptGoals).set({ goalType: input.goalType, updatedAt: new Date() }).where(eq(ptGoals.id, goal.id));
  else await db.insert(ptGoals).values({ clientId: client.id, goalType: input.goalType, priority: "primary" });
  await refreshClientProgrammeQuality(db, owner.authUserId, client.id);
  revalidatePath("/designer");
  return { clientId: client.id };
}

export async function updateClientProfileAction(rawInput: z.input<typeof clientProfileUpdateSchema>) {
  const owner = await requireDesignerAccess();
  const input = clientProfileUpdateSchema.parse(rawInput);
  const db = getDb();
  const [client] = await db.update(ptClients).set({ firstName: input.firstName, lastName: input.lastName, dateOfBirth: input.dateOfBirth || null, sexOrGender: input.sexOrGender || null, trainingExperience: input.trainingExperience || null, heightCm: input.heightCm ?? null, weightKg: input.weightKg ?? null, occupation: input.occupation || null, dailyActivity: input.dailyActivity || null, sleepHours: input.sleepHours || null, stressLevel: input.stressLevel || null, sessionDurationMinutes: input.sessionDurationMinutes, notes: input.notes || null, updatedAt: new Date() }).where(and(eq(ptClients.id, input.clientId), eq(ptClients.ownerProfileId, owner.authUserId))).returning({ id: ptClients.id });
  if (!client) throw new Error("Client profile could not be updated.");
  await refreshClientProgrammeQuality(db, owner.authUserId, client.id);
  revalidatePath("/designer");
  return { clientId: client.id };
}

export async function deleteClientAction(rawInput: z.input<typeof deleteClientSchema>) {
  const owner = await requireDesignerAccess();
  const input = deleteClientSchema.parse(rawInput);
  const db = getDb();
  const [client] = await db.select({ id: ptClients.id }).from(ptClients).where(and(eq(ptClients.id, input.clientId), eq(ptClients.ownerProfileId, owner.authUserId))).limit(1);
  if (!client) throw new Error("Client could not be found.");
  await db.delete(ptClients).where(and(eq(ptClients.id, client.id), eq(ptClients.ownerProfileId, owner.authUserId)));
  revalidatePath("/designer");
  return { clientId: client.id };
}

export async function updateClientPreferencesAction(rawInput: z.input<typeof clientPreferencesSchema>) {
  const owner = await requireDesignerAccess();
  const input = clientPreferencesSchema.parse(rawInput);
  const db = getDb();
  const [client] = await db.select({ id: ptClients.id }).from(ptClients).where(and(eq(ptClients.id, input.clientId), eq(ptClients.ownerProfileId, owner.authUserId))).limit(1);
  if (!client) throw new Error("Client could not be found.");
  const values = { likedExercises: input.likedExercises, dislikedExercises: input.dislikedExercises, preferredStyle: input.preferredStyle || null, preferredStructure: input.preferredStructure || null, preferredEquipment: input.preferredEquipment, cardioModalities: input.cardioModalities, varietyPreference: input.varietyPreference || null, confidenceNotes: input.confidenceNotes || null, updatedAt: new Date() };
  const [existing] = await db.select({ id: ptPreferences.id }).from(ptPreferences).where(eq(ptPreferences.clientId, client.id)).limit(1);
  if (existing) await db.update(ptPreferences).set(values).where(eq(ptPreferences.id, existing.id));
  else await db.insert(ptPreferences).values({ clientId: client.id, ...values });
  await refreshClientProgrammeQuality(db, owner.authUserId, client.id);
  revalidatePath("/designer");
  return { clientId: client.id };
}

export async function saveClientPerformanceRecordAction(rawInput: z.input<typeof performanceRecordSchema>) {
  const owner = await requireDesignerAccess();
  const input = performanceRecordSchema.parse(rawInput);
  const db = getDb();
  const [client] = await db.select({ id: ptClients.id }).from(ptClients).where(and(eq(ptClients.id, input.clientId), eq(ptClients.ownerProfileId, owner.authUserId))).limit(1);
  if (!client) throw new Error("Client could not be found.");
  if (input.exerciseId) {
    const [exercise] = await db.select({ id: ptExercises.id }).from(ptExercises).where(and(eq(ptExercises.id, input.exerciseId), or(isNull(ptExercises.ownerProfileId), eq(ptExercises.ownerProfileId, owner.authUserId)))).limit(1);
    if (!exercise) throw new Error("Exercise could not be found.");
  }
  await db.insert(ptClientPerformanceRecords).values({ clientId: client.id, exerciseId: input.exerciseId || null, metricType: input.metricType, metricName: input.metricName || null, performanceDate: input.performanceDate, value: input.value.toString(), unit: input.unit, repetitions: input.repetitions ?? null, loadKg: input.loadKg?.toString() ?? null, source: input.source, confidence: input.confidence || null, techniqueAcceptable: input.techniqueAcceptable, painReported: input.painReported, notes: input.notes || null });
  await refreshClientProgrammeQuality(db, owner.authUserId, client.id);
  revalidatePath("/designer");
  return { clientId: client.id };
}

export async function updateClientLocationAction(rawInput: z.input<typeof clientLocationSchema>) {
  const owner = await requireDesignerAccess();
  const input = clientLocationSchema.parse(rawInput);
  const db = getDb();
  const [client] = await db.select({ id: ptClients.id }).from(ptClients).where(and(eq(ptClients.id, input.clientId), eq(ptClients.ownerProfileId, owner.authUserId))).limit(1);
  if (!client) throw new Error("Client could not be found.");
  const [existing] = await db.select({ id: ptLocations.id }).from(ptLocations).where(eq(ptLocations.clientId, client.id)).orderBy(desc(ptLocations.updatedAt)).limit(1);
  if (existing) await db.update(ptLocations).set({ name: input.name, locationType: input.locationType, equipment: input.equipment, updatedAt: new Date() }).where(eq(ptLocations.id, existing.id));
  else await db.insert(ptLocations).values({ clientId: client.id, name: input.name, locationType: input.locationType, equipment: input.equipment });
  await refreshClientProgrammeQuality(db, owner.authUserId, client.id);
  revalidatePath("/designer");
  return { clientId: client.id };
}

export async function getDesignerSettingsAction() {
  const owner = await requireDesignerAccess();
  const db = getDb();
  const [settings] = await db.select({ qualityRules: ptDesignerSettings.qualityRules }).from(ptDesignerSettings).where(eq(ptDesignerSettings.ownerProfileId, owner.authUserId)).limit(1);
  return normalizeQualitySettings(settings?.qualityRules ?? defaultQualitySettings);
}

export async function updateDesignerSettingsAction(rawInput: z.input<typeof qualitySettingsSchema>) {
  const owner = await requireDesignerAccess();
  const input = qualitySettingsSchema.parse(rawInput);
  const rules: QualitySettings = normalizeQualitySettings(input);
  const db = getDb();
  const [existing] = await db.select({ ownerProfileId: ptDesignerSettings.ownerProfileId }).from(ptDesignerSettings).where(eq(ptDesignerSettings.ownerProfileId, owner.authUserId)).limit(1);
  if (existing) await db.update(ptDesignerSettings).set({ qualityRules: rules, updatedAt: new Date() }).where(eq(ptDesignerSettings.ownerProfileId, owner.authUserId));
  else await db.insert(ptDesignerSettings).values({ ownerProfileId: owner.authUserId, qualityRules: rules });
  await refreshOwnerProgrammeQuality(db, owner.authUserId, rules);
  revalidatePath("/designer");
  return rules;
}

export async function updateClientAssessmentAction(rawInput: z.input<typeof clientAssessmentUpdateSchema>) {
  const owner = await requireDesignerAccess();
  const input = clientAssessmentUpdateSchema.parse(rawInput);
  const db = getDb();
  const [client] = await db.select({ id: ptClients.id }).from(ptClients).where(and(eq(ptClients.id, input.clientId), eq(ptClients.ownerProfileId, owner.authUserId))).limit(1);
  if (!client) throw new Error("Client could not be found.");
  const [assessment] = await db.select({ id: ptAssessments.id, responses: ptAssessments.responses, riskFlags: ptAssessments.riskFlags }).from(ptAssessments).where(eq(ptAssessments.clientId, client.id)).orderBy(desc(ptAssessments.assessmentDate)).limit(1);
  if (!assessment) throw new Error("Record an assessment before editing safety notes.");
  const previousResponses = assessment.responses && typeof assessment.responses === "object" && !Array.isArray(assessment.responses) ? assessment.responses as Record<string, unknown> : {};
  const responses = input.screening ? { ...previousResponses, ...input.screening } : previousResponses;
  const riskFlags = input.screening ? getScreeningFlags(responses as ScreeningAnswers) : assessment.riskFlags;
  await db.update(ptAssessments).set({ responses: { ...responses, injuryNotes: input.injuryNotes || null, contraindicationNotes: input.contraindicationNotes || null }, riskFlags, clearanceRequired: input.clearanceRequired, ptNotes: input.ptNotes || null, updatedAt: new Date() }).where(eq(ptAssessments.id, assessment.id));
  await refreshClientProgrammeQuality(db, owner.authUserId, client.id);
  revalidatePath("/designer");
  return { clientId: client.id };
}

export async function saveProgrammeAction(rawInput: z.input<typeof programmeInputSchema>) {
  const owner = await requireDesignerAccess();
  const input = programmeInputSchema.parse(rawInput);
  const db = getDb();
  const [firstName, ...lastParts] = input.clientName.split(" ");
  const lastName = lastParts.join(" ") || "Client";
  let [client] = await db.select({ id: ptClients.id, preferredDays: ptClients.preferredDays }).from(ptClients).where(and(eq(ptClients.ownerProfileId, owner.authUserId), eq(ptClients.firstName, firstName), eq(ptClients.lastName, lastName))).limit(1);
  if (!client) [client] = await db.insert(ptClients).values({ ownerProfileId: owner.authUserId, firstName, lastName, sessionDurationMinutes: input.sessionDurationMinutes, preferredDays: input.sessionDays ?? Array.from({ length: input.trainingDays }, (_, index) => index + 1) }).returning({ id: ptClients.id, preferredDays: ptClients.preferredDays });
  if (!client) throw new Error("Client could not be resolved.");
  const [previousProgramme] = await db.select({ version: ptProgrammes.version }).from(ptProgrammes).where(and(eq(ptProgrammes.ownerProfileId, owner.authUserId), eq(ptProgrammes.clientId, client.id))).orderBy(desc(ptProgrammes.version)).limit(1);
  const [programme] = await db.insert(ptProgrammes).values({ ownerProfileId: owner.authUserId, clientId: client.id, name: `${input.goalSummary} foundation`, goalSummary: input.goalSummary, durationWeeks: 8, methodology: input.methodology || "Full-body foundation with RIR-based double progression", status: "draft", version: (previousProgramme?.version ?? 0) + 1, rationale: input.rationale || "Draft saved for PT review. Finalise only after screening, equipment and quality checks have been reviewed." }).returning({ id: ptProgrammes.id, version: ptProgrammes.version });
  if (!programme) throw new Error("Programme could not be saved.");
  const allExercises = await db.select({ id: ptExercises.id, name: ptExercises.name }).from(ptExercises).where(or(isNull(ptExercises.ownerProfileId), eq(ptExercises.ownerProfileId, owner.authUserId))).orderBy(asc(ptExercises.name));
  const toExerciseRows = (exercises: z.infer<typeof exerciseDraftSchema>[]) => exercises.map((exercise, index) => {
    const match = allExercises.find((candidate) => candidate.name.toLowerCase() === exercise.name.toLowerCase());
    return match ? { exerciseId: match.id, orderIndex: index, sets: exercise.sets, repsMin: exercise.repsMin ?? null, repsMax: exercise.repsMax ?? null, intensityType: "rir" as const, intensityValue: exercise.intensityValue, restSeconds: exercise.restSeconds ?? null, tempo: exercise.tempo || null, technique: exercise.technique || null, notes: exercise.notes || null, groupKey: exercise.groupKey || null, progressionRule: exercise.progressionRule || "When all sets reach the top of the range at target RIR with acceptable technique, add a small load increment." } : null;
  }).filter((row): row is NonNullable<typeof row> => row !== null);
  const exerciseRows = toExerciseRows(input.exercises);
  const rowsByDay: Record<string, typeof exerciseRows> = {};
  for (const [day, exercises] of Object.entries(input.sessionExercises ?? {})) {
    rowsByDay[day] = toExerciseRows(exercises);
  }
  const rowsByWeek: Record<string, Record<string, typeof exerciseRows>> = {};
  for (const [week, byDay] of Object.entries(input.sessionExercisesByWeek ?? {})) {
    rowsByWeek[week] = {};
    for (const [day, exercises] of Object.entries(byDay)) rowsByWeek[week][day] = toExerciseRows(exercises);
  }
  let savedPrescriptionCount = 0;
  const sessionDays = input.sessionDays ?? normalizePreferredDays(client.preferredDays, input.trainingDays);
  for (let weekNumber = 1; weekNumber <= 8; weekNumber += 1) {
    const weekPlan = input.weekPlans?.[weekNumber - 1];
    const [week] = await db.insert(ptProgrammeWeeks).values({ programmeId: programme.id, weekNumber, focus: weekPlan?.focus || (weekNumber <= 2 ? "Foundation / familiarisation" : weekNumber <= 6 ? "Build / progressive overload" : "Consolidate / review"), volumeTarget: weekPlan?.volumeTarget || (weekNumber <= 2 ? "Moderate" : "Moderate-high"), intensityTarget: weekPlan?.intensityTarget || "RIR 2–3" }).returning({ id: ptProgrammeWeeks.id });
    if (!week) throw new Error("Programme week could not be saved.");
    for (const dayOfWeek of sessionDays) {
      const sessionName = input.sessionNames?.[String(dayOfWeek)] || `Day ${dayOfWeek} - Full body`;
      const sessionType = /conditioning|interval|aerobic/i.test(sessionName) ? "conditioning" : /power|athletic/i.test(sessionName) ? "strength" : /strength/i.test(sessionName) ? "strength" : "mixed";
      const [session] = await db.insert(ptSessions).values({ programmeWeekId: week.id, dayOfWeek, name: sessionName, sessionType, durationMinutes: input.sessionDurationMinutes, warmupMinutes: 5 }).returning({ id: ptSessions.id });
      if (!session) throw new Error("Programme session could not be saved.");
      const activeRowsByDay = rowsByWeek[String(weekNumber)] ?? rowsByDay;
      const rowsForDay = activeRowsByDay[String(dayOfWeek)] ?? (dayOfWeek === 1 ? exerciseRows : []);
      if (rowsForDay.length) {
        const rows = rowsForDay.map((row) => ({ ...row, sessionId: session.id }));
        await db.insert(ptExercisePrescriptions).values(rows);
        savedPrescriptionCount += rows.length;
      }
    }
  }
  await db.insert(ptProgrammeEvents).values({ programmeId: programme.id, actorProfileId: owner.authUserId, action: "draft_saved", details: { exerciseCount: savedPrescriptionCount, weekCount: 8, version: programme.version } });
  await refreshProgrammeQuality(db, owner.authUserId, programme.id);
  revalidatePath("/designer");
  return { programmeId: programme.id, version: programme.version, exerciseCount: savedPrescriptionCount, weekCount: 8 };
}

export async function recordProgrammeOverrideAction(rawInput: z.input<typeof programmeOverrideSchema>) {
  const owner = await requireDesignerAccess();
  const input = programmeOverrideSchema.parse(rawInput);
  const db = getDb();
  const [programme] = await db.select({ id: ptProgrammes.id, clientId: ptProgrammes.clientId, overrideReasons: ptProgrammes.overrideReasons }).from(ptProgrammes).where(and(eq(ptProgrammes.id, input.programmeId), eq(ptProgrammes.ownerProfileId, owner.authUserId))).limit(1);
  if (!programme) throw new Error("Programme could not be found.");
  const current = await getCurrentProgrammeQuality(db, owner.authUserId, programme.id);
  if (!current) throw new Error("Programme quality could not be evaluated.");
  const selected = current.review.findings.filter((item) => input.warningCodes.includes(item.key) || input.warningCodes.includes(item.ruleId));
  if (!selected.length) throw new Error("Select a current advisory finding before recording a PT decision.");
  if (selected.some((item) => !findingCanBeAcknowledged(item))) throw new Error("Blocking and significant safety findings cannot be bypassed by acknowledgement. Resolve or update the underlying information first.");
  const decision = input.decision ?? "overridden";
  const override = { warningCodes: selected.map((item) => item.ruleId), findingKeys: selected.map((item) => item.key), decision, reason: input.reason, recordedAt: new Date().toISOString(), rulesetVersion: current.review.rulesetVersion, evidenceVersion: current.review.evidence.evidenceVersion, sourceFingerprint: current.review.sourceFingerprint };
  const previous = Array.isArray(programme.overrideReasons) ? programme.overrideReasons : [];
  await db.update(ptProgrammes).set({ overrideReasons: [...previous, override], updatedAt: new Date() }).where(eq(ptProgrammes.id, programme.id));
  for (const item of selected) await db.insert(ptProgrammeQualityAcknowledgements).values({ programmeId: programme.id, ruleId: item.ruleId, findingKey: item.key, decision, reason: input.reason, rulesetVersion: current.review.rulesetVersion, evidenceVersion: current.review.evidence.evidenceVersion, sourceFingerprint: current.review.sourceFingerprint, updatedAt: new Date() }).onConflictDoUpdate({ target: [ptProgrammeQualityAcknowledgements.programmeId, ptProgrammeQualityAcknowledgements.findingKey], set: { decision, reason: input.reason, rulesetVersion: current.review.rulesetVersion, evidenceVersion: current.review.evidence.evidenceVersion, sourceFingerprint: current.review.sourceFingerprint, updatedAt: new Date() } });
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
  if (input.status === "assigned" || input.status === "active") {
    const quality = await getCurrentProgrammeQuality(db, owner.authUserId, programme.id);
    if (quality?.review.approvalReadiness === "blocked") throw new Error("Resolve the blocking programme quality findings before assigning this programme.");
    const [assessment] = await db.select({ clearanceRequired: ptAssessments.clearanceRequired, riskFlags: ptAssessments.riskFlags, ptNotes: ptAssessments.ptNotes }).from(ptAssessments).where(eq(ptAssessments.clientId, programme.clientId)).orderBy(desc(ptAssessments.assessmentDate)).limit(1);
    const unresolvedRiskFlags = Array.isArray(assessment?.riskFlags) && assessment.riskFlags.length > 0 && !hasRecordedScreeningReview(assessment?.ptNotes);
    if (assessment?.clearanceRequired || unresolvedRiskFlags) throw new Error("Resolve the screening or clearance flag before assigning this programme.");
  }
  if (input.status === "active") {
    const [existingActive] = await db.select({ id: ptProgrammes.id }).from(ptProgrammes).where(and(eq(ptProgrammes.ownerProfileId, owner.authUserId), eq(ptProgrammes.clientId, programme.clientId), eq(ptProgrammes.status, "active"), ne(ptProgrammes.id, programme.id))).limit(1);
    if (existingActive) throw new Error("Only one programme can be active for a client. Pause or complete the current active programme first.");
  }
  if ((input.status === "paused" || input.status === "archived") && !input.reason?.trim()) throw new Error("Record a reason when pausing or archiving a programme.");
  const now = new Date();
  await db.update(ptProgrammes).set({ status: input.status, startDate: input.status === "assigned" ? now.toISOString().slice(0, 10) : undefined, updatedAt: now }).where(eq(ptProgrammes.id, programme.id));
  await db.insert(ptProgrammeEvents).values({ programmeId: programme.id, actorProfileId: owner.authUserId, action: "status_changed", details: { from: programme.status, to: input.status, reason: input.reason ?? null, changedAt: now.toISOString() } });
  revalidatePath("/designer");
  return { programmeId: programme.id, status: input.status };
}

export async function resolveScreeningAction(rawInput: z.input<typeof screeningReviewSchema>) {
  const owner = await requireDesignerAccess();
  const input = screeningReviewSchema.parse(rawInput);
  const db = getDb();
  const [client] = await db.select({ id: ptClients.id, firstName: ptClients.firstName, lastName: ptClients.lastName }).from(ptClients).where(and(eq(ptClients.id, input.clientId), eq(ptClients.ownerProfileId, owner.authUserId))).limit(1);
  if (!client) throw new Error("Client could not be found.");
  const [assessment] = await db.select({ id: ptAssessments.id, ptNotes: ptAssessments.ptNotes }).from(ptAssessments).where(eq(ptAssessments.clientId, client.id)).orderBy(desc(ptAssessments.assessmentDate)).limit(1);
  if (!assessment) throw new Error("Record an assessment before resolving screening.");
  const reviewDate = new Date().toISOString().slice(0, 10);
  const outcomeLabel = input.outcome === "professional_clearance_obtained" ? "Appropriate professional clearance obtained" : "PT screening review completed";
  const note = `${screeningReviewMarker} ${outcomeLabel} on ${reviewDate}. ${input.reason}`;
  const previousNotes = assessment.ptNotes?.trim();
  await db.update(ptAssessments).set({ clearanceRequired: false, reviewDate, ptNotes: previousNotes ? `${previousNotes}\n\n${note}` : note, updatedAt: new Date() }).where(eq(ptAssessments.id, assessment.id));
  const [programme] = await db.select({ id: ptProgrammes.id }).from(ptProgrammes).where(and(eq(ptProgrammes.clientId, client.id), eq(ptProgrammes.ownerProfileId, owner.authUserId))).orderBy(desc(ptProgrammes.updatedAt)).limit(1);
  if (programme) await db.insert(ptProgrammeEvents).values({ programmeId: programme.id, actorProfileId: owner.authUserId, action: "screening_reviewed", details: { outcome: input.outcome, reason: input.reason, reviewDate } });
  await refreshClientProgrammeQuality(db, owner.authUserId, client.id);
  revalidatePath("/designer");
  return { clientId: client.id, outcome: input.outcome };
}

const exerciseCreateSchema = z.object({ name: z.string().trim().min(2).max(120), pattern: z.string().trim().min(2).max(80), target: z.array(z.string().trim().min(1)).min(1).max(10), equipment: z.array(z.string().trim().min(1)).max(10), difficulty: z.enum(["beginner", "intermediate", "advanced"]), complexity: z.enum(["low", "moderate", "high"]), compound: z.boolean(), unilateral: z.boolean() });
const exerciseUpdateSchema = z.object({ exerciseId: z.string().uuid(), name: z.string().trim().min(2).max(120), pattern: z.string().trim().min(2).max(80), primaryMuscles: z.array(z.string().trim().min(1)).min(1).max(12), secondaryMuscles: z.array(z.string().trim().min(1)).max(12), equipment: z.array(z.string().trim().min(1)).max(12), difficulty: z.enum(["beginner", "intermediate", "advanced"]), complexity: z.enum(["low", "moderate", "high"]), suitability: z.array(z.string().trim().min(1)).max(12), tags: z.array(z.string().trim().min(1)).max(20), regressions: z.array(z.string().trim().min(1)).max(12), progressions: z.array(z.string().trim().min(1)).max(12), alternatives: z.array(z.string().trim().min(1)).max(12), coachingCues: z.array(z.string().trim().min(1)).max(12), commonErrors: z.array(z.string().trim().min(1)).max(12), cautionTags: z.array(z.string().trim().min(1)).max(12), compound: z.boolean(), unilateral: z.boolean() });

export async function createExerciseAction(rawInput: z.input<typeof exerciseCreateSchema>) {
  const owner = await requireDesignerAccess();
  const input = exerciseCreateSchema.parse(rawInput);
  const db = getDb();
  const slugBase = input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "custom-exercise";
  const [exercise] = await db.insert(ptExercises).values({ ownerProfileId: owner.authUserId, slug: `${slugBase}-${Date.now().toString(36)}`, name: input.name, movementPattern: input.pattern, primaryMuscles: input.target, equipment: input.equipment, difficulty: input.difficulty, technicalComplexity: input.complexity, suitability: ["strength", "hypertrophy", "general fitness"], compound: input.compound, unilateral: input.unilateral, tags: ["custom"], regressions: [], progressions: [], alternatives: [], coachingCues: [], commonErrors: [], cautionTags: [] }).returning({ id: ptExercises.id, name: ptExercises.name, pattern: ptExercises.movementPattern, target: ptExercises.primaryMuscles, equipment: ptExercises.equipment, difficulty: ptExercises.difficulty, complexity: ptExercises.technicalComplexity, suitability: ptExercises.suitability, compound: ptExercises.compound, unilateral: ptExercises.unilateral, regressions: ptExercises.regressions, progressions: ptExercises.progressions, alternatives: ptExercises.alternatives, coachingCues: ptExercises.coachingCues, commonErrors: ptExercises.commonErrors, cautionTags: ptExercises.cautionTags });
  if (!exercise) throw new Error("Exercise could not be created.");
  await refreshOwnerProgrammeQuality(db, owner.authUserId);
  revalidatePath("/designer");
  return { exercise };
}

export async function updateExerciseAction(rawInput: z.input<typeof exerciseUpdateSchema>) {
  const owner = await requireDesignerAccess();
  const input = exerciseUpdateSchema.parse(rawInput);
  const db = getDb();
  const [existing] = await db.select({ id: ptExercises.id, ownerProfileId: ptExercises.ownerProfileId, slug: ptExercises.slug }).from(ptExercises).where(eq(ptExercises.id, input.exerciseId)).limit(1);
  if (!existing) throw new Error("Exercise could not be found.");
  const values = { name: input.name, movementPattern: input.pattern, primaryMuscles: input.primaryMuscles, secondaryMuscles: input.secondaryMuscles, equipment: input.equipment, difficulty: input.difficulty, technicalComplexity: input.complexity, suitability: input.suitability, compound: input.compound, unilateral: input.unilateral, tags: input.tags, regressions: input.regressions, progressions: input.progressions, alternatives: input.alternatives, coachingCues: input.coachingCues, commonErrors: input.commonErrors, cautionTags: input.cautionTags, updatedAt: new Date() };
  let exerciseId = existing.id;
  if (existing.ownerProfileId === owner.authUserId) {
    await db.update(ptExercises).set(values).where(and(eq(ptExercises.id, existing.id), eq(ptExercises.ownerProfileId, owner.authUserId)));
  } else {
    const [copy] = await db.insert(ptExercises).values({ ...values, ownerProfileId: owner.authUserId, slug: `${existing.slug}-custom-${Date.now().toString(36)}` }).returning({ id: ptExercises.id });
    if (!copy) throw new Error("Custom exercise copy could not be created.");
    exerciseId = copy.id;
  }
  const [exercise] = await db.select({ id: ptExercises.id, name: ptExercises.name, pattern: ptExercises.movementPattern, target: ptExercises.primaryMuscles, secondary: ptExercises.secondaryMuscles, equipment: ptExercises.equipment, difficulty: ptExercises.difficulty, complexity: ptExercises.technicalComplexity, suitability: ptExercises.suitability, compound: ptExercises.compound, unilateral: ptExercises.unilateral, tags: ptExercises.tags, regressions: ptExercises.regressions, progressions: ptExercises.progressions, alternatives: ptExercises.alternatives, coachingCues: ptExercises.coachingCues, commonErrors: ptExercises.commonErrors, cautionTags: ptExercises.cautionTags, ownerProfileId: ptExercises.ownerProfileId }).from(ptExercises).where(eq(ptExercises.id, exerciseId)).limit(1);
  if (!exercise) throw new Error("Updated exercise could not be loaded.");
  await refreshOwnerProgrammeQuality(db, owner.authUserId);
  revalidatePath("/designer");
  return { exercise };
}

export async function logWorkoutResultAction(rawInput: z.input<typeof workoutInputSchema>) {
  const owner = await requireDesignerAccess();
  const input = workoutInputSchema.parse(rawInput);
  const db = getDb();
  const [client] = await db.select({ id: ptClients.id }).from(ptClients).where(and(eq(ptClients.ownerProfileId, owner.authUserId), eq(ptClients.id, input.clientId))).limit(1);
  if (!client) throw new Error("Save the client profile before logging a workout.");
  const [session] = await db.select({ id: ptSessions.id }).from(ptSessions).innerJoin(ptProgrammeWeeks, eq(ptProgrammeWeeks.id, ptSessions.programmeWeekId)).innerJoin(ptProgrammes, eq(ptProgrammes.id, ptProgrammeWeeks.programmeId)).where(and(eq(ptSessions.id, input.sessionId), eq(ptProgrammes.clientId, client.id), eq(ptProgrammes.ownerProfileId, owner.authUserId))).limit(1);
  if (!session) throw new Error("The selected session could not be found for this client.");
  const prescriptions = await db.select({ id: ptExercisePrescriptions.id }).from(ptExercisePrescriptions).where(eq(ptExercisePrescriptions.sessionId, session.id));
  const allowed = new Set(prescriptions.map((prescription) => prescription.id));
  const setRows = input.sets?.filter((set) => allowed.has(set.prescriptionId)).map((set) => ({ workoutResultId: "", prescriptionId: set.prescriptionId, setNumber: set.setNumber, actualReps: set.reps ?? null, actualLoadKg: set.loadKg ?? null, actualRpe: set.rpe ?? null, actualRir: set.rir ?? null, techniqueAcceptable: set.techniqueAcceptable, painReported: set.painReported })) ?? [];
  const repetitionLoad = setRows.reduce((total, set) => total + (set.actualReps ?? 0), 0);
  const volumeLoadKg = setRows.reduce((total, set) => total + (set.actualReps ?? 0) * (set.actualLoadKg ?? 0), 0);
  const rpeValues = setRows.flatMap((set) => set.actualRpe === null ? [] : [set.actualRpe]);
  const rirValues = setRows.flatMap((set) => set.actualRir === null ? [] : [set.actualRir]);
  const averageRpe = rpeValues.length ? Math.round(rpeValues.reduce((total, value) => total + value, 0) / rpeValues.length) : null;
  const averageRir = rirValues.length ? Math.round(rirValues.reduce((total, value) => total + value, 0) / rirValues.length) : null;
  const [result] = await db.insert(ptWorkoutResults).values({ ownerProfileId: owner.authUserId, clientId: client.id, sessionId: session.id, scheduledDate: input.scheduledDate, completedAt: input.status === "completed" || input.status === "partial" ? new Date() : null, status: input.status, sessionRpe: input.sessionRpe ?? null, energy: input.energy ?? null, painReported: input.painReported, enjoyment: input.enjoyment ?? null, durationMinutes: input.durationMinutes ?? null, volumeLoadKg, repetitionLoad, averageRpe, averageRir, notes: input.notes || null }).returning({ id: ptWorkoutResults.id });
  if (!result) throw new Error("Workout result could not be saved.");
  if (setRows.length) await db.insert(ptWorkoutResultSets).values(setRows.map((set) => ({ ...set, workoutResultId: result.id })));
  await refreshClientProgrammeQuality(db, owner.authUserId, client.id);
  revalidatePath("/designer");
  return { resultId: result.id, metrics: { volumeLoadKg, repetitionLoad, averageRpe, averageRir } };
}
