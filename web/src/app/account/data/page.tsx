import Link from "next/link";
import { redirect } from "next/navigation";

import { SkipLink } from "@/components/a11y";
import { getAccountAccess } from "@/lib/authorization/server";

import { changeProgressData } from "./actions";
import styles from "./data.module.css";

export const dynamic = "force-dynamic";

export default async function AccountDataPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const access = await getAccountAccess();
  if (access.state === "unauthenticated") redirect("/auth/sign-in");
  if (access.state !== "active") redirect("/auth/sign-in?access=blocked");
  const query = await searchParams;
  const done = typeof query.done === "string" ? query.done : null;

  return (
    <div className={styles.shell}>
      <SkipLink />
      <header className={styles.header}><Link href="/learn"><strong>PT Learning Lab</strong><small>Your learning data</small></Link><span>{access.account.email}</span></header>
      <main className={styles.main} id="main-content">
        <Link className={styles.back} href="/learn">← Learning path</Link>
        <p className={styles.eyebrow}>Privacy controls</p>
        <h1>Your learning data</h1>
        <p className={styles.intro}>Export a readable copy at any time. Reset and delete only affect records owned by this signed-in account.</p>
        {done === "reset" && <p className={styles.notice} role="status">Progress, attempts and review recommendations were reset. Bookmarks were kept.</p>}
        {done === "delete" && <p className={styles.notice} role="status">Progress, attempts, review recommendations and bookmarks were deleted.</p>}

        <section className={styles.card} aria-labelledby="export-heading"><div><h2 id="export-heading">Export learning data</h2><p>Download progress, attempts, review recommendations and bookmarks as JSON.</p></div><a className={styles.primary} href="/account/data/export">Download export</a></section>
        <section className={styles.card} aria-labelledby="reset-heading"><div><h2 id="reset-heading">Reset progress</h2><p>Removes lesson progress, practice attempts and review recommendations. Bookmarks remain.</p></div><form action={changeProgressData}><input type="hidden" name="intent" value="reset" /><label>Type <strong>RESET PROGRESS</strong><input name="confirmation" autoComplete="off" required /></label><button type="submit">Reset progress</button></form></section>
        <section className={`${styles.card} ${styles.danger}`} aria-labelledby="delete-heading"><div><h2 id="delete-heading">Delete all learning data</h2><p>Also removes bookmarks. Your invited sign-in profile remains, so you can start again.</p></div><form action={changeProgressData}><input type="hidden" name="intent" value="delete" /><label>Type <strong>DELETE LEARNING DATA</strong><input name="confirmation" autoComplete="off" required /></label><button type="submit">Delete learning data</button></form></section>
      </main>
    </div>
  );
}
