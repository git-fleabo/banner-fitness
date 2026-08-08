import Link from "next/link";

import type { LearningLessonSummary } from "@/lib/content/repository";

import styles from "./prototype-overview.module.css";

function formatStatus(status: LearningLessonSummary["status"]) {
  const label = status.replaceAll("_", " ");
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function PrototypeOverview({ lessons, revisionCount = 0, ownerPreview }: { lessons: LearningLessonSummary[]; revisionCount?: number; ownerPreview: boolean }) {
  const firstLesson = lessons[0];
  const nextUnstartedLesson = lessons.find((lesson) => lesson.coverageState === "not_started");
  const continueLesson = lessons.find((lesson) => lesson.coverageState === "in_progress") ?? nextUnstartedLesson ?? firstLesson;
  const coveredCount = lessons.filter((lesson) => lesson.coverageState === "covered").length;
  const isRevisit = lessons.every((lesson) => lesson.coverageState === "covered");

  if (!firstLesson) {
    return (
      <main className={styles.emptyState} id="main-content">
        <p className={styles.eyebrow}>Human Movement Studio</p>
        <h1>No published lessons yet</h1>
        <p>The first five lessons are still being reviewed. They will appear here after the owner publishes them.</p>
      </main>
    );
  }

  const continueLabel = continueLesson.coverageState === "in_progress"
    ? "Resume where you left off"
    : isRevisit
      ? "Revisit the recommended path"
      : "Start the next lesson";

  return (
    <div className={styles.appShell} id="top">
      <a className={styles.skipLink} href="#main-content">Skip to main content</a>
      <header className={styles.header}>
        <a className={styles.brand} href="#top" aria-label="PT Learning Lab home">
          <span className={styles.brandMark} aria-hidden="true">PL</span>
          <span><strong>PT Learning Lab</strong><small>Human Movement Studio</small></span>
        </a>
        <div className={styles.headerActions}>{ownerPreview && <Link href="/owner/review">Owner review</Link>}<Link href="/reference">Reference</Link><Link href="/review">Review queue</Link><Link href="/account/data">Your data</Link><span className={styles.foundationStatus}>{ownerPreview ? "Owner draft preview" : "Learning path"}</span></div>
      </header>

      <div className={styles.workspace}>
        <aside className={styles.rail} aria-labelledby="lesson-map-heading">
          <p className={styles.eyebrow}>Prototype path</p>
          <h2 id="lesson-map-heading">Anatomy and movement</h2>
          <p className={styles.railIntro}>Five short lessons, using the squat as a recurring anchor.</p>
          <ol className={styles.lessonList}>
            {lessons.map((lesson, index) => (
              <li key={lesson.slug} className={index === 0 ? styles.currentLesson : undefined}>
                <span className={styles.lessonNumber}>{lesson.order}</span>
                <span><Link href={`/learn/${lesson.slug}${lesson.coverageState === "in_progress" ? `?step=${lesson.resumeStep ?? "check"}` : ""}`}><strong>{lesson.title}</strong></Link><small>{lesson.durationMinutes} min · {lesson.coverageState === "covered" ? "Covered · Revisit" : lesson.coverageState === "in_progress" ? "Continue check" : formatStatus(lesson.status)}</small></span>
              </li>
            ))}
          </ol>
        </aside>

        <main className={styles.main} id="main-content">
          <nav className={styles.breadcrumb} aria-label="Current location">
            <span>Module 1</span><span aria-hidden="true">/</span><span>Lesson 1 of 5</span>
          </nav>
          <section className={styles.hero} aria-labelledby="page-heading">
            <div>
              <p className={styles.eyebrow}>Anatomy and movement</p>
              <h1 id="page-heading">{firstLesson.title}</h1>
              <p className={styles.lede}>Learn by noticing movement. Short visual lessons help you distinguish, apply and explain movement concepts with confidence.</p>
            </div>
            <div className={styles.mappingCard}>
              <span>Qualification mapping</span><strong>{firstLesson.mapping}</strong>
            </div>
          </section>

          <section className={styles.actionGrid} aria-label="Your next actions">
            <Link className={styles.continueCard} href={`/learn/${continueLesson.slug}${continueLesson.coverageState === "in_progress" ? `?step=${continueLesson.resumeStep ?? "check"}` : ""}`}>
              <span className={styles.eyebrow}>{continueLesson.coverageState === "in_progress" ? "Continue learning" : "Next up"}</span><strong>{continueLesson.title}</strong><span>{continueLabel} →</span>
            </Link>
            <Link className={styles.revisionCard} href="/review"><span className={styles.eyebrow}>Today’s revision</span><strong>{revisionCount ? `${revisionCount} useful ${revisionCount === 1 ? "revisit" : "revisits"}` : "Build your first revision"}</strong><span>{revisionCount ? "See why each one was recommended" : "Practice adds explainable recommendations"} →</span></Link>
          </section>

          <section className={styles.progressSummary} aria-label="Progress summary"><div><span className={styles.eyebrow}>Your progress</span><strong>{coveredCount} of {lessons.length} lessons covered</strong></div><p>Coverage, first-attempt practice and later understanding are kept separate. One correct response never becomes a mastery label.</p></section>

          <section className={styles.outcomeCard} aria-labelledby="outcome-heading">
            <div className={styles.outcomeIcon} aria-hidden="true">01</div>
            <div><p className={styles.eyebrow}>By the end, you can…</p><h2 id="outcome-heading">{firstLesson.outcome}</h2></div>
          </section>

          <section className={styles.previewGrid} aria-label="Planned learning experience">
            <div className={styles.visualCard}>
              <div className={styles.figureBackdrop} aria-hidden="true">
                <div className={styles.figureHead} /><div className={styles.figureBody} /><div className={styles.midline} />
              </div>
              <div className={styles.visualCopy}>
                <p className={styles.eyebrow}>Explore</p>
                <h2>Whose left side are we describing?</h2>
                <p>The first interaction will establish the person’s viewpoint before introducing directional terms.</p>
              </div>
            </div>
            <div className={styles.rhythmCard}>
              <p className={styles.eyebrow}>Shared lesson rhythm</p>
              <ol>
                <li><span>1</span>Hook and outcome</li><li><span>2</span>Explain and explore</li>
                <li><span>3</span>Apply to movement</li><li><span>4</span>Check and close</li>
              </ol>
              <p className={styles.note}>Structured text and keyboard operation will be available for every visual interaction.</p>
              <Link className={styles.openLesson} href={`/learn/${firstLesson.slug}`}>Open lesson 1 →</Link>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
