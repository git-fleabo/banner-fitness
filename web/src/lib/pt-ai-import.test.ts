import { describe, expect, it } from "vitest";

import { buildImportDiff, parseAiProgrammeImport, toEditorSessions } from "./pt-ai-import";

const validResponse = {
  format: "banner-fitness-programme-draft",
  schemaVersion: "1",
  source: { tool: "Test AI", generatedAt: "2026-08-12" },
  programme: {
    goalSummary: "General strength",
    sessionDurationMinutes: 45,
    sessions: [
      { dayOfWeek: 1, name: "Full body strength", exercises: [{ name: "Goblet Squat", pattern: "Knee dominant", target: "Quads", equipment: "Dumbbells", sets: 3, repsMin: 8, repsMax: 12, intensityValue: "2 RIR", restSeconds: 90 }] },
      { dayOfWeek: 3, name: "Full body strength", exercises: [{ name: "DB Bench Press", pattern: "Horizontal push", target: "Chest", equipment: "Dumbbells", sets: 3, repsMin: 8, repsMax: 12, intensityValue: "2 RIR", restSeconds: 90 }] },
    ],
  },
};

describe("AI programme import contract", () => {
  it("parses direct and fenced JSON into editor sessions", () => {
    const direct = parseAiProgrammeImport(validResponse);
    const fenced = parseAiProgrammeImport(`Here is the draft:\n\n\`\`\`json\n${JSON.stringify(validResponse)}\n\`\`\``);
    expect(toEditorSessions(direct)[0].exercises[0].prescription).toBe("3 × 8–12");
    expect(fenced.programme.sessions).toHaveLength(2);
  });

  it("rejects the wrong format, duplicate days and invalid rep ranges", () => {
    expect(() => parseAiProgrammeImport({ ...validResponse, format: "other" })).toThrow();
    expect(() => parseAiProgrammeImport({ ...validResponse, programme: { ...validResponse.programme, sessions: [{ ...validResponse.programme.sessions[0], dayOfWeek: 1 }, { ...validResponse.programme.sessions[1], dayOfWeek: 1 }] } })).toThrow("different dayOfWeek");
    expect(() => parseAiProgrammeImport({ ...validResponse, programme: { ...validResponse.programme, sessions: [{ ...validResponse.programme.sessions[0], exercises: [{ ...validResponse.programme.sessions[0].exercises[0], repsMin: 13, repsMax: 8 }] }] } })).toThrow("repsMax");
  });

  it("builds a review diff without mutating the existing programme", () => {
    const imported = toEditorSessions(parseAiProgrammeImport(validResponse));
    const diff = buildImportDiff([{ dayOfWeek: 1, name: "Old session", exercises: [{ name: "Goblet Squat" }] }], imported);
    expect(diff.isNewProgramme).toBe(false);
    expect(diff.changedSessionCount).toBe(2);
    expect(diff.importedExerciseCount).toBe(2);
  });
});

