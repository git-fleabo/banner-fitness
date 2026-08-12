import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./actions", () => ({
  deleteProgrammeTemplateAction: vi.fn(),
  listProgrammeTemplatesAction: vi.fn().mockResolvedValue([]),
  saveProgrammeAction: vi.fn().mockResolvedValue({ version: 1 }),
  saveProgrammeTemplateAction: vi.fn(),
}));

import { buildEditorSessionState, buildProgrammeTemplateState, buildStarterTemplateState, buildWeekPreview, copySessionToDay, getEditorSessionDays } from "@/lib/programme-editor";
import { saveProgrammeAction } from "./actions";
import { SessionEditorModal } from "./designer-support";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

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

  it("maps a saved custom template without changing its exercise snapshot", () => {
    const custom = { id: "custom-1", label: "My template", description: "", goal: "General fitness", sessions: [{ name: "Custom A", exercises: [exercise] }] };
    const state = buildProgrammeTemplateState(custom, [5, 7], 2);
    expect(state.days).toEqual([5, 7]);
    expect(state.names).toEqual({ "5": "Friday · Custom A", "7": "Sunday · Custom A" });
    expect(state.sessions["5"][0]).toEqual(exercise);
  });

  it("copies a session to another scheduled day without mutating the source", () => {
    const state = buildEditorSessionState({ preferredDays: [1, 3], trainingDays: 2, week: [exercise] });
    const copied = copySessionToDay({ ...state, sourceDay: 1, targetDay: 3 });
    expect(copied.sessions["3"]).toEqual(copied.sessions["1"]);
    expect(copied.sessions["3"]).not.toBe(copied.sessions["1"]);
    expect(copied.names["3"]).toContain("Wednesday");
    expect(copied.names["1"]).toContain("Monday");
  });

  it("builds a reviewable week preview with exercise and set totals", () => {
    const preview = buildWeekPreview({ days: [2, 4], sessions: { "2": [exercise], "4": [] }, names: { "2": "Tuesday · Strength", "4": "Thursday · Conditioning" } });
    expect(preview.map((session) => session.label)).toEqual(["Tuesday", "Thursday"]);
    expect(preview[0].exerciseCount).toBe(1);
    expect(preview[0].totalSets).toBe(3);
    expect(preview[1].exerciseCount).toBe(0);
  });

  it("closes before refreshing the parent after saving a draft", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ exercises: [] }) }));
    const lifecycle: string[] = [];

    render(<SessionEditorModal clientId="client-1" clientName="Test Client" goal="General strength" days={1} preferredDays={[1]} week={[exercise]} onClose={() => lifecycle.push("close")} onSaved={() => lifecycle.push("refresh")} notify={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Preview week & save →" }));
    await user.click(screen.getByRole("button", { name: "Save as new version →" }));

    expect(saveProgrammeAction).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(lifecycle).toEqual(["close", "refresh"]));
  });
});
