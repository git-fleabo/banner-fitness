import { describe, expect, it } from "vitest";

import { progressDataActionSchema } from "./data-controls";

describe("progress data confirmations", () => {
  it("requires the exact reset phrase", () => {
    expect(progressDataActionSchema.safeParse({ intent: "reset", confirmation: "reset progress" }).success).toBe(false);
    expect(progressDataActionSchema.safeParse({ intent: "reset", confirmation: "RESET PROGRESS" }).success).toBe(true);
  });

  it("does not accept a reset confirmation for full learning-data deletion", () => {
    expect(progressDataActionSchema.safeParse({ intent: "delete", confirmation: "RESET PROGRESS" }).success).toBe(false);
    expect(progressDataActionSchema.safeParse({ intent: "delete", confirmation: "DELETE LEARNING DATA" }).success).toBe(true);
  });
});
