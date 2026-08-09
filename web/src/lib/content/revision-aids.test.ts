import { describe, expect, it } from "vitest";

import { revisionAidFor, revisionAidProfiles } from "./revision-aids";

describe("revision aid profiles", () => {
  it("gives every draft topic a complete memory and retrieval frame", () => {
    expect(revisionAidProfiles).toHaveLength(5);
    for (const profile of revisionAidProfiles) {
      expect(profile.shortDescription).toBeTruthy();
      expect(profile.memoryCue).toBeTruthy();
      expect(profile.commonTraps.length).toBeGreaterThanOrEqual(3);
      expect(profile.quickCheckPrompt).toBeTruthy();
      expect(profile.revisitSignal).toBeTruthy();
      expect(profile.aidTypes.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("provides a safe fallback for future topics", () => {
    expect(revisionAidFor("future-topic").quickCheckPrompt).toBeTruthy();
  });
});
