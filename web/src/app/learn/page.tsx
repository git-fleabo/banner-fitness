import { redirect } from "next/navigation";
import Link from "next/link";

import { PrototypeOverview } from "@/components/prototype-overview";
import { getAccountAccess } from "@/lib/authorization/server";
import { listLessonSummaries } from "@/lib/content/repository";
import { listReviewItems } from "@/lib/content/repository";

export const dynamic = "force-dynamic";

function LoadFailure() {
  return (
    <main id="main-content" style={{ maxWidth: "42rem", margin: "0 auto", padding: "4rem 1.5rem" }}>
      <p>Human Movement Studio</p>
      <h1>We couldn’t load your learning path</h1>
      <p>Try refreshing this page. Your learner account and saved progress are not changed by this error.</p>
      <Link href="/learn">Try again</Link>
    </main>
  );
}

export default async function LearnPage() {
  let access: Awaited<ReturnType<typeof getAccountAccess>>;
  try {
    access = await getAccountAccess();
  } catch (error) {
    console.error("[learner-dashboard] access-load-failed", error instanceof Error ? error.message : String(error));
    return <LoadFailure />;
  }

  if (access.state === "unauthenticated") redirect("/auth/sign-in");
  if (access.state === "unprovisioned") redirect("/auth/sign-in?access=pending");
  if (access.state === "blocked") redirect("/auth/sign-in?access=blocked");

  let lessons: Awaited<ReturnType<typeof listLessonSummaries>>;
  let reviewItems: Awaited<ReturnType<typeof listReviewItems>>;
  try {
    [lessons, reviewItems] = await Promise.all([
      listLessonSummaries(access.account.role === "owner" ? "owner" : "learner", access.account.authUserId),
      listReviewItems(access.account.authUserId),
    ]);
  } catch (error) {
    console.error("[learner-dashboard] content-load-failed", error instanceof Error ? error.message : String(error));
    return <LoadFailure />;
  }

  return <PrototypeOverview lessons={lessons} revisionCount={reviewItems.length} dueRevisionCount={reviewItems.filter((item) => item.isDue).length} ownerPreview={access.account.role === "owner"} />;
}
