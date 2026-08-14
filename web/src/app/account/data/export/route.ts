import { eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getAccountAccess } from "@/lib/authorization/server";
import { getDb } from "@/lib/db/client";
import {
  ptAssessments,
  ptClientPerformanceRecords,
  ptClients,
  ptDesignerSettings,
  ptExercisePrescriptions,
  ptExercises,
  ptGoals,
  ptLocations,
  ptPreferences,
  ptProgrammeEvents,
  ptProgrammeQualityAcknowledgements,
  ptProgrammeQualityReviews,
  ptProgrammeTemplates,
  ptProgrammeWeeks,
  ptProgrammes,
  ptSessions,
  ptWorkoutResultSets,
  ptWorkoutResults,
} from "@/lib/db/schema";

export async function GET() {
  const access = await getAccountAccess();
  if (access.state !== "active" || !["owner", "pt"].includes(access.account.role)) return NextResponse.json({ error: "An active PT account is required." }, { status: 401 });

  const ownerProfileId = access.account.authUserId;
  const db = getDb();
  const [clients, programmes, templates, exercises, designerSettings] = await Promise.all([
    db.select().from(ptClients).where(eq(ptClients.ownerProfileId, ownerProfileId)),
    db.select().from(ptProgrammes).where(eq(ptProgrammes.ownerProfileId, ownerProfileId)),
    db.select().from(ptProgrammeTemplates).where(eq(ptProgrammeTemplates.ownerProfileId, ownerProfileId)),
    db.select().from(ptExercises).where(eq(ptExercises.ownerProfileId, ownerProfileId)),
    db.select().from(ptDesignerSettings).where(eq(ptDesignerSettings.ownerProfileId, ownerProfileId)),
  ]);
  const clientIds = clients.map((row) => row.id);
  const programmeIds = programmes.map((row) => row.id);
  const [assessments, goals, preferences, locations, performanceRecords, weeks, events, qualityReviews, qualityAcknowledgements] = await Promise.all([
    clientIds.length ? db.select().from(ptAssessments).where(inArray(ptAssessments.clientId, clientIds)) : Promise.resolve([]),
    clientIds.length ? db.select().from(ptGoals).where(inArray(ptGoals.clientId, clientIds)) : Promise.resolve([]),
    clientIds.length ? db.select().from(ptPreferences).where(inArray(ptPreferences.clientId, clientIds)) : Promise.resolve([]),
    clientIds.length ? db.select().from(ptLocations).where(inArray(ptLocations.clientId, clientIds)) : Promise.resolve([]),
    clientIds.length ? db.select().from(ptClientPerformanceRecords).where(inArray(ptClientPerformanceRecords.clientId, clientIds)) : Promise.resolve([]),
    programmeIds.length ? db.select().from(ptProgrammeWeeks).where(inArray(ptProgrammeWeeks.programmeId, programmeIds)) : Promise.resolve([]),
    programmeIds.length ? db.select().from(ptProgrammeEvents).where(inArray(ptProgrammeEvents.programmeId, programmeIds)) : Promise.resolve([]),
    programmeIds.length ? db.select().from(ptProgrammeQualityReviews).where(inArray(ptProgrammeQualityReviews.programmeId, programmeIds)) : Promise.resolve([]),
    programmeIds.length ? db.select().from(ptProgrammeQualityAcknowledgements).where(inArray(ptProgrammeQualityAcknowledgements.programmeId, programmeIds)) : Promise.resolve([]),
  ]);
  const weekIds = weeks.map((row) => row.id);
  const sessions = weekIds.length ? await db.select().from(ptSessions).where(inArray(ptSessions.programmeWeekId, weekIds)) : [];
  const sessionIds = sessions.map((row) => row.id);
  const prescriptions = sessionIds.length ? await db.select().from(ptExercisePrescriptions).where(inArray(ptExercisePrescriptions.sessionId, sessionIds)) : [];
  const results = clientIds.length ? await db.select().from(ptWorkoutResults).where(inArray(ptWorkoutResults.clientId, clientIds)) : [];
  const resultIds = results.map((row) => row.id);
  const resultSets = resultIds.length ? await db.select().from(ptWorkoutResultSets).where(inArray(ptWorkoutResultSets.workoutResultId, resultIds)) : [];

  const body = JSON.stringify({
    exportedAt: new Date().toISOString(),
    account: { email: access.account.email, role: access.account.role },
    clientData: { clients, assessments, goals, preferences, locations, performanceRecords },
    programmeData: { programmes, weeks, sessions, prescriptions, events, qualityReviews, qualityAcknowledgements, templates },
    workoutData: { results, resultSets },
    exerciseLibrary: exercises,
    designerSettings,
  }, null, 2);
  return new NextResponse(body, {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="banner-fitness-pt-data-${new Date().toISOString().slice(0, 10)}.json"`,
      "cache-control": "private, no-store",
    },
  });
}
