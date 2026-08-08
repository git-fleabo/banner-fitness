import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { fetchMock, signInWithEmailOtp, routerPush } = vi.hoisted(() => ({ fetchMock: vi.fn(), signInWithEmailOtp: vi.fn(), routerPush: vi.fn() }));

vi.mock("@/lib/auth/client", () => ({
  authClient: { signIn: { emailOtp: signInWithEmailOtp } },
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: routerPush }) }));

import { SignInForm } from "./sign-in-form";

describe("SignInForm", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    signInWithEmailOtp.mockReset();
    routerPush.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("starts the invited passwordless email OTP flow", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ success: true }) });

    render(<SignInForm />);
    await userEvent.type(screen.getByLabelText("Email address"), "learner@example.com");
    await userEvent.click(screen.getByRole("button", { name: "Email me a verification code" }));

    expect(fetchMock).toHaveBeenCalledWith("/api/auth/email-otp/send-verification-otp", {
      method: "POST",
      headers: { accept: "application/json", "content-type": "application/json" },
      credentials: "same-origin",
      cache: "no-store",
      body: JSON.stringify({ email: "learner@example.com", type: "sign-in" }),
    });
    expect(await screen.findByRole("status")).toHaveTextContent("six-digit code");
  });

  it("shows a recoverable error when the email code cannot be sent", async () => {
    fetchMock.mockResolvedValue({ ok: false, json: async () => ({ message: "Email provider unavailable" }) });

    render(<SignInForm />);
    await userEvent.type(screen.getByLabelText("Email address"), "learner@example.com");
    await userEvent.click(screen.getByRole("button", { name: "Email me a verification code" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("could not complete email sign-in");
  });
});
