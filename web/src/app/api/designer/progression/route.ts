import { and, desc, eq, inArray } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { getAccountAccess } from "@/lib/authorization/server";
import { getDb } from "@/lib/db/client";
import { evaluateProgression } from "@/lib/pt-programming";
import { ptClients, ptExercisePrescriptions, ptExercises, ptProgrammeWeeks, ptProgrammes, ptSessions, ptWorkoutResultSets, ptWorkoutResults } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const access = await getAccountAccess();
  if (access.state !== "active" || access.account.role !== "owner") return NextResponse.json({ error: "PT owner access required" }, { status: 403 });
  const clientId = request.nextUrl.searchParams.get("clientId");
  if (!clientId) return NextResponse.json({ error: "clientId is required" }, { status: 400 });
  const db = getDb();
  const [client] = await db.select({ id: ptClients.id, firstName: ptClients.firstName, lastName: ptClients.lastName }).from(ptClients).where(and(eq(ptClients.id, clientId), eq(ptClients.ownerProfileId, access.account.authUserId))).limit(1);
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });
  const [programme] = await db.select({ id: ptProgrammes.id, version: ptProgrammes.version, currentWeek: ptProgrammes.currentWeek }).from(ptProgrammes).where(and(eq(ptProgrammes.clientId, client.id), eq(ptProgrammes.ownerProfileId, access.account.authUserId))).orderBy(desc(ptProgrammes.updatedAt)).limit(1);
  if (!programme) return NextResponse.json({ client, programme: null, decisions: [] });
  const rows = await db.select({ prescriptionId: ptExercisePrescriptions.id, exerciseName: ptExercises.name, pattern: ptExercises.movementPattern, sets: ptExercisePrescriptions.sets, repsMin: ptExercisePrescriptions.repsMin, repsMax: ptExercisePrescriptions.repsMax, intensityValue: ptExercisePrescriptions.intensityValue, progressionRule: ptExercisePrescriptions.progressionRule }).from(ptExercisePrescriptions).innerJoin(ptSessions, eq(ptSessions.id, ptExercisePrescriptions.sessionId)).innerJoin(ptProgrammeWeeks, eq(ptProgrammeWeeks.id, ptSessions.programmeWeekId)).innerJoin(ptProgrammes, eq(ptProgrammes.id, ptProgrammeWeeks.programmeId)).innerJoin(ptExercises, eq(ptExercises.id, ptExercisePrescriptions.exerciseId)).where(eq(ptProgrammes.id, programme.id));
  const prescriptionIds = rows.map((row) => row.prescriptionId);
  const resultRows = prescriptionIds.length ? await db.select({ prescriptionId: ptWorkoutResultSets.prescriptionId, actualReps: ptWorkoutResultSets.actualReps, actualLoadKg: ptWorkoutResultSets.actualLoadKg, actualRir: ptWorkoutResultSets.actualRir, techniqueAcceptable: ptWorkoutResultSets.techniqueAcceptable, painReported: ptWorkoutResultSets.painReported, scheduledDate: ptWorkoutResults.scheduledDate }).from(ptWorkoutResultSets).innerJoin(ptWorkoutResults, eq(ptWorkoutResults.id, ptWorkoutResultSets.workoutResultId)).where(and(eq(ptWorkoutResults.clientId, client.id), inArray(ptWorkoutResultSets.prescriptionId, prescriptionIds))).orderBy(desc(ptWorkoutResults.scheduledDate)) : [];
  const decisions = rows.map((row) => {
    const latestDate = resultRows.find((result) => result.prescriptionId === row.prescriptionId)?.scheduledDate;
    const completed = resultRows.filter((result) => result.prescriptionId === row.prescriptionId && result.scheduledDate === latestDate).filter((result) => result.actualReps !== null).map((result) => ({ reps: result.actualReps ?? 0, rir: result.actualRir ?? undefined, techniqueAcceptable: result.techniqueAcceptable, painReported: result.painReported }));
    const targetRir = Number(row.intensityValue.match(/(\d+)\s*RIR/i)?.[1] ?? 2);
    const loadKg = resultRows.find((result) => result.prescriptionId === row.prescriptionId && result.scheduledDate === latestDate)?.actualLoadKg ?? undefined;
    const decision = completed.length ? evaluateProgression({ prescribedSets: row.sets, repsMin: row.repsMin ?? 1, repsMax: row.repsMax ?? row.repsMin ?? 1, targetRir, loadKg: loadKg ?? undefined, completed }) : null;
    return { prescriptionId: row.prescriptionId, exerciseName: row.exerciseName, pattern: row.pattern, prescription: `${row.sets} × ${row.repsMin ?? "—"}${row.repsMax && row.repsMax !== row.repsMin ? `–${row.repsMax}` : ""}`, intensityValue: row.intensityValue, progressionRule: row.progressionRule, lastDate: latestDate ?? null, decision };
  });
  return NextResponse.json({ client, programme, decisions });
}
