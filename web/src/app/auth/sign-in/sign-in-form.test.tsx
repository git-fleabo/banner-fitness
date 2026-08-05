import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { signInWithGoogle } = vi.hoisted(() => ({ signInWithGoogle: vi.fn() }));

vi.mock("@/lib/auth/client", () => ({
  authClient: { signIn: { social: signInWithGoogle } },
}));

import { SignInForm } from "./sign-in-form";

describe("SignInForm", () => {
  beforeEach(() => signInWithGoogle.mockReset());

  it("starts the invited Google sign-in flow", async () => {
    signInWithGoogle.mockResolvedValue({ error: null });

    render(<SignInForm />);
    await userEvent.click(screen.getByRole("button", { name: "Continue with Google" }));

    expect(signInWithGoogle).toHaveBeenCalledWith({
      provider: "google",
      callbackURL: "/learn",
      errorCallbackURL: "/auth/sign-in?error=google",
    });
  });

  it("shows a recoverable error when Google sign-in cannot start", async () => {
    signInWithGoogle.mockResolvedValue({ error: { status: 500 } });

    render(<SignInForm />);
    await userEvent.click(screen.getByRole("button", { name: "Continue with Google" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Sign-in is temporarily unavailable");
  });
});
