import { and, asc, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getAccountAccess } from "@/lib/authorization/server";
import { getDb } from "@/lib/db/client";
import { ptClients, ptGoals, ptProgrammes, ptWorkoutResults } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const access = await getAccountAccess();
  if (access.state !== "active" || access.account.role !== "owner") return NextResponse.json({ error: "PT owner access required" }, { status: 403 });
  const searchParams = new URL(request.url).searchParams;
  const clientId = searchParams.get("clientId");
  const clientName = searchParams.get("clientName")?.trim();
  if (!clientId && !clientName) return NextResponse.json({ error: "clientId or clientName is required" }, { status: 400 });
  const db = getDb();
  const [firstName, ...lastParts] = (clientName ?? "").split(" ");
  const [client] = await db.select({ id: ptClients.id, firstName: ptClients.firstName, lastName: ptClients.lastName, sessionDurationMinutes: ptClients.sessionDurationMinutes, preferredDays: ptClients.preferredDays }).from(ptClients).where(and(eq(ptClients.ownerProfileId, access.account.authUserId), clientId ? eq(ptClients.id, clientId) : and(eq(ptClients.firstName, firstName), eq(ptClients.lastName, lastParts.join(" ") || "Client")))).limit(1);
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });
  const goals = await db.select({ goalType: ptGoals.goalType, priority: ptGoals.priority, target: ptGoals.target, metric: ptGoals.metric }).from(ptGoals).where(eq(ptGoals.clientId, client.id)).orderBy(asc(ptGoals.priority));
  const programmes = await db.select({ name: ptProgrammes.name, goalSummary: ptProgrammes.goalSummary, status: ptProgrammes.status, currentWeek: ptProgrammes.currentWeek, durationWeeks: ptProgrammes.durationWeeks, updatedAt: ptProgrammes.updatedAt }).from(ptProgrammes).where(and(eq(ptProgrammes.clientId, client.id), eq(ptProgrammes.ownerProfileId, access.account.authUserId))).orderBy(desc(ptProgrammes.updatedAt)).limit(5);
  const results = await db.select({ scheduledDate: ptWorkoutResults.scheduledDate, status: ptWorkoutResults.status, sessionRpe: ptWorkoutResults.sessionRpe, energy: ptWorkoutResults.energy, painReported: ptWorkoutResults.painReported, durationMinutes: ptWorkoutResults.durationMinutes, notes: ptWorkoutResults.notes }).from(ptWorkoutResults).where(and(eq(ptWorkoutResults.clientId, client.id), eq(ptWorkoutResults.ownerProfileId, access.account.authUserId))).orderBy(desc(ptWorkoutResults.scheduledDate)).limit(30);
  const completed = results.filter((result) => result.status === "completed" || result.status === "partial").length;
  const adherence = results.length ? Math.round((completed / results.length) * 100) : null;
  return NextResponse.json({ generatedAt: new Date().toISOString(), client, goals, programmes, results, summary: { adherence, sessionsRecorded: results.length, painReports: results.filter((result) => result.painReported).length, averageSessionRpe: results.length ? Number((results.reduce((sum, result) => sum + (result.sessionRpe ?? 0), 0) / results.filter((result) => result.sessionRpe !== null).length).toFixed(1)) || null : null } });
}
