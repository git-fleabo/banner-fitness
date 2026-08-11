import { describe, expect, it } from "vitest";

import { buildProgrammeTask, programmePromptFilename, programmePromptTitle, promptEvidenceInstruction } from "./pt-prompt";

describe("PT AI prompt instructions", () => {
  it("uses Banner Fitness branding in generated bundles and downloads", () => {
    expect(programmePromptTitle).toContain("Banner Fitness");
    expect(programmePromptFilename).toBe("banner-fitness-pt-review");
  });

  it("asks the AI to help generate a programme when none exists", () => {
    expect(buildProgrammeTask(false)).toContain("No saved programme exists");
    expect(buildProgrammeTask(false)).toContain("Help the qualified PT draft a suitable programme");
  });

  it("keeps review mode distinct when a programme exists", () => {
    expect(buildProgrammeTask(true)).toContain("Review the current programme");
    expect(buildProgrammeTask(true)).not.toContain("No saved programme exists");
  });

  it("preserves the evidence and scope guardrails", () => {
    expect(promptEvidenceInstruction).toContain("2026 ACSM");
    expect(promptEvidenceInstruction).toContain("Do not enforce rigid rep brackets");
    expect(promptEvidenceInstruction).toContain("1RM test");
  });
});
