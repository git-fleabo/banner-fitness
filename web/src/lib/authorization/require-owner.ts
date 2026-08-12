import { NextResponse } from "next/server";

import { getAccountAccess, type AccountAccess } from "@/lib/authorization/server";
import { getDb } from "@/lib/db/client";
import { ptClients } from "@/lib/db/schema";
import { and, eq, isNotNull } from "drizzle-orm";

export const OWNER_ACCESS_ERROR = "PT designer access required";

export type ActiveOwner = Extract<AccountAccess, { state: "active" }>['account'];

export async function requireOwner(): Promise<ActiveOwner | NextResponse> {
  const access = await getAccountAccess();
  if (access.state === "unauthenticated") return NextResponse.json({ error: OWNER_ACCESS_ERROR }, { status: 401 });
  if (access.state !== "active" || !["owner", "pt"].includes(access.account.role)) return NextResponse.json({ error: OWNER_ACCESS_ERROR }, { status: 403 });
  return access.account;
}

export function isActiveOwner(value: ActiveOwner | NextResponse): value is ActiveOwner {
  return !(value instanceof NextResponse);
}

/** Owners administer the whole PT workspace; PT accounts see only assigned rows. */
export function designerOwnership(column: Parameters<typeof isNotNull>[0], account: ActiveOwner) {
  return account.role === "owner" ? isNotNull(column) : eq(column, account.authUserId);
}

export async function getOwnedClient(clientId: string, ownerProfileId: string, account?: ActiveOwner) {
  const [client] = await getDb().select().from(ptClients).where(and(eq(ptClients.id, clientId), account ? designerOwnership(ptClients.ownerProfileId, account) : eq(ptClients.ownerProfileId, ownerProfileId))).limit(1);
  return client ?? null;
}
