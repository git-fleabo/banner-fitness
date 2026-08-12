import { and, asc, eq, or } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { isActiveOwner, requireWorkspaceOwner } from "@/lib/authorization/require-owner";
import { getDb } from "@/lib/db/client";
import { profiles, ptClients, ptInvitations } from "@/lib/db/schema";

const inviteSchema = z.object({ email: z.string().trim().email().max(320) });
const statusSchema = z.object({ memberId: z.string().min(1), status: z.enum(["active", "blocked"]) });
const assignmentSchema = z.object({ clientId: z.string().uuid(), ownerProfileId: z.string().min(1) });

export async function GET() {
  const owner = await requireWorkspaceOwner();
  if (!isActiveOwner(owner)) return owner;
  const db = getDb();
  const members = await db.select({ id: profiles.authUserId, email: profiles.email, displayName: profiles.displayName, role: profiles.role, status: profiles.status }).from(profiles).where(or(eq(profiles.role, "owner"), eq(profiles.role, "pt"))).orderBy(asc(profiles.displayName), asc(profiles.email));
  const clients = await db.select({ id: ptClients.id, firstName: ptClients.firstName, lastName: ptClients.lastName, ownerProfileId: ptClients.ownerProfileId }).from(ptClients).orderBy(asc(ptClients.lastName), asc(ptClients.firstName));
  const invitations = await db.select({ id: ptInvitations.id, email: ptInvitations.email, status: ptInvitations.status, createdAt: ptInvitations.createdAt }).from(ptInvitations).where(eq(ptInvitations.status, "pending")).orderBy(asc(ptInvitations.createdAt));
  return NextResponse.json({ members, clients, invitations });
}

export async function POST(request: NextRequest) {
  const owner = await requireWorkspaceOwner();
  if (!isActiveOwner(owner)) return owner;
  const parsed = inviteSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid PT email address" }, { status: 400 });
  const email = parsed.data.email.toLowerCase();
  const db = getDb();
  const [existingProfile] = await db.select({ id: profiles.authUserId, role: profiles.role }).from(profiles).where(eq(profiles.email, email)).limit(1);
  if (existingProfile) return NextResponse.json({ error: existingProfile.role === "pt" ? "This email already has a PT account" : "This email already belongs to an existing account" }, { status: 409 });
  const [existingInvite] = await db.select({ id: ptInvitations.id }).from(ptInvitations).where(and(eq(ptInvitations.email, email), eq(ptInvitations.status, "pending"))).limit(1);
  if (existingInvite) return NextResponse.json({ error: "A pending invitation already exists for this email" }, { status: 409 });
  const [invitation] = await db.insert(ptInvitations).values({ email, invitedBy: owner.authUserId }).returning({ id: ptInvitations.id, email: ptInvitations.email, status: ptInvitations.status });
  return NextResponse.json({ invitation }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const owner = await requireWorkspaceOwner();
  if (!isActiveOwner(owner)) return owner;
  const body = await request.json().catch(() => null);
  const db = getDb();
  const status = statusSchema.safeParse(body);
  if (status.success) {
    if (status.data.memberId === owner.authUserId) return NextResponse.json({ error: "The workspace owner cannot be blocked" }, { status: 400 });
    const [member] = await db.update(profiles).set({ status: status.data.status, updatedAt: new Date() }).where(and(eq(profiles.authUserId, status.data.memberId), eq(profiles.role, "pt"))).returning({ id: profiles.authUserId, status: profiles.status });
    return member ? NextResponse.json({ member }) : NextResponse.json({ error: "PT account not found" }, { status: 404 });
  }
  const assignment = assignmentSchema.safeParse(body);
  if (!assignment.success) return NextResponse.json({ error: "Invalid team update" }, { status: 400 });
  const [assignee] = await db.select({ id: profiles.authUserId }).from(profiles).where(and(eq(profiles.authUserId, assignment.data.ownerProfileId), or(eq(profiles.role, "owner"), eq(profiles.role, "pt")), eq(profiles.status, "active"))).limit(1);
  if (!assignee) return NextResponse.json({ error: "Choose an active owner or PT" }, { status: 400 });
  const [client] = await db.update(ptClients).set({ ownerProfileId: assignee.id, updatedAt: new Date() }).where(eq(ptClients.id, assignment.data.clientId)).returning({ id: ptClients.id, ownerProfileId: ptClients.ownerProfileId });
  return client ? NextResponse.json({ client }) : NextResponse.json({ error: "Client not found" }, { status: 404 });
}
