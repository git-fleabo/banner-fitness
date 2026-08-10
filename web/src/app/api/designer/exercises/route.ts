import { and, asc, eq, isNull, or } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getAccountAccess } from "@/lib/authorization/server";
import { getDb } from "@/lib/db/client";
import { ptExercises } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const access = await getAccountAccess();
  if (access.state !== "active" || access.account.role !== "owner") return NextResponse.json({ error: "PT owner access required" }, { status: 403 });
  const query = new URL(request.url).searchParams.get("q")?.trim().toLowerCase() ?? "";
  const db = getDb();
  const rows = await db.select({ id: ptExercises.id, name: ptExercises.name, pattern: ptExercises.movementPattern, target: ptExercises.primaryMuscles, secondary: ptExercises.secondaryMuscles, equipment: ptExercises.equipment, difficulty: ptExercises.difficulty, complexity: ptExercises.technicalComplexity, suitability: ptExercises.suitability, compound: ptExercises.compound, unilateral: ptExercises.unilateral, tags: ptExercises.tags, regressions: ptExercises.regressions, progressions: ptExercises.progressions, alternatives: ptExercises.alternatives, coachingCues: ptExercises.coachingCues, commonErrors: ptExercises.commonErrors, cautionTags: ptExercises.cautionTags }).from(ptExercises).where(and(or(isNull(ptExercises.ownerProfileId), eq(ptExercises.ownerProfileId, access.account.authUserId)))).orderBy(asc(ptExercises.name));
  const filtered = query ? rows.filter((row) => `${row.name} ${row.pattern} ${JSON.stringify(row.target)} ${JSON.stringify(row.equipment)}`.toLowerCase().includes(query)) : rows;
  return NextResponse.json({ exercises: filtered });
}
