import { and, count, desc, eq, gte } from "drizzle-orm";
import { NextResponse } from "next/server";

import { designerOwnership, isActiveOwner, requireOwner } from "@/lib/authorization/require-owner";
import { getDb } from "@/lib/db/client";
import { hasRecordedScreeningReview } from "@/lib/pt-programming";
import { ptAssessments, ptClients, ptGoals, ptLocations, ptProgrammeQualityReviews, ptProgrammeWeeks, ptProgrammes, ptSessions, ptWorkoutResults } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  const owner = await requireOwner();
  if (!isActiveOwner(owner)) return owner;
  const access = { account: owner };
  const db = getDb();
  const [clientCount] = await db.select({ value: count() }).from(ptClients).where(and(designerOwnership(ptClients.ownerProfileId, owner), eq(ptClients.status, "active")));
  const [programmeCount] = await db.select({ value: count() }).from(ptProgrammes).where(and(designerOwnership(ptProgrammes.ownerProfileId, owner), eq(ptProgrammes.status, "draft")));
  const since = new Date(); since.setDate(since.getDate() - 30);
  const resultCounts = await db.select({ status: ptWorkoutResults.status, value: count() }).from(ptWorkoutResults).where(and(designerOwnership(ptWorkoutResults.ownerProfileId, owner), gte(ptWorkoutResults.scheduledDate, since.toISOString().slice(0, 10)))).groupBy(ptWorkoutResults.status);
  const totalResults = resultCounts.reduce((sum, row) => sum + Number(row.value), 0);
  const completedResults = resultCounts.filter((row) => row.status === "completed" || row.status === "partial").reduce((sum, row) => sum + Number(row.value), 0);
  const clients = await db.select({ id: ptClients.id, firstName: ptClients.firstName, lastName: ptClients.lastName, status: ptClients.status, trainingExperience: ptClients.trainingExperience, sessionDurationMinutes: ptClients.sessionDurationMinutes, updatedAt: ptClients.updatedAt }).from(ptClients).where(designerOwnership(ptClients.ownerProfileId, owner)).orderBy(desc(ptClients.updatedAt)).limit(100);
  const programmes = await db.select({ id: ptProgrammes.id, clientId: ptProgrammes.clientId, name: ptProgrammes.name, goalSummary: ptProgrammes.goalSummary, status: ptProgrammes.status, currentWeek: ptProgrammes.currentWeek, durationWeeks: ptProgrammes.durationWeeks, version: ptProgrammes.version, updatedAt: ptProgrammes.updatedAt }).from(ptProgrammes).where(designerOwnership(ptProgrammes.ownerProfileId, owner)).orderBy(desc(ptProgrammes.updatedAt)).limit(100);
  const qualityReviews = await db.select({ programmeId: ptProgrammeQualityReviews.programmeId, score: ptProgrammeQualityReviews.score, approvalReadiness: ptProgrammeQualityReviews.approvalReadiness, blockingCount: ptProgrammeQualityReviews.blockingCount, significantCount: ptProgrammeQualityReviews.significantCount, advisoryCount: ptProgrammeQualityReviews.advisoryCount, evaluatedAt: ptProgrammeQualityReviews.evaluatedAt }).from(ptProgrammeQualityReviews).innerJoin(ptProgrammes, eq(ptProgrammeQualityReviews.programmeId, ptProgrammes.id)).where(eq(ptProgrammes.ownerProfileId, access.account.authUserId));
  const assessments = await db.select({ clientId: ptClients.id, firstName: ptClients.firstName, lastName: ptClients.lastName, reviewDate: ptAssessments.reviewDate, clearanceRequired: ptAssessments.clearanceRequired, riskFlags: ptAssessments.riskFlags, ptNotes: ptAssessments.ptNotes, assessmentDate: ptAssessments.assessmentDate }).from(ptAssessments).innerJoin(ptClients, eq(ptAssessments.clientId, ptClients.id)).where(eq(ptClients.ownerProfileId, access.account.authUserId)).orderBy(desc(ptAssessments.assessmentDate)).limit(100);
  const latestAssessments = new Map<string, typeof assessments[number]>();
  for (const assessment of assessments) if (!latestAssessments.has(assessment.clientId)) latestAssessments.set(assessment.clientId, assessment);
  const today = new Date().toISOString().slice(0, 10);
  const attention = Array.from(latestAssessments.values()).filter((assessment) => !hasRecordedScreeningReview(assessment.ptNotes) && (assessment.clearanceRequired || (Array.isArray(assessment.riskFlags) && assessment.riskFlags.length > 0))).map((assessment) => ({ id: `assessment-${assessment.clientId}`, clientId: assessment.clientId, name: `${assessment.firstName} ${assessment.lastName}`, text: assessment.clearanceRequired ? "Screening review or clearance required" : "Screening flags need PT review", tag: "Review", tone: "orange" }));
  for (const client of clients.filter((item) => item.status === "active")) {
    if (!latestAssessments.has(client.id)) attention.push({ id: `screening-missing-${client.id}`, clientId: client.id, name: `${client.firstName} ${client.lastName}`, text: "Initial screening has not been recorded", tag: "Start", tone: "orange" });
  }
  for (const assessment of latestAssessments.values()) {
    if (assessment.reviewDate && assessment.reviewDate < today) attention.push({ id: `assessment-overdue-${assessment.clientId}`, clientId: assessment.clientId, name: `${assessment.firstName} ${assessment.lastName}`, text: `Screening review date passed on ${assessment.reviewDate}`, tag: "Overdue", tone: "orange" });
  }
  for (const programme of programmes.filter((item) => item.status === "draft").slice(0, 5)) {
    const ownerClient = clients.find((item) => item.id === programme.clientId);
    if (ownerClient) attention.push({ id: `programme-${programme.id}`, clientId: programme.clientId, name: `${ownerClient.firstName} ${ownerClient.lastName}`, text: `Draft programme awaiting review · Week ${programme.currentWeek}`, tag: "Draft", tone: "blue" });
  }
  const qualityByProgramme = new Map(qualityReviews.map((review) => [review.programmeId, review]));
  for (const programme of programmes) {
    const quality = qualityByProgramme.get(programme.id);
    if (!quality || quality.approvalReadiness === "ready") continue;
    const ownerClient = clients.find((item) => item.id === programme.clientId);
    if (!ownerClient) continue;
    const severity = quality.blockingCount > 0 ? "blocked" : quality.significantCount > 0 ? "needs review" : "PT consideration";
    attention.push({ id: `quality-${programme.id}`, clientId: programme.clientId, name: `${ownerClient.firstName} ${ownerClient.lastName}`, text: `Programme quality ${quality.score} · ${severity}`, tag: quality.blockingCount > 0 ? "Blocked" : "Quality", tone: quality.blockingCount > 0 ? "orange" : "blue" });
  }
  const scheduledSessions = await db.select({ id: ptSessions.id, clientId: ptProgrammes.clientId, firstName: ptClients.firstName, lastName: ptClients.lastName, dayOfWeek: ptSessions.dayOfWeek, name: ptSessions.name, sessionType: ptSessions.sessionType, durationMinutes: ptSessions.durationMinutes }).from(ptSessions).innerJoin(ptProgrammeWeeks, eq(ptSessions.programmeWeekId, ptProgrammeWeeks.id)).innerJoin(ptProgrammes, eq(ptProgrammeWeeks.programmeId, ptProgrammes.id)).innerJoin(ptClients, eq(ptProgrammes.clientId, ptClients.id)).where(and(eq(ptProgrammes.ownerProfileId, access.account.authUserId), eq(ptProgrammes.status, "active"), eq(ptProgrammeWeeks.weekNumber, ptProgrammes.currentWeek))).orderBy(ptSessions.dayOfWeek).limit(20);
  const baseSchedule = scheduledSessions.map((session) => ({ ...session, clientName: `${session.firstName} ${session.lastName}`, day: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][session.dayOfWeek % 7] }));
  const primaryGoals = await db.select({ clientId: ptGoals.clientId, goalType: ptGoals.goalType, target: ptGoals.target, metric: ptGoals.metric }).from(ptGoals).innerJoin(ptClients, eq(ptGoals.clientId, ptClients.id)).where(and(eq(ptClients.ownerProfileId, access.account.authUserId), eq(ptGoals.priority, "primary"))).orderBy(desc(ptGoals.updatedAt));
  const locations = await db.select({ clientId: ptLocations.clientId, name: ptLocations.name }).from(ptLocations).innerJoin(ptClients, eq(ptLocations.clientId, ptClients.id)).where(eq(ptClients.ownerProfileId, access.account.authUserId)).orderBy(desc(ptLocations.updatedAt));
  const recentResults = await db.select({ clientId: ptWorkoutResults.clientId, sessionId: ptWorkoutResults.sessionId, scheduledDate: ptWorkoutResults.scheduledDate, status: ptWorkoutResults.status, painReported: ptWorkoutResults.painReported, energy: ptWorkoutResults.energy, sessionRpe: ptWorkoutResults.sessionRpe }).from(ptWorkoutResults).where(and(eq(ptWorkoutResults.ownerProfileId, access.account.authUserId), gte(ptWorkoutResults.scheduledDate, new Date(Date.now() - 1000 * 60 * 60 * 24 * 120).toISOString().slice(0, 10)))).orderBy(desc(ptWorkoutResults.scheduledDate)).limit(1000);
  const currentWeekMonday = new Date();
  const currentWeekDay = currentWeekMonday.getDay() || 7;
  currentWeekMonday.setDate(currentWeekMonday.getDate() - currentWeekDay + 1);
  const schedule = baseSchedule.map((session) => {
    const calendarDate = new Date(currentWeekMonday);
    calendarDate.setDate(currentWeekMonday.getDate() + session.dayOfWeek - 1);
    const date = calendarDate.toISOString().slice(0, 10);
    const result = recentResults.find((item) => item.sessionId === session.id && item.scheduledDate === date);
    return { ...session, date, status: result?.status ?? (date < today ? "pending" : date === today ? "today" : "upcoming") };
  });
  const programmeByClient = new Map<string, typeof programmes[number]>();
  for (const programme of programmes) if (!programmeByClient.has(programme.clientId)) programmeByClient.set(programme.clientId, programme);
  const assessmentByClient = new Map<string, typeof assessments[number]>();
  for (const assessment of assessments) if (!assessmentByClient.has(assessment.clientId)) assessmentByClient.set(assessment.clientId, assessment);
  const goalByClient = new Map<string, typeof primaryGoals[number]>();
  for (const goal of primaryGoals) if (!goalByClient.has(goal.clientId)) goalByClient.set(goal.clientId, goal);
  const locationByClient = new Map<string, typeof locations[number]>();
  for (const location of locations) if (!locationByClient.has(location.clientId)) locationByClient.set(location.clientId, location);
  const latestResultByClient = new Map<string, typeof recentResults[number]>();
  const resultStatsByClient = new Map<string, { total: number; completed: number }>();
  for (const result of recentResults) {
    if (!latestResultByClient.has(result.clientId)) latestResultByClient.set(result.clientId, result);
    const stats = resultStatsByClient.get(result.clientId) ?? { total: 0, completed: 0 };
    stats.total += 1;
    if (result.status === "completed" || result.status === "partial") stats.completed += 1;
    resultStatsByClient.set(result.clientId, stats);
  }
  const currentDay = new Date().getDay() || 7;
  const dashboardClients = clients.map((client) => {
    const assessment = assessmentByClient.get(client.id);
    const programme = programmeByClient.get(client.id) ?? null;
    const result = latestResultByClient.get(client.id) ?? null;
    const stats = resultStatsByClient.get(client.id) ?? { total: 0, completed: 0 };
    const clientSchedule = schedule.filter((session) => session.clientId === client.id).sort((a, b) => ((a.dayOfWeek - currentDay + 7) % 7) - ((b.dayOfWeek - currentDay + 7) % 7));
    const dataGaps = [!assessment ? "screening" : "", !goalByClient.has(client.id) ? "goal" : "", !client.trainingExperience ? "experience" : "", !locationByClient.has(client.id) ? "location" : ""].filter(Boolean);
    const screeningConcern = Boolean(assessment && (!hasRecordedScreeningReview(assessment.ptNotes) && (assessment.clearanceRequired || (Array.isArray(assessment.riskFlags) && assessment.riskFlags.length > 0)))) || Boolean(assessment?.reviewDate && assessment.reviewDate < today);
    const quality = programme ? qualityByProgramme.get(programme.id) ?? null : null;
    return { ...client, programme: programme ? { id: programme.id, name: programme.name, status: programme.status, currentWeek: programme.currentWeek, durationWeeks: programme.durationWeeks, version: programme.version } : null, goal: goalByClient.get(client.id) ?? null, location: locationByClient.get(client.id) ?? null, lastWorkout: result ? { date: result.scheduledDate, status: result.status, painReported: result.painReported, energy: result.energy, sessionRpe: result.sessionRpe } : null, adherence: stats.total ? Math.round((stats.completed / stats.total) * 100) : null, nextSession: clientSchedule[0] ? { day: clientSchedule[0].day, name: clientSchedule[0].name, durationMinutes: clientSchedule[0].durationMinutes } : null, quality: quality ? { score: quality.score, approvalReadiness: quality.approvalReadiness, blockingCount: quality.blockingCount, significantCount: quality.significantCount, advisoryCount: quality.advisoryCount, evaluatedAt: quality.evaluatedAt } : null, dataGaps, needsAttention: Boolean(dataGaps.length || screeningConcern || result?.painReported || programme?.status === "draft" || (quality && quality.approvalReadiness !== "ready")) };
  });
  return NextResponse.json({ counts: { clients: Number(clientCount?.value ?? 0), draftProgrammes: Number(programmeCount?.value ?? 0), adherence: totalResults ? Math.round((completedResults / totalResults) * 100) : null, sessionsThisWeek: schedule.length }, clients, dashboardClients, programmes, attention, schedule });
}
