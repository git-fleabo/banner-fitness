import { NextRequest, NextResponse } from "next/server";

import { generateCaseStudyDraftAction } from "@/app/designer/actions";
import { getAccountAccess } from "@/lib/authorization/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const access = await getAccountAccess();
  if (access.state !== "active" || access.account.role !== "owner") return NextResponse.json({ error: "PT owner access required" }, { status: 403 });
  try {
    const body = await request.json() as { clientId?: unknown };
    if (typeof body.clientId !== "string") return NextResponse.json({ error: "clientId is required" }, { status: 400 });
    const result = await generateCaseStudyDraftAction({ clientId: body.clientId });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Case-study draft could not be generated" }, { status: 400 });
  }
}
