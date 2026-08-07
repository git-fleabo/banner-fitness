"use client";

import { useState } from "react";

import { PlaneAxisExplorer, SquatJointSequence } from "@/components/movement-interactions";

import styles from "./lesson-activities.module.css";

type Props = { lessonSlug: string; step: "hook" | "explain" | "explore" | "apply" };

const activityCopy = {
  "anatomical-position": {
    explore: { title: "Anchor the viewpoint", prompt: "A client faces you. Whose left are you describing?", options: [["subject", "The client's left"], ["viewer", "My left as the coach"]], answer: "subject", why: "Anatomical left and right belong to the person being described, not the viewer." },
    apply: { title: "Compare two structures", prompt: "The elbow is ____ to the wrist.", options: [["proximal", "Proximal"], ["distal", "Distal"]], answer: "proximal", why: "Proximal means nearer the limb's attachment to the trunk." },
  },
  "recognising-actions": {
    explore: { title: "Movement detective", prompt: "During a lateral raise, the arm moves away from the body's midline. What is the principal shoulder action?", options: [["abduction", "Abduction"], ["adduction", "Adduction"], ["flexion", "Flexion"]], answer: "abduction", why: "The arm moves away from the midline: abduction." },
    apply: { title: "Name the evidence", prompt: "Which explanation is precise enough for another trainer?", options: [["precise", "During lowering, the elbow moves into extension as its angle increases"], ["vague", "The curl goes down"]], answer: "precise", why: "A useful observation names the phase, joint, action and visible change." },
  },
  "mixed-movement-challenge": {
    explore: { title: "Fresh movement case", prompt: "A standing torso rotation is predominantly in which plane?", options: [["transverse", "Transverse"], ["sagittal", "Sagittal"], ["frontal", "Frontal"]], answer: "transverse", why: "Axial rotation is predominantly transverse-plane movement." },
    apply: { title: "Repair the explanation", prompt: "Which sentence makes ‘the leg bends down’ precise?", options: [["precise", "During descent, the knee moves into flexion as its angle decreases"], ["muscle", "The quadriceps works while the body goes lower"]], answer: "precise", why: "The precise version identifies phase, joint, action and observable evidence." },
  },
} as const;

function ChoiceActivity({ lessonSlug, step }: Props) {
  const config = activityCopy[lessonSlug as keyof typeof activityCopy]?.[step as "explore" | "apply"];
  const [selected, setSelected] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  if (!config) return <div className={styles.explainCard}><span className={styles.eyebrow}>Think first</span><p>Use the explanation above to predict what you would observe before opening the next step.</p></div>;
  const correct = selected === config.answer;
  return <section className={styles.activity} aria-labelledby="activity-heading">
    <div className={styles.activityIntro}><span className={styles.eyebrow}>{step === "explore" ? "Predict, then reveal" : "Apply the method"}</span><h3 id="activity-heading">{config.title}</h3><p>{config.prompt}</p></div>
    <div className={styles.choiceGrid}>{config.options.map(([id, label]) => <button key={id} type="button" aria-pressed={selected === id} disabled={checked} onClick={() => { setSelected(id); setChecked(false); }}>{label}</button>)}</div>
    {!checked ? <button className={styles.primary} type="button" disabled={!selected} onClick={() => setChecked(true)}>Check my thinking</button> : <div className={`${styles.feedback} ${correct ? styles.correct : styles.misconception}`} role="status" aria-live="polite"><strong>{correct ? "That matches the evidence" : "A useful distinction to revisit"}</strong><p>{correct ? config.why : `This answer is a tempting shortcut. ${config.why}`}</p>{!correct && <button type="button" onClick={() => { setSelected(null); setChecked(false); }}>Retry this part</button>}</div>}
  </section>;
}

export function LessonActivity(props: Props) {
  if (props.lessonSlug === "planes-and-axes" && props.step === "explore") return <PlaneAxisExplorer />;
  if (props.lessonSlug === "joint-actions" && props.step === "explore") return <SquatJointSequence />;
  if (props.lessonSlug === "anatomical-position" || props.lessonSlug === "recognising-actions" || props.lessonSlug === "mixed-movement-challenge") return <ChoiceActivity {...props} />;
  return <div className={styles.explainCard}><span className={styles.eyebrow}>Make a prediction</span><p>Before continuing, say the key relationship in your own words. The written equivalent stays available below the visual.</p></div>;
}
