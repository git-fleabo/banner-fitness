import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth/server";

const authMiddleware = auth.middleware({ loginUrl: "/auth/sign-in" });

export default function proxy(request: NextRequest) {
  // Server Actions run their own account and content authorization. Redirecting
  // their POST requests would replace the action payload with the sign-in page.
  if (request.method === "POST" && request.headers.has("next-action")) {
    return NextResponse.next();
  }

  return authMiddleware(request);
}

export const config = {
  matcher: ["/learn/:path*", "/review/:path*", "/owner/:path*", "/account/:path*"],
};
