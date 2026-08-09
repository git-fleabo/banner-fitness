import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PrototypeOverview } from "./prototype-overview";
import { prototypeLessons } from "@/lib/content/prototype";

const lessons = prototypeLessons.map((lesson) => ({ ...lesson, versionNumber: 1 }));

describe("PrototypeOverview", () => {
  it("renders a safe empty state before any lesson is published", () => {
    render(<PrototypeOverview lessons={[]} ownerPreview={false} />);
    expect(screen.getByRole("heading", { level: 1, name: "The revision library is being prepared" })).toBeInTheDocument();
    expect(screen.getByText(/without replacing the course itself/)).toBeInTheDocument();
  });

  it("renders a revision library rather than a linear course path", () => {
    render(<PrototypeOverview lessons={lessons} ownerPreview />);
    expect(screen.getByRole("heading", { level: 1, name: "Find the area you need to strengthen." })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Revision aids by topic" })).toBeInTheDocument();
    expect(screen.getByText("Plane through; axis around. They meet at a right angle.")).toBeInTheDocument();
    expect(screen.getAllByText(/Draft aid/)).toHaveLength(5);
    expect(screen.getByRole("link", { name: "Skip to main content" })).toHaveAttribute("href", "#main-content");
  });

  it("surfaces a focused aid without forcing the next topic", () => {
    const progressLessons = lessons.map((lesson, index) => ({
      ...lesson,
      coverageState: index === 0 ? "covered" as const : "not_started" as const,
    }));
    render(<PrototypeOverview lessons={progressLessons} ownerPreview={false} />);
    expect(screen.getAllByRole("link", { name: "Open the aid →" }).some((link) => link.getAttribute("href") === "/learn/planes-and-axes")).toBe(true);
    expect(screen.queryByText(/Start the next lesson/)).not.toBeInTheDocument();
  });
});
