import { describe, expect, it } from "vitest";

import { filterProgrammeLibraryTemplates, mapLibraryTemplateToClientSessions, programmeLibrarySeed } from "./programme-library";
import { PT_GOALS } from "./pt-goals";

describe("programme library", () => {
  it("ships a varied reusable catalogue", () => {
    expect(programmeLibrarySeed).toHaveLength(36);
    expect(new Set(programmeLibrarySeed.map((template) => template.goal)).size).toBe(PT_GOALS.length);
    for (const goal of PT_GOALS) expect(programmeLibrarySeed.filter((template) => template.goal === goal).length).toBeGreaterThanOrEqual(3);
    expect(programmeLibrarySeed.every((template) => template.sessions.every((session) => session.exercises.length > 0))).toBe(true);
    expect(programmeLibrarySeed.some((template) => template.id === "library-5x5-strength-3-day")).toBe(true);
    expect(programmeLibrarySeed.some((template) => template.id === "library-concurrent-strength-conditioning-4-day")).toBe(true);
    expect(programmeLibrarySeed.every((template) => template.experienceLevel && template.frameworkType)).toBe(true);
  });

  it("maps a reusable template to the client's preferred days when the frequency matches", () => {
    const template = programmeLibrarySeed.find((candidate) => candidate.id === "library-full-body-strength-3-day");
    expect(template).toBeDefined();
    const sessions = mapLibraryTemplateToClientSessions(template!, [1, 3, 5]);
    expect(sessions.map((session) => session.dayOfWeek)).toEqual([1, 3, 5]);
    expect(sessions[0]?.exercises[0]?.name).toBe("Barbell Back Squat");
  });

  it("uses a complete weekday fallback when the template frequency differs", () => {
    const template = programmeLibrarySeed.find((candidate) => candidate.id === "library-upper-lower-hypertrophy-4-day");
    expect(template).toBeDefined();
    expect(mapLibraryTemplateToClientSessions(template!, [1, 3, 5]).map((session) => session.dayOfWeek)).toEqual([1, 2, 3, 4]);
  });

  it("filters by frequency, equipment, experience and framework", () => {
    const matches = filterProgrammeLibraryTemplates(programmeLibrarySeed, { frequency: 2, equipment: "TRX", experienceLevel: "Varied", frameworkType: "Equipment-specific" });
    expect(matches.map((template) => template.id)).toEqual(["library-suspension-rings-mixed-2-day"]);
  });
});
