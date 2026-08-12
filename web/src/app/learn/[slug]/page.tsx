import { notFound, redirect } from "next/navigation";

import { LessonShell } from "@/components/lesson-shell";
import { getAccountAccess } from "@/lib/authorization/server";
import { getLessonBySlug, getLessonResumeState } from "@/lib/content/repository";

export const dynamic = "force-dynamic";

export default async function LessonPage({ params, searchParams }: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const access = await getAccountAccess();
  if (access.state === "unauthenticated") redirect("/auth/sign-in");
  if (access.state === "unprovisioned") redirect("/auth/sign-in?access=pending");
  if (access.state === "blocked") redirect("/auth/sign-in?access=blocked");

  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const [lesson, resumeState] = await Promise.all([
    getLessonBySlug(slug, access.account.role === "owner" ? "owner" : "learner"),
    getLessonResumeState(slug, access.account.authUserId),
  ]);
  if (!lesson) notFound();

  const requestedStep = typeof query.step === "string" ? query.step : undefined;
  const revisionQuestionStableKey = typeof query.revisionQuestion === "string" ? query.revisionQuestion : undefined;
  const revisionId = typeof query.revisionId === "string" ? query.revisionId : undefined;
  return <LessonShell lesson={lesson} requestedStep={requestedStep} resumeState={resumeState} revisionQuestionStableKey={revisionQuestionStableKey} revisionId={revisionId} ownerPreview={access.account.role === "owner"} />;
}
