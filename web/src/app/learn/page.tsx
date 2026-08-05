import { redirect } from "next/navigation";

import { PrototypeOverview } from "@/components/prototype-overview";
import { getAccountAccess } from "@/lib/authorization/server";
import { listLessonSummaries } from "@/lib/content/repository";

export const dynamic = "force-dynamic";

export default async function LearnPage() {
  const access = await getAccountAccess();

  if (access.state === "unauthenticated") redirect("/auth/sign-in");
  if (access.state === "unprovisioned") redirect("/auth/sign-in?access=pending");
  if (access.state === "blocked") redirect("/auth/sign-in?access=blocked");

  const lessons = await listLessonSummaries(access.account.role);

  return <PrototypeOverview lessons={lessons} ownerPreview={access.account.role === "owner"} />;
}
