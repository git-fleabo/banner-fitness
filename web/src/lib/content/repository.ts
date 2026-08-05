import "server-only";

import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/lib/db/client";
import {
  feedbackRulesSchema,
  learningObjectContentSchema,
  responseSchema as questionResponseSchema,
  scoringSchema as questionScoringSchema,
} from "@/lib/content/contracts";
import {
  curriculumTopics,
  learningObjects,
  learningObjectVersions,
  learningObjectVersionQuestions,
  lessons,
  lessonProgress,
  lessonVersionObjects,
  lessonVersions,
  questions,
  questionVersions,
  reviewDecisions,
  reviewQueue,
  sourceLinks,
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
  coverageState?: "not_started" | "in_progress" | "covered";
  resumeStep?: string;
};

export type LessonResumeState = {
  stepStableKey: string;
  questionStableKey: string;
  selected: string[];
  submitted: boolean;
  evidenceRecorded: boolean;
  feedbackCategory?: "correct" | "incorrect" | "partly_correct" | "misconception";
};

function parseResumeState(value: unknown): LessonResumeState | null {
  const result = z.object({
    stepStableKey: z.string(),
    questionStableKey: z.string(),
    selected: z.array(z.string()),
    submitted: z.boolean(),
    evidenceRecorded: z.boolean(),
    feedbackCategory: z.enum(["correct", "incorrect", "partly_correct", "misconception"]).optional(),
  }).safeParse(value);
  return result.success ? result.data : null;
}

export type LessonPageData = LearningLessonSummary & {
  objects: Array<{
    stableKey: string;
    type: "hook" | "explain" | "explore" | "apply" | "check" | "close" | "visual" | "structured_text";
    title: string;
    content: ReturnType<typeof learningObjectContentSchema.parse>;
    structuredText: string | null;
    position: number;
    questions: Array<{
      stableKey: string;
      prompt: string;
      response: ReturnType<typeof questionResponseSchema.parse>;
      scoring: ReturnType<typeof questionScoringSchema.parse>;
      feedback: ReturnType<typeof feedbackRulesSchema.parse>;
      position: number;
    }>;
  }>;
};

export async function listLessonSummaries(role: "owner" | "learner", learnerId: string): Promise<LearningLessonSummary[]> {
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
      coverageState: lessonProgress.coverageState,
      resumeState: lessonProgress.resumeState,
    })
    .from(lessons)
    .innerJoin(curriculumTopics, eq(lessons.curriculumTopicId, curriculumTopics.id))
    .innerJoin(lessonVersions, eq(lessonVersions.lessonId, lessons.id))
    .leftJoin(lessonProgress, and(eq(lessonProgress.lessonId, lessons.id), eq(lessonProgress.learnerId, learnerId)))
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
    coverageState: row.coverageState ?? "not_started",
    resumeStep: parseResumeState(row.resumeState)?.stepStableKey,
  }));
}

export async function getLessonResumeState(slug: string, learnerId: string): Promise<LessonResumeState | null> {
  const db = getDb();
  const [row] = await db
    .select({ resumeState: lessonProgress.resumeState })
    .from(lessonProgress)
    .innerJoin(lessons, eq(lessonProgress.lessonId, lessons.id))
    .where(and(eq(lessons.slug, slug), eq(lessonProgress.learnerId, learnerId)))
    .limit(1);
  return parseResumeState(row?.resumeState);
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
      learningObjectVersionId: learningObjectVersions.id,
    })
    .from(lessonVersionObjects)
    .innerJoin(learningObjectVersions, eq(lessonVersionObjects.learningObjectVersionId, learningObjectVersions.id))
    .innerJoin(learningObjects, eq(learningObjectVersions.learningObjectId, learningObjects.id))
    .where(eq(lessonVersionObjects.lessonVersionId, version.lessonVersionId))
    .orderBy(asc(lessonVersionObjects.position));

  const objectVersionIds = objectRows.map((item) => item.learningObjectVersionId);
  const questionRows = objectVersionIds.length === 0 ? [] : await db
    .select({
      learningObjectVersionId: learningObjectVersionQuestions.learningObjectVersionId,
      stableKey: questions.stableKey,
      prompt: questionVersions.prompt,
      response: questionVersions.responseSchema,
      scoring: questionVersions.scoringSchema,
      feedback: questionVersions.feedbackRules,
      position: learningObjectVersionQuestions.position,
    })
    .from(learningObjectVersionQuestions)
    .innerJoin(questionVersions, eq(learningObjectVersionQuestions.questionVersionId, questionVersions.id))
    .innerJoin(questions, eq(questionVersions.questionId, questions.id))
    .where(inArray(learningObjectVersionQuestions.learningObjectVersionId, objectVersionIds))
    .orderBy(asc(learningObjectVersionQuestions.position));

  const questionsByObject = new Map<string, typeof questionRows>();
  for (const question of questionRows) {
    const items = questionsByObject.get(question.learningObjectVersionId) ?? [];
    items.push(question);
    questionsByObject.set(question.learningObjectVersionId, items);
  }

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
      questions: (questionsByObject.get(item.learningObjectVersionId) ?? []).map((question) => ({
        stableKey: question.stableKey,
        prompt: question.prompt,
        response: questionResponseSchema.parse(question.response),
        scoring: questionScoringSchema.parse(question.scoring),
        feedback: feedbackRulesSchema.parse(question.feedback),
        position: question.position,
      })),
    })),
  };
}

export type LearningReviewItem = {
  id: string;
  lessonSlug: string;
  lessonTitle: string;
  questionPrompt: string | null;
  reason: "incorrect" | "partly_correct" | "misconception" | "low_confidence" | "manual";
  dueAt: Date;
  evidence: unknown;
};

export async function listReviewItems(learnerId: string): Promise<LearningReviewItem[]> {
  const db = getDb();
  return db
    .select({
      id: reviewQueue.id,
      lessonSlug: lessons.slug,
      lessonTitle: lessonVersions.title,
      questionPrompt: questionVersions.prompt,
      reason: reviewQueue.reason,
      dueAt: reviewQueue.dueAt,
      evidence: reviewQueue.evidence,
    })
    .from(reviewQueue)
    .innerJoin(lessons, eq(reviewQueue.lessonId, lessons.id))
    .innerJoin(lessonVersions, eq(reviewQueue.lessonVersionId, lessonVersions.id))
    .leftJoin(questionVersions, eq(reviewQueue.questionVersionId, questionVersions.id))
    .where(and(eq(reviewQueue.learnerId, learnerId), eq(reviewQueue.status, "queued")))
    .orderBy(asc(reviewQueue.dueAt));
}

export type OwnerReviewLesson = {
  lessonVersionId: string;
  slug: string;
  title: string;
  status: LearningLessonSummary["status"];
  versionNumber: number;
  objectCount: number;
  questionCount: number;
  sourcedTargetCount: number;
  expectedSourceTargetCount: number;
  mappingUncertainty: string | null;
  latestDecision: LearningLessonSummary["status"] | null;
  latestRationale: string | null;
};

export async function listOwnerReviewLessons(): Promise<OwnerReviewLesson[]> {
  const db = getDb();
  const rows = await db
    .select({
      lessonVersionId: lessonVersions.id,
      slug: lessons.slug,
      title: lessonVersions.title,
      status: lessonVersions.status,
      versionNumber: lessonVersions.versionNumber,
      objectCount: sql<number>`(select count(*)::int from ${lessonVersionObjects} lvo where lvo.lesson_version_id = ${lessonVersions.id})`,
      questionCount: sql<number>`(select count(*)::int from ${lessonVersionObjects} lvo join ${learningObjectVersionQuestions} lovq on lovq.learning_object_version_id = lvo.learning_object_version_id where lvo.lesson_version_id = ${lessonVersions.id})`,
      sourcedTargetCount: sql<number>`(
        (select count(*)::int from (select 1 from ${sourceLinks} sl where sl.lesson_version_id = ${lessonVersions.id} limit 1) lesson_source) +
        (select count(distinct lvo.learning_object_version_id)::int from ${lessonVersionObjects} lvo where lvo.lesson_version_id = ${lessonVersions.id} and exists (select 1 from ${sourceLinks} sl where sl.learning_object_version_id = lvo.learning_object_version_id)) +
        (select count(distinct lovq.question_version_id)::int from ${learningObjectVersionQuestions} lovq join ${lessonVersionObjects} lvo on lvo.learning_object_version_id = lovq.learning_object_version_id where lvo.lesson_version_id = ${lessonVersions.id} and exists (select 1 from ${sourceLinks} sl where sl.question_version_id = lovq.question_version_id))
      )`,
      mappingUncertainty: sql<string | null>`(select max(sl.mapping_uncertainty) from ${sourceLinks} sl where sl.lesson_version_id = ${lessonVersions.id})`,
      latestDecision: sql<LearningLessonSummary["status"] | null>`(select rd.decision from ${reviewDecisions} rd where rd.lesson_version_id = ${lessonVersions.id} order by rd.reviewed_at desc limit 1)`,
      latestRationale: sql<string | null>`(select rd.rationale from ${reviewDecisions} rd where rd.lesson_version_id = ${lessonVersions.id} order by rd.reviewed_at desc limit 1)`,
    })
    .from(lessonVersions)
    .innerJoin(lessons, eq(lessonVersions.lessonId, lessons.id))
    .orderBy(asc(lessons.recommendedOrder), desc(lessonVersions.versionNumber));

  const latestBySlug = new Map<string, (typeof rows)[number]>();
  for (const row of rows) if (!latestBySlug.has(row.slug)) latestBySlug.set(row.slug, row);
  return [...latestBySlug.values()].map((row) => ({
    ...row,
    expectedSourceTargetCount: 1 + row.objectCount + row.questionCount,
  }));
}
