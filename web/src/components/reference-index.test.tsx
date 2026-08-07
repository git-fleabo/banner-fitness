import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ReferenceIndex } from "./reference-index";

const terms = [
  { slug: "axis", term: "Axis", definition: "A line around which movement rotates.", status: "draft" as const, versionNumber: 1, sourceTitle: "Prototype learning plan", sourceLocation: "PT_LEARNING_LAB_PROTOTYPE_LEARNING_PLAN.md" },
  { slug: "flexion", term: "Flexion", definition: "A joint action that usually decreases the angle.", status: "draft" as const, versionNumber: 1, sourceTitle: "Module 2 course book", sourceLocation: "Module 2/L3 Module 2.pdf" },
];

describe("ReferenceIndex", () => {
  afterEach(cleanup);

  it("shows the selected definition and source record", () => {
    render(<ReferenceIndex terms={terms} selectedSlug="flexion" ownerPreview />);
    expect(screen.getByRole("heading", { name: "Flexion" })).toBeInTheDocument();
    expect(screen.getByText("Module 2 course book")).toBeInTheDocument();
    expect(screen.getByText("Owner draft preview")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Flexion/ })).toHaveAttribute("aria-current", "page");
  });

  it("filters terms without hiding the current search from the form", () => {
    render(<ReferenceIndex terms={terms} query="axis" ownerPreview />);
    expect(screen.getByDisplayValue("axis")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /Axis/ }).some((link) => link.getAttribute("aria-current") === "page")).toBe(true);
    expect(screen.queryByRole("link", { name: /Flexion/ })).not.toBeInTheDocument();
  });
});
