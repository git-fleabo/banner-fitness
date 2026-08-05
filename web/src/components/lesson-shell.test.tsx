import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import type { LessonPageData } from "@/lib/content/repository";
import { prototypeContentSeed } from "@/lib/content/prototype-seed";

import { LessonShell } from "./lesson-shell";

const seed = prototypeContentSeed.lessons[1];
const lesson: LessonPageData = {
  order: seed.order,
  slug: seed.slug,
  title: seed.title,
  outcome: seed.outcome,
  durationMinutes: seed.durationMinutes,
  mapping: seed.mapping,
  status: "draft",
  versionNumber: 1,
  objects: seed.objects.map((object, index) => ({ ...object, structuredText: object.structuredText ?? null, position: index + 1 })),
};

afterEach(cleanup);

describe("LessonShell", () => {
  it("renders the shared rhythm with an accessible current step", () => {
    render(<LessonShell lesson={lesson} requestedStep="explore" ownerPreview />);
    expect(screen.getByRole("heading", { name: seed.outcome })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Explore.*Plane-and-axis explorer/ })).toHaveAttribute("aria-current", "step");
    expect(screen.getAllByRole("status").some((status) => status.textContent?.includes("Step 3 of 6"))).toBe(true);
    expect(screen.getByText("Owner · Draft v1")).toBeInTheDocument();
  });

  it("keeps structured text and keyboard guidance available for the visual interaction", () => {
    render(<LessonShell lesson={lesson} requestedStep="explore" ownerPreview />);
    expect(screen.getByText("Open structured-text alternative")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sagittal" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("link", { name: "Apply →" })).toHaveAttribute("href", expect.stringContaining("planes-apply"));
  });
});
