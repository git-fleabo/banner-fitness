"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";

import { getAccountAccess } from "@/lib/authorization/server";
import { listOwnerReviewLessons } from "@/lib/content/repository";
import { reviewTransitionError } from "@/lib/content/workflow";
import { getDb } from "@/lib/db/client";
import {
  learningObjectVersions,
  learningObjectVersionQuestions,
  lessonVersionObjects,
  lessonVersions,
  questionVersions,
  reviewDecisions,
} from "@/lib/db/schema";

const transitionSchema = z.object({
  lessonVersionId: z.string().uuid(),
  targetStatus: z.enum(["in_review", "approved", "published"]),
  rationale: z.string().optional(),
  mappingAcknowledged: z.string().optional().transform((value) => value === "on"),
});

export async function transitionLessonReview(formData: FormData) {
  const values = transitionSchema.parse(Object.fromEntries(formData));
  const access = await getAccountAccess();
  if (access.state !== "active" || access.account.role !== "owner") throw new Error("Owner access is required.");

  const item = (await listOwnerReviewLessons()).find((lesson) => lesson.lessonVersionId === values.lessonVersionId);
  if (!item) throw new Error("This lesson version was not found.");

  const error = reviewTransitionError({
    currentStatus: item.status,
    targetStatus: values.targetStatus,
    rationale: values.rationale,
    sourcesComplete: item.sourcedTargetCount >= item.expectedSourceTargetCount,
    hasMappingUncertainty: Boolean(item.mappingUncertainty),
    mappingAcknowledged: values.mappingAcknowledged,
    hasApprovedDecision: item.latestDecision === "approved",
  });
  if (error) throw new Error(error);

  const db = getDb();
  const objectRows = await db
    .select({ id: learningObjectVersions.id })
    .from(lessonVersionObjects)
    .innerJoin(learningObjectVersions, eq(lessonVersionObjects.learningObjectVersionId, learningObjectVersions.id))
    .where(eq(lessonVersionObjects.lessonVersionId, item.lessonVersionId));
  const objectIds = objectRows.map((row) => row.id);
  const questionRows = objectIds.length === 0 ? [] : await db
    .selectDistinct({ id: questionVersions.id })
    .from(learningObjectVersionQuestions)
    .innerJoin(questionVersions, eq(learningObjectVersionQuestions.questionVersionId, questionVersions.id))
    .where(inArray(learningObjectVersionQuestions.learningObjectVersionId, objectIds));
  const questionIds = questionRows.map((row) => row.id);
  const now = new Date();
  const publishedAt = values.targetStatus === "published" ? now : null;
  const rationale = values.rationale?.trim() || (values.targetStatus === "in_review" ? "Submitted for owner review." : "Published after approved owner review.");

  await db.transaction(async (tx) => {
    if (objectIds.length > 0) await tx.update(learningObjectVersions).set({ status: values.targetStatus, publishedAt, updatedAt: now }).where(inArray(learningObjectVersions.id, objectIds));
    if (questionIds.length > 0) await tx.update(questionVersions).set({ status: values.targetStatus, publishedAt, updatedAt: now }).where(inArray(questionVersions.id, questionIds));
    const [updatedLesson] = await tx.update(lessonVersions).set({ status: values.targetStatus, publishedAt, updatedAt: now }).where(and(eq(lessonVersions.id, item.lessonVersionId), eq(lessonVersions.status, item.status))).returning({ id: lessonVersions.id });
    if (!updatedLesson) throw new Error("The lesson changed while it was being reviewed. Refresh and try again.");

    await tx.insert(reviewDecisions).values([
      { targetType: "lesson_version", lessonVersionId: item.lessonVersionId, decision: values.targetStatus, rationale, reviewedBy: access.account.authUserId },
      ...objectIds.map((id) => ({ targetType: "learning_object_version" as const, learningObjectVersionId: id, decision: values.targetStatus, rationale, reviewedBy: access.account.authUserId })),
      ...questionIds.map((id) => ({ targetType: "question_version" as const, questionVersionId: id, decision: values.targetStatus, rationale, reviewedBy: access.account.authUserId })),
    ]);
  });

  revalidatePath("/owner/review");
  revalidatePath("/learn");
  revalidatePath(`/learn/${item.slug}`);
}
