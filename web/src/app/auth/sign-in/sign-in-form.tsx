"use client";

import { useState } from "react";

import { authClient } from "@/lib/auth/client";

import styles from "./sign-in.module.css";

type SignInState = "idle" | "redirecting" | "sent" | "error";

export function SignInForm() {
  const [state, setState] = useState<SignInState>("idle");
  const [email, setEmail] = useState("");

  async function handleSignIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("redirecting");

    const { data, error } = await authClient.signIn.magicLink({
      email,
      callbackURL: "/learn",
      errorCallbackURL: "/auth/sign-in?error=email",
    });

    if (error || !data?.status) setState("error");
    else setState("sent");
  }

  return (
    <form className={styles.form} onSubmit={handleSignIn}>
      {state === "error" ? <p className={styles.error} role="alert">We could not send the sign-in link. Check the email address and try again.</p> : null}
      {state === "sent" ? <p className={styles.success} role="status">Check your inbox for a sign-in link. You can close this tab after opening it.</p> : null}
      <label htmlFor="sign-in-email">Email address</label>
      <input
        id="sign-in-email"
        name="email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(event) => {
          setEmail(event.target.value);
          if (state !== "idle") setState("idle");
        }}
        required
      />
      <button type="submit" disabled={state === "redirecting"}>
        {state === "redirecting" ? "Sending link…" : state === "sent" ? "Send another link" : "Email me a sign-in link"}
      </button>
    </form>
  );
}
