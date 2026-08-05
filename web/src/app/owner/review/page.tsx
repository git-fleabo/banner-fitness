import Link from "next/link";
import { redirect } from "next/navigation";

import { SkipLink } from "@/components/a11y";
import { getAccountAccess } from "@/lib/authorization/server";
import { listOwnerReviewLessons } from "@/lib/content/repository";

import { transitionLessonReview } from "./actions";
import styles from "./review.module.css";

export const dynamic = "force-dynamic";

function statusLabel(status: string) {
  return status.replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase());
}

export default async function OwnerReviewPage() {
  const access = await getAccountAccess();
  if (access.state === "unauthenticated") redirect("/auth/sign-in");
  if (access.state !== "active" || access.account.role !== "owner") redirect("/learn");
  const lessons = await listOwnerReviewLessons();

  return (
    <div className={styles.shell}>
      <SkipLink />
      <header className={styles.header}><Link href="/learn"><strong>PT Learning Lab</strong><small>Owner review</small></Link><span>{lessons.length} lesson versions</span></header>
      <main className={styles.main} id="main-content">
        <Link className={styles.back} href="/learn">← Learning path</Link>
        <p className={styles.eyebrow}>Publication boundary</p>
        <h1>Owner review</h1>
        <p className={styles.intro}>Preview draft lessons, inspect source coverage and record deliberate review decisions. Publication is blocked until the lesson package has complete source links and an approved owner decision.</p>
        <div className={styles.warning}><strong>Nothing is published by opening or previewing this page.</strong><span>Approval and publication are separate recorded actions.</span></div>
        <ol className={styles.list}>
          {lessons.map((lesson) => {
            const sourcesComplete = lesson.sourcedTargetCount >= lesson.expectedSourceTargetCount;
            return (
              <li key={lesson.lessonVersionId}>
                <div className={styles.lessonHeading}><div><p className={styles.eyebrow}>Version {lesson.versionNumber}</p><h2>{lesson.title}</h2></div><span>{statusLabel(lesson.status)}</span></div>
                <div className={styles.metrics}><span><b>{lesson.objectCount}</b> learning objects</span><span><b>{lesson.questionCount}</b> questions</span><span data-complete={sourcesComplete}><b>{lesson.sourcedTargetCount}/{lesson.expectedSourceTargetCount}</b> sourced targets</span></div>
                {lesson.mappingUncertainty && <aside className={styles.uncertainty}><strong>Mapping uncertainty remains</strong><p>{lesson.mappingUncertainty}</p></aside>}
                {lesson.latestDecision && <p className={styles.decision}>Latest recorded decision: <strong>{statusLabel(lesson.latestDecision)}</strong>{lesson.latestRationale ? ` — ${lesson.latestRationale}` : ""}</p>}
                <div className={styles.actions}>
                  <Link href={`/learn/${lesson.slug}`}>Preview lesson →</Link>
                  {lesson.status === "draft" && <form action={transitionLessonReview}><input type="hidden" name="lessonVersionId" value={lesson.lessonVersionId} /><button name="targetStatus" value="in_review">Send for review</button></form>}
                  {lesson.status === "in_review" && <form className={styles.reviewForm} action={transitionLessonReview}><input type="hidden" name="lessonVersionId" value={lesson.lessonVersionId} /><label>Approval rationale<textarea name="rationale" minLength={10} required /></label>{lesson.mappingUncertainty && <label className={styles.check}><input type="checkbox" name="mappingAcknowledged" required />I have checked and explicitly acknowledge the recorded mapping uncertainty.</label>}<button name="targetStatus" value="approved">Record approval</button></form>}
                  {lesson.status === "approved" && <form action={transitionLessonReview}><input type="hidden" name="lessonVersionId" value={lesson.lessonVersionId} /><input type="hidden" name="rationale" value="Published after approved owner review." /><button className={styles.publish} name="targetStatus" value="published">Publish to learners</button></form>}
                  {lesson.status === "published" && <strong className={styles.published}>Available to invited learners</strong>}
                </div>
              </li>
            );
          })}
        </ol>
      </main>
    </div>
  );
}
