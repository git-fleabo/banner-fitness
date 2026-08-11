import { and, count, desc, eq, gte } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getAccountAccess } from "@/lib/authorization/server";
import { getDb } from "@/lib/db/client";
import { hasRecordedScreeningReview } from "@/lib/pt-programming";
import { ptAssessments, ptClients, ptProgrammeWeeks, ptProgrammes, ptSessions, ptWorkoutResults } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  const access = await getAccountAccess();
  if (access.state !== "active" || access.account.role !== "owner") return NextResponse.json({ error: "PT owner access required" }, { status: 403 });
  const db = getDb();
  const [clientCount] = await db.select({ value: count() }).from(ptClients).where(and(eq(ptClients.ownerProfileId, access.account.authUserId), eq(ptClients.status, "active")));
  const [programmeCount] = await db.select({ value: count() }).from(ptProgrammes).where(and(eq(ptProgrammes.ownerProfileId, access.account.authUserId), eq(ptProgrammes.status, "draft")));
  const since = new Date(); since.setDate(since.getDate() - 30);
  const resultCounts = await db.select({ status: ptWorkoutResults.status, value: count() }).from(ptWorkoutResults).where(and(eq(ptWorkoutResults.ownerProfileId, access.account.authUserId), gte(ptWorkoutResults.scheduledDate, since.toISOString().slice(0, 10)))).groupBy(ptWorkoutResults.status);
  const totalResults = resultCounts.reduce((sum, row) => sum + Number(row.value), 0);
  const completedResults = resultCounts.filter((row) => row.status === "completed" || row.status === "partial").reduce((sum, row) => sum + Number(row.value), 0);
  const clients = await db.select({ id: ptClients.id, firstName: ptClients.firstName, lastName: ptClients.lastName, status: ptClients.status, updatedAt: ptClients.updatedAt }).from(ptClients).where(eq(ptClients.ownerProfileId, access.account.authUserId)).orderBy(desc(ptClients.updatedAt)).limit(20);
  const programmes = await db.select({ id: ptProgrammes.id, clientId: ptProgrammes.clientId, name: ptProgrammes.name, goalSummary: ptProgrammes.goalSummary, status: ptProgrammes.status, currentWeek: ptProgrammes.currentWeek, durationWeeks: ptProgrammes.durationWeeks, version: ptProgrammes.version, updatedAt: ptProgrammes.updatedAt }).from(ptProgrammes).where(eq(ptProgrammes.ownerProfileId, access.account.authUserId)).orderBy(desc(ptProgrammes.updatedAt)).limit(20);
  const assessments = await db.select({ clientId: ptClients.id, firstName: ptClients.firstName, lastName: ptClients.lastName, reviewDate: ptAssessments.reviewDate, clearanceRequired: ptAssessments.clearanceRequired, riskFlags: ptAssessments.riskFlags, ptNotes: ptAssessments.ptNotes, assessmentDate: ptAssessments.assessmentDate }).from(ptAssessments).innerJoin(ptClients, eq(ptAssessments.clientId, ptClients.id)).where(eq(ptClients.ownerProfileId, access.account.authUserId)).orderBy(desc(ptAssessments.assessmentDate)).limit(100);
  const latestAssessments = new Map<string, typeof assessments[number]>();
  for (const assessment of assessments) if (!latestAssessments.has(assessment.clientId)) latestAssessments.set(assessment.clientId, assessment);
  const attention = Array.from(latestAssessments.values()).filter((assessment) => !hasRecordedScreeningReview(assessment.ptNotes) && (assessment.clearanceRequired || (Array.isArray(assessment.riskFlags) && assessment.riskFlags.length > 0))).map((assessment) => ({ id: `assessment-${assessment.clientId}`, clientId: assessment.clientId, name: `${assessment.firstName} ${assessment.lastName}`, text: assessment.clearanceRequired ? "Screening review or clearance required" : "Screening flags need PT review", tag: "Review", tone: "orange" }));
  for (const programme of programmes.filter((item) => item.status === "draft").slice(0, 5)) {
    const ownerClient = clients.find((item) => item.id === programme.clientId);
    if (ownerClient) attention.push({ id: `programme-${programme.id}`, clientId: programme.clientId, name: `${ownerClient.firstName} ${ownerClient.lastName}`, text: `Draft programme awaiting review · Week ${programme.currentWeek}`, tag: "Draft", tone: "blue" });
  }
  const scheduledSessions = await db.select({ id: ptSessions.id, clientId: ptProgrammes.clientId, firstName: ptClients.firstName, lastName: ptClients.lastName, dayOfWeek: ptSessions.dayOfWeek, name: ptSessions.name, sessionType: ptSessions.sessionType, durationMinutes: ptSessions.durationMinutes }).from(ptSessions).innerJoin(ptProgrammeWeeks, eq(ptSessions.programmeWeekId, ptProgrammeWeeks.id)).innerJoin(ptProgrammes, eq(ptProgrammeWeeks.programmeId, ptProgrammes.id)).innerJoin(ptClients, eq(ptProgrammes.clientId, ptClients.id)).where(and(eq(ptProgrammes.ownerProfileId, access.account.authUserId), eq(ptProgrammes.status, "active"), eq(ptProgrammeWeeks.weekNumber, ptProgrammes.currentWeek))).orderBy(ptSessions.dayOfWeek).limit(20);
  const schedule = scheduledSessions.map((session) => ({ ...session, clientName: `${session.firstName} ${session.lastName}`, day: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][session.dayOfWeek % 7] }));
  return NextResponse.json({ counts: { clients: Number(clientCount?.value ?? 0), draftProgrammes: Number(programmeCount?.value ?? 0), adherence: totalResults ? Math.round((completedResults / totalResults) * 100) : null, sessionsThisWeek: schedule.length }, clients, programmes, attention, schedule });
}
