import { describe, expect, it } from "vitest";

import { evaluateProgression, getScreeningFlags } from "./pt-programming";

describe("PT screening", () => {
  it("flags symptoms without diagnosing", () => {
    const flags = getScreeningFlags({ chestPain: true, dizzinessOrFainting: true });
    expect(flags.map((flag) => flag.code)).toEqual(["medical-clearance", "symptom-assessment"]);
    expect(flags.every((flag) => !flag.label.toLowerCase().includes("diagnos"))).toBe(true);
  });
});

describe("progression", () => {
  it("does not recommend progression when no sets were completed", () => {
    expect(evaluateProgression({ prescribedSets: 2, repsMin: 8, repsMax: 10, targetRir: 2, completed: [] }).action).toBe("no-data");
  });
  it("progresses only when the full top range is achieved", () => {
    expect(evaluateProgression({ prescribedSets: 2, repsMin: 8, repsMax: 10, targetRir: 2, loadKg: 20, completed: [{ reps: 10, rir: 2, techniqueAcceptable: true, painReported: false }, { reps: 10, rir: 3, techniqueAcceptable: true, painReported: false }] })).toMatchObject({ action: "progress", nextLoadKg: 22.5 });
  });

  it("holds progression when pain is reported", () => {
    expect(evaluateProgression({ prescribedSets: 2, repsMin: 8, repsMax: 10, targetRir: 2, loadKg: 20, completed: [{ reps: 10, rir: 2, techniqueAcceptable: true, painReported: true }] }).action).toBe("hold");
  });
});
