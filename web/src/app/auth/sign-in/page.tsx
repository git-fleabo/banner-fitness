import Link from "next/link";

import { SignInForm } from "./sign-in-form";
import styles from "./sign-in.module.css";

export const dynamic = "force-dynamic";

export default function SignInPage() {
  return (
    <main className={styles.page}>
      <section className={styles.card} aria-labelledby="sign-in-heading">
        <Link className={styles.brand} href="/">PT Learning Lab</Link>
        <p className={styles.eyebrow}>Private learning space</p>
        <h1 id="sign-in-heading">Welcome back</h1>
        <p className={styles.intro}>Enter the email address matching your invitation. We will send a one-time sign-in link; no password is required.</p>
        <SignInForm />
        <p className={styles.help}>Access is invitation-only. Contact the owner if you expected an invitation.</p>
      </section>
    </main>
  );
}
