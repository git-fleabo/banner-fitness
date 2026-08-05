import { describe, expect, it } from "vitest";

import { canAccessOwnedRecord, canReviewContent } from "./policy";

const learner = { authUserId: "learner-1", role: "learner", status: "active" } as const;
const owner = { authUserId: "owner-1", role: "owner", status: "active" } as const;

describe("authorization policy", () => {
  it("limits an active learner to their own records", () => {
    expect(canAccessOwnedRecord(learner, "learner-1")).toBe(true);
    expect(canAccessOwnedRecord(learner, "learner-2")).toBe(false);
  });

  it("allows an active owner to review content and inspect learner records", () => {
    expect(canReviewContent(owner)).toBe(true);
    expect(canAccessOwnedRecord(owner, "learner-1")).toBe(true);
  });

  it("denies blocked accounts regardless of role", () => {
    expect(canReviewContent({ ...owner, status: "blocked" })).toBe(false);
    expect(canAccessOwnedRecord({ ...learner, status: "blocked" }, "learner-1")).toBe(false);
  });
});
