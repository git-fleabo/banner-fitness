import { and, asc, desc, eq, gte, lte } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { designerOwnership, isActiveOwner, requireOwner } from "@/lib/authorization/require-owner";
import { getDb } from "@/lib/db/client";
import { ptClients, ptExercisePrescriptions, ptExercises, ptWorkoutResultSets, ptWorkoutResults, ptSessions } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const owner = await requireOwner();
  if (!isActiveOwner(owner)) return owner;
  const clientId = request.nextUrl.searchParams.get("clientId");
  if (!clientId) return NextResponse.json({ error: "clientId is required" }, { status: 400 });
  const db = getDb();
  const fromDate = request.nextUrl.searchParams.get("from");
  const toDate = request.nextUrl.searchParams.get("to");
  const dateFilters = [fromDate ? gte(ptWorkoutResults.scheduledDate, fromDate) : undefined, toDate ? lte(ptWorkoutResults.scheduledDate, toDate) : undefined].filter((filter): filter is ReturnType<typeof gte> => Boolean(filter));
  const [client] = await db.select({ id: ptClients.id, firstName: ptClients.firstName, lastName: ptClients.lastName }).from(ptClients).where(and(eq(ptClients.id, clientId), designerOwnership(ptClients.ownerProfileId, owner))).limit(1);
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  const results = await db.select({ id: ptWorkoutResults.id, scheduledDate: ptWorkoutResults.scheduledDate, sessionName: ptSessions.name, status: ptWorkoutResults.status, sessionRpe: ptWorkoutResults.sessionRpe, energy: ptWorkoutResults.energy, painReported: ptWorkoutResults.painReported, durationMinutes: ptWorkoutResults.durationMinutes, volumeLoadKg: ptWorkoutResults.volumeLoadKg, repetitionLoad: ptWorkoutResults.repetitionLoad, averageRpe: ptWorkoutResults.averageRpe, averageRir: ptWorkoutResults.averageRir, notes: ptWorkoutResults.notes }).from(ptWorkoutResults).leftJoin(ptSessions, eq(ptSessions.id, ptWorkoutResults.sessionId)).where(and(eq(ptWorkoutResults.clientId, client.id), eq(ptWorkoutResults.ownerProfileId, owner.authUserId), ...dateFilters)).orderBy(desc(ptWorkoutResults.scheduledDate), desc(ptWorkoutResults.createdAt)).limit(100);
  const setRows = await db.select({ scheduledDate: ptWorkoutResults.scheduledDate, exerciseName: ptExercises.name, pattern: ptExercises.movementPattern, actualReps: ptWorkoutResultSets.actualReps, actualLoadKg: ptWorkoutResultSets.actualLoadKg, actualRpe: ptWorkoutResultSets.actualRpe, actualRir: ptWorkoutResultSets.actualRir }).from(ptWorkoutResultSets).innerJoin(ptWorkoutResults, eq(ptWorkoutResults.id, ptWorkoutResultSets.workoutResultId)).innerJoin(ptExercisePrescriptions, eq(ptExercisePrescriptions.id, ptWorkoutResultSets.prescriptionId)).innerJoin(ptExercises, eq(ptExercises.id, ptExercisePrescriptions.exerciseId)).where(and(eq(ptWorkoutResults.clientId, client.id), eq(ptWorkoutResults.ownerProfileId, owner.authUserId), ...dateFilters)).orderBy(asc(ptWorkoutResults.scheduledDate));

  const exerciseMap = new Map<string, { exerciseName: string; pattern: string; sessions: Set<string>; totalReps: number; volumeLoadKg: number; bestLoadKg: number; latestLoadKg: number; latestDate: string | null; trend: Map<string, { reps: number; volumeLoadKg: number; bestLoadKg: number }> }>();
  for (const row of setRows) {
    const current = exerciseMap.get(row.exerciseName) ?? { exerciseName: row.exerciseName, pattern: row.pattern, sessions: new Set<string>(), totalReps: 0, volumeLoadKg: 0, bestLoadKg: 0, latestLoadKg: 0, latestDate: null, trend: new Map<string, { reps: number; volumeLoadKg: number; bestLoadKg: number }>() };
    const reps = row.actualReps ?? 0;
    const load = row.actualLoadKg ?? 0;
    current.sessions.add(row.scheduledDate);
    current.totalReps += reps;
    current.volumeLoadKg += reps * load;
    current.bestLoadKg = Math.max(current.bestLoadKg, load);
    const day = current.trend.get(row.scheduledDate) ?? { reps: 0, volumeLoadKg: 0, bestLoadKg: 0 };
    day.reps += reps; day.volumeLoadKg += reps * load; day.bestLoadKg = Math.max(day.bestLoadKg, load); current.trend.set(row.scheduledDate, day);
    if (!current.latestDate || row.scheduledDate >= current.latestDate) { current.latestDate = row.scheduledDate; current.latestLoadKg = load; }
    exerciseMap.set(row.exerciseName, current);
  }

  const totalSessions = results.length;
  const completedSessions = results.filter((result) => result.status === "completed").length;
  const rpeValues = results.flatMap((result) => result.sessionRpe === null ? [] : [result.sessionRpe]);
  return NextResponse.json({
    client,
    summary: {
      totalSessions,
      completedSessions,
      adherence: totalSessions ? Math.round((completedSessions / totalSessions) * 100) : null,
      totalVolumeLoadKg: results.reduce((total, result) => total + (result.volumeLoadKg ?? 0), 0),
      totalRepetitionLoad: results.reduce((total, result) => total + (result.repetitionLoad ?? 0), 0),
      averageSessionRpe: rpeValues.length ? Math.round(rpeValues.reduce((total, value) => total + value, 0) / rpeValues.length) : null,
      painReports: results.filter((result) => result.painReported).length,
    },
    trend: results.slice().reverse().map((result) => ({ date: result.scheduledDate, label: result.sessionName ?? "Workout", status: result.status, volumeLoadKg: result.volumeLoadKg ?? 0, repetitionLoad: result.repetitionLoad ?? 0, sessionRpe: result.sessionRpe, averageRpe: result.averageRpe, averageRir: result.averageRir })),
    exercises: Array.from(exerciseMap.values()).map((exercise) => ({ ...exercise, sessions: exercise.sessions.size, trend: Array.from(exercise.trend.entries()).map(([date, values]) => ({ date, ...values })) })),
    results: results.map(({ id, scheduledDate, sessionName, status, sessionRpe, energy, painReported, durationMinutes, volumeLoadKg, repetitionLoad, averageRpe, averageRir, notes }) => ({ id, scheduledDate, sessionName, status, sessionRpe, energy, painReported, durationMinutes, volumeLoadKg, repetitionLoad, averageRpe, averageRir, notes })),
  });
}
