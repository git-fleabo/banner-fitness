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

  return (
    <div className={styles.shell}>
      <SkipLink />
      <header className={styles.header}><Link href="/learn"><strong>PT Learning Lab</strong><small>Human Movement Studio</small></Link><span>{items.length} queued</span></header>
      <main className={styles.main} id="main-content">
        <Link className={styles.back} href="/learn">← Learning path</Link>
        <p className={styles.eyebrow}>Explainable revision</p>
        <h1>Review queue</h1>
        <p className={styles.intro}>Recommendations come from recorded practice evidence. Revisit the source lesson, choose a later date or remove a recommendation whenever it is no longer useful.</p>
        {items.length === 0 ? <section className={styles.empty}><h2>Nothing queued</h2><p>A wrong, partly-correct or named-misconception response can add a reason here.</p></section> : (
          <ol className={styles.list}>
            {items.map((item) => {
              const evidence = typeof item.evidence === "object" && item.evidence !== null ? item.evidence as Record<string, unknown> : {};
              const misconception = typeof evidence.misconceptionCode === "string" ? evidence.misconceptionCode.replaceAll("_", " ").toLowerCase() : null;
              return (
                <li key={item.id}>
                  <div><p className={styles.eyebrow}>{item.reason.replaceAll("_", " ")}</p><h2>{item.lessonTitle}</h2><p>{item.questionPrompt ?? "Lesson review"}</p></div>
                  <aside><span>Why this is recommended</span><strong>{misconception ? `The response matched: ${misconception}.` : `The recorded response was ${item.reason.replaceAll("_", " ")}.`}</strong><small>Due {item.dueAt.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</small><Link href={`/learn/${item.lessonSlug}?step=check`}>Review this check →</Link><form action={updateReviewRecommendation}><input type="hidden" name="reviewId" value={item.id} /><button name="intent" value="tomorrow">Tomorrow</button><button name="intent" value="three_days">In 3 days</button><button name="intent" value="dismiss">Remove</button></form></aside>
                </li>
              );
            })}
          </ol>
        )}
      </main>
    </div>
  );
}
