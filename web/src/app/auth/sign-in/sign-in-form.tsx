"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import styles from "./sign-in.module.css";

type SignInState = "idle" | "sending" | "code" | "verifying" | "error";

const AUTH_REQUEST_TIMEOUT_MS = 12000;

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function readableAuthError(error: unknown) {
  const message = error instanceof Error ? error.message : "We could not complete email sign-in.";
  if (/expired/i.test(message)) return "That code has expired. Request a new code and use the latest email.";
  if (/invalid|incorrect|not found/i.test(message)) return "That code was not accepted. Check the latest email or request a new code.";
  if (/timed out/i.test(message)) return "The authentication request timed out. Check your connection and try again.";
  return message;
}

async function sendSignInCode(email: string) {
  const response = await fetch("/api/auth/email-otp/send-verification-otp", {
    method: "POST",
    headers: { accept: "application/json", "content-type": "application/json" },
    credentials: "same-origin",
    cache: "no-store",
    body: JSON.stringify({ email: normalizeEmail(email), type: "sign-in" }),
  });
  const data = await response.json().catch(() => null) as { success?: boolean; message?: string; error?: string } | null;
  if (!response.ok || !data?.success) throw new Error(data?.message ?? data?.error ?? "The verification code could not be sent");
}

async function verifySignInCode(email: string, otp: string) {
  const response = await fetch("/api/auth/sign-in/email-otp", {
    method: "POST",
    headers: { accept: "application/json", "content-type": "application/json" },
    credentials: "same-origin",
    cache: "no-store",
    body: JSON.stringify({ email: normalizeEmail(email), otp: otp.trim() }),
  });
  const data = await response.json().catch(() => null) as { message?: string; error?: string } | null;
  if (!response.ok) throw new Error(data?.message ?? data?.error ?? "The verification code could not be accepted");
}

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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function requestCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("sending");
    setErrorMessage(null);

    try {
      await withTimeout(sendSignInCode(email));
      setState("code");
    } catch (error) {
      setState("error");
      setErrorMessage(readableAuthError(error));
    }
  }

  async function resendCode() {
    setState("sending");
    setErrorMessage(null);

    try {
      await withTimeout(sendSignInCode(email));
      setOtp("");
      setState("code");
    } catch (error) {
      setState("code");
      setErrorMessage(readableAuthError(error));
    }
  }

  async function verifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("verifying");
    setErrorMessage(null);

    try {
      await withTimeout(verifySignInCode(email, otp));
      router.push("/learn");
    } catch (error) {
      setState("code");
      setErrorMessage(readableAuthError(error));
    }
  }

  return (
    <form className={styles.form} onSubmit={state === "code" || state === "verifying" ? verifyCode : requestCode}>
      {errorMessage ? <p className={styles.error} role="alert">{errorMessage}</p> : null}
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
          setErrorMessage(null);
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
      {state === "code" ? (
        <>
          <button className={styles.secondaryButton} type="button" onClick={resendCode}>Send a new code</button>
          <button className={styles.secondaryButton} type="button" onClick={() => { setState("idle"); setOtp(""); setErrorMessage(null); }}>Use a different email</button>
        </>
      ) : null}
    </form>
  );
}
