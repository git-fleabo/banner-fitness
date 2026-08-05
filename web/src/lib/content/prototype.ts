import { z } from "zod";

export const prototypeLessonSchema = z.object({
  order: z.int().positive(),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(1),
  outcome: z.string().min(1),
  durationMinutes: z.int().min(5).max(10),
  mapping: z.string().min(1),
  status: z.literal("draft"),
});

export const prototypeLessonsSchema = z
  .array(prototypeLessonSchema)
  .length(5)
  .superRefine((lessons, context) => {
    if (new Set(lessons.map((lesson) => lesson.order)).size !== lessons.length) {
      context.addIssue({ code: "custom", message: "Lesson order must be unique" });
    }
    if (new Set(lessons.map((lesson) => lesson.slug)).size !== lessons.length) {
      context.addIssue({ code: "custom", message: "Lesson slugs must be unique" });
    }
  });

export type PrototypeLesson = z.infer<typeof prototypeLessonSchema>;

export const prototypeLessons = prototypeLessonsSchema.parse([
  { order: 1, slug: "anatomical-position", title: "Anatomical position and directional terms", outcome: "Use anatomical position as a shared reference and accurately compare two body structures.", durationMinutes: 8, mapping: "Module 1 · Anatomy and movement", status: "draft" },
  { order: 2, slug: "planes-and-axes", title: "Planes and axes", outcome: "Match each anatomical plane to its axis and identify the predominant plane of a simple movement.", durationMinutes: 8, mapping: "Module 1 · Anatomy and movement", status: "draft" },
  { order: 3, slug: "joint-actions", title: "Joint actions", outcome: "Describe the principal hip, knee and ankle actions visible through a squat.", durationMinutes: 9, mapping: "Module 1 · Mapping needs confirmation", status: "draft" },
  { order: 4, slug: "recognising-actions", title: "Recognising actions in exercise", outcome: "Identify predominant joint actions and planes in a small set of common exercises.", durationMinutes: 9, mapping: "Module 1 · Anatomy and movement", status: "draft" },
  { order: 5, slug: "mixed-movement-challenge", title: "Mixed movement challenge", outcome: "Apply the full five-step observation method to unfamiliar movement examples.", durationMinutes: 10, mapping: "Module 1 · Anatomy and movement", status: "draft" },
]);
