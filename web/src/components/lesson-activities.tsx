"use client";

import { useState } from "react";

import { PlaneAxisExplorer, PlaneAxisSorter, SquatJointSequence } from "@/components/movement-interactions";

import styles from "./lesson-activities.module.css";

type Props = { lessonSlug: string; step: "hook" | "explain" | "explore" | "apply" };

type PositionView = "front" | "back";

const positionFeatures = [
  ["upright", "The subject stands upright"],
  ["faces-forward", "The subject faces forward"],
  ["arms-by-sides", "The arms rest by the sides"],
  ["palms-forward", "The palms face forward"],
  ["elbows-bent", "The elbows are held in a flexed position"],
] as const;

const comparisons = [
  { prompt: "The elbow is ____ to the wrist.", answer: "proximal", options: [["proximal", "Proximal"], ["distal", "Distal"]], why: "The elbow is nearer the upper limb's attachment to the trunk." },
  { prompt: "The sternum is ____ to the shoulder.", answer: "medial", options: [["medial", "Medial"], ["lateral", "Lateral"]], why: "The sternum is closer to the body's midline than the shoulder." },
  { prompt: "The skin is ____ to the muscle beneath it.", answer: "superficial", options: [["superficial", "Superficial"], ["deep", "Deep"]], why: "Superficial means closer to the body's surface." },
  { prompt: "The spine is ____ to the sternum.", answer: "posterior", options: [["anterior", "Anterior"], ["posterior", "Posterior"]], why: "The spine is toward the back; the sternum is toward the front." },
  { prompt: "The heart is ____ to the skin covering the chest.", answer: "deep", options: [["superficial", "Superficial"], ["deep", "Deep"]], why: "The heart is farther from the body's surface than the skin." },
] as const;

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

export function AnatomicalPositionLab() {
  const [view, setView] = useState<PositionView>("front");
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [featuresChecked, setFeaturesChecked] = useState(false);
  const [sideAnswer, setSideAnswer] = useState<string | null>(null);
  const [sideChecked, setSideChecked] = useState(false);
  const correctFeatures = positionFeatures.filter(([id]) => id !== "elbows-bent").map(([id]) => id);
  const featuresCorrect = selectedFeatures.length === correctFeatures.length && correctFeatures.every((id) => selectedFeatures.includes(id));

  function toggleFeature(id: string) {
    setSelectedFeatures((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
    setFeaturesChecked(false);
  }

  return (
    <section className={styles.activity} data-testid="anatomical-position-lab" aria-labelledby="position-lab-heading">
      <div className={styles.activityIntro}><span className={styles.eyebrow}>Explore the reference</span><h3 id="position-lab-heading">Anchor the body before you name a direction</h3><p>Anatomical position is a shared starting point. The view may change, but the subject&apos;s body sides and landmarks do not.</p></div>
      <div className={styles.labToolbar} aria-label="Figure view"><span>View the subject from:</span><div>{(["front", "back"] as PositionView[]).map((item) => <button key={item} type="button" aria-pressed={view === item} onClick={() => setView(item)}>{item === "front" ? "Front" : "Back"} view</button>)}</div></div>
      <div className={styles.positionWorkspace}>
        <figure className={styles.positionFigure} data-view={view}>
          <div className={styles.positionPerson} aria-hidden="true"><span className={styles.positionHead} /><span className={styles.positionTorso} /><span className={styles.positionArmLeft} /><span className={styles.positionArmRight} /><span className={styles.positionLegLeft} /><span className={styles.positionLegRight} /></div>
          <figcaption><strong>{view === "front" ? "Front view" : "Back view"}</strong><span>Screen position is not the reference.</span></figcaption>
        </figure>
        <fieldset className={styles.featureList}>
          <legend>Which features belong to anatomical position?</legend>
          {positionFeatures.map(([id, label]) => <button key={id} type="button" aria-pressed={selectedFeatures.includes(id)} onClick={() => toggleFeature(id)}>{label}</button>)}
          {!featuresChecked ? <button className={styles.primary} type="button" disabled={selectedFeatures.length === 0} onClick={() => setFeaturesChecked(true)}>Check the features</button> : <div className={`${styles.feedback} ${featuresCorrect ? styles.correct : styles.misconception}`} role="status" aria-live="polite"><strong>{featuresCorrect ? "That is the reference position" : "A useful distinction to revisit"}</strong><p>{featuresCorrect ? "Upright, facing forward, arms by the sides and palms forward establish the shared reference. An elbow bend is a change in posture, not a defining feature here." : "The reference position is upright, facing forward, arms by the sides and palms forward. An elbow bend is a tempting extra selection because it describes a posture, not the agreed reference."}</p>{!featuresCorrect && <button type="button" onClick={() => { setSelectedFeatures([]); setFeaturesChecked(false); }}>Retry the features</button>}</div>}
        </fieldset>
      </div>
      <section className={styles.viewpointCheck} aria-labelledby="viewpoint-check-heading">
        <p className={styles.eyebrow}>Subject or viewer?</p><h4 id="viewpoint-check-heading">The subject&apos;s left remains the subject&apos;s left in both views.</h4><div className={styles.choiceGrid}><button type="button" aria-pressed={sideAnswer === "subject-left"} disabled={sideChecked} onClick={() => setSideAnswer("subject-left")}>Use the subject&apos;s left</button><button type="button" aria-pressed={sideAnswer === "screen-left"} disabled={sideChecked} onClick={() => setSideAnswer("screen-left")}>Use screen-left</button></div>{!sideChecked ? <button className={styles.primary} type="button" disabled={!sideAnswer} onClick={() => setSideChecked(true)}>Check the viewpoint</button> : <div className={`${styles.feedback} ${sideAnswer === "subject-left" ? styles.correct : styles.misconception}`} role="status" aria-live="polite"><strong>{sideAnswer === "subject-left" ? "The reference stays with the person" : "Viewer-left is a tempting shortcut"}</strong><p>{sideAnswer === "subject-left" ? "Changing from front to back view changes what appears on screen, not the subject-relative meaning of left and right." : "Describe the person being observed, not the side of the screen. The subject&apos;s left stays consistent when the viewpoint changes."}</p>{sideAnswer !== "subject-left" && <button type="button" onClick={() => { setSideAnswer(null); setSideChecked(false); }}>Retry the viewpoint</button>}</div>}</section>
    </section>
  );
}

export function DirectionalComparisonBuilder() {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [complete, setComplete] = useState(false);
  const item = comparisons[index];
  const correct = selected === item.answer;

  function next() {
    if (index === comparisons.length - 1) setComplete(true);
    else setIndex((current) => current + 1);
    setSelected(null);
    setChecked(false);
  }

  if (complete) return <section className={styles.activity} data-testid="directional-comparison-builder" aria-labelledby="comparison-complete-heading"><p className={styles.eyebrow}>Comparison set complete</p><h3 id="comparison-complete-heading">The reference follows the body into a new pose.</h3><p>You compared landmarks rather than relying on screen position. The same relationships remain meaningful when the figure changes from standing into the starting squat stance.</p><div className={styles.poseNote}><strong>Transfer to the squat</strong><span>Proximal, distal, medial, lateral, anterior, posterior, superficial and deep describe relationships between structures—not whether the whole body is moving up or down.</span></div><button className={styles.primary} type="button" onClick={() => { setIndex(0); setSelected(null); setChecked(false); setComplete(false); }}>Practise the comparisons again</button></section>;

  return <section className={styles.activity} data-testid="directional-comparison-builder" aria-labelledby="comparison-heading"><div className={styles.activityIntro}><span className={styles.eyebrow}>Apply the reference · {index + 1} of {comparisons.length}</span><h3 id="comparison-heading">Complete the comparison</h3><p>{item.prompt}</p></div><div className={styles.choiceGrid}>{item.options.map(([id, label]) => <button key={id} type="button" aria-pressed={selected === id} disabled={checked} onClick={() => { setSelected(id); setChecked(false); }}>{label}</button>)}</div>{!checked ? <button className={styles.primary} type="button" disabled={!selected} onClick={() => setChecked(true)}>Check comparison</button> : <div className={`${styles.feedback} ${correct ? styles.correct : styles.misconception}`} role="status" aria-live="polite"><strong>{correct ? "That relationship is accurate" : "Check the reference line"}</strong><p>{correct ? item.why : `The useful clue is the relationship between the two named structures. ${item.why}`}</p>{correct ? <button type="button" onClick={next}>{index === comparisons.length - 1 ? "Finish comparisons" : "Next comparison"}</button> : <button type="button" onClick={() => { setSelected(null); setChecked(false); }}>Retry comparison</button>}</div>}</section>;
}

export function LessonActivity(props: Props) {
  if (props.lessonSlug === "planes-and-axes" && props.step === "explore") return <PlaneAxisExplorer />;
  if (props.lessonSlug === "planes-and-axes" && props.step === "apply") return <PlaneAxisSorter />;
  if (props.lessonSlug === "joint-actions" && props.step === "explore") return <SquatJointSequence />;
  if (props.lessonSlug === "anatomical-position" && props.step === "explore") return <AnatomicalPositionLab />;
  if (props.lessonSlug === "anatomical-position" && props.step === "apply") return <DirectionalComparisonBuilder />;
  if (props.lessonSlug === "anatomical-position" || props.lessonSlug === "recognising-actions" || props.lessonSlug === "mixed-movement-challenge") return <ChoiceActivity {...props} />;
  return <div className={styles.explainCard}><span className={styles.eyebrow}>Make a prediction</span><p>Before continuing, say the key relationship in your own words. The written equivalent stays available below the visual.</p></div>;
}
