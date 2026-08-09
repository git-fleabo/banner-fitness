import Link from "next/link";

import type { LearningLessonSummary } from "@/lib/content/repository";
import { revisionAidFor } from "@/lib/content/revision-aids";

import styles from "./prototype-overview.module.css";

function stateLabel(lesson: LearningLessonSummary) {
  if (lesson.coverageState === "covered") return "Practised · revisit later";
  if (lesson.coverageState === "in_progress") return "Continue your review";
  return lesson.status === "draft" ? "Draft aid" : "Ready to explore";
}

export function PrototypeOverview({ lessons, revisionCount = 0, ownerPreview }: { lessons: LearningLessonSummary[]; revisionCount?: number; ownerPreview: boolean }) {
  if (lessons.length === 0) {
    return (
      <main className={styles.emptyState} id="main-content">
        <p className={styles.eyebrow}>Revision library</p>
        <h1>The revision library is being prepared</h1>
        <p>The first revision aids are still in owner review. This space will help you strengthen weak areas without replacing the course itself.</p>
      </main>
    );
  }

  const featuredLesson = lessons.find((lesson) => lesson.slug === "planes-and-axes") ?? lessons[0];
  const featuredAid = revisionAidFor(featuredLesson.slug);
  const coveredCount = lessons.filter((lesson) => lesson.coverageState === "covered").length;

  return (
    <div className={styles.appShell} id="top">
      <a className={styles.skipLink} href="#main-content">Skip to main content</a>
      <header className={styles.header}>
        <a className={styles.brand} href="#top" aria-label="PT Learning Lab home">
          <span className={styles.brandMark} aria-hidden="true">PL</span>
          <span><strong>PT Learning Lab</strong><small>Revision companion</small></span>
        </a>
        <div className={styles.headerActions}>
          {ownerPreview && <Link href="/owner/review">Owner review</Link>}
          <Link href="/reference">Reference</Link>
          <Link href="/review">Review queue</Link>
          <Link href="/account/data">Your data</Link>
          <span className={styles.foundationStatus}>{ownerPreview ? "Draft studio" : "Revision library"}</span>
        </div>
      </header>

      <main className={styles.main} id="main-content">
        <nav className={styles.breadcrumb} aria-label="Current location"><span>Revision library</span><span aria-hidden="true">/</span><span>Anatomy and movement</span></nav>

        <section className={styles.hero} aria-labelledby="page-heading">
          <div>
            <p className={styles.eyebrow}>A companion to your course</p>
            <h1 id="page-heading">Find the area you need to strengthen.</h1>
            <p className={styles.lede}>Short revision aids turn difficult PT concepts into clear explanations, memory cues and useful retrieval practice. Browse what you need today; there is no forced sequence.</p>
          </div>
          <aside className={styles.heroNote}>
            <span>Use it like this</span>
            <strong>Notice → remember → retrieve → revisit</strong>
            <p>One correct answer is evidence from this attempt, not a permanent mastery label.</p>
          </aside>
        </section>

        <section className={styles.actionGrid} aria-label="Revision actions">
          <Link className={styles.primaryCard} href={featuredLesson.coverageState === "in_progress" ? `/learn/${featuredLesson.slug}?step=${featuredLesson.resumeStep ?? "check"}` : `/learn/${featuredLesson.slug}`}>
            <span className={styles.eyebrow}>Suggested starting point</span>
            <strong>{featuredAid.label}</strong>
            <span>{featuredLesson.coverageState === "in_progress" ? "Continue this aid" : "Open a focused aid"} →</span>
          </Link>
          <Link className={styles.secondaryCard} href="/review">
            <span className={styles.eyebrow}>Your review queue</span>
            <strong>{revisionCount ? `${revisionCount} useful ${revisionCount === 1 ? "revisit" : "revisits"}` : "Build your first revisit"}</strong>
            <span>{revisionCount ? "See why these came back" : "Practice creates explainable revisits"} →</span>
          </Link>
        </section>

        <section className={styles.featured} aria-labelledby="featured-heading">
          <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>One complete revision aid</p><h2 id="featured-heading">{featuredLesson.title}</h2></div><span>{featuredLesson.durationMinutes} minutes</span></div>
          <div className={styles.featuredGrid}>
            <div><p className={styles.featuredDescription}>{featuredAid.shortDescription}</p><Link className={styles.openLink} href={`/learn/${featuredLesson.slug}`}>Open the aid →</Link></div>
            <div className={styles.memoryCard}><p className={styles.eyebrow}>Memory cue</p><strong>{featuredAid.memoryCue}</strong><p>Use the cue before checking the longer explanation.</p></div>
            <div className={styles.trapCard}><p className={styles.eyebrow}>Common traps</p><ul>{featuredAid.commonTraps.map((trap) => <li key={trap}>{trap}</li>)}</ul></div>
          </div>
        </section>

        <section className={styles.library} id="revision-aids" aria-labelledby="library-heading">
          <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>Browse by weak area</p><h2 id="library-heading">Revision aids by topic</h2></div><span>{coveredCount} of {lessons.length} practised</span></div>
          <div className={styles.libraryGrid}>
            {lessons.map((lesson) => {
              const aid = revisionAidFor(lesson.slug);
              return <article className={styles.aidCard} key={lesson.slug}>
                <div className={styles.aidCardTop}><span>{lesson.order.toString().padStart(2, "0")}</span><small>{lesson.durationMinutes} min · {stateLabel(lesson)}</small></div>
                <p className={styles.eyebrow}>{aid.label}</p>
                <h3>{lesson.title}</h3>
                <p>{aid.shortDescription}</p>
                <div className={styles.aidTypes}>{aid.aidTypes.map((type) => <span key={type}>{type}</span>)}</div>
                <Link href={`/learn/${lesson.slug}`}>Open revision aid →</Link>
              </article>;
            })}
          </div>
        </section>

        <section className={styles.method} aria-labelledby="method-heading">
          <div><p className={styles.eyebrow}>The learning loop</p><h2 id="method-heading">Small aids, repeated retrieval.</h2></div>
          <ol><li><span>1</span><strong>Choose</strong><p>Start with the concept that feels least secure.</p></li><li><span>2</span><strong>Notice</strong><p>Use the explanation, visual or worked example.</p></li><li><span>3</span><strong>Retrieve</strong><p>Answer without looking, then inspect the evidence.</p></li><li><span>4</span><strong>Revisit</strong><p>Return later when the idea needs another look.</p></li></ol>
        </section>
      </main>
    </div>
  );
}
