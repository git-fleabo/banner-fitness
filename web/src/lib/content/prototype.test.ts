import { describe, expect, it } from "vitest";

import { prototypeLessons, prototypeLessonsSchema } from "./prototype";

describe("prototype lesson contract", () => {
  it("contains five ordered, uniquely addressed draft lessons", () => {
    expect(prototypeLessons.map((lesson) => lesson.order)).toEqual([1, 2, 3, 4, 5]);
    expect(new Set(prototypeLessons.map((lesson) => lesson.slug).values()).size).toBe(5);
    expect(prototypeLessons.every((lesson) => lesson.status === "draft")).toBe(true);
  });

  it("rejects a lesson sequence with duplicate slugs", () => {
    const invalidLessons = prototypeLessons.map((lesson, index) =>
      index === 1 ? { ...lesson, slug: prototypeLessons[0].slug } : lesson,
    );
    expect(prototypeLessonsSchema.safeParse(invalidLessons).success).toBe(false);
  });
});
