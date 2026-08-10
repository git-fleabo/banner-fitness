import { describe, expect, it } from "vitest";

import { checkProgrammeQuality, evaluateProgression, getScreeningFlags } from "./pt-programming";

describe("PT screening", () => {
  it("flags symptoms without diagnosing", () => {
    const flags = getScreeningFlags({ chestPain: true, dizzinessOrFainting: true });
    expect(flags.map((flag) => flag.code)).toEqual(["medical-clearance", "symptom-assessment"]);
    expect(flags.every((flag) => !flag.label.toLowerCase().includes("diagnos"))).toBe(true);
  });
});

describe("programme quality", () => {
  it("warns when pressing volume is not balanced", () => {
    const result = checkProgrammeQuality({ goal: "general strength", trainingDays: 2, experience: "intermediate", availableEquipment: ["Dumbbells"], sessions: [{ name: "Upper", dayOfWeek: 1, durationMinutes: 45, targetDurationMinutes: 45, exercises: [{ name: "Press", pattern: "Horizontal push", equipment: ["Dumbbells"], technicalComplexity: "low", primaryMuscles: ["chest"], sets: 3 }, { name: "Press 2", pattern: "Vertical push", equipment: ["Dumbbells"], technicalComplexity: "low", primaryMuscles: ["shoulders"], sets: 3 }, { name: "Press 3", pattern: "Horizontal push", equipment: ["Dumbbells"], technicalComplexity: "low", primaryMuscles: ["chest"], sets: 3 }] }], });
    expect(result.warnings.some((warning) => warning.code === "push-pull-balance")).toBe(true);
  });
});

describe("progression", () => {
  it("progresses only when the full top range is achieved", () => {
    expect(evaluateProgression({ prescribedSets: 2, repsMin: 8, repsMax: 10, targetRir: 2, loadKg: 20, completed: [{ reps: 10, rir: 2, techniqueAcceptable: true, painReported: false }, { reps: 10, rir: 3, techniqueAcceptable: true, painReported: false }] })).toMatchObject({ action: "progress", nextLoadKg: 22.5 });
  });

  it("holds progression when pain is reported", () => {
    expect(evaluateProgression({ prescribedSets: 2, repsMin: 8, repsMax: 10, targetRir: 2, loadKg: 20, completed: [{ reps: 10, rir: 2, techniqueAcceptable: true, painReported: true }] }).action).toBe("hold");
  });
});
