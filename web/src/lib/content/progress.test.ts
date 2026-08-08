import { describe, expect, it } from "vitest";

import { hasRecordedEvidence, lessonResumeStateSchema, parseLessonResumeState } from "./progress";

describe("lesson progress resume state", () => {
  it("only treats a submitted check as recorded learning evidence", () => {
    expect(hasRecordedEvidence({ stepStableKey: "check", submitted: true, evidenceRecorded: true })).toBe(true);
    expect(hasRecordedEvidence({ stepStableKey: "check", submitted: true })).toBe(false);
    expect(hasRecordedEvidence(null)).toBe(false);
  });

  it("accepts a step-only position before practice evidence exists", () => {
    expect(parseLessonResumeState({ stepStableKey: "planes-explore" })).toEqual({ stepStableKey: "planes-explore" });
  });

  it("keeps submitted evidence and completed coverage states parseable", () => {
    expect(parseLessonResumeState({ stepStableKey: "check", questionStableKey: "q-1", selected: ["answer"], submitted: true, evidenceRecorded: true, feedbackCategory: "misconception" })).toMatchObject({ submitted: true, feedbackCategory: "misconception" });
    expect(parseLessonResumeState({ stepStableKey: "close", complete: true, confidence: 4 })).toEqual({ stepStableKey: "close", complete: true, confidence: 4 });
    expect(parseLessonResumeState({ complete: true, confidence: 3 })).toEqual({ stepStableKey: "close", complete: true, confidence: 3 });
  });

  it("rejects progress without a resumable step", () => {
    expect(lessonResumeStateSchema.safeParse({ complete: true }).success).toBe(false);
  });
});
