import { and, asc, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getAccountAccess } from "@/lib/authorization/server";
import { getDb } from "@/lib/db/client";
import { ptClients, ptGoals, ptProgrammes, ptWorkoutResults } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

function escapeHtml(value: unknown) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

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
  const summary = { adherence, sessionsRecorded: results.length, painReports: results.filter((result) => result.painReported).length, averageSessionRpe: results.length ? Number((results.reduce((sum, result) => sum + (result.sessionRpe ?? 0), 0) / results.filter((result) => result.sessionRpe !== null).length).toFixed(1)) || null : null };
  const payload = { generatedAt: new Date().toISOString(), client, goals, programmes, results, summary };
  const reportBrand = "BANNER FITNESS · PT WORKSPACE";
  if (searchParams.get("format") === "html") {
    const goalRows = goals.map((goal) => `<tr><td>${escapeHtml(goal.priority)}</td><td>${escapeHtml(goal.goalType)}</td><td>${escapeHtml(goal.target || "-")}</td></tr>`).join("");
    const resultRows = results.map((result) => `<tr><td>${escapeHtml(result.scheduledDate)}</td><td>${escapeHtml(result.status)}</td><td>${escapeHtml(result.sessionRpe ?? "-")}</td><td>${result.painReported ? "Yes" : "No"}</td><td>${escapeHtml(result.notes || "-")}</td></tr>`).join("");
    const html = `<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><title>${escapeHtml(client.firstName)} ${escapeHtml(client.lastName)} - Progress report</title><style>body{font-family:Arial,sans-serif;color:#253d3e;max-width:900px;margin:0 auto;padding:44px;background:#fff}header{display:flex;justify-content:space-between;border-bottom:3px solid #1e5d57;padding-bottom:20px;margin-bottom:28px}h1,h2{font-family:Georgia,serif;font-weight:500}h1{font-size:34px;margin:0 0 8px}h2{font-size:20px;border-bottom:1px solid #e5e1d9;padding-bottom:8px;margin-top:30px}.eyebrow{font-size:10px;letter-spacing:.15em;font-weight:700;color:#6a9275}.muted{color:#74847e;font-size:12px}.metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.metric{background:#f2f7f1;padding:15px;border-radius:6px}.metric b{display:block;font:24px Georgia;color:#1e5d57;margin-top:5px}table{width:100%;border-collapse:collapse;font-size:12px}th,td{text-align:left;border-bottom:1px solid #e8e5df;padding:10px 8px}th{font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:#72827b}.print{background:#1e5d57;color:#fff;border:0;padding:10px 15px;border-radius:5px;font-weight:700;cursor:pointer}@media print{body{padding:0}.print{display:none}}</style></head><body><header><div><p class="eyebrow">${reportBrand}</p><h1>${escapeHtml(client.firstName)} ${escapeHtml(client.lastName)}</h1><p class="muted">Progress report generated ${escapeHtml(new Date(payload.generatedAt).toLocaleDateString("en-GB"))}</p></div><button class="print" onclick="window.print()">Print / Save PDF</button></header><section class="metrics"><div class="metric"><span class="muted">Adherence</span><b>${summary.adherence === null ? "-" : `${summary.adherence}%`}</b></div><div class="metric"><span class="muted">Sessions recorded</span><b>${summary.sessionsRecorded}</b></div><div class="metric"><span class="muted">Pain reports</span><b>${summary.painReports}</b></div></section><h2>Goals</h2><table><thead><tr><th>Priority</th><th>Goal</th><th>Target</th></tr></thead><tbody>${goalRows || '<tr><td colspan="3">No goals recorded</td></tr>'}</tbody></table><h2>Programme history</h2><table><thead><tr><th>Programme</th><th>Goal</th><th>Status</th><th>Week</th></tr></thead><tbody>${programmes.map((programme) => `<tr><td>${escapeHtml(programme.name)}</td><td>${escapeHtml(programme.goalSummary)}</td><td>${escapeHtml(programme.status)}</td><td>${programme.currentWeek}/${programme.durationWeeks}</td></tr>`).join("") || '<tr><td colspan="4">No programmes recorded</td></tr>'}</tbody></table><h2>Workout results</h2><table><thead><tr><th>Date</th><th>Status</th><th>Session RPE</th><th>Pain</th><th>Notes</th></tr></thead><tbody>${resultRows || '<tr><td colspan="5">No workout results recorded</td></tr>'}</tbody></table><p class="muted">This report supports PT review and documentation. It is not a medical assessment or diagnosis.</p></body></html>`;
    return new NextResponse(html, { headers: { "content-type": "text/html; charset=utf-8" } });
  }
  return NextResponse.json(payload);
}
