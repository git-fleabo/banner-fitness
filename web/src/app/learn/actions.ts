"use server";

import { revalidatePath } from "next/cache";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";

import { getAccountAccess } from "@/lib/authorization/server";
import { feedbackRulesSchema, scoringSchema as questionScoringSchema } from "@/lib/content/contracts";
import { getDb } from "@/lib/db/client";
import {
  learningObjectVersions,
  learningObjectVersionQuestions,
  lessons,
  lessonProgress,
  learningObjects,
  lessonVersionObjects,
  lessonVersions,
  practiceAttempts,
  questions,
  questionVersions,
  reviewQueue,
} from "@/lib/db/schema";
import { parseLessonResumeState } from "@/lib/content/progress";

const attemptInputSchema = z.object({
  lessonSlug: z.string().regex(/^[a-z0-9-]+$/),
  questionStableKey: z.string().min(1),
  selected: z.array(z.string().min(1)).min(1),
});

const completionInputSchema = z.object({
  lessonSlug: z.string().regex(/^[a-z0-9-]+$/),
  confidence: z.number().int().min(1).max(5).optional(),
});

const positionInputSchema = z.object({ lessonSlug: z.string().regex(/^[a-z0-9-]+$/), stepStableKey: z.string().min(1) });

function sameAnswers(left: string[], right: string[]) {
  return [...left].sort().join("\u0000") === [...right].sort().join("\u0000");
}

async function requireActiveAccount() {
  const access = await getAccountAccess();
  if (access.state !== "active") throw new Error("An active account is required.");
  return access.account;
}

export async function recordPracticeAttempt(input: unknown) {
  const values = attemptInputSchema.parse(input);
  const account = await requireActiveAccount();
  const db = getDb();
  const [target] = await db
    .select({
      lessonId: lessons.id,
      lessonVersionId: lessonVersions.id,
      lessonStatus: lessonVersions.status,
      questionVersionId: questionVersions.id,
      scoring: questionVersions.scoringSchema,
      feedback: questionVersions.feedbackRules,
      objectPosition: lessonVersionObjects.position,
    })
    .from(questions)
    .innerJoin(questionVersions, eq(questionVersions.questionId, questions.id))
    .innerJoin(learningObjectVersionQuestions, eq(learningObjectVersionQuestions.questionVersionId, questionVersions.id))
    .innerJoin(learningObjectVersions, eq(learningObjectVersions.id, learningObjectVersionQuestions.learningObjectVersionId))
    .innerJoin(lessonVersionObjects, eq(lessonVersionObjects.learningObjectVersionId, learningObjectVersions.id))
    .innerJoin(lessonVersions, eq(lessonVersions.id, lessonVersionObjects.lessonVersionId))
    .innerJoin(lessons, eq(lessons.id, lessonVersions.lessonId))
    .where(and(eq(questions.stableKey, values.questionStableKey), eq(lessons.slug, values.lessonSlug)))
    .limit(1);

  if (!target || (account.role === "learner" && target.lessonStatus !== "published")) {
    throw new Error("This question is not available to this account.");
  }

  const scoring = questionScoringSchema.parse(target.scoring);
  const feedback = feedbackRulesSchema.parse(target.feedback);
  const isCorrect = sameAnswers(values.selected, scoring.correct);
  const isPartlyCorrect = !isCorrect && (scoring.partlyCorrect ?? []).some((answer) => sameAnswers(values.selected, answer));
  const feedbackCategory = isCorrect ? "correct" : isPartlyCorrect ? "partly_correct" : feedback.misconceptionCode ? "misconception" : "incorrect";

  const [existingProgress] = await db.select({ coverageState: lessonProgress.coverageState, completedAt: lessonProgress.completedAt })
    .from(lessonProgress)
    .where(and(eq(lessonProgress.learnerId, account.authUserId), eq(lessonProgress.lessonId, target.lessonId)))
    .limit(1);
  const retainsCoverage = existingProgress?.coverageState === "covered";
  const [attempt] = await db.insert(practiceAttempts).values({
    learnerId: account.authUserId,
    lessonVersionId: target.lessonVersionId,
    questionVersionId: target.questionVersionId,
    response: { selected: values.selected },
    feedbackCategory,
    misconceptionCode: feedbackCategory === "misconception" ? feedback.misconceptionCode : null,
  }).returning({ id: practiceAttempts.id, attemptedAt: practiceAttempts.attemptedAt });

  await db.insert(lessonProgress).values({
    learnerId: account.authUserId,
    lessonId: target.lessonId,
    lessonVersionId: target.lessonVersionId,
    coverageState: retainsCoverage ? "covered" : "in_progress",
    lastObjectPosition: target.objectPosition,
    resumeState: {
      stepStableKey: "check",
      questionStableKey: values.questionStableKey,
      selected: values.selected,
      submitted: true,
      evidenceRecorded: true,
      feedbackCategory,
    },
    startedAt: new Date(),
  }).onConflictDoUpdate({
    target: [lessonProgress.learnerId, lessonProgress.lessonId],
    set: {
      lessonVersionId: target.lessonVersionId,
      coverageState: retainsCoverage ? "covered" : "in_progress",
      lastObjectPosition: target.objectPosition,
      resumeState: {
        stepStableKey: "check",
        questionStableKey: values.questionStableKey,
        selected: values.selected,
        submitted: true,
        evidenceRecorded: true,
        feedbackCategory,
      },
      completedAt: retainsCoverage ? existingProgress?.completedAt ?? null : null,
      updatedAt: new Date(),
    },
  });

  let revision;
  if (!isCorrect) {
    const reason = feedbackCategory === "misconception" ? "misconception" : feedbackCategory === "partly_correct" ? "partly_correct" : "incorrect";
    const dueAt = new Date(Date.now() + (feedbackCategory === "misconception" ? 1 : 2) * 86_400_000);
    const [existing] = await db.select({ id: reviewQueue.id }).from(reviewQueue).where(and(
      eq(reviewQueue.learnerId, account.authUserId),
      eq(reviewQueue.questionVersionId, target.questionVersionId),
      eq(reviewQueue.status, "queued"),
    )).limit(1);
    const evidence = { attemptId: attempt.id, feedbackCategory, misconceptionCode: feedback.misconceptionCode ?? null };

    if (existing) {
      await db.update(reviewQueue).set({ reason, evidence, dueAt, updatedAt: new Date() }).where(eq(reviewQueue.id, existing.id));
    } else {
      await db.insert(reviewQueue).values({
        learnerId: account.authUserId,
        lessonId: target.lessonId,
        lessonVersionId: target.lessonVersionId,
        questionVersionId: target.questionVersionId,
        reason,
        evidence,
        dueAt,
      });
    }
    revision = { reason, dueAt: dueAt.toISOString(), explanation: `Recommended because this response was ${feedbackCategory.replaceAll("_", " ")}${feedback.misconceptionCode ? ` and matched ${feedback.misconceptionCode.replaceAll("_", " ").toLowerCase()}` : ""}.` };
  }

  revalidatePath("/learn");
  revalidatePath(`/learn/${values.lessonSlug}`);
  return {
    feedbackCategory,
    result: isCorrect ? feedback.correct : isPartlyCorrect ? feedback.partlyCorrect ?? feedback.incorrect : feedback.incorrect,
    nextAction: feedback.nextAction,
    revision,
    attemptedAt: attempt.attemptedAt.toISOString(),
  };
}

export async function completeLesson(input: unknown) {
  const values = completionInputSchema.parse(input);
  const account = await requireActiveAccount();
  const db = getDb();
  const [target] = await db
    .select({ lessonId: lessons.id, lessonVersionId: lessonVersions.id, status: lessonVersions.status })
    .from(lessons)
    .innerJoin(lessonVersions, eq(lessonVersions.lessonId, lessons.id))
    .where(eq(lessons.slug, values.lessonSlug))
    .orderBy(desc(lessonVersions.versionNumber))
    .limit(1);

  if (!target || (account.role === "learner" && target.status !== "published")) throw new Error("This lesson is not available to this account.");
  const completedAt = new Date();
  await db.insert(lessonProgress).values({
    learnerId: account.authUserId,
    lessonId: target.lessonId,
    lessonVersionId: target.lessonVersionId,
    coverageState: "covered",
    lastObjectPosition: 1,
    resumeState: { stepStableKey: "close", complete: true, confidence: values.confidence ?? null },
    startedAt: completedAt,
    completedAt,
  }).onConflictDoUpdate({
    target: [lessonProgress.learnerId, lessonProgress.lessonId],
    set: {
      lessonVersionId: target.lessonVersionId,
      coverageState: "covered",
      resumeState: { stepStableKey: "close", complete: true, confidence: values.confidence ?? null },
      completedAt,
      updatedAt: completedAt,
    },
  });

  revalidatePath("/learn");
  revalidatePath(`/learn/${values.lessonSlug}`);
  return { completedAt: completedAt.toISOString(), confidence: values.confidence ?? null, securityState: "Not yet secure" as const };
}

export async function recordLessonPosition(input: unknown) {
  const values = positionInputSchema.parse(input);
  const account = await requireActiveAccount();
  const db = getDb();
  const [target] = await db.select({ lessonId: lessons.id, lessonVersionId: lessonVersions.id, status: lessonVersions.status, objectPosition: lessonVersionObjects.position })
    .from(lessons)
    .innerJoin(lessonVersions, eq(lessonVersions.lessonId, lessons.id))
    .innerJoin(lessonVersionObjects, eq(lessonVersionObjects.lessonVersionId, lessonVersions.id))
    .innerJoin(learningObjectVersions, eq(learningObjectVersions.id, lessonVersionObjects.learningObjectVersionId))
    .innerJoin(learningObjects, eq(learningObjects.id, learningObjectVersions.learningObjectId))
    .where(and(eq(lessons.slug, values.lessonSlug), eq(learningObjects.stableKey, values.stepStableKey)))
    .orderBy(desc(lessonVersions.versionNumber))
    .limit(1);
  if (!target || (account.role === "learner" && target.status !== "published")) throw new Error("This lesson is not available to this account.");
  const [existing] = await db.select({ resumeState: lessonProgress.resumeState, coverageState: lessonProgress.coverageState, completedAt: lessonProgress.completedAt }).from(lessonProgress).where(and(eq(lessonProgress.learnerId, account.authUserId), eq(lessonProgress.lessonId, target.lessonId))).limit(1);
  const previous = parseLessonResumeState(existing?.resumeState) ?? {};
  const resumeState = { ...previous, stepStableKey: values.stepStableKey };
  const retainsCoverage = existing?.coverageState === "covered";
  await db.insert(lessonProgress).values({ learnerId: account.authUserId, lessonId: target.lessonId, lessonVersionId: target.lessonVersionId, coverageState: retainsCoverage ? "covered" : "in_progress", lastObjectPosition: target.objectPosition, resumeState, startedAt: new Date() }).onConflictDoUpdate({ target: [lessonProgress.learnerId, lessonProgress.lessonId], set: { lessonVersionId: target.lessonVersionId, lastObjectPosition: target.objectPosition, coverageState: retainsCoverage ? "covered" : "in_progress", resumeState, completedAt: retainsCoverage ? existing?.completedAt ?? null : null, updatedAt: new Date() } });
  revalidatePath("/learn");
}
