import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { signInWithMagicLink } = vi.hoisted(() => ({ signInWithMagicLink: vi.fn() }));

vi.mock("@/lib/auth/client", () => ({
  authClient: { signIn: { magicLink: signInWithMagicLink } },
}));

import { SignInForm } from "./sign-in-form";

describe("SignInForm", () => {
  beforeEach(() => signInWithMagicLink.mockReset());
  afterEach(() => cleanup());

  it("starts the invited passwordless email flow", async () => {
    signInWithMagicLink.mockResolvedValue({ data: { status: true }, error: null });

    render(<SignInForm />);
    await userEvent.type(screen.getByLabelText("Email address"), "learner@example.com");
    await userEvent.click(screen.getByRole("button", { name: "Email me a sign-in link" }));

    expect(signInWithMagicLink).toHaveBeenCalledWith({
      email: "learner@example.com",
      callbackURL: "/learn",
      errorCallbackURL: "/auth/sign-in?error=email",
    });
    expect(await screen.findByRole("status")).toHaveTextContent("Check your inbox");
  });

  it("shows a recoverable error when the email link cannot be sent", async () => {
    signInWithMagicLink.mockResolvedValue({ error: { status: 500 } });

    render(<SignInForm />);
    await userEvent.type(screen.getByLabelText("Email address"), "learner@example.com");
    await userEvent.click(screen.getByRole("button", { name: "Email me a sign-in link" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("could not send the sign-in link");
  });
});
