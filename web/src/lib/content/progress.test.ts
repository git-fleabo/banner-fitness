import { describe, expect, it } from "vitest";

import { lessonResumeStateSchema, parseLessonResumeState } from "./progress";

describe("lesson progress resume state", () => {
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
