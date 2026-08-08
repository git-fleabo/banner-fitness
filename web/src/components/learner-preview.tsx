import Link from "next/link";

import type { LessonPageData, LearningLessonSummary } from "@/lib/content/repository";

import styles from "./learner-preview.module.css";

function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1).replaceAll("_", " ");
}

export function LearnerPreview({ lessons, pages }: { lessons: LearningLessonSummary[]; pages: LessonPageData[] }) {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <Link href="/preview/learner"><strong>PT Learning Lab</strong><small>Temporary learner preview</small></Link>
        <span>Read-only · draft content</span>
      </header>
      <main className={styles.main}>
        <section className={styles.notice} aria-label="Preview notice">
          <p className={styles.eyebrow}>Preview mode</p>
          <h1>Review the learner experience before authentication is repaired</h1>
          <p>This temporary view exposes draft lesson content without creating a session or recording learner progress. It is for content review only.</p>
        </section>

        <nav className={styles.lessonNav} aria-label="Lessons in this preview">
          <p className={styles.eyebrow}>Module 1 · Anatomy and movement</p>
          <ol>{lessons.map((lesson) => <li key={lesson.slug}><a href={`#${lesson.slug}`}><span>{lesson.order}</span>{lesson.title}</a></li>)}</ol>
        </nav>

        <div className={styles.lessons}>
          {pages.map((lesson) => (
            <article className={styles.lesson} id={lesson.slug} key={lesson.slug}>
              <header className={styles.lessonHeader}>
                <div><p className={styles.eyebrow}>Lesson {lesson.order} · {lesson.durationMinutes} minutes</p><h2>{lesson.title}</h2></div>
                <span>Draft v{lesson.versionNumber}</span>
              </header>
              <p className={styles.outcome}><strong>By the end, you can…</strong> {lesson.outcome}</p>
              {lesson.objects.filter((object) => object.type !== "structured_text").map((object) => (
                <section className={styles.step} key={object.stableKey}>
                  <div className={styles.stepHeading}><p className={styles.eyebrow}>{titleCase(object.type)}</p><h3>{object.title}</h3></div>
                  <p>{object.content.body}</p>
                  {object.content.keyIdeas && <div className={styles.keyIdeas}><strong>Keep these distinctions</strong><ul>{object.content.keyIdeas.map((idea) => <li key={idea}>{idea}</li>)}</ul></div>}
                  {object.content.workedExample && <aside className={styles.example}><strong>Worked example</strong><h4>{object.content.workedExample.question}</h4><p><b>Answer:</b> {object.content.workedExample.answer}</p><p><b>Evidence:</b> {object.content.workedExample.evidence}</p></aside>}
                  {object.content.interaction && <details className={styles.interaction}><summary>Practice preview: {object.content.interaction.name}</summary><p>{object.content.interaction.instructions}</p><p>{object.content.interaction.structuredText}</p><small>Interactive responses are disabled in this read-only preview.</small></details>}
                  {object.questions.length > 0 && <details className={styles.questions}><summary>{object.questions.length} practice questions</summary><ol>{object.questions.map((question) => <li key={question.stableKey}><p>{question.prompt}</p><ul>{question.response.choices?.map((choice) => <li key={choice.id}>{choice.label}</li>)}</ul></li>)}</ol></details>}
                </section>
              ))}
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}
