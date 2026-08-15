import "server-only";

import { and, eq } from "drizzle-orm";

import { auth } from "@/lib/auth/server";
import { getDb } from "@/lib/db/client";
import { getServerEnv } from "@/lib/env";
import { profiles, ptInvitations } from "@/lib/db/schema";

export type AccountAccess =
  | { state: "unauthenticated" }
  | { state: "unprovisioned"; email: string }
  | { state: "blocked" }
  | { state: "active"; account: typeof profiles.$inferSelect };

export async function getAccountAccess(): Promise<AccountAccess> {
  if (getServerEnv().DEV_BYPASS_AUTH) {
    console.warn("!!! DEV_BYPASS_AUTH ENABLED: Neon Auth is bypassed; local development only !!!");
    const db = getDb();
    const [account] = await db
      .insert(profiles)
      .values({
        authUserId: "dev-local-owner",
        email: "dev-local-owner@localhost",
        displayName: "Local Development Owner",
        role: "owner",
        status: "active",
        activatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: profiles.authUserId,
        set: {
          email: "dev-local-owner@localhost",
          displayName: "Local Development Owner",
          role: "owner",
          status: "active",
          activatedAt: new Date(),
          updatedAt: new Date(),
        },
      })
      .returning();

    if (!account) throw new Error("Unable to create the local development owner profile");
    return { state: "active", account };
  }

  const { data: session, error } = await auth.getSession();

  if (error || !session?.user) {
    return { state: "unauthenticated" };
  }

  const db = getDb();
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.authUserId, session.user.id))
    .limit(1);

  if (!profile) {
    const email = session.user.email.toLowerCase();
    const [invitation] = await db
      .select()
      .from(ptInvitations)
      .where(and(eq(ptInvitations.email, email), eq(ptInvitations.status, "pending")))
      .limit(1);
    if (!invitation) return { state: "unprovisioned", email: session.user.email };
    const [claimed] = await db.insert(profiles).values({ authUserId: session.user.id, email, displayName: session.user.name ?? email.split("@")[0], role: "pt", status: "invited", invitedBy: invitation.invitedBy }).returning();
    await db.update(ptInvitations).set({ status: "claimed", claimedAt: new Date(), updatedAt: new Date() }).where(and(eq(ptInvitations.id, invitation.id), eq(ptInvitations.status, "pending")));
    return { state: "active", account: { ...claimed, status: "active", activatedAt: new Date() } };
  }

  if (profile.email.toLowerCase() !== session.user.email.toLowerCase()) {
    return { state: "blocked" };
  }

  if (profile.status === "blocked") {
    return { state: "blocked" };
  }

  if (profile.status === "invited") {
    const [activated] = await db
      .update(profiles)
      .set({ status: "active", activatedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(profiles.authUserId, profile.authUserId), eq(profiles.status, "invited")))
      .returning();

    return { state: "active", account: activated ?? { ...profile, status: "active" } };
  }

  return { state: "active", account: profile };
}
