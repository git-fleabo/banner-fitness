import { NextResponse } from "next/server";

import { getAccountAccess } from "@/lib/authorization/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const access = await getAccountAccess();
  if (access.state === "unauthenticated" || access.state === "unprovisioned") return NextResponse.json({ state: access.state }, { status: 401 });
  if (access.state !== "active" || access.account.role !== "owner") return NextResponse.json({ state: "blocked" }, { status: 403 });
  return NextResponse.json({ state: "active", displayName: access.account.displayName });
}
