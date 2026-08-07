import { redirect } from "next/navigation";

import { PrototypeOverview } from "@/components/prototype-overview";
import { getAccountAccess } from "@/lib/authorization/server";
import { listLessonSummaries } from "@/lib/content/repository";
import { listReviewItems } from "@/lib/content/repository";

export const dynamic = "force-dynamic";

export default async function LearnPage() {
  const access = await getAccountAccess();

  if (access.state === "unauthenticated") redirect("/auth/sign-in");
  if (access.state === "unprovisioned") redirect("/auth/sign-in?access=pending");
  if (access.state === "blocked") redirect("/auth/sign-in?access=blocked");

  const [lessons, reviewItems] = await Promise.all([
    listLessonSummaries(access.account.role, access.account.authUserId),
    listReviewItems(access.account.authUserId),
  ]);

  return <PrototypeOverview lessons={lessons} revisionCount={reviewItems.length} ownerPreview={access.account.role === "owner"} />;
}
