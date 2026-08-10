import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { getAccountAccess } from "@/lib/authorization/server";
import { getDb } from "@/lib/db/client";
import { ptAssessments, ptClients, ptExercisePrescriptions, ptExercises, ptGoals, ptLocations, ptPreferences, ptProgrammeEvents, ptProgrammeWeeks, ptProgrammes, ptSessions, ptWorkoutResultSets, ptWorkoutResults } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

function asList(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function display(value: unknown) {
  if (value === null || value === undefined || value === "") return "Not recorded";
  if (Array.isArray(value)) return value.length ? value.join(", ") : "None recorded";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function buildMarkdown(bundle: Record<string, unknown>, redacted: boolean) {
  const client = bundle.client as Record<string, unknown>;
  const screening = bundle.screening as Record<string, unknown>;
  const goals = bundle.goals as Array<Record<string, unknown>>;
  const preferences = bundle.preferences as Record<string, unknown>;
  const locations = bundle.locations as Array<Record<string, unknown>>;
  const programme = bundle.currentProgramme as Record<string, unknown> | null;
  const quality = bundle.qualityChecks as Record<string, unknown>;
  const programmeHistory = bundle.programmeHistory as Array<Record<string, unknown>>;
  const results = bundle.recentWorkoutResults as Array<Record<string, unknown>>;
  const lines = [
    "# Engine PT - Construction review bundle",
    "",
    "Use this as a review aid for a qualified Personal Trainer. Analyse the supplied facts, identify uncertainties and propose options for PT consideration. Do not diagnose, prescribe medical treatment or bypass screening, referral or professional-clearance requirements. The PT remains responsible for the final programme.",
    "",
    "## Client context",
    `- Name: ${redacted ? "Redacted client" : display(client.name)}`,
    `- Date of birth: ${redacted ? "Redacted" : display(client.dateOfBirth)}`,
    `- Sex / gender: ${display(client.sexOrGender)}`,
    `- Height: ${display(client.heightCm)} cm`,
    `- Weight: ${display(client.weightKg)} kg`,
    `- Occupation: ${display(client.occupation)}`,
    `- Daily activity: ${display(client.dailyActivity)}`,
    `- Sleep: ${display(client.sleepHours)}`,
    `- Stress: ${display(client.stressLevel)}`,
    `- Session duration: ${display(client.sessionDurationMinutes)} minutes`,
    `- Preferred training days: ${display(client.preferredDays)}`,
    `- PT notes: ${display(client.notes)}`,
    "",
    "## Screening and scope",
    `- Assessment date: ${display(screening.assessmentDate)}`,
    `- Review date: ${display(screening.reviewDate)}`,
    `- Clearance required: ${display(screening.clearanceRequired)}`,
    `- Risk flags: ${display(screening.riskFlags)}`,
    `- PT assessment notes: ${display(screening.ptNotes)}`,
    "",
    "## Goals",
    ...(goals.length ? goals.map((goal) => `- ${display(goal.priority)}: ${display(goal.goalType)}${goal.target ? ` · Target: ${display(goal.target)}` : ""}${goal.metric ? ` · Metric: ${display(goal.metric)}` : ""}`) : ["- No goals recorded"]),
    "",
    "## Preferences",
    `- Preferred style: ${display(preferences.preferredStyle)}`,
    `- Preferred structure: ${display(preferences.preferredStructure)}`,
    `- Favourite exercises: ${display(preferences.likedExercises)}`,
    `- Disliked exercises: ${display(preferences.dislikedExercises)}`,
    `- Preferred equipment: ${display(preferences.preferredEquipment)}`,
    `- Cardio modalities: ${display(preferences.cardioModalities)}`,
    `- Variety preference: ${display(preferences.varietyPreference)}`,
    `- Confidence notes: ${display(preferences.confidenceNotes)}`,
    "",
    "## Training locations and equipment",
    ...(locations.length ? locations.map((location) => `- ${display(location.name)} (${display(location.locationType)}): ${display(location.equipment)}`) : ["- No locations recorded"]),
    "",
    "## Current programme",
    ...(programme ? [
      `- ${display(programme.name)} · Version ${display(programme.version)} · Status: ${display(programme.status)}`,
      `- Goal: ${display(programme.goalSummary)}`,
      `- Duration: ${display(programme.durationWeeks)} weeks · Current week: ${display(programme.currentWeek)}`,
      `- Methodology: ${display(programme.methodology)}`,
      `- Rationale: ${display(programme.rationale)}`,
      "",
      "### Programme weeks and sessions",
      ...((programme.weeks as Array<Record<string, unknown>>).flatMap((week) => [
        `- Week ${display(week.weekNumber)}: ${display(week.focus)} · Volume: ${display(week.volumeTarget)} · Intensity: ${display(week.intensityTarget)}`,
        ...((week.sessions as Array<Record<string, unknown>>).map((session) => `  - ${display(session.name)} · ${display(session.sessionType)} · ${display(session.durationMinutes)} min\n    ${((session.exercises as Array<Record<string, unknown>>).map((exercise) => `${display(exercise.name)}: ${display(exercise.sets)} sets × ${display(exercise.reps)} · ${display(exercise.intensity)} · Rest ${display(exercise.restSeconds)}s · Progression: ${display(exercise.progressionRule)}`).join("\n    ")) || "No exercises recorded"}`)),
      ])),
    ] : ["- No current programme recorded"]),
    "",
    "## Programme version history",
    ...(programmeHistory.length ? programmeHistory.map((version) => `- Version ${display(version.version)} · ${display(version.name)} · ${display(version.status)} · Updated ${display(version.updatedAt)} · Goal: ${display(version.goalSummary)}`) : ["- No programme versions recorded"]),
    "",
    "## Rule-based quality checks",
    `- Advisory score: ${display(quality.score)}`,
    ...(asList(quality.warnings).length ? asList(quality.warnings).map((warning) => `- Warning: ${display(warning)}`) : ["- No current rule-based warnings recorded"]),
    "",
    "## Recent workout history",
    ...(results.length ? results.map((result) => `- ${display(result.scheduledDate)} · ${display(result.sessionName)} · ${display(result.status)} · Session RPE ${display(result.sessionRpe)} · Energy ${display(result.energy)} · Pain reported: ${display(result.painReported)} · Duration ${display(result.durationMinutes)} min · Notes: ${display(result.notes)}\n  Sets: ${display(result.sets)}`) : ["- No workout results recorded"]),
    "",
    "## Questions for PT review",
    "1. Are the screening and scope decisions sufficiently documented for the proposed training?",
    "2. Does the programme align with the client’s goals, experience, preferences, equipment and recovery capacity?",
    "3. Which exercises, volumes, intensities or progression rules should be retained, changed or discussed with the client?",
    "4. What information is missing before the next programme version is approved?",
    "",
    "Return recommendations with reasoning, confidence/uncertainty and practical alternatives. Keep the PT in control of every final decision.",
  ];
  return lines.join("\n");
}

export async function GET(request: NextRequest) {
  const access = await getAccountAccess();
  if (access.state !== "active" || access.account.role !== "owner") return NextResponse.json({ error: "PT owner access required" }, { status: 403 });
  const clientId = request.nextUrl.searchParams.get("clientId");
  if (!clientId) return NextResponse.json({ error: "clientId is required" }, { status: 400 });
  const redacted = request.nextUrl.searchParams.get("redact") === "true";
  const db = getDb();
  const [client] = await db.select({ id: ptClients.id, firstName: ptClients.firstName, lastName: ptClients.lastName, dateOfBirth: ptClients.dateOfBirth, sexOrGender: ptClients.sexOrGender, heightCm: ptClients.heightCm, weightKg: ptClients.weightKg, occupation: ptClients.occupation, dailyActivity: ptClients.dailyActivity, sleepHours: ptClients.sleepHours, stressLevel: ptClients.stressLevel, sessionDurationMinutes: ptClients.sessionDurationMinutes, preferredDays: ptClients.preferredDays, notes: ptClients.notes }).from(ptClients).where(and(eq(ptClients.id, clientId), eq(ptClients.ownerProfileId, access.account.authUserId))).limit(1);
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });
  const [assessment] = await db.select({ assessmentDate: ptAssessments.assessmentDate, reviewDate: ptAssessments.reviewDate, responses: ptAssessments.responses, riskFlags: ptAssessments.riskFlags, clearanceRequired: ptAssessments.clearanceRequired, ptNotes: ptAssessments.ptNotes }).from(ptAssessments).where(eq(ptAssessments.clientId, client.id)).orderBy(desc(ptAssessments.assessmentDate)).limit(1);
  const goals = await db.select({ goalType: ptGoals.goalType, priority: ptGoals.priority, target: ptGoals.target, metric: ptGoals.metric }).from(ptGoals).where(eq(ptGoals.clientId, client.id)).orderBy(asc(ptGoals.priority), asc(ptGoals.createdAt));
  const [preferences] = await db.select({ likedExercises: ptPreferences.likedExercises, dislikedExercises: ptPreferences.dislikedExercises, preferredStyle: ptPreferences.preferredStyle, preferredStructure: ptPreferences.preferredStructure, preferredEquipment: ptPreferences.preferredEquipment, cardioModalities: ptPreferences.cardioModalities, varietyPreference: ptPreferences.varietyPreference, confidenceNotes: ptPreferences.confidenceNotes }).from(ptPreferences).where(eq(ptPreferences.clientId, client.id)).limit(1);
  const locations = await db.select({ name: ptLocations.name, locationType: ptLocations.locationType, equipment: ptLocations.equipment }).from(ptLocations).where(eq(ptLocations.clientId, client.id)).orderBy(asc(ptLocations.name));
  const [programme] = await db.select({ id: ptProgrammes.id, name: ptProgrammes.name, goalSummary: ptProgrammes.goalSummary, methodology: ptProgrammes.methodology, status: ptProgrammes.status, currentWeek: ptProgrammes.currentWeek, durationWeeks: ptProgrammes.durationWeeks, version: ptProgrammes.version, rationale: ptProgrammes.rationale }).from(ptProgrammes).where(and(eq(ptProgrammes.clientId, client.id), eq(ptProgrammes.ownerProfileId, access.account.authUserId))).orderBy(desc(ptProgrammes.updatedAt)).limit(1);
  const programmeHistory = await db.select({ name: ptProgrammes.name, goalSummary: ptProgrammes.goalSummary, status: ptProgrammes.status, version: ptProgrammes.version, updatedAt: ptProgrammes.updatedAt }).from(ptProgrammes).where(and(eq(ptProgrammes.clientId, client.id), eq(ptProgrammes.ownerProfileId, access.account.authUserId))).orderBy(desc(ptProgrammes.version));
  const events = programme ? await db.select({ action: ptProgrammeEvents.action, details: ptProgrammeEvents.details, createdAt: ptProgrammeEvents.createdAt }).from(ptProgrammeEvents).where(eq(ptProgrammeEvents.programmeId, programme.id)).orderBy(desc(ptProgrammeEvents.createdAt)) : [];
  const weeks = programme ? await db.select({ id: ptProgrammeWeeks.id, weekNumber: ptProgrammeWeeks.weekNumber, focus: ptProgrammeWeeks.focus, volumeTarget: ptProgrammeWeeks.volumeTarget, intensityTarget: ptProgrammeWeeks.intensityTarget }).from(ptProgrammeWeeks).where(eq(ptProgrammeWeeks.programmeId, programme.id)).orderBy(asc(ptProgrammeWeeks.weekNumber)) : [];
  const weekIds = weeks.map((week) => week.id);
  const sessions = weekIds.length ? await db.select({ id: ptSessions.id, programmeWeekId: ptSessions.programmeWeekId, name: ptSessions.name, sessionType: ptSessions.sessionType, durationMinutes: ptSessions.durationMinutes, dayOfWeek: ptSessions.dayOfWeek }).from(ptSessions).where(inArray(ptSessions.programmeWeekId, weekIds)).orderBy(asc(ptSessions.programmeWeekId), asc(ptSessions.dayOfWeek)) : [];
  const sessionIds = sessions.map((session) => session.id);
  const prescriptions = sessionIds.length ? await db.select({ sessionId: ptExercisePrescriptions.sessionId, name: ptExercises.name, sets: ptExercisePrescriptions.sets, repsMin: ptExercisePrescriptions.repsMin, repsMax: ptExercisePrescriptions.repsMax, intensityValue: ptExercisePrescriptions.intensityValue, restSeconds: ptExercisePrescriptions.restSeconds, progressionRule: ptExercisePrescriptions.progressionRule }).from(ptExercisePrescriptions).innerJoin(ptExercises, eq(ptExercises.id, ptExercisePrescriptions.exerciseId)).where(inArray(ptExercisePrescriptions.sessionId, sessionIds)).orderBy(asc(ptExercisePrescriptions.sessionId), asc(ptExercisePrescriptions.orderIndex)) : [];
  const results = await db.select({ id: ptWorkoutResults.id, scheduledDate: ptWorkoutResults.scheduledDate, sessionName: ptSessions.name, status: ptWorkoutResults.status, sessionRpe: ptWorkoutResults.sessionRpe, energy: ptWorkoutResults.energy, painReported: ptWorkoutResults.painReported, durationMinutes: ptWorkoutResults.durationMinutes, notes: ptWorkoutResults.notes }).from(ptWorkoutResults).leftJoin(ptSessions, eq(ptSessions.id, ptWorkoutResults.sessionId)).where(and(eq(ptWorkoutResults.clientId, client.id), eq(ptWorkoutResults.ownerProfileId, access.account.authUserId))).orderBy(desc(ptWorkoutResults.scheduledDate)).limit(30);
  const resultIds = results.map((result) => result.id);
  const resultSets = resultIds.length ? await db.select({ workoutResultId: ptWorkoutResultSets.workoutResultId, setNumber: ptWorkoutResultSets.setNumber, exerciseName: ptExercises.name, actualReps: ptWorkoutResultSets.actualReps, actualLoadKg: ptWorkoutResultSets.actualLoadKg, actualRpe: ptWorkoutResultSets.actualRpe, actualRir: ptWorkoutResultSets.actualRir, techniqueAcceptable: ptWorkoutResultSets.techniqueAcceptable, painReported: ptWorkoutResultSets.painReported }).from(ptWorkoutResultSets).innerJoin(ptExercisePrescriptions, eq(ptExercisePrescriptions.id, ptWorkoutResultSets.prescriptionId)).innerJoin(ptExercises, eq(ptExercises.id, ptExercisePrescriptions.exerciseId)).where(inArray(ptWorkoutResultSets.workoutResultId, resultIds)).orderBy(asc(ptWorkoutResultSets.workoutResultId), asc(ptWorkoutResultSets.setNumber)) : [];
  const resultSetsByResult = new Map<string, string[]>();
  for (const set of resultSets) { const current = resultSetsByResult.get(set.workoutResultId) ?? []; current.push(`${set.exerciseName}: ${set.actualReps ?? "—"} reps @ ${set.actualLoadKg ?? "—"} kg, RPE ${set.actualRpe ?? "—"}, RIR ${set.actualRir ?? "—"}, technique ${set.techniqueAcceptable ? "acceptable" : "not acceptable"}, pain ${set.painReported ? "reported" : "not reported"}`); resultSetsByResult.set(set.workoutResultId, current); }
  const programmeData = programme ? { ...programme, events, weeks: weeks.map((week) => ({ ...week, sessions: sessions.filter((session) => session.programmeWeekId === week.id).map((session) => ({ ...session, exercises: prescriptions.filter((exercise) => exercise.sessionId === session.id).map((exercise) => ({ ...exercise, reps: exercise.repsMin ? `${exercise.repsMin}${exercise.repsMax && exercise.repsMax !== exercise.repsMin ? `–${exercise.repsMax}` : ""}` : "as prescribed", intensity: exercise.intensityValue })) })) })) } : null;
  const warnings = [
    assessment?.clearanceRequired ? "Screening flag present: review referral or clearance requirements before assigning this programme." : "",
    programme && programmeData && (programmeData.weeks as Array<{ sessions: Array<{ exercises: Array<unknown> }> }>).flatMap((week) => week.sessions).length < (Array.isArray(client.preferredDays) ? client.preferredDays.length : 0) ? "Saved programme session count may be below the client's preferred weekly frequency." : "",
    programme && programmeData && (programmeData.weeks as Array<{ sessions: Array<{ exercises: Array<{ name: string; sets: number }> }> }>).flatMap((week) => week.sessions).flatMap((session) => session.exercises).reduce((sum, exercise) => sum + exercise.sets, 0) > 160 ? "Total programme volume may create a high recovery demand." : "",
  ].filter(Boolean);
  const bundle = { client: { ...client, name: redacted ? "Redacted client" : `${client.firstName} ${client.lastName}`, firstName: redacted ? "Redacted" : client.firstName, lastName: redacted ? "client" : client.lastName }, screening: assessment ?? { clearanceRequired: false, riskFlags: [], responses: {}, ptNotes: null }, goals, preferences: preferences ?? {}, locations, currentProgramme: programmeData, programmeHistory, qualityChecks: { score: Math.max(0, 100 - warnings.length * 8), warnings }, recentWorkoutResults: results.map((result) => ({ ...result, sets: resultSetsByResult.get(result.id) ?? [] })), privacy: { redacted, excluded: redacted ? ["client name", "date of birth"] : [] } };
  return NextResponse.json({ markdown: buildMarkdown(bundle, redacted), json: bundle, meta: { redacted, programmeVersion: programme?.version ?? null, programmeCount: programmeHistory.length, workoutResultCount: results.length } });
}
