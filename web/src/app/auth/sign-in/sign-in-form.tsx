"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth/client";

import styles from "./sign-in.module.css";

type SignInState = "idle" | "sending" | "code" | "verifying" | "error";

const AUTH_REQUEST_TIMEOUT_MS = 12000;

function withTimeout<T>(request: Promise<T>) {
  let timeout: ReturnType<typeof setTimeout>;
  const timeoutRequest = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => reject(new Error("Authentication request timed out")), AUTH_REQUEST_TIMEOUT_MS);
  });

  return Promise.race([request, timeoutRequest]).finally(() => clearTimeout(timeout));
}

export function SignInForm() {
  const router = useRouter();
  const [state, setState] = useState<SignInState>("idle");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");

  async function requestCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("sending");

    try {
      const { data, error } = await withTimeout(authClient.emailOtp.sendVerificationOtp({ email, type: "sign-in" }));
      if (error || !data?.success) throw new Error("The verification code could not be sent");
      setState("code");
    } catch {
      setState("error");
    }
  }

  async function verifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("verifying");

    try {
      const { error } = await withTimeout(authClient.signIn.emailOtp({ email, otp }));
      if (error) throw new Error("The verification code could not be accepted");
      router.push("/learn");
    } catch {
      setState("error");
    }
  }

  return (
    <form className={styles.form} onSubmit={state === "code" || state === "verifying" ? verifyCode : requestCode}>
      {state === "error" ? <p className={styles.error} role="alert">We could not complete email sign-in. Check the address or code and try again.</p> : null}
      <label htmlFor="sign-in-email">Email address</label>
      <input
        id="sign-in-email"
        name="email"
        type="email"
        autoComplete="email"
        value={email}
        disabled={state === "sending" || state === "verifying"}
        onChange={(event) => {
          setEmail(event.target.value);
          setOtp("");
          if (state !== "idle") setState("idle");
        }}
        required
      />
      {state === "code" || state === "verifying" ? (
        <>
          <label htmlFor="sign-in-code">Verification code</label>
          <input
            id="sign-in-code"
            name="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={otp}
            onChange={(event) => setOtp(event.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
            disabled={state === "verifying"}
            required
          />
          <p className={styles.success} role="status">We sent a six-digit code to your email. It may take a minute to arrive.</p>
        </>
      ) : null}
      <button type="submit" disabled={state === "sending" || state === "verifying"}>
        {state === "sending" ? "Sending code…" : state === "verifying" ? "Checking code…" : state === "code" ? "Verify code" : "Email me a verification code"}
      </button>
      {state === "code" ? <button className={styles.secondaryButton} type="button" onClick={() => setState("idle")}>Use a different email</button> : null}
    </form>
  );
}
