import { z } from "zod";

const slugSchema = z.string().regex(/^[a-z0-9-]+$/);
const statusSchema = z.literal("draft");

export const choiceSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
});

export const responseSchema = z.object({
  kind: z.enum(["single_choice", "multiple_choice", "ordered_choice", "short_text"]),
  choices: z.array(choiceSchema).optional(),
  placeholder: z.string().optional(),
  variationOf: z.string().optional(),
});

export const scoringSchema = z.object({
  correct: z.array(z.string()).min(1),
  partlyCorrect: z.array(z.array(z.string())).optional(),
  caseSensitive: z.boolean().default(false),
});

export const feedbackRulesSchema = z.object({
  correct: z.string().min(1),
  partlyCorrect: z.string().optional(),
  incorrect: z.string().min(1),
  misconceptionCode: z.string().optional(),
  nextAction: z.enum(["retry", "inspect_visual", "open_glossary", "add_revision"]),
});

export const questionSeedSchema = z.object({
  stableKey: z.string().min(1),
  prompt: z.string().min(1),
  response: responseSchema,
  scoring: scoringSchema,
  feedback: feedbackRulesSchema,
  sourceKey: z.enum(["module-1", "module-2", "learning-plan"]),
});

export const learningObjectContentSchema = z.object({
  kind: z.enum(["hook", "explain", "explore", "apply", "check", "close", "reference"]),
  body: z.string().min(1),
  supportingOutcomes: z.array(z.string().min(1)).optional(),
  interaction: z.object({
    name: z.string().min(1),
    instructions: z.string().min(1),
    keyboardAlternative: z.string().min(1),
    structuredText: z.string().min(1),
  }).optional(),
  misconceptionCodes: z.array(z.string()).optional(),
  outsideMasteryPromise: z.boolean().optional(),
});

export const learningObjectSeedSchema = z.object({
  stableKey: z.string().min(1),
  type: z.enum(["hook", "explain", "explore", "apply", "check", "close", "visual", "structured_text"]),
  title: z.string().min(1),
  content: learningObjectContentSchema,
  structuredText: z.string().min(1).optional(),
  sourceKey: z.enum(["module-1", "module-2", "learning-plan"]),
  questions: z.array(questionSeedSchema).default([]),
});

export const lessonSeedSchema = z.object({
  order: z.int().positive(),
  slug: slugSchema,
  title: z.string().min(1),
  outcome: z.string().min(1),
  durationMinutes: z.int().min(5).max(10),
  mapping: z.string().min(1),
  mappingStatus: z.enum(["confirmed", "provisional", "needs_confirmation"]),
  status: statusSchema,
  sourceKey: z.enum(["module-1", "module-2", "learning-plan"]),
  objects: z.array(learningObjectSeedSchema).min(6),
});

export const glossarySeedSchema = z.object({
  slug: slugSchema,
  term: z.string().min(1),
  definition: z.string().min(1),
  sourceKey: z.enum(["module-1", "module-2", "learning-plan"]),
});

export const misconceptionSeedSchema = z.object({
  code: z.string().regex(/^[A-Z0-9_]+$/),
  label: z.string().min(1),
  explanation: z.string().min(1),
});

export const prototypeContentSeedSchema = z.object({
  packageVersion: z.literal(1),
  status: statusSchema,
  topic: z.object({
    slug: slugSchema,
    title: z.string().min(1),
    description: z.string().min(1),
    recommendedOrder: z.int().positive(),
    origymModule: z.string().min(1),
    mappingStatus: z.enum(["confirmed", "provisional", "needs_confirmation"]),
  }),
  misconceptions: z.array(misconceptionSeedSchema).length(15),
  glossary: z.array(glossarySeedSchema).length(25),
  lessons: z.array(lessonSeedSchema).length(5),
}).superRefine((seed, context) => {
  const lessonOrders = seed.lessons.map((lesson) => lesson.order);
  const keys = seed.lessons.flatMap((lesson) =>
    lesson.objects.flatMap((object) => [object.stableKey, ...object.questions.map((question) => question.stableKey)]),
  );
  if (new Set(lessonOrders).size !== lessonOrders.length) {
    context.addIssue({ code: "custom", message: "Lesson order must be unique" });
  }
  if (new Set(keys).size !== keys.length) {
    context.addIssue({ code: "custom", message: "Learning object and question keys must be unique" });
  }
});

export type PrototypeContentSeed = z.infer<typeof prototypeContentSeedSchema>;
export type LessonSeed = z.infer<typeof lessonSeedSchema>;
