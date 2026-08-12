import { describe, expect, it } from "vitest";

import { parsePrescriptionSetCount, readAssessmentNotes } from "./pt-data";

describe("PT shared data parsing", () => {
  it("reads assessment notes consistently and safely", () => {
    expect(readAssessmentNotes({ injuryNotes: " Shoulder pain ", contraindicationNotes: 4 })).toEqual({ injuryNotes: "Shoulder pain", contraindicationNotes: null });
    expect(readAssessmentNotes(null)).toEqual({ injuryNotes: null, contraindicationNotes: null });
  });

  it.each([["3 × 8–12", 3], ["4 x 10", 4], ["2 sets", 2], ["not recorded", null] as const])("parses %s", (value, count) => {
    expect(parsePrescriptionSetCount(value)).toBe(count);
  });
});
