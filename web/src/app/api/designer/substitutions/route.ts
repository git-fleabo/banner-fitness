import { and, asc, desc, eq, isNull, or } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { isActiveOwner, requireOwner } from "@/lib/authorization/require-owner";
import { getDb } from "@/lib/db/client";
import { ptClients, ptExercises, ptLocations } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

const list = (value: unknown) => Array.isArray(value) ? value.map(String) : [];

export async function GET(request: NextRequest) {
  const owner = await requireOwner();
  if (!isActiveOwner(owner)) return owner;
  const clientId = request.nextUrl.searchParams.get("clientId");
  const exerciseId = request.nextUrl.searchParams.get("exerciseId");
  if (!clientId || !exerciseId) return NextResponse.json({ error: "clientId and exerciseId are required" }, { status: 400 });
  const db = getDb();
  const [client] = await db.select({ id: ptClients.id }).from(ptClients).where(and(eq(ptClients.id, clientId), eq(ptClients.ownerProfileId, owner.authUserId))).limit(1);
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });
  const [source] = await db.select({ id: ptExercises.id, name: ptExercises.name, pattern: ptExercises.movementPattern, target: ptExercises.primaryMuscles, difficulty: ptExercises.difficulty, equipment: ptExercises.equipment }).from(ptExercises).where(and(eq(ptExercises.id, exerciseId), or(isNull(ptExercises.ownerProfileId), eq(ptExercises.ownerProfileId, owner.authUserId)))).limit(1);
  if (!source) return NextResponse.json({ error: "Exercise not found" }, { status: 404 });
  const [location] = await db.select({ equipment: ptLocations.equipment }).from(ptLocations).where(eq(ptLocations.clientId, client.id)).orderBy(desc(ptLocations.updatedAt)).limit(1);
  const available = list(location?.equipment);
  const library = await db.select({ id: ptExercises.id, name: ptExercises.name, pattern: ptExercises.movementPattern, target: ptExercises.primaryMuscles, secondary: ptExercises.secondaryMuscles, equipment: ptExercises.equipment, difficulty: ptExercises.difficulty, complexity: ptExercises.technicalComplexity, alternatives: ptExercises.alternatives, regressions: ptExercises.regressions, progressions: ptExercises.progressions }).from(ptExercises).where(or(isNull(ptExercises.ownerProfileId), eq(ptExercises.ownerProfileId, owner.authUserId))).orderBy(asc(ptExercises.name));
  const sourceTargets = new Set(list(source.target).map((item) => item.toLowerCase()));
  const candidates = library.filter((item) => item.id !== source.id).map((item) => { const itemTargets = list(item.target); const overlap = itemTargets.filter((target) => sourceTargets.has(target.toLowerCase())).length; const patternMatch = item.pattern.toLowerCase() === source.pattern.toLowerCase(); const availableMatch = !available.length || list(item.equipment).some((required) => available.some((owned) => owned.toLowerCase().includes(required.toLowerCase()) || required.toLowerCase().includes(owned.toLowerCase()))); return { item, score: overlap * 3 + (patternMatch ? 5 : 0) + (availableMatch ? 3 : 0), availableMatch }; }).filter((candidate) => candidate.availableMatch).sort((a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name)).slice(0, 8).map(({ item }) => ({ ...item, target: list(item.target), secondary: list(item.secondary), equipment: list(item.equipment) }));
  return NextResponse.json({ source: { ...source, target: list(source.target), equipment: list(source.equipment) }, availableEquipment: available, candidates });
}
