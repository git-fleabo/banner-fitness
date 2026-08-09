import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/app/learn/actions", () => ({
  completeLesson: vi.fn(),
  recordPracticeAttempt: vi.fn(),
}));

import { completeLesson, recordPracticeAttempt } from "@/app/learn/actions";
import { prototypeContentSeed } from "@/lib/content/prototype-seed";

import { LessonClose, QuestionPractice } from "./learning-evidence";

const question = prototypeContentSeed.lessons[1].objects.find((object) => object.type === "check")!.questions[0];
const questions = [{ ...question, position: 1 }];
const mixedCheck = prototypeContentSeed.lessons[4].objects.find((object) => object.type === "check")!;
const variation = mixedCheck.questions.find((item) => item.response.variationOf);
const baseQuestion = mixedCheck.questions.find((item) => item.stableKey === variation?.response.variationOf);

afterEach(cleanup);
beforeEach(() => vi.clearAllMocks());

describe("QuestionPractice", () => {
  it("records an attempt and explains its revision recommendation", async () => {
    vi.mocked(recordPracticeAttempt).mockResolvedValue({
      feedbackCategory: "misconception",
      result: "The axis is perpendicular to the plane.",
      nextAction: "inspect_visual",
      revision: { reason: "misconception", dueAt: "2026-08-06T12:00:00.000Z", explanation: "Recommended because this matched plane equals axis." },
      revisionCompleted: false,
      attemptedAt: "2026-08-05T12:00:00.000Z",
    });
    const user = userEvent.setup();
    render(<QuestionPractice lessonSlug="planes-and-axes" questions={questions} />);

    await user.click(screen.getByRole("button", { name: "Anterior-posterior axis" }));
    await user.click(screen.getByRole("button", { name: "Check answer" }));

    expect(recordPracticeAttempt).toHaveBeenCalledWith({ lessonSlug: "planes-and-axes", questionStableKey: question.stableKey, selected: ["ap"] });
    expect(await screen.findByText("Added to revision")).toBeInTheDocument();
    expect(screen.getByText(/change this in the review queue/)).toBeInTheDocument();
  });

  it("restores a submitted selection and identifies its recorded evidence", () => {
    render(<QuestionPractice lessonSlug="planes-and-axes" questions={questions} resumeState={{
      stepStableKey: "check",
      questionStableKey: question.stableKey,
      selected: ["ap"],
      submitted: true,
      evidenceRecorded: true,
      feedbackCategory: "misconception",
    }} />);

    expect(screen.getByRole("button", { name: "Anterior-posterior axis" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText(/submitted and recorded as practice evidence/)).toBeInTheDocument();
  });

  it("opens a changed question for a targeted revisit and clears it after success", async () => {
    if (!variation || !baseQuestion) throw new Error("The mixed seed must include a question variation.");
    vi.mocked(recordPracticeAttempt).mockResolvedValue({
      feedbackCategory: "correct",
      result: "The changed viewpoint still uses the subject's left.",
      nextAction: "retry",
      revision: undefined,
      revisionCompleted: true,
      attemptedAt: "2026-08-05T12:00:00.000Z",
    });
    const user = userEvent.setup();
    render(<QuestionPractice lessonSlug="mixed-movement-challenge" questions={[{ ...baseQuestion, position: 1 }, { ...variation, position: 2 }]} revisionQuestionStableKey={baseQuestion.stableKey} revisionId="00000000-0000-4000-8000-000000000123" />);

    expect(screen.getByText("Targeted revisit")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: variation.prompt })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: variation.response.choices![0].label }));
    await user.click(screen.getByRole("button", { name: "Check answer" }));

    expect(recordPracticeAttempt).toHaveBeenCalledWith({ lessonSlug: "mixed-movement-challenge", questionStableKey: variation.stableKey, selected: [variation.response.choices![0].id], reviewId: "00000000-0000-4000-8000-000000000123" });
    expect(screen.getByText("Targeted revisit completed")).toBeInTheDocument();
  });
});

describe("LessonClose", () => {
  it("records optional confidence while keeping coverage separate from security", async () => {
    vi.mocked(completeLesson).mockResolvedValue({ completedAt: "2026-08-05T12:00:00.000Z", confidence: 4, securityState: "Not yet secure" });
    const user = userEvent.setup();
    render(<LessonClose lessonSlug="planes-and-axes" />);

    await user.click(screen.getByRole("button", { name: "4" }));
    await user.click(screen.getByRole("button", { name: "Mark lesson covered" }));
    expect(completeLesson).toHaveBeenCalledWith({ lessonSlug: "planes-and-axes", confidence: 4 });
    expect(await screen.findByRole("heading", { name: "Coverage recorded—not yet secure" })).toBeInTheDocument();
  });

  it("shows persisted coverage without asking the learner to complete the lesson again", () => {
    render(<LessonClose lessonSlug="planes-and-axes" completed confidence={4} />);
    expect(screen.getByRole("heading", { name: "Coverage recorded—not yet secure" })).toBeInTheDocument();
    expect(screen.getByText("Your optional confidence: 4 of 5.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Mark lesson covered" })).not.toBeInTheDocument();
  });
});
