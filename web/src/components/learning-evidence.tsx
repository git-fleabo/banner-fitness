"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import { completeLesson, recordPracticeAttempt } from "@/app/learn/actions";
import type { LessonPageData, LessonResumeState } from "@/lib/content/repository";

import styles from "./learning-evidence.module.css";

type Question = LessonPageData["objects"][number]["questions"][number];
type AttemptResult = Awaited<ReturnType<typeof recordPracticeAttempt>>;
type CompletionResult = Awaited<ReturnType<typeof completeLesson>>;

export function QuestionPractice({ lessonSlug, questions, resumeState, revisionQuestionStableKey, revisionId }: { lessonSlug: string; questions: Question[]; resumeState?: LessonResumeState | null; revisionQuestionStableKey?: string; revisionId?: string }) {
  const targetedQuestion = revisionId
    ? questions.find((question) => question.response.variationOf === revisionQuestionStableKey)
      ?? (revisionQuestionStableKey ? questions.find((question) => question.stableKey !== revisionQuestionStableKey) : questions[questions.length - 1])
    : undefined;
  const activeQuestions = targetedQuestion ? [targetedQuestion] : questions;
  const targeted = Boolean(revisionId);
  const resumedIndex = Math.max(0, activeQuestions.findIndex((question) => question.stableKey === resumeState?.questionStableKey));
  const [index, setIndex] = useState(resumedIndex);
  const [selected, setSelected] = useState<string | null>(resumeState?.selected?.[0] ?? null);
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [finished, setFinished] = useState(false);
  const [isPending, startTransition] = useTransition();
  const question = activeQuestions[index];

  if (!question || finished) {
    return (
      <section className={styles.summary} aria-labelledby="check-summary-heading">
        <p className={styles.kicker}>{targeted ? "Targeted revisit complete" : "Check complete"}</p>
        <h3 id="check-summary-heading">{targeted ? "This weak area has been revisited" : "This attempt added practice evidence"}</h3>
        <p>{targeted ? "The queued revision was checked with a changed question where available. Your original attempt remains visible in your learning record." : "Coverage and practice are recorded separately from durable security. Revisit varied question forms over time before treating the outcome as secure."}</p>
        <Link className={styles.nextAction} href={`/learn/${lessonSlug}?step=close`}>Continue to lesson reflection →</Link>
        <button type="button" onClick={() => { setIndex(0); setSelected(null); setResult(null); setFinished(false); }}>Practise again</button>
      </section>
    );
  }

  function submit() {
    if (!selected) return;
    startTransition(async () => {
      const input = { lessonSlug, questionStableKey: question.stableKey, selected: [selected], ...(revisionId ? { reviewId: revisionId } : {}) };
      const nextResult = await recordPracticeAttempt(input);
      setResult(nextResult);
    });
  }

  function next() {
    if (index >= activeQuestions.length - 1) setFinished(true);
    else setIndex((value) => value + 1);
    setSelected(null);
    setResult(null);
  }

  return (
    <section className={styles.practice} aria-labelledby="practice-question-heading">
      <div className={styles.practiceHeader}><p className={styles.kicker}>{targeted ? "Targeted revisit" : `Question ${index + 1} of ${activeQuestions.length}`}</p><span>{targeted ? "Changed retrieval check" : "Evidence-recording check"}</span></div>
      <h3 id="practice-question-heading">{question.prompt}</h3>
      {resumeState?.submitted && resumeState.questionStableKey === question.stableKey && !result && (
        <p className={styles.resumeNotice} role="status">Resumed with your previous selection. That answer was submitted and recorded as practice evidence; check it again when you are ready to retry.</p>
      )}
      <div className={styles.choices}>
        {(question.response.choices ?? []).map((option) => (
          <button key={option.id} type="button" aria-pressed={selected === option.id} disabled={Boolean(result) || isPending} onClick={() => setSelected(option.id)}>{option.label}</button>
        ))}
      </div>

      {!result ? <button className={styles.submit} type="button" disabled={!selected || isPending} onClick={submit}>{isPending ? "Recording…" : "Check answer"}</button> : (
        <div className={`${styles.feedback} ${styles[result.feedbackCategory]}`} role="status" aria-live="polite">
          <strong>{result.feedbackCategory === "correct" ? "Correct" : result.feedbackCategory === "partly_correct" ? "Partly correct" : "Needs another look"}</strong>
          <p>{result.result}</p>
          {result.revision && <div className={styles.revision}><b>Added to revision</b><p>{result.revision.explanation}</p><small>Due {new Date(result.revision.dueAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}. You can change this in the review queue.</small></div>}
          {result.feedbackCategory === "correct" && result.revisionCompleted && <div className={styles.revisionComplete} role="status"><b>Targeted revisit completed</b><p>This recommendation is cleared. Keep the concept open for another varied retrieval later.</p></div>}
          {result.feedbackCategory === "correct" ? <button type="button" onClick={next}>{index === activeQuestions.length - 1 ? "Finish check" : "Next question"}</button> : <button type="button" onClick={() => { setSelected(null); setResult(null); }}>Retry question</button>}
        </div>
      )}
    </section>
  );
}

export function LessonClose({ lessonSlug, completed = false, confidence: savedConfidence = null }: { lessonSlug: string; completed?: boolean; confidence?: number | null }) {
  const [confidence, setConfidence] = useState<number | undefined>();
  const [result, setResult] = useState<CompletionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function finish() {
    setError(null);
    startTransition(async () => {
      try {
        setResult(await completeLesson({ lessonSlug, confidence }));
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "We could not record coverage yet.");
      }
    });
  }

  if (result || completed) {
    const recordedConfidence = result?.confidence ?? savedConfidence;
    return (
      <section className={styles.summary} aria-labelledby="lesson-complete-heading">
        <p className={styles.kicker}>Lesson covered</p>
        <h3 id="lesson-complete-heading">Coverage recorded—not yet secure</h3>
        <p>You completed this lesson and can revisit it at any time. Security requires correct retrieval on more than one occasion and in more than one question form.</p>
        {recordedConfidence && <p>Your optional confidence: {recordedConfidence} of 5.</p>}
        <Link className={styles.nextAction} href="/learn">Return to your learning path →</Link>
      </section>
    );
  }

  return (
    <section className={styles.closePanel} aria-labelledby="finish-lesson-heading">
      <p className={styles.kicker}>Optional reflection</p>
      <h3 id="finish-lesson-heading">How confident do you feel right now?</h3>
      <p>Confidence helps you choose what to revisit; it is not scored evidence.</p>
      {error && <p className={styles.error} role="alert">{error} <Link href={`/learn/${lessonSlug}?step=check`}>Return to the evidence check.</Link></p>}
      <div className={styles.confidence} aria-label="Optional confidence from 1 to 5">
        {[1, 2, 3, 4, 5].map((value) => <button key={value} type="button" aria-pressed={confidence === value} onClick={() => setConfidence(value)}>{value}</button>)}
      </div>
      <button className={styles.submit} type="button" disabled={isPending} onClick={finish}>{isPending ? "Saving…" : "Mark lesson covered"}</button>
    </section>
  );
}
