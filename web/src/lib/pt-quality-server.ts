import "server-only";

import { and, asc, desc, eq } from "drizzle-orm";

import { ptAssessments, ptClients, ptDesignerSettings, ptExercisePrescriptions, ptExercises, ptGoals, ptLocations, ptPreferences, ptProgrammeQualityAcknowledgements, ptProgrammeQualityReviews, ptProgrammeWeeks, ptProgrammes, ptSessions, ptWorkoutResults } from "@/lib/db/schema";
import { getDb } from "@/lib/db/client";
import { defaultQualitySettings, evaluateProgrammeQuality, normalizeQualitySettings, QUALITY_EVIDENCE, QUALITY_RULESET, type QualityContext, type QualityFinding, type QualityReview, type QualitySettings } from "@/lib/pt-quality";

const asList = (value: unknown) => Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
const asRecord = (value: unknown) => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
const asNumberList = (value: unknown) => Array.isArray(value) ? value.filter((item): item is number => typeof item === "number") : [];

async function resolveSettings(db: ReturnType<typeof getDb>, ownerProfileId: string, settings?: QualitySettings) {
  if (settings) return settings;
  const [row] = await db.select({ qualityRules: ptDesignerSettings.qualityRules }).from(ptDesignerSettings).where(eq(ptDesignerSettings.ownerProfileId, ownerProfileId)).limit(1);
  return normalizeQualitySettings(row?.qualityRules ?? defaultQualitySettings);
}

export async function loadProgrammeQualityContext(db: ReturnType<typeof getDb>, ownerProfileId: string, programmeId: string): Promise<QualityContext | null> {
  const [programme] = await db.select({ id: ptProgrammes.id, clientId: ptProgrammes.clientId, goalSummary: ptProgrammes.goalSummary, durationWeeks: ptProgrammes.durationWeeks }).from(ptProgrammes).where(and(eq(ptProgrammes.id, programmeId), eq(ptProgrammes.ownerProfileId, ownerProfileId))).limit(1);
  if (!programme) return null;
  const [client] = await db.select({ preferredDays: ptClients.preferredDays, trainingExperience: ptClients.trainingExperience, dailyActivity: ptClients.dailyActivity, sessionDurationMinutes: ptClients.sessionDurationMinutes, sleepHours: ptClients.sleepHours, stressLevel: ptClients.stressLevel }).from(ptClients).where(and(eq(ptClients.id, programme.clientId), eq(ptClients.ownerProfileId, ownerProfileId))).limit(1);
  if (!client) return null;
  const [assessmentRow] = await db.select({ clearanceRequired: ptAssessments.clearanceRequired, riskFlags: ptAssessments.riskFlags, responses: ptAssessments.responses, reviewDate: ptAssessments.reviewDate, ptNotes: ptAssessments.ptNotes }).from(ptAssessments).where(eq(ptAssessments.clientId, programme.clientId)).orderBy(desc(ptAssessments.assessmentDate)).limit(1);
  const assessmentValues = asRecord(assessmentRow?.responses);
  const [goal] = await db.select({ goalType: ptGoals.goalType, target: ptGoals.target, metric: ptGoals.metric }).from(ptGoals).where(and(eq(ptGoals.clientId, programme.clientId), eq(ptGoals.priority, "primary"))).orderBy(desc(ptGoals.updatedAt)).limit(1);
  const [location] = await db.select({ name: ptLocations.name, locationType: ptLocations.locationType, equipment: ptLocations.equipment }).from(ptLocations).where(eq(ptLocations.clientId, programme.clientId)).orderBy(desc(ptLocations.updatedAt)).limit(1);
  const [preferences] = await db.select({ likedExercises: ptPreferences.likedExercises, dislikedExercises: ptPreferences.dislikedExercises, preferredEquipment: ptPreferences.preferredEquipment, confidenceNotes: ptPreferences.confidenceNotes }).from(ptPreferences).where(eq(ptPreferences.clientId, programme.clientId)).limit(1);
  const sessionRows = await db.select({ id: ptSessions.id, weekNumber: ptProgrammeWeeks.weekNumber, dayOfWeek: ptSessions.dayOfWeek, name: ptSessions.name, sessionType: ptSessions.sessionType, durationMinutes: ptSessions.durationMinutes, exerciseId: ptExercises.id, exerciseName: ptExercises.name, pattern: ptExercises.movementPattern, primaryMuscles: ptExercises.primaryMuscles, equipment: ptExercises.equipment, cautionTags: ptExercises.cautionTags, tags: ptExercises.tags, technicalComplexity: ptExercises.technicalComplexity, compound: ptExercises.compound, prescriptionId: ptExercisePrescriptions.id, sets: ptExercisePrescriptions.sets, repsMin: ptExercisePrescriptions.repsMin, repsMax: ptExercisePrescriptions.repsMax, intensityType: ptExercisePrescriptions.intensityType, intensityValue: ptExercisePrescriptions.intensityValue, restSeconds: ptExercisePrescriptions.restSeconds, progressionRule: ptExercisePrescriptions.progressionRule }).from(ptSessions).innerJoin(ptProgrammeWeeks, eq(ptProgrammeWeeks.id, ptSessions.programmeWeekId)).leftJoin(ptExercisePrescriptions, eq(ptExercisePrescriptions.sessionId, ptSessions.id)).leftJoin(ptExercises, eq(ptExercises.id, ptExercisePrescriptions.exerciseId)).where(eq(ptProgrammeWeeks.programmeId, programme.id)).orderBy(asc(ptProgrammeWeeks.weekNumber), asc(ptSessions.dayOfWeek), asc(ptExercisePrescriptions.orderIndex));
  const sessionMap = new Map<string, QualityContext["programme"]["sessions"][number]>();
  sessionRows.forEach((row) => {
    const session = sessionMap.get(row.id) ?? { id: row.id, weekNumber: row.weekNumber, dayOfWeek: row.dayOfWeek, name: row.name, sessionType: row.sessionType, durationMinutes: row.durationMinutes, exercises: [] };
    if (row.exerciseId && row.exerciseName && row.pattern && row.prescriptionId && row.sets !== null) session.exercises.push({ id: row.exerciseId, name: row.exerciseName, pattern: row.pattern, primaryMuscles: asList(row.primaryMuscles), equipment: asList(row.equipment), cautionTags: asList(row.cautionTags), tags: asList(row.tags), technicalComplexity: row.technicalComplexity, compound: row.compound ?? undefined, sets: row.sets ?? 0, repsMin: row.repsMin, repsMax: row.repsMax, intensityType: row.intensityType, intensityValue: row.intensityValue, restSeconds: row.restSeconds, progressionRule: row.progressionRule });
    sessionMap.set(row.id, session);
  });
  const recentResults = await db.select({ painReported: ptWorkoutResults.painReported, energy: ptWorkoutResults.energy, sessionRpe: ptWorkoutResults.sessionRpe, notes: ptWorkoutResults.notes }).from(ptWorkoutResults).where(and(eq(ptWorkoutResults.clientId, programme.clientId), eq(ptWorkoutResults.ownerProfileId, ownerProfileId))).orderBy(desc(ptWorkoutResults.scheduledDate)).limit(30);
  const riskFlags = Array.isArray(assessmentRow?.riskFlags) ? assessmentRow.riskFlags as Array<{ code?: string; action?: string; label?: string }> : [];
  return {
    client: { preferredDays: asNumberList(client.preferredDays), trainingExperience: client.trainingExperience, dailyActivity: client.dailyActivity, sessionDurationMinutes: client.sessionDurationMinutes, sleepHours: client.sleepHours, stressLevel: client.stressLevel },
    assessment: assessmentRow ? { responses: assessmentValues, riskFlags, clearanceRequired: assessmentRow.clearanceRequired ?? undefined, reviewDate: assessmentRow.reviewDate, ptNotes: assessmentRow.ptNotes, injuryNotes: typeof assessmentValues.injuryNotes === "string" ? assessmentValues.injuryNotes : null, contraindicationNotes: typeof assessmentValues.contraindicationNotes === "string" ? assessmentValues.contraindicationNotes : null } : null,
    goal: goal ?? null,
    location: location ? { ...location, equipment: asList(location.equipment) } : null,
    preferences: preferences ? { ...preferences, likedExercises: asList(preferences.likedExercises), dislikedExercises: asList(preferences.dislikedExercises), preferredEquipment: asList(preferences.preferredEquipment) } : null,
    programme: { id: programme.id, goalSummary: programme.goalSummary, durationWeeks: programme.durationWeeks, trainingDays: asNumberList(client.preferredDays).length, sessions: Array.from(sessionMap.values()) },
    recentResults,
  };
}

async function saveReview(db: ReturnType<typeof getDb>, programmeId: string, review: QualityReview) {
  await db.insert(ptProgrammeQualityReviews).values({ programmeId, rulesetVersion: review.rulesetVersion, evidenceVersion: review.evidence.evidenceVersion, evaluatedAt: new Date(review.evaluatedAt), score: review.score, approvalReadiness: review.approvalReadiness, blockingCount: review.counts.blocking, significantCount: review.counts.significant, advisoryCount: review.counts.advisory, infoCount: review.counts.info, scheduledSessions: review.scheduledSessions, emptySessions: review.emptySessions, totalSets: review.totalSets, sourceFingerprint: review.sourceFingerprint, findings: review.findings, passedRuleIds: review.passedRuleIds, updatedAt: new Date() }).onConflictDoUpdate({ target: ptProgrammeQualityReviews.programmeId, set: { rulesetVersion: review.rulesetVersion, evidenceVersion: review.evidence.evidenceVersion, evaluatedAt: new Date(review.evaluatedAt), score: review.score, approvalReadiness: review.approvalReadiness, blockingCount: review.counts.blocking, significantCount: review.counts.significant, advisoryCount: review.counts.advisory, infoCount: review.counts.info, scheduledSessions: review.scheduledSessions, emptySessions: review.emptySessions, totalSets: review.totalSets, sourceFingerprint: review.sourceFingerprint, findings: review.findings, passedRuleIds: review.passedRuleIds, updatedAt: new Date() } });
}

function applyAcknowledgements(review: QualityReview, rows: Array<{ ruleId: string; findingKey: string; decision: string; reason: string; sourceFingerprint: string; rulesetVersion: string; evidenceVersion: string; createdAt: Date }>) {
  const current = rows.filter((row) => row.sourceFingerprint === review.sourceFingerprint && row.rulesetVersion === review.rulesetVersion && row.evidenceVersion === review.evidence.evidenceVersion);
  const byKey = new Map(current.map((row) => [row.findingKey, row]));
  return { ...review, findings: review.findings.map((item) => { const acknowledgement = byKey.get(item.key); return acknowledgement ? { ...item, acknowledged: true, acknowledgementDecision: (acknowledgement.decision === "acknowledged" ? "acknowledged" : "overridden") as "acknowledged" | "overridden" } : item; }) };
}

export async function getCurrentProgrammeQuality(db: ReturnType<typeof getDb>, ownerProfileId: string, programmeId: string, settings?: QualitySettings) {
  const context = await loadProgrammeQualityContext(db, ownerProfileId, programmeId);
  if (!context) return null;
  const review = evaluateProgrammeQuality(context, await resolveSettings(db, ownerProfileId, settings));
  const [stored] = await db.select({ sourceFingerprint: ptProgrammeQualityReviews.sourceFingerprint, rulesetVersion: ptProgrammeQualityReviews.rulesetVersion }).from(ptProgrammeQualityReviews).where(eq(ptProgrammeQualityReviews.programmeId, programmeId)).limit(1);
  if (!stored || stored.sourceFingerprint !== review.sourceFingerprint || stored.rulesetVersion !== review.rulesetVersion) await saveReview(db, programmeId, review);
  const acknowledgements = await db.select({ ruleId: ptProgrammeQualityAcknowledgements.ruleId, findingKey: ptProgrammeQualityAcknowledgements.findingKey, decision: ptProgrammeQualityAcknowledgements.decision, reason: ptProgrammeQualityAcknowledgements.reason, sourceFingerprint: ptProgrammeQualityAcknowledgements.sourceFingerprint, rulesetVersion: ptProgrammeQualityAcknowledgements.rulesetVersion, evidenceVersion: ptProgrammeQualityAcknowledgements.evidenceVersion, createdAt: ptProgrammeQualityAcknowledgements.createdAt }).from(ptProgrammeQualityAcknowledgements).where(eq(ptProgrammeQualityAcknowledgements.programmeId, programmeId)).orderBy(desc(ptProgrammeQualityAcknowledgements.createdAt));
  return { review: applyAcknowledgements(review, acknowledgements), context, acknowledgements, evidence: QUALITY_EVIDENCE, rulesetVersion: QUALITY_RULESET.version };
}

export async function refreshProgrammeQuality(db: ReturnType<typeof getDb>, ownerProfileId: string, programmeId: string, settings?: QualitySettings) {
  const context = await loadProgrammeQualityContext(db, ownerProfileId, programmeId);
  if (!context) return null;
  const review = evaluateProgrammeQuality(context, await resolveSettings(db, ownerProfileId, settings));
  await saveReview(db, programmeId, review);
  return review;
}

export async function refreshClientProgrammeQuality(db: ReturnType<typeof getDb>, ownerProfileId: string, clientId: string, settings?: QualitySettings) {
  const programmes = await db.select({ id: ptProgrammes.id }).from(ptProgrammes).where(and(eq(ptProgrammes.ownerProfileId, ownerProfileId), eq(ptProgrammes.clientId, clientId)));
  for (const programme of programmes) await refreshProgrammeQuality(db, ownerProfileId, programme.id, settings);
}

export async function refreshOwnerProgrammeQuality(db: ReturnType<typeof getDb>, ownerProfileId: string, settings?: QualitySettings) {
  const programmes = await db.select({ id: ptProgrammes.id }).from(ptProgrammes).where(eq(ptProgrammes.ownerProfileId, ownerProfileId));
  for (const programme of programmes) await refreshProgrammeQuality(db, ownerProfileId, programme.id, settings);
}

export function findingCanBeAcknowledged(item: QualityFinding) {
  return item.severity === "advisory" || item.severity === "info";
}
