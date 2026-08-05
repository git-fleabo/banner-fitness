import { and, eq } from "drizzle-orm";
import type { NeonHttpDatabase } from "drizzle-orm/neon-http";

import * as schema from "@/lib/db/schema";
import { prototypeContentSeed } from "./prototype-seed";

type Database = NeonHttpDatabase<typeof schema>;
type SourceKey = "module-1" | "module-2" | "learning-plan";

const sourceDefinitions: Record<SourceKey, typeof schema.sourceRecords.$inferInsert> = {
  "module-1": {
    id: "10000000-0000-4000-8000-000000000001",
    title: "OriGym Level 3 Module 1 course book",
    sourceType: "origym_pdf",
    location: "Module 1/L3 Module 1 June 2021.pdf",
    pageRange: "74-84",
    reviewedAt: "2026-08-05",
    rightsStatus: "private_reference",
    notes: "Coverage and terminology reference only. No source visual or distinctive wording is reproduced.",
  },
  "module-2": {
    id: "10000000-0000-4000-8000-000000000002",
    title: "OriGym Level 3 Module 2 course book",
    sourceType: "origym_pdf",
    location: "Module 2/L3 Module 2.pdf",
    pageRange: "5-9",
    reviewedAt: "2026-08-05",
    rightsStatus: "private_reference",
    notes: "Joint-action terminology cross-check. Portal curriculum placement must be confirmed before publication.",
  },
  "learning-plan": {
    id: "10000000-0000-4000-8000-000000000003",
    title: "PT Learning Lab approved prototype learning plan",
    sourceType: "original_research",
    location: "PT_LEARNING_LAB_PROTOTYPE_LEARNING_PLAN.md",
    reviewedAt: "2026-08-05",
    rightsStatus: "original",
    notes: "Approved original learning design and acceptance boundary.",
  },
};

async function ensureSourceLink(
  db: Database,
  sourceKey: SourceKey,
  target: Pick<typeof schema.sourceLinks.$inferInsert, "lessonVersionId" | "learningObjectVersionId" | "questionVersionId" | "glossaryVersionId">,
  details: { sourceExcerptNote: string; mappingUncertainty?: string },
) {
  const sourceRecordId = sourceDefinitions[sourceKey].id!;
  const targetEntry = Object.entries(target).find(([, value]) => value !== undefined);
  if (!targetEntry) throw new Error("A source link target is required");

  const [targetColumnName, targetValue] = targetEntry as [keyof typeof target, string];
  const targetColumn = schema.sourceLinks[targetColumnName];
  const [existing] = await db
    .select({ id: schema.sourceLinks.id })
    .from(schema.sourceLinks)
    .where(and(eq(schema.sourceLinks.sourceRecordId, sourceRecordId), eq(targetColumn, targetValue)))
    .limit(1);

  if (existing) {
    await db.update(schema.sourceLinks).set({ ...details, updatedAt: new Date() }).where(eq(schema.sourceLinks.id, existing.id));
    return;
  }

  await db.insert(schema.sourceLinks).values({ sourceRecordId, ...target, ...details });
}

export async function seedPrototypeDrafts(db: Database, createdBy: string) {
  for (const source of Object.values(sourceDefinitions)) {
    await db.insert(schema.sourceRecords).values(source).onConflictDoUpdate({
      target: schema.sourceRecords.id,
      set: { ...source, updatedAt: new Date() },
    });
  }

  const [topic] = await db.insert(schema.curriculumTopics).values({
    ...prototypeContentSeed.topic,
  }).onConflictDoUpdate({
    target: schema.curriculumTopics.slug,
    set: { ...prototypeContentSeed.topic, updatedAt: new Date() },
  }).returning({ id: schema.curriculumTopics.id });

  let learningObjectCount = 0;
  let questionCount = 0;

  for (const lessonSeed of prototypeContentSeed.lessons) {
    const [lesson] = await db.insert(schema.lessons).values({
      curriculumTopicId: topic.id,
      slug: lessonSeed.slug,
      recommendedOrder: lessonSeed.order,
    }).onConflictDoUpdate({
      target: schema.lessons.slug,
      set: { curriculumTopicId: topic.id, recommendedOrder: lessonSeed.order, updatedAt: new Date() },
    }).returning({ id: schema.lessons.id });

    const [lessonVersion] = await db.insert(schema.lessonVersions).values({
      lessonId: lesson.id,
      versionNumber: 1,
      title: lessonSeed.title,
      outcome: lessonSeed.outcome,
      estimatedMinutes: lessonSeed.durationMinutes,
      status: "draft",
      createdBy,
    }).onConflictDoUpdate({
      target: [schema.lessonVersions.lessonId, schema.lessonVersions.versionNumber],
      set: {
        title: lessonSeed.title,
        outcome: lessonSeed.outcome,
        estimatedMinutes: lessonSeed.durationMinutes,
        status: "draft",
        createdBy,
        publishedAt: null,
        updatedAt: new Date(),
      },
    }).returning({ id: schema.lessonVersions.id });

    await ensureSourceLink(db, lessonSeed.sourceKey, { lessonVersionId: lessonVersion.id }, {
      sourceExcerptNote: `Draft lesson coverage and terminology: ${lessonSeed.title}.`,
      ...(lessonSeed.mappingStatus === "needs_confirmation" ? { mappingUncertainty: lessonSeed.mapping } : {}),
    });

    for (const [objectIndex, objectSeed] of lessonSeed.objects.entries()) {
      const [learningObject] = await db.insert(schema.learningObjects).values({
        lessonId: lesson.id,
        stableKey: objectSeed.stableKey,
        type: objectSeed.type,
      }).onConflictDoUpdate({
        target: [schema.learningObjects.lessonId, schema.learningObjects.stableKey],
        set: { type: objectSeed.type, updatedAt: new Date() },
      }).returning({ id: schema.learningObjects.id });

      const [learningObjectVersion] = await db.insert(schema.learningObjectVersions).values({
        learningObjectId: learningObject.id,
        versionNumber: 1,
        title: objectSeed.title,
        content: objectSeed.content,
        structuredText: objectSeed.structuredText,
        status: "draft",
        createdBy,
      }).onConflictDoUpdate({
        target: [schema.learningObjectVersions.learningObjectId, schema.learningObjectVersions.versionNumber],
        set: {
          title: objectSeed.title,
          content: objectSeed.content,
          structuredText: objectSeed.structuredText,
          status: "draft",
          createdBy,
          publishedAt: null,
          updatedAt: new Date(),
        },
      }).returning({ id: schema.learningObjectVersions.id });

      await db.insert(schema.lessonVersionObjects).values({
        lessonVersionId: lessonVersion.id,
        learningObjectVersionId: learningObjectVersion.id,
        position: objectIndex + 1,
      }).onConflictDoUpdate({
        target: [schema.lessonVersionObjects.lessonVersionId, schema.lessonVersionObjects.learningObjectVersionId],
        set: { position: objectIndex + 1 },
      });

      await ensureSourceLink(db, objectSeed.sourceKey, { learningObjectVersionId: learningObjectVersion.id }, {
        sourceExcerptNote: `Draft ${objectSeed.type} object: ${objectSeed.title}.`,
      });
      learningObjectCount += 1;

      for (const [questionIndex, questionSeed] of objectSeed.questions.entries()) {
        const [question] = await db.insert(schema.questions).values({ stableKey: questionSeed.stableKey }).onConflictDoUpdate({
          target: schema.questions.stableKey,
          set: { updatedAt: new Date() },
        }).returning({ id: schema.questions.id });

        const [questionVersion] = await db.insert(schema.questionVersions).values({
          questionId: question.id,
          versionNumber: 1,
          prompt: questionSeed.prompt,
          responseSchema: questionSeed.response,
          scoringSchema: questionSeed.scoring,
          feedbackRules: questionSeed.feedback,
          status: "draft",
          createdBy,
        }).onConflictDoUpdate({
          target: [schema.questionVersions.questionId, schema.questionVersions.versionNumber],
          set: {
            prompt: questionSeed.prompt,
            responseSchema: questionSeed.response,
            scoringSchema: questionSeed.scoring,
            feedbackRules: questionSeed.feedback,
            status: "draft",
            createdBy,
            publishedAt: null,
            updatedAt: new Date(),
          },
        }).returning({ id: schema.questionVersions.id });

        await db.insert(schema.learningObjectVersionQuestions).values({
          learningObjectVersionId: learningObjectVersion.id,
          questionVersionId: questionVersion.id,
          position: questionIndex + 1,
        }).onConflictDoUpdate({
          target: [schema.learningObjectVersionQuestions.learningObjectVersionId, schema.learningObjectVersionQuestions.questionVersionId],
          set: { position: questionIndex + 1 },
        });

        await ensureSourceLink(db, questionSeed.sourceKey, { questionVersionId: questionVersion.id }, {
          sourceExcerptNote: `Original draft question; concept checked against ${sourceDefinitions[questionSeed.sourceKey].title}.`,
        });
        questionCount += 1;
      }
    }
  }

  for (const glossarySeed of prototypeContentSeed.glossary) {
    const [term] = await db.insert(schema.glossaryTerms).values({
      slug: glossarySeed.slug,
      term: glossarySeed.term,
    }).onConflictDoUpdate({
      target: schema.glossaryTerms.slug,
      set: { term: glossarySeed.term, updatedAt: new Date() },
    }).returning({ id: schema.glossaryTerms.id });

    const [version] = await db.insert(schema.glossaryVersions).values({
      glossaryTermId: term.id,
      versionNumber: 1,
      definition: glossarySeed.definition,
      status: "draft",
      createdBy,
    }).onConflictDoUpdate({
      target: [schema.glossaryVersions.glossaryTermId, schema.glossaryVersions.versionNumber],
      set: { definition: glossarySeed.definition, status: "draft", createdBy, publishedAt: null, updatedAt: new Date() },
    }).returning({ id: schema.glossaryVersions.id });

    await ensureSourceLink(db, glossarySeed.sourceKey, { glossaryVersionId: version.id }, {
      sourceExcerptNote: `Draft original definition for ${glossarySeed.term}.`,
    });
  }

  return {
    lessons: prototypeContentSeed.lessons.length,
    learningObjects: learningObjectCount,
    questions: questionCount,
    glossaryTerms: prototypeContentSeed.glossary.length,
    misconceptions: prototypeContentSeed.misconceptions.length,
  };
}
