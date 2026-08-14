import { describe, expect, it } from "vitest";

import { clientDataActionSchema } from "./data-controls";

describe("PT data deletion confirmations", () => {
  it("requires the exact PT deletion phrase", () => {
    expect(clientDataActionSchema.safeParse({ intent: "delete", confirmation: "delete pt data" }).success).toBe(false);
    expect(clientDataActionSchema.safeParse({ intent: "delete", confirmation: "DELETE PT DATA" }).success).toBe(true);
  });

  it("does not accept an unrelated confirmation", () => {
    expect(clientDataActionSchema.safeParse({ intent: "delete", confirmation: "DELETE CURRICULUM DATA" }).success).toBe(false);
  });
});
