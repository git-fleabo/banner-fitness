import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { ExplanationDiagnosis, MixedMovementCase, MixedTransferSet, MovementDetective, PhaseDescriptionBuilder, PlaneAxisExplorer, PlaneAxisSorter, SquatJointSequence } from "./movement-interactions";

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

describe("PlaneAxisSorter", () => {
  it("classifies all three movements and explains predominant rather than exclusive plane", async () => {
    const user = userEvent.setup();
    render(<PlaneAxisSorter />);
    const sorter = screen.getByTestId("plane-axis-sorter");

    for (const [movement, plane] of [["Bodyweight squat", "Sagittal"], ["Lateral raise", "Frontal"], ["Standing torso rotation", "Transverse"]] as const) {
      expect(within(sorter).getByText(movement)).toBeInTheDocument();
      await user.click(within(sorter).getByRole("button", { name: plane }));
      await user.click(within(sorter).getByRole("button", { name: "Check predominant plane" }));
      expect(within(sorter).getByText("That matches the movement")).toBeInTheDocument();
      await user.click(within(sorter).getByRole("button", { name: /Next movement|Finish sorter/ }));
    }

    expect(within(sorter).getByText(/predominant plane/)).toBeInTheDocument();
    expect(within(sorter).getByText(/smaller components in other planes/)).toBeInTheDocument();
  });
});

describe("Lesson 3-5 authoring interactions", () => {
  it("builds all three phase descriptions with the explicit ankle return wording", async () => {
    const user = userEvent.setup();
    render(<PhaseDescriptionBuilder />);
    const builder = screen.getByTestId("phase-description-builder");
    const cards = [
      ["Descent", "Knee", "Flexion"],
      ["Descent", "Ankle", "Dorsiflexion"],
      ["Return", "Ankle", "Back towards neutral"],
    ];

    for (const [phase, joint, action] of cards) {
      await user.click(within(builder).getByRole("button", { name: phase }));
      await user.click(within(builder).getByRole("button", { name: joint }));
      await user.click(within(builder).getByRole("button", { name: action }));
      await user.click(within(builder).getByRole("button", { name: "Check description" }));
      expect(within(builder).getByText("That sentence is precise")).toBeInTheDocument();
      await user.click(within(builder).getByRole("button", { name: /Next description|Finish builder/ }));
    }

    expect(within(builder).getByText(/ankle return is described as movement back towards neutral/)).toBeInTheDocument();
  });

  it("moves the detective through evidence fields and diagnoses precise explanations", async () => {
    const user = userEvent.setup();
    render(<MovementDetective />);
    const detective = screen.getByTestId("movement-detective");

    await user.click(within(detective).getByRole("button", { name: "Knee" }));
    await user.click(within(detective).getByRole("button", { name: "Check observation" }));
    await user.click(within(detective).getByRole("button", { name: "Next observation" }));
    expect(within(detective).getByText("Which phase is shown?")).toBeInTheDocument();

    cleanup();
    render(<ExplanationDiagnosis />);
    const diagnosis = screen.getByTestId("explanation-diagnosis");
    await user.click(within(diagnosis).getByRole("button", { name: /During the descent, the knee/ }));
    await user.click(within(diagnosis).getByRole("button", { name: "Check explanation" }));
    expect(within(diagnosis).getByText("That explanation carries the evidence")).toBeInTheDocument();
  });

  it("completes the mixed six-step case and fresh transfer set", async () => {
    const user = userEvent.setup();
    render(<MixedMovementCase />);
    const mixed = screen.getByTestId("mixed-movement-case");
    const answers = ["The client's left", "Proximal", "Sagittal", "Medio-lateral", "Hip flexion and knee flexion", "During descent, the knee moves into flexion as its angle decreases"];

    for (const answer of answers) {
      await user.click(within(mixed).getByRole("button", { name: answer }));
      await user.click(within(mixed).getByRole("button", { name: "Check case step" }));
      await user.click(within(mixed).getByRole("button", { name: /Next case step|Finish case/ }));
    }
    expect(within(mixed).getByText(/Check again soon: matching planes and axes/)).toBeInTheDocument();

    cleanup();
    render(<MixedTransferSet />);
    const transfer = screen.getByTestId("mixed-transfer-set");
    await user.click(within(transfer).getByRole("button", { name: /Shoulder abduction/ }));
    await user.click(within(transfer).getByRole("button", { name: "Check transfer" }));
    expect(within(transfer).getByText("The method transfers")).toBeInTheDocument();
  });
});
