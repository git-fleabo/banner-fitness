import "server-only";

import { asc, desc, eq } from "drizzle-orm";

import { getDb } from "@/lib/db/client";
import { curriculumTopics, lessons, lessonVersions } from "@/lib/db/schema";

export type LearningLessonSummary = {
  order: number;
  slug: string;
  title: string;
  outcome: string;
  durationMinutes: number;
  mapping: string;
  status: "draft" | "in_review" | "approved" | "published" | "retired";
  versionNumber: number;
};

export async function listLessonSummaries(role: "owner" | "learner"): Promise<LearningLessonSummary[]> {
  const db = getDb();
  const query = db
    .select({
      order: lessons.recommendedOrder,
      slug: lessons.slug,
      title: lessonVersions.title,
      outcome: lessonVersions.outcome,
      durationMinutes: lessonVersions.estimatedMinutes,
      mappingStatus: curriculumTopics.mappingStatus,
      origymModule: curriculumTopics.origymModule,
      status: lessonVersions.status,
      versionNumber: lessonVersions.versionNumber,
    })
    .from(lessons)
    .innerJoin(curriculumTopics, eq(lessons.curriculumTopicId, curriculumTopics.id))
    .innerJoin(lessonVersions, eq(lessonVersions.lessonId, lessons.id))
    .orderBy(asc(lessons.recommendedOrder), desc(lessonVersions.versionNumber));

  const rows = role === "learner"
    ? await query.where(eq(lessonVersions.status, "published"))
    : await query;

  const latestBySlug = new Map<string, (typeof rows)[number]>();
  for (const row of rows) {
    if (!latestBySlug.has(row.slug)) latestBySlug.set(row.slug, row);
  }

  return [...latestBySlug.values()].map((row) => ({
    order: row.order,
    slug: row.slug,
    title: row.title,
    outcome: row.outcome,
    durationMinutes: row.durationMinutes,
    mapping: `${row.origymModule} · ${row.mappingStatus.replaceAll("_", " ")}`,
    status: row.status,
    versionNumber: row.versionNumber,
  }));
}
