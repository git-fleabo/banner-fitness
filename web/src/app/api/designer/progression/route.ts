import { and, desc, eq, inArray } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { getOwnedClient, isActiveOwner, requireOwner } from "@/lib/authorization/require-owner";
import { getDb } from "@/lib/db/client";
import { evaluateProgression } from "@/lib/pt-programming";
import { ptExercisePrescriptions, ptExercises, ptProgrammeWeeks, ptProgrammes, ptSessions, ptWorkoutResultSets, ptWorkoutResults } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const owner = await requireOwner();
  if (!isActiveOwner(owner)) return owner;
  const clientId = request.nextUrl.searchParams.get("clientId");
  if (!clientId) return NextResponse.json({ error: "clientId is required" }, { status: 400 });
  const db = getDb();
  const client = await getOwnedClient(clientId, owner.authUserId, owner);
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });
  const [programme] = await db.select({ id: ptProgrammes.id, version: ptProgrammes.version, currentWeek: ptProgrammes.currentWeek }).from(ptProgrammes).where(and(eq(ptProgrammes.clientId, client.id), eq(ptProgrammes.ownerProfileId, owner.authUserId))).orderBy(desc(ptProgrammes.updatedAt)).limit(1);
  if (!programme) return NextResponse.json({ client, programme: null, decisions: [] });
  const rows = await db.select({ prescriptionId: ptExercisePrescriptions.id, exerciseName: ptExercises.name, pattern: ptExercises.movementPattern, sets: ptExercisePrescriptions.sets, repsMin: ptExercisePrescriptions.repsMin, repsMax: ptExercisePrescriptions.repsMax, intensityValue: ptExercisePrescriptions.intensityValue, progressionRule: ptExercisePrescriptions.progressionRule, weekNumber: ptProgrammeWeeks.weekNumber, dayOfWeek: ptSessions.dayOfWeek, sessionName: ptSessions.name }).from(ptExercisePrescriptions).innerJoin(ptSessions, eq(ptSessions.id, ptExercisePrescriptions.sessionId)).innerJoin(ptProgrammeWeeks, eq(ptProgrammeWeeks.id, ptSessions.programmeWeekId)).innerJoin(ptProgrammes, eq(ptProgrammes.id, ptProgrammeWeeks.programmeId)).innerJoin(ptExercises, eq(ptExercises.id, ptExercisePrescriptions.exerciseId)).where(eq(ptProgrammes.id, programme.id)).orderBy(ptProgrammeWeeks.weekNumber, ptSessions.dayOfWeek, ptExercisePrescriptions.orderIndex);
  const prescriptionIds = rows.map((row) => row.prescriptionId);
  const resultRows = prescriptionIds.length ? await db.select({ prescriptionId: ptWorkoutResultSets.prescriptionId, actualReps: ptWorkoutResultSets.actualReps, actualLoadKg: ptWorkoutResultSets.actualLoadKg, actualRir: ptWorkoutResultSets.actualRir, techniqueAcceptable: ptWorkoutResultSets.techniqueAcceptable, painReported: ptWorkoutResultSets.painReported, scheduledDate: ptWorkoutResults.scheduledDate }).from(ptWorkoutResultSets).innerJoin(ptWorkoutResults, eq(ptWorkoutResults.id, ptWorkoutResultSets.workoutResultId)).where(and(eq(ptWorkoutResults.clientId, client.id), eq(ptWorkoutResults.ownerProfileId, owner.authUserId), inArray(ptWorkoutResultSets.prescriptionId, prescriptionIds))).orderBy(desc(ptWorkoutResults.scheduledDate)) : [];
  const decisions = rows.map((row) => {
    const latestDate = resultRows.find((result) => result.prescriptionId === row.prescriptionId)?.scheduledDate;
    const completed = resultRows.filter((result) => result.prescriptionId === row.prescriptionId && result.scheduledDate === latestDate).filter((result) => result.actualReps !== null).map((result) => ({ reps: result.actualReps ?? 0, rir: result.actualRir ?? undefined, techniqueAcceptable: result.techniqueAcceptable, painReported: result.painReported }));
    const targetRir = Number(row.intensityValue.match(/(\d+)\s*RIR/i)?.[1] ?? 2);
    const loadKg = resultRows.find((result) => result.prescriptionId === row.prescriptionId && result.scheduledDate === latestDate)?.actualLoadKg ?? undefined;
    const decision = completed.length ? evaluateProgression({ prescribedSets: row.sets, repsMin: row.repsMin ?? 1, repsMax: row.repsMax ?? row.repsMin ?? 1, targetRir, loadKg: loadKg ?? undefined, completed }) : null;
    return { prescriptionId: row.prescriptionId, exerciseName: row.exerciseName, pattern: row.pattern, prescription: `${row.sets} × ${row.repsMin ?? "—"}${row.repsMax && row.repsMax !== row.repsMin ? `–${row.repsMax}` : ""}`, intensityValue: row.intensityValue, progressionRule: row.progressionRule, weekNumber: row.weekNumber, dayOfWeek: row.dayOfWeek, sessionName: row.sessionName, lastDate: latestDate ?? null, decision };
  });
  return NextResponse.json({ client, programme, decisions });
}
