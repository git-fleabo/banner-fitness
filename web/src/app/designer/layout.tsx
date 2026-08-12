import { redirect } from "next/navigation";

import { getAccountAccess } from "@/lib/authorization/server";

export const dynamic = "force-dynamic";

export default async function DesignerLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const access = await getAccountAccess();
  if (access.state === "unauthenticated" || access.state === "unprovisioned") redirect("/auth/sign-in?next=/designer");
  if (access.state !== "active" || !["owner", "pt"].includes(access.account.role)) redirect("/learn");
  return children;
}
