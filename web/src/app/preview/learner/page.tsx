import { notFound } from "next/navigation";

import { LearnerPreview } from "@/components/learner-preview";
import { getLessonBySlug, listLessonSummaries } from "@/lib/content/repository";
import { PREVIEW_LEARNER_ID, requireLearnerPreview } from "@/lib/preview/learner-preview";

export const dynamic = "force-dynamic";

export default async function LearnerPreviewPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  requireLearnerPreview(token);
  const lessons = await listLessonSummaries("owner", PREVIEW_LEARNER_ID);
  const pages = (await Promise.all(lessons.map((lesson) => getLessonBySlug(lesson.slug, "owner")))).filter((lesson): lesson is NonNullable<typeof lesson> => Boolean(lesson));
  if (pages.length === 0) notFound();
  return <LearnerPreview lessons={lessons} pages={pages} />;
}
