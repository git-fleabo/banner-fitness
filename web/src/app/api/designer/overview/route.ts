import { and, count, desc, eq, gte } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getAccountAccess } from "@/lib/authorization/server";
import { getDb } from "@/lib/db/client";
import { ptClients, ptProgrammes, ptWorkoutResults } from "@/lib/db/schema";

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
  const programmes = await db.select({ id: ptProgrammes.id, clientId: ptProgrammes.clientId, name: ptProgrammes.name, goalSummary: ptProgrammes.goalSummary, status: ptProgrammes.status, currentWeek: ptProgrammes.currentWeek, durationWeeks: ptProgrammes.durationWeeks, updatedAt: ptProgrammes.updatedAt }).from(ptProgrammes).where(eq(ptProgrammes.ownerProfileId, access.account.authUserId)).orderBy(desc(ptProgrammes.updatedAt)).limit(20);
  return NextResponse.json({ counts: { clients: Number(clientCount?.value ?? 0), draftProgrammes: Number(programmeCount?.value ?? 0), adherence: totalResults ? Math.round((completedResults / totalResults) * 100) : null }, clients, programmes });
}
