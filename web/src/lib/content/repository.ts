import "server-only";

import { and, asc, desc, eq } from "drizzle-orm";

import { getDb } from "@/lib/db/client";
import { learningObjectContentSchema } from "@/lib/content/contracts";
import {
  curriculumTopics,
  learningObjects,
  learningObjectVersions,
  lessons,
  lessonVersionObjects,
  lessonVersions,
} from "@/lib/db/schema";

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

export type LessonPageData = LearningLessonSummary & {
  objects: Array<{
    stableKey: string;
    type: "hook" | "explain" | "explore" | "apply" | "check" | "close" | "visual" | "structured_text";
    title: string;
    content: ReturnType<typeof learningObjectContentSchema.parse>;
    structuredText: string | null;
    position: number;
  }>;
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

export async function getLessonBySlug(slug: string, role: "owner" | "learner"): Promise<LessonPageData | null> {
  const db = getDb();
  const versionRows = await db
    .select({
      lessonId: lessons.id,
      order: lessons.recommendedOrder,
      slug: lessons.slug,
      title: lessonVersions.title,
      outcome: lessonVersions.outcome,
      durationMinutes: lessonVersions.estimatedMinutes,
      mappingStatus: curriculumTopics.mappingStatus,
      origymModule: curriculumTopics.origymModule,
      status: lessonVersions.status,
      versionNumber: lessonVersions.versionNumber,
      lessonVersionId: lessonVersions.id,
    })
    .from(lessons)
    .innerJoin(curriculumTopics, eq(lessons.curriculumTopicId, curriculumTopics.id))
    .innerJoin(lessonVersions, eq(lessonVersions.lessonId, lessons.id))
    .where(and(eq(lessons.slug, slug), ...(role === "learner" ? [eq(lessonVersions.status, "published")] : [])))
    .orderBy(desc(lessonVersions.versionNumber))
    .limit(1);

  const version = versionRows[0];
  if (!version) return null;

  const objectRows = await db
    .select({
      stableKey: learningObjects.stableKey,
      type: learningObjects.type,
      title: learningObjectVersions.title,
      content: learningObjectVersions.content,
      structuredText: learningObjectVersions.structuredText,
      position: lessonVersionObjects.position,
    })
    .from(lessonVersionObjects)
    .innerJoin(learningObjectVersions, eq(lessonVersionObjects.learningObjectVersionId, learningObjectVersions.id))
    .innerJoin(learningObjects, eq(learningObjectVersions.learningObjectId, learningObjects.id))
    .where(eq(lessonVersionObjects.lessonVersionId, version.lessonVersionId))
    .orderBy(asc(lessonVersionObjects.position));

  return {
    order: version.order,
    slug: version.slug,
    title: version.title,
    outcome: version.outcome,
    durationMinutes: version.durationMinutes,
    mapping: `${version.origymModule} · ${version.mappingStatus.replaceAll("_", " ")}`,
    status: version.status,
    versionNumber: version.versionNumber,
    objects: objectRows.map((item) => ({
      ...item,
      title: item.title ?? "Untitled learning step",
      content: learningObjectContentSchema.parse(item.content),
    })),
  };
}
