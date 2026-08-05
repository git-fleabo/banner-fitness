import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { PlaneAxisExplorer, SquatJointSequence } from "./movement-interactions";

afterEach(cleanup);

describe("PlaneAxisExplorer", () => {
  it("updates plane and axis together and explains a correct pairing", async () => {
    const user = userEvent.setup();
    render(<PlaneAxisExplorer />);

    await user.click(screen.getByRole("button", { name: "Frontal" }));
    expect(screen.getByRole("button", { name: "Frontal" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText(/Showing Frontal with its anterior-posterior axis/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Anterior-posterior" }));
    await user.click(screen.getByRole("button", { name: "Check pairing" }));
    expect(screen.getByText("Correct")).toBeInTheDocument();
  });

  it("preserves the valid part of a reversed pairing and allows retry", async () => {
    const user = userEvent.setup();
    render(<PlaneAxisExplorer />);
    await user.click(screen.getByRole("button", { name: "Longitudinal" }));
    await user.click(screen.getByRole("button", { name: "Check pairing" }));
    expect(screen.getByText("Partly correct")).toBeInTheDocument();
    expect(screen.getByText(/real anatomical axis/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry pairing" })).toBeEnabled();
  });

  it("operates the native plane controls with keyboard focus and Enter", async () => {
    const user = userEvent.setup();
    render(<PlaneAxisExplorer />);
    const sagittal = screen.getByRole("button", { name: "Sagittal" });
    const frontal = screen.getByRole("button", { name: "Frontal" });

    await user.tab();
    expect(sagittal).toHaveFocus();
    await user.tab();
    expect(frontal).toHaveFocus();
    await user.keyboard("{Enter}");

    expect(frontal).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText(/Showing Frontal with its anterior-posterior axis/)).toBeInTheDocument();
  });
});

describe("SquatJointSequence", () => {
  it("keeps stage and joint explicit and identifies the muscle-action misconception", async () => {
    const user = userEvent.setup();
    render(<SquatJointSequence />);
    const lab = screen.getByTestId("squat-joint-sequence");

    await user.click(within(lab).getByRole("button", { name: "Lower" }));
    await user.click(within(lab).getByRole("button", { name: "Quadriceps contraction" }));
    await user.click(within(lab).getByRole("button", { name: "Check action" }));
    expect(within(lab).getByText("Needs another look")).toBeInTheDocument();
    expect(within(lab).getByText(/joint action and muscle action/)).toBeInTheDocument();

    await user.click(within(lab).getByRole("button", { name: "Retry action" }));
    await user.click(within(lab).getByRole("button", { name: "Flexion" }));
    await user.click(within(lab).getByRole("button", { name: "Check action" }));
    expect(within(lab).getByText("Correct")).toBeInTheDocument();
    expect(within(lab).getByText(/During the descent, the knee moves into flexion/)).toBeInTheDocument();
  });
});
