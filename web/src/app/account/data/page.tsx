import Link from "next/link";
import { redirect } from "next/navigation";

import { SkipLink } from "@/components/a11y";
import { getAccountAccess } from "@/lib/authorization/server";

import { deleteClientData } from "./actions";
import styles from "./data.module.css";

export const dynamic = "force-dynamic";

export default async function AccountDataPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const access = await getAccountAccess();
  if (access.state === "unauthenticated") redirect("/auth/sign-in");
  if (access.state !== "active" || !["owner", "pt"].includes(access.account.role)) redirect("/auth/sign-in?access=designer");
  const query = await searchParams;
  const done = typeof query.done === "string" ? query.done : null;

  return (
    <div className={styles.shell}>
      <SkipLink />
      <header className={styles.header}><Link href="/designer"><strong>Banner Fitness</strong><small>PT workspace data</small></Link><span>{access.account.email}</span></header>
      <main className={styles.main} id="main-content">
        <Link className={styles.back} href="/designer">← PT workspace</Link>
        <p className={styles.eyebrow}>Privacy controls</p>
        <h1>Your PT workspace data</h1>
        <p className={styles.intro}>Export a readable copy of your clients, PAR-Q assessments, preferences, programmes, results and quality records at any time.</p>
        {done === "delete" && <p className={styles.notice} role="status">Your PT client data, programmes, results, custom exercises, templates and designer settings were deleted. Your sign-in profile remains.</p>}

        <section className={styles.card} aria-labelledby="export-heading"><div><h2 id="export-heading">Export PT data</h2><p>Download client, assessment, programme, workout, performance, quality-review and designer data as JSON.</p></div><a className={styles.primary} href="/account/data/export">Download export</a></section>
        <section className={`${styles.card} ${styles.danger}`} aria-labelledby="delete-heading"><div><h2 id="delete-heading">Delete PT workspace data</h2><p>Removes your PT clients and their related records, your programmes and results, custom exercises, programme templates and designer settings. Your sign-in profile and invitations remain.</p></div><form action={deleteClientData}><input type="hidden" name="intent" value="delete" /><label>Type <strong>DELETE PT DATA</strong><input name="confirmation" autoComplete="off" required /></label><button type="submit">Delete PT data</button></form></section>
      </main>
    </div>
  );
}
