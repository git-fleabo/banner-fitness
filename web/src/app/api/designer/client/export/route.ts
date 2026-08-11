import { NextRequest } from "next/server";

import { GET as getClient } from "@/app/api/designer/client/route";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const response = await getClient(request);
  if (!response.ok) return response;

  const clientId = request.nextUrl.searchParams.get("clientId") ?? "client";
  const body = await response.text();
  return new Response(body, {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="banner-fitness-client-${clientId}.json"`,
      "cache-control": "private, no-store",
    },
  });
}
