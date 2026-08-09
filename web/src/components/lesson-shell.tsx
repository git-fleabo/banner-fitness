import Link from "next/link";

import { LiveStatus, SkipLink, VisuallyHidden } from "@/components/a11y";
import { LessonClose, QuestionPractice } from "@/components/learning-evidence";
import { LessonActivity } from "@/components/lesson-activities";
import { LessonPositionTracker } from "@/components/lesson-position-tracker";
import type { LessonPageData, LessonResumeState } from "@/lib/content/repository";
import { revisionAidFor } from "@/lib/content/revision-aids";

import styles from "./lesson-shell.module.css";

const visibleStepTypes = new Set(["hook", "explain", "explore", "apply", "check", "close"]);

function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1).replaceAll("_", " ");
}

function aidStepLabel(value: string) {
  return { hook: "Quick idea", explain: "Explain it", explore: "See it", apply: "Use it", check: "Check yourself", close: "Choose a revisit" }[value] ?? titleCase(value);
}

export function LessonShell({ lesson, requestedStep, resumeState, ownerPreview }: { lesson: LessonPageData; requestedStep?: string; resumeState?: LessonResumeState | null; ownerPreview: boolean }) {
  const revisionAid = revisionAidFor(lesson.slug);
  const steps = lesson.objects.filter((object) => visibleStepTypes.has(object.type));
  const activeStep = requestedStep ?? resumeState?.stepStableKey;
  const currentIndex = Math.max(0, steps.findIndex((object) => object.stableKey === activeStep || object.type === activeStep));
  const current = steps[currentIndex] ?? steps[0];
  const previous = steps[currentIndex - 1];
  const next = steps[currentIndex + 1];
  const reference = lesson.objects.find((object) => object.content.outsideMasteryPromise);
  const customInteraction = ["hook", "explain", "explore", "apply"].includes(current.type)
    ? <LessonActivity lessonSlug={lesson.slug} step={current.type as "hook" | "explain" | "explore" | "apply"} />
    : null;
  const evidenceActivity = current.type === "check" && current.questions.length > 0
    ? <QuestionPractice lessonSlug={lesson.slug} questions={current.questions} resumeState={resumeState} />
    : current.type === "close"
      ? <LessonClose lessonSlug={lesson.slug} completed={resumeState?.complete} confidence={resumeState?.confidence} />
      : null;

  return (
    <div className={styles.shell} id="top">
      <LessonPositionTracker lessonSlug={lesson.slug} stepStableKey={current.stableKey} />
      <SkipLink />
      <LiveStatus>Revision aid card {currentIndex + 1} of {steps.length}: {current.title}</LiveStatus>

      <header className={styles.header}>
        <Link className={styles.brand} href="/learn" aria-label="PT Learning Lab home">
          <span className={styles.brandMark} aria-hidden="true">PL</span>
          <span><strong>PT Learning Lab</strong><small>Revision companion</small></span>
        </Link>
        <div className={styles.headerContext}>
          <Link href="/reference">Reference</Link>
          <span>Revision aid · {lesson.durationMinutes} min</span>
          {ownerPreview && <span className={styles.draftBadge}>Owner · {titleCase(lesson.status)} v{lesson.versionNumber}</span>}
        </div>
      </header>

      <div className={styles.mobileProgress}>
        <div><span>{aidStepLabel(current.type)}</span><strong>{currentIndex + 1} of {steps.length}</strong></div>
        <progress value={currentIndex + 1} max={steps.length}><VisuallyHidden>{currentIndex + 1} of {steps.length}</VisuallyHidden></progress>
      </div>

      <div className={styles.workspace}>
        <aside className={styles.rail} aria-labelledby="lesson-steps-heading">
          <Link className={styles.backLink} href="/learn">← Revision library</Link>
          <p className={styles.eyebrow}>Topic collection</p>
          <h2 id="lesson-steps-heading">{lesson.title}</h2>
          <ol>
            {steps.map((step, index) => {
              const isCurrent = step.stableKey === current.stableKey;
              return (
                <li key={step.stableKey}>
                  <Link className={isCurrent ? styles.currentStep : undefined} href={`/learn/${lesson.slug}?step=${step.stableKey}`} aria-current={isCurrent ? "step" : undefined}>
                    <span>{index + 1}</span><span><strong>{aidStepLabel(step.type)}</strong><small>{step.title}</small></span>
                  </Link>
                </li>
              );
            })}
          </ol>
          <p className={styles.progressNote}>These cards support revision. Coverage and durable security remain separate.</p>
        </aside>

        <main className={styles.main} id="main-content" tabIndex={-1}>
          <nav className={styles.breadcrumb} aria-label="Breadcrumb">
            <Link href="/learn">Revision library</Link><span aria-hidden="true">/</span><span>{revisionAid.label}</span>
          </nav>

          <section className={styles.outcome} aria-labelledby="lesson-outcome-heading">
            <p className={styles.eyebrow}>Why this is useful</p>
            <h1 id="lesson-outcome-heading">{lesson.outcome}</h1>
          </section>

          <section className={styles.aidSummary} aria-label="Revision aid summary">
            <div><p className={styles.eyebrow}>Quick takeaway</p><strong>{revisionAid.shortDescription}</strong></div>
            <div><p className={styles.eyebrow}>Memory cue</p><strong>{revisionAid.memoryCue}</strong></div>
            <div><p className={styles.eyebrow}>Watch for</p><ul>{revisionAid.commonTraps.slice(0, 2).map((trap) => <li key={trap}>{trap}</li>)}</ul></div>
          </section>

          <section className={styles.recallPanel} aria-label="Before and after revision prompts">
            <div><p className={styles.eyebrow}>Try before reading</p><strong>{revisionAid.quickCheckPrompt}</strong></div>
            <div><p className={styles.eyebrow}>Revisit when…</p><strong>{revisionAid.revisitSignal}</strong></div>
          </section>

          <article className={styles.learningCard} aria-labelledby="step-heading">
            <div className={styles.cardHeading}>
              <div><p className={styles.eyebrow}>{aidStepLabel(current.type)}</p><h2 id="step-heading">{current.title}</h2></div>
              <span>{lesson.durationMinutes} min aid</span>
            </div>
            <p className={styles.bodyCopy}>{current.content.body}</p>

            {current.content.keyIdeas && (
              <section className={styles.keyIdeas} aria-labelledby="key-ideas-heading">
                <p className={styles.eyebrow}>Remember this</p>
                <h3 id="key-ideas-heading">The useful model</h3>
                <ul>{current.content.keyIdeas.map((idea) => <li key={idea}>{idea}</li>)}</ul>
              </section>
            )}

            {current.content.workedExample && (
              <aside className={styles.workedExample} aria-labelledby="worked-example-heading">
                <p className={styles.eyebrow}>Worked example</p>
                <h3 id="worked-example-heading">{current.content.workedExample.question}</h3>
                <p><strong>Answer:</strong> {current.content.workedExample.answer}</p>
                <p><strong>Evidence:</strong> {current.content.workedExample.evidence}</p>
              </aside>
            )}

            {customInteraction}
            {evidenceActivity}

            {!customInteraction && !evidenceActivity && current.content.interaction && (
              <section className={styles.interactionFrame} aria-labelledby="interaction-heading">
                <div className={styles.interactionVisual} aria-hidden="true"><span>{titleCase(current.type)}</span></div>
                <div className={styles.interactionCopy}>
                  <p className={styles.eyebrow}>Interaction frame</p>
                  <h3 id="interaction-heading">{current.content.interaction.name}</h3>
                  <p>{current.content.interaction.instructions}</p>
                  <p className={styles.keyboardNote}>{current.content.interaction.keyboardAlternative}</p>
                </div>
              </section>
            )}

            {current.structuredText && (
              <details className={styles.structuredText}>
                <summary>Open structured-text alternative</summary>
                <div><p>{current.structuredText}</p></div>
              </details>
            )}

            {reference && current.type === "close" && (
              <details className={styles.reference}>
                <summary>{reference.title}</summary>
                <p>{reference.content.body}</p>
              </details>
            )}

            <nav className={styles.stepActions} aria-label="Lesson steps">
              {previous ? <Link className={styles.secondaryAction} href={`/learn/${lesson.slug}?step=${previous.stableKey}`}>← {aidStepLabel(previous.type)}</Link> : <span />}
              {next ? <Link className={styles.primaryAction} href={`/learn/${lesson.slug}?step=${next.stableKey}`}>{aidStepLabel(next.type)} →</Link> : <Link className={styles.primaryAction} href="/learn">Return to revision library</Link>}
            </nav>
          </article>

          <aside className={styles.mapping} aria-label="Content status and mapping">
            <div><span>Reference mapping</span><strong>{lesson.mapping}</strong></div>
            <div><span>Draft status</span><strong>v{lesson.versionNumber} · {titleCase(lesson.status)}</strong></div>
          </aside>
        </main>
      </div>
    </div>
  );
}
