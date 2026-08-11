import { describe, expect, it } from "vitest";

import { buildEditorSessionState, buildStarterTemplateState, getEditorSessionDays } from "@/lib/programme-editor";

const exercise = { name: "Squat", pattern: "Squat", prescription: "3 × 8–12", target: "Quads", equipment: "Dumbbells" };

describe("programme editor schedule", () => {
  it("uses the client's selected weekdays instead of fixed weekday tabs", () => {
    expect(getEditorSessionDays([2, 4, 6], 3)).toEqual([2, 4, 6]);
    expect(buildEditorSessionState({ preferredDays: [2, 4, 6], trainingDays: 3, week: [exercise] }).days).toEqual([2, 4, 6]);
  });

  it("falls back to the requested number of weekdays when none are selected", () => {
    expect(getEditorSessionDays([], 4)).toEqual([1, 2, 3, 4]);
  });

  it("preserves saved session days and names when editing a programme", () => {
    const saved = [{ dayOfWeek: 2, name: "Tuesday · Strength", exercises: [exercise] }, { dayOfWeek: 6, name: "Saturday · Conditioning", exercises: [] }];
    const state = buildEditorSessionState({ preferredDays: [1, 3, 5], trainingDays: 3, week: [exercise], savedSessions: saved });
    expect(state.days).toEqual([2, 6]);
    expect(state.names).toEqual({ "2": "Tuesday · Strength", "6": "Saturday · Conditioning" });
  });

  it("maps a starter template onto the client's preferred weekdays", () => {
    const state = buildStarterTemplateState("general-strength", [2, 4, 6], 3);
    expect(state?.days).toEqual([2, 4, 6]);
    expect(Object.keys(state?.sessions ?? {})).toEqual(["2", "4", "6"]);
    expect(state?.sessions["2"][0].name).toBe("Goblet Squat");
    expect(state?.names["4"]).toContain("Thursday");
  });

  it("returns null for an unknown starter template", () => {
    expect(buildStarterTemplateState("not-a-template", [1, 3, 5], 3)).toBeNull();
  });
});
