import { auth } from "@/lib/auth/server";

export default auth.middleware({ loginUrl: "/auth/sign-in" });

export const config = {
  matcher: ["/learn/:path*", "/review/:path*", "/owner/:path*", "/account/:path*"],
};
