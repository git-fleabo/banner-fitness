import { describe, expect, it } from "vitest";

import { prototypeLessons, prototypeLessonsSchema } from "./prototype";
import { prototypeContentSeed } from "./prototype-seed";

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

describe("versioned prototype seed", () => {
  it("meets the approved minimum draft inventory", () => {
    const objects = prototypeContentSeed.lessons.flatMap((lesson) => lesson.objects);
    const questions = objects.flatMap((object) => object.questions);
    const lessonChecks = questions.filter((item) => !item.stableKey.startsWith("mixed-"));
    const mixedCore = questions.filter((item) => item.stableKey.startsWith("mixed-check-"));
    const mixedVariations = questions.filter((item) => item.response.variationOf);

    expect(prototypeContentSeed.status).toBe("draft");
    expect(prototypeContentSeed.lessons).toHaveLength(5);
    expect(objects.filter((item) => item.type === "explore")).toHaveLength(5);
    expect(objects.filter((item) => item.type === "apply")).toHaveLength(5);
    expect(lessonChecks).toHaveLength(16);
    expect(mixedCore).toHaveLength(6);
    expect(mixedVariations).toHaveLength(6);
    expect(prototypeContentSeed.misconceptions).toHaveLength(11);
    expect(prototypeContentSeed.glossary).toHaveLength(25);
    expect(objects.some((item) => item.content.outsideMasteryPromise)).toBe(true);
  });

  it("keeps source and accessible structured-text metadata on every authored item", () => {
    for (const lesson of prototypeContentSeed.lessons) {
      expect(lesson.sourceKey).toBeTruthy();
      for (const object of lesson.objects) {
        expect(object.sourceKey).toBeTruthy();
        expect(object.structuredText).toBeTruthy();
        for (const question of object.questions) expect(question.sourceKey).toBeTruthy();
      }
    }
    for (const term of prototypeContentSeed.glossary) expect(term.sourceKey).toBeTruthy();
  });
});
