import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PrototypeOverview } from "./prototype-overview";
import { prototypeLessons } from "@/lib/content/prototype";

const lessons = prototypeLessons.map((lesson) => ({ ...lesson, versionNumber: 1 }));

describe("PrototypeOverview", () => {
  it("renders the approved prototype path and learner outcome", () => {
    render(<PrototypeOverview lessons={lessons} ownerPreview />);
    expect(screen.getByRole("heading", { level: 1, name: "Anatomical position and directional terms" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Use anatomical position as a shared reference/ })).toBeInTheDocument();
    expect(screen.getAllByText(/Draft/)).toHaveLength(5);
    expect(screen.getByRole("link", { name: "Skip to main content" })).toHaveAttribute("href", "#main-content");
  });

  it("starts the next unfinished lesson after coverage is recorded", () => {
    const progressLessons = lessons.map((lesson, index) => ({
      ...lesson,
      coverageState: index === 0 ? "covered" as const : "not_started" as const,
    }));
    render(<PrototypeOverview lessons={progressLessons} ownerPreview={false} />);
    expect(screen.getAllByRole("link", { name: /Start the next lesson/ }).some((link) => link.getAttribute("href") === "/learn/planes-and-axes")).toBe(true);
  });
});
