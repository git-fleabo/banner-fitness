import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { AnatomicalPositionLab, DirectionalComparisonBuilder } from "./lesson-activities";

afterEach(cleanup);

describe("AnatomicalPositionLab", () => {
  it("keeps the figure view explicit and checks the defining reference features", async () => {
    const user = userEvent.setup();
    render(<AnatomicalPositionLab />);

    await user.click(screen.getByRole("button", { name: "Back view" }));
    expect(screen.getByRole("button", { name: "Back view" })).toHaveAttribute("aria-pressed", "true");
    for (const feature of ["The subject stands upright", "The subject faces forward", "The arms rest by the sides", "The palms face forward"]) await user.click(screen.getByRole("button", { name: feature }));
    await user.click(screen.getByRole("button", { name: "Check the features" }));
    expect(screen.getByText("That is the reference position")).toBeInTheDocument();
  });

  it("names viewer-left as a targeted misconception and offers retry", async () => {
    const user = userEvent.setup();
    render(<AnatomicalPositionLab />);
    await user.click(screen.getByRole("button", { name: "Use screen-left" }));
    await user.click(screen.getByRole("button", { name: "Check the viewpoint" }));
    expect(screen.getByText("Viewer-left is a tempting shortcut")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry the viewpoint" })).toBeInTheDocument();
  });
});

describe("DirectionalComparisonBuilder", () => {
  it("walks through all five comparisons and explains the squat transfer", async () => {
    const user = userEvent.setup();
    render(<DirectionalComparisonBuilder />);
    const answers = ["Proximal", "Medial", "Superficial", "Posterior", "Deep"];

    for (const [index, answer] of answers.entries()) {
      expect(screen.getByText(`Apply the reference · ${index + 1} of 5`)).toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: answer }));
      await user.click(screen.getByRole("button", { name: "Check comparison" }));
      await user.click(screen.getByRole("button", { name: index === answers.length - 1 ? "Finish comparisons" : "Next comparison" }));
    }

    expect(screen.getByRole("heading", { name: "The reference follows the body into a new pose." })).toBeInTheDocument();
    expect(screen.getByText("Transfer to the squat")).toBeInTheDocument();
  });
});
