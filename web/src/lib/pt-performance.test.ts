import { describe, expect, it } from "vitest";

import { defaultEffortForExperience, performanceBaselineText, remapSessionDays } from "./pt-performance";

describe("client performance helpers", () => {
  it("formats 1RM, estimated 1RM and rep-max observations without treating them as prescriptions", () => {
    expect(performanceBaselineText({ metricType: "one_rm", value: "100", unit: "kg", repetitions: null, loadKg: null })).toBe("100 kg 1RM");
    expect(performanceBaselineText({ metricType: "estimated_one_rm", value: 82.5, unit: "kg", repetitions: null, loadKg: null })).toBe("82.5 kg estimated 1RM");
    expect(performanceBaselineText({ metricType: "rep_max", value: 5, unit: "reps", repetitions: 5, loadKg: "75" })).toBe("75 kg × 5 rep max");
  });

  it("remaps generated sessions onto the client's current preferred days", () => {
    expect(remapSessionDays({ "1": ["A"], "3": ["B"], "5": ["C"] }, [1, 3, 5], [2, 4, 6])).toEqual({ "2": ["A"], "4": ["B"], "6": ["C"] });
  });

  it("rejects mismatched source and target day mappings", () => {
    expect(() => remapSessionDays({}, [1], [2, 4])).toThrow("same length");
  });

  it("uses a more conservative default effort for a beginner without requiring failure", () => {
    expect(defaultEffortForExperience("Beginner resistance training")).toBe("3 RIR");
    expect(defaultEffortForExperience("Intermediate")).toBe("2 RIR");
    expect(defaultEffortForExperience(null)).toBe("2 RIR");
  });
});
