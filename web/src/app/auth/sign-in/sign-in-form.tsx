"use client";

import { FormEvent, useState } from "react";

import { authClient } from "@/lib/auth/client";

import styles from "./sign-in.module.css";

type FormState = "idle" | "sending" | "sent" | "error";

export function SignInForm() {
  const [state, setState] = useState<FormState>("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("sending");

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const { error } = await authClient.signIn.magicLink({ email, callbackURL: "/learn" });

    setState(error && error.status >= 500 ? "error" : "sent");
  }

  if (state === "sent") {
    return (
      <div className={styles.message} role="status">
        <strong>Check your email</strong>
        <p>If that address has an invitation, its sign-in link will arrive shortly.</p>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <label htmlFor="email">Email address</label>
      <input id="email" name="email" type="email" autoComplete="email" required />
      {state === "error" ? <p className={styles.error} role="alert">Sign-in is temporarily unavailable. Please try again.</p> : null}
      <button type="submit" disabled={state === "sending"}>
        {state === "sending" ? "Sending link…" : "Email me a sign-in link"}
      </button>
    </form>
  );
}
