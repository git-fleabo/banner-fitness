import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { PrototypeOverview } from "./prototype-overview";
import { prototypeLessons } from "@/lib/content/prototype";

const lessons = prototypeLessons.map((lesson) => ({ ...lesson, versionNumber: 1 }));

afterEach(cleanup);

describe("PrototypeOverview", () => {
  it("renders a safe empty state before any lesson is published", () => {
    render(<PrototypeOverview lessons={[]} ownerPreview={false} />);
    expect(screen.getByRole("heading", { level: 1, name: "The revision library is being prepared" })).toBeInTheDocument();
    expect(screen.getByText(/without replacing the course itself/)).toBeInTheDocument();
  });

  it("renders a revision library rather than a linear course path", () => {
    render(<PrototypeOverview lessons={lessons} ownerPreview />);
    expect(screen.getByRole("heading", { level: 1, name: "Find the area you need to strengthen." })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Find the aid you need today." })).toBeInTheDocument();
    expect(screen.getByText("Plane through; axis around. They meet at a right angle.")).toBeInTheDocument();
    expect(screen.getAllByText("Not started", { selector: "div" })).toHaveLength(5);
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

  it("finds weak areas by concept and filters their state", async () => {
    const user = userEvent.setup();
    render(<PrototypeOverview lessons={lessons.map((lesson, index) => ({ ...lesson, coverageState: index === 0 ? "in_progress" as const : "not_started" as const, confidence: index === 0 ? 2 : null, dueReviewCount: index === 0 ? 1 : 0 }))} ownerPreview={false} />);

    const search = screen.getByLabelText("Search concepts, cues or traps");
    const library = screen.getByRole("region", { name: "Find the aid you need today." });
    await user.type(search, "viewpoint");
    expect(within(library).getByRole("heading", { name: "Anatomical position and directional terms" })).toBeInTheDocument();
    expect(within(library).queryByRole("heading", { name: "Planes and axes" })).not.toBeInTheDocument();

    await user.clear(search);
    await user.selectOptions(screen.getByLabelText("Show"), "due");
    expect(within(library).getAllByText("1 due revisit")).toHaveLength(1);
    expect(within(library).getByRole("heading", { name: "Anatomical position and directional terms" })).toBeInTheDocument();
  });
});
