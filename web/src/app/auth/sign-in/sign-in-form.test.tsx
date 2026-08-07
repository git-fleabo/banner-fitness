import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { sendVerificationOtp, signInWithEmailOtp, routerPush } = vi.hoisted(() => ({ sendVerificationOtp: vi.fn(), signInWithEmailOtp: vi.fn(), routerPush: vi.fn() }));

vi.mock("@/lib/auth/client", () => ({
  authClient: { emailOtp: { sendVerificationOtp }, signIn: { emailOtp: signInWithEmailOtp } },
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: routerPush }) }));

import { SignInForm } from "./sign-in-form";

describe("SignInForm", () => {
  beforeEach(() => {
    sendVerificationOtp.mockReset();
    signInWithEmailOtp.mockReset();
    routerPush.mockReset();
  });
  afterEach(() => cleanup());

  it("starts the invited passwordless email OTP flow", async () => {
    sendVerificationOtp.mockResolvedValue({ data: { success: true }, error: null });

    render(<SignInForm />);
    await userEvent.type(screen.getByLabelText("Email address"), "learner@example.com");
    await userEvent.click(screen.getByRole("button", { name: "Email me a verification code" }));

    expect(sendVerificationOtp).toHaveBeenCalledWith({
      email: "learner@example.com",
      type: "sign-in",
    });
    expect(await screen.findByRole("status")).toHaveTextContent("six-digit code");
  });

  it("shows a recoverable error when the email code cannot be sent", async () => {
    sendVerificationOtp.mockResolvedValue({ error: { status: 500 } });

    render(<SignInForm />);
    await userEvent.type(screen.getByLabelText("Email address"), "learner@example.com");
    await userEvent.click(screen.getByRole("button", { name: "Email me a verification code" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("could not complete email sign-in");
  });
});
