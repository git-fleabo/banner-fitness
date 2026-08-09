"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type { LearningLessonSummary } from "@/lib/content/repository";
import { revisionAidFor } from "@/lib/content/revision-aids";

import styles from "./prototype-overview.module.css";

type Filter = "all" | "due" | "low-confidence" | "not-started" | "in-progress" | "covered";

function areaStatus(lesson: LearningLessonSummary) {
  const dueReviewCount = lesson.dueReviewCount ?? 0;
  const confidence = lesson.confidence ?? null;
  if (dueReviewCount > 0) return { label: `${dueReviewCount} due revisit${dueReviewCount === 1 ? "" : "s"}`, tone: "due" };
  if (confidence !== null && confidence <= 2) return { label: `Low confidence · ${confidence}/5`, tone: "low" };
  if (lesson.coverageState === "in_progress") return { label: "Continue this aid", tone: "progress" };
  if (lesson.coverageState === "covered") return { label: confidence ? `Covered · ${confidence}/5` : "Covered · revisit later", tone: "covered" };
  return { label: "Not started", tone: "new" };
}

function matchesFilter(lesson: LearningLessonSummary, filter: Filter) {
  if (filter === "all") return true;
  if (filter === "due") return (lesson.dueReviewCount ?? 0) > 0;
  if (filter === "low-confidence") return lesson.confidence !== null && lesson.confidence !== undefined && lesson.confidence <= 2;
  return lesson.coverageState === filter.replace("-", "_");
}

export function WeakAreaFinder({ lessons }: { lessons: LearningLessonSummary[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const normalizedQuery = query.trim().toLowerCase();
  const visibleLessons = useMemo(() => lessons.filter((lesson) => {
    const aid = revisionAidFor(lesson.slug);
    const searchable = [lesson.title, lesson.outcome, aid.label, aid.shortDescription, aid.memoryCue, ...aid.commonTraps, ...aid.aidTypes].join(" ").toLowerCase();
    return (!normalizedQuery || searchable.includes(normalizedQuery)) && matchesFilter(lesson, filter);
  }), [filter, lessons, normalizedQuery]);

  return (
    <section className={styles.library} id="revision-aids" aria-labelledby="library-heading">
      <div className={styles.sectionHeading}>
        <div><p className={styles.eyebrow}>Browse by weak area</p><h2 id="library-heading">Find the aid you need today.</h2></div>
        <span>{visibleLessons.length} of {lessons.length} shown</span>
      </div>

      <div className={styles.finder} aria-label="Find a revision aid">
        <div className={styles.finderSearch}>
          <label htmlFor="revision-search">Search concepts, cues or traps</label>
          <input id="revision-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try plane, viewpoint or angle" />
        </div>
        <div className={styles.finderFilter}>
          <label htmlFor="revision-filter">Show</label>
          <select id="revision-filter" value={filter} onChange={(event) => setFilter(event.target.value as Filter)}>
            <option value="all">All areas</option>
            <option value="due">Due for revisit</option>
            <option value="low-confidence">Low confidence</option>
            <option value="not-started">Not started</option>
            <option value="in-progress">In progress</option>
            <option value="covered">Covered</option>
          </select>
        </div>
      </div>

      <p className={styles.finderResult} role="status" aria-live="polite">
        {visibleLessons.length === 0 ? "No revision aids match those choices." : `${visibleLessons.length} revision ${visibleLessons.length === 1 ? "aid" : "aids"} match those choices.`}
      </p>

      {visibleLessons.length > 0 ? <div className={styles.libraryGrid}>
        {visibleLessons.map((lesson) => {
          const aid = revisionAidFor(lesson.slug);
          const status = areaStatus(lesson);
          const confidence = lesson.confidence ?? null;
          const queuedReviewCount = lesson.queuedReviewCount ?? 0;
          return <article className={styles.aidCard} key={lesson.slug}>
            <div className={styles.aidCardTop}><span>{lesson.order.toString().padStart(2, "0")}</span><small>{lesson.durationMinutes} min</small></div>
            <div className={styles.aidStatus} data-tone={status.tone}>{status.label}</div>
            <p className={styles.eyebrow}>{aid.label}</p>
            <h3>{lesson.title}</h3>
            <p>{aid.shortDescription}</p>
            <div className={styles.aidMeta}>
              <span>{confidence === null ? "Confidence not recorded" : `Confidence ${confidence}/5`}</span>
              {queuedReviewCount > 0 && <span>{queuedReviewCount} queued</span>}
            </div>
            <div className={styles.aidTypes}>{aid.aidTypes.map((type) => <span key={type}>{type}</span>)}</div>
            <Link href={`/learn/${lesson.slug}`}>Open revision aid →</Link>
          </article>;
        })}
      </div> : (
        <div className={styles.finderEmpty}>
          <strong>Try a broader search</strong>
          <p>Search the concept, memory cue or common trap you remember—not only the topic title.</p>
          <button type="button" onClick={() => { setQuery(""); setFilter("all"); }}>Show all aids</button>
        </div>
      )}
    </section>
  );
}
