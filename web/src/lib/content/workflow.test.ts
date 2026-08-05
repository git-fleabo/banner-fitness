import { describe, expect, it } from "vitest";

import { reviewTransitionError } from "./workflow";

const ready = {
  currentStatus: "in_review" as const,
  targetStatus: "approved" as const,
  rationale: "Sources and learning design checked.",
  sourcesComplete: true,
  hasMappingUncertainty: false,
  mappingAcknowledged: false,
  hasApprovedDecision: false,
};

describe("reviewTransitionError", () => {
  it("requires explicit acknowledgement of recorded mapping uncertainty", () => {
    expect(reviewTransitionError({ ...ready, hasMappingUncertainty: true })).toMatch(/acknowledged/);
    expect(reviewTransitionError({ ...ready, hasMappingUncertainty: true, mappingAcknowledged: true })).toBeNull();
  });

  it("blocks publication without both approved status and an approval decision", () => {
    expect(reviewTransitionError({ ...ready, targetStatus: "published" })).toMatch(/approved content/);
    expect(reviewTransitionError({ ...ready, currentStatus: "approved", targetStatus: "published" })).toMatch(/decision/);
    expect(reviewTransitionError({ ...ready, currentStatus: "approved", targetStatus: "published", hasApprovedDecision: true })).toBeNull();
  });
});
