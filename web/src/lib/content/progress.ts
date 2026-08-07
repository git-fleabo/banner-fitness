import { z } from "zod";

export const lessonFeedbackCategorySchema = z.enum(["correct", "incorrect", "partly_correct", "misconception"]);

export const lessonResumeStateSchema = z.object({
  stepStableKey: z.string().min(1),
  questionStableKey: z.string().min(1).optional(),
  selected: z.array(z.string().min(1)).optional(),
  submitted: z.boolean().optional(),
  evidenceRecorded: z.boolean().optional(),
  feedbackCategory: lessonFeedbackCategorySchema.optional(),
  complete: z.boolean().optional(),
  confidence: z.number().int().min(1).max(5).nullable().optional(),
});

export type LessonResumeState = z.infer<typeof lessonResumeStateSchema>;

export function parseLessonResumeState(value: unknown): LessonResumeState | null {
  const candidate = typeof value === "object" && value !== null && "complete" in value && !("stepStableKey" in value)
    ? { ...value, stepStableKey: "close" }
    : value;
  const result = lessonResumeStateSchema.safeParse(candidate);
  return result.success ? result.data : null;
}
