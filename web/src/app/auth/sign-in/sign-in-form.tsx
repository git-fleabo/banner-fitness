"use client";

import { useState } from "react";

import { authClient } from "@/lib/auth/client";

import styles from "./sign-in.module.css";

type SignInState = "idle" | "redirecting" | "error";

export function SignInForm() {
  const [state, setState] = useState<SignInState>("idle");

  async function handleSignIn() {
    setState("redirecting");

    const { error } = await authClient.signIn.social({
      provider: "google",
      callbackURL: "/learn",
      errorCallbackURL: "/auth/sign-in?error=google",
    });

    if (error) setState("error");
  }

  return (
    <div className={styles.form}>
      {state === "error" ? <p className={styles.error} role="alert">Sign-in is temporarily unavailable. Please try again.</p> : null}
      <button type="button" disabled={state === "redirecting"} onClick={handleSignIn}>
        {state === "redirecting" ? "Opening Google…" : "Continue with Google"}
      </button>
    </div>
  );
}
