import Link from "next/link";
import { redirect } from "next/navigation";

import { SkipLink } from "@/components/a11y";
import { getAccountAccess } from "@/lib/authorization/server";
import { listReviewItems } from "@/lib/content/repository";
import { updateReviewRecommendation } from "./actions";

import styles from "./review.module.css";

export const dynamic = "force-dynamic";

export default async function ReviewPage() {
  const access = await getAccountAccess();
  if (access.state === "unauthenticated") redirect("/auth/sign-in");
  if (access.state === "unprovisioned") redirect("/auth/sign-in?access=pending");
  if (access.state === "blocked") redirect("/auth/sign-in?access=blocked");
  const items = await listReviewItems(access.account.authUserId);
  const dueItems = items.filter((item) => item.isDue);

  return (
    <div className={styles.shell}>
      <SkipLink />
      <header className={styles.header}><Link href="/learn"><strong>PT Learning Lab</strong><small>Revision companion</small></Link><span>{dueItems.length} due · {items.length} queued</span></header>
      <main className={styles.main} id="main-content">
        <Link className={styles.back} href="/learn">← Learning path</Link>
        <p className={styles.eyebrow}>Targeted revision</p>
        <h1>Review what needs another look.</h1>
        <p className={styles.intro}>Each recommendation is tied to a recorded response or low-confidence reflection. The revisit opens a changed check where the content supports one, so you practise the weak idea rather than simply repeating the same screen.</p>
        {items.length > 0 && <div className={styles.queueSummary} aria-label="Revision queue summary"><div><strong>{dueItems.length}</strong><span>Due now</span></div><div><strong>{items.length - dueItems.length}</strong><span>Scheduled later</span></div><div><strong>{new Set(items.map((item) => item.lessonSlug)).size}</strong><span>Areas in queue</span></div></div>}
        {items.length === 0 ? <section className={styles.empty}><h2>Nothing queued</h2><p>A wrong, partly-correct or named-misconception response can add a reason here.</p></section> : (
          <ol className={styles.list}>
            {items.map((item) => {
              const evidence = typeof item.evidence === "object" && item.evidence !== null ? item.evidence as Record<string, unknown> : {};
              const misconception = typeof evidence.misconceptionCode === "string" ? evidence.misconceptionCode.replaceAll("_", " ").toLowerCase() : null;
              return (
              <li key={item.id}>
                  <div><p className={styles.eyebrow}>{item.reason.replaceAll("_", " ")}</p><h2>{item.lessonTitle}</h2><p>{item.questionPrompt ?? "A low-confidence reflection is asking for a fresh check in this area."}</p></div>
                  <aside><span>Why this is recommended</span><strong>{misconception ? `The response matched: ${misconception}.` : item.reason === "low_confidence" && typeof evidence.confidence === "number" ? `You recorded confidence ${evidence.confidence} of 5.` : `The recorded response was ${item.reason.replaceAll("_", " ")}.`}</strong><small>{item.isDue ? "Due now" : `Due in ${item.daysUntilDue} day${item.daysUntilDue === 1 ? "" : "s"}`} · {item.dueAt.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</small><Link href={`/learn/${item.lessonSlug}?step=check&revisionId=${encodeURIComponent(item.id)}${item.questionStableKey ? `&revisionQuestion=${encodeURIComponent(item.questionStableKey)}` : ""}`}>Start changed check →</Link><form action={updateReviewRecommendation}><input type="hidden" name="reviewId" value={item.id} /><button name="intent" value="tomorrow">Tomorrow</button><button name="intent" value="three_days">In 3 days</button><button name="intent" value="dismiss">Remove</button></form></aside>
              </li>
              );
            })}
          </ol>
        )}
      </main>
    </div>
  );
}
