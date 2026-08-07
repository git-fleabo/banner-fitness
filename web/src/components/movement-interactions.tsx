"use client";

import { useState } from "react";

import styles from "./movement-interactions.module.css";

type Plane = "sagittal" | "frontal" | "transverse";
type Axis = "medio-lateral" | "anterior-posterior" | "longitudinal";

const planes: Record<Plane, { label: string; axis: Axis; axisLabel: string; division: string; example: string }> = {
  sagittal: { label: "Sagittal", axis: "medio-lateral", axisLabel: "Medio-lateral", division: "left and right portions", example: "A squat is predominantly sagittal." },
  frontal: { label: "Frontal", axis: "anterior-posterior", axisLabel: "Anterior-posterior", division: "anterior and posterior portions", example: "A lateral raise is predominantly frontal." },
  transverse: { label: "Transverse", axis: "longitudinal", axisLabel: "Longitudinal", division: "upper and lower portions", example: "Standing torso rotation is predominantly transverse." },
};

const axisLabels: Record<Axis, string> = {
  "medio-lateral": "Medio-lateral",
  "anterior-posterior": "Anterior-posterior",
  longitudinal: "Longitudinal",
};

export function PlaneAxisExplorer() {
  const [plane, setPlane] = useState<Plane>("sagittal");
  const [answer, setAnswer] = useState<Axis | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const selected = planes[plane];
  const isCorrect = answer === selected.axis;

  function choosePlane(next: Plane) {
    setPlane(next);
    setAnswer(null);
    setSubmitted(false);
  }

  return (
    <div className={styles.lab} data-testid="plane-axis-explorer">
      <div className={styles.selector} aria-label="Select an anatomical plane">
        {(Object.keys(planes) as Plane[]).map((item) => <button key={item} type="button" aria-pressed={plane === item} onClick={() => choosePlane(item)}>{planes[item].label}</button>)}
      </div>

      <div className={styles.planeWorkspace}>
        <figure className={styles.figure}>
          <div className={styles.person} aria-hidden="true"><span /><i /></div>
          <div className={`${styles.plane} ${styles[plane]}`} aria-hidden="true" />
          <div className={`${styles.axis} ${styles[selected.axis]}`} aria-hidden="true" />
          <figcaption><strong>{selected.label} plane</strong><span>Divides the body into {selected.division}.</span></figcaption>
        </figure>
        <div className={styles.explanation}>
          <p className={styles.kicker}>Selected relationship</p>
          <h3>{selected.label} plane</h3>
          <p>Movement through this plane rotates around the <strong>{selected.axisLabel.toLowerCase()} axis</strong>.</p>
          <p>{selected.example}</p>
          <p className={styles.liveUpdate} role="status" aria-live="polite">Showing {selected.label} with its {selected.axisLabel.toLowerCase()} axis.</p>
        </div>
      </div>

      <section className={styles.checkPanel} aria-labelledby="plane-check-heading">
        <p className={styles.kicker}>Pairing check</p>
        <h3 id="plane-check-heading">Which axis pairs with the {selected.label.toLowerCase()} plane?</h3>
        <div className={styles.answerGrid}>
          {(Object.keys(axisLabels) as Axis[]).map((axis) => <button key={axis} type="button" aria-pressed={answer === axis} disabled={submitted} onClick={() => setAnswer(axis)}>{axisLabels[axis]}</button>)}
        </div>
        {!submitted ? (
          <button className={styles.submit} type="button" disabled={!answer} onClick={() => setSubmitted(true)}>Check pairing</button>
        ) : (
          <div className={`${styles.feedback} ${isCorrect ? styles.correct : styles.partly}`} role="status" aria-live="polite">
            <strong>{isCorrect ? "Correct" : "Partly correct"}</strong>
            <p>{isCorrect ? `The ${selected.label.toLowerCase()} plane pairs with the ${selected.axisLabel.toLowerCase()} axis.` : `You chose a real anatomical axis, but it pairs with a different plane. The plane and its perpendicular axis are distinct; inspect the overlay and try again.`}</p>
            {!isCorrect && <p><b>Misconception to check:</b> plane and axis pairings have been reversed.</p>}
            {!isCorrect && <button type="button" onClick={() => { setAnswer(null); setSubmitted(false); }}>Retry pairing</button>}
          </div>
        )}
      </section>
    </div>
  );
}

const planeSorterCards = [
  { name: "Bodyweight squat", answer: "sagittal" as Plane, clue: "The principal hip and knee flexion-extension pattern occurs through the sagittal plane." },
  { name: "Lateral raise", answer: "frontal" as Plane, clue: "The arms move away from the body's midline through the frontal plane." },
  { name: "Standing torso rotation", answer: "transverse" as Plane, clue: "The trunk rotates around a vertical axis through the transverse plane." },
];

export function PlaneAxisSorter() {
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<Plane | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [complete, setComplete] = useState(false);
  const card = planeSorterCards[index];
  const correct = answer === card.answer;

  function next() {
    if (index === planeSorterCards.length - 1) setComplete(true);
    else setIndex((current) => current + 1);
    setAnswer(null);
    setSubmitted(false);
  }

  if (complete) return <section className={styles.checkPanel} data-testid="plane-axis-sorter" aria-labelledby="plane-sorter-complete-heading"><p className={styles.kicker}>Sorter complete</p><h3 id="plane-sorter-complete-heading">Use “predominantly”, not “only”.</h3><p>These movements have a predominant plane for the pattern being discussed. Real movement can include smaller components in other planes, so the label is useful shorthand rather than a claim that the body is perfectly restricted.</p><button className={styles.submit} type="button" onClick={() => { setIndex(0); setAnswer(null); setSubmitted(false); setComplete(false); }}>Practise the sorter again</button></section>;

  return <section className={styles.checkPanel} data-testid="plane-axis-sorter" aria-labelledby="plane-sorter-heading"><p className={styles.kicker}>Apply the relationship · {index + 1} of {planeSorterCards.length}</p><h3 id="plane-sorter-heading">Which plane is predominant for this movement?</h3><p><strong>{card.name}</strong></p><p>{card.clue}</p><div className={styles.answerGrid}>{(Object.keys(planes) as Plane[]).map((item) => <button key={item} type="button" aria-pressed={answer === item} disabled={submitted} onClick={() => setAnswer(item)}>{planes[item].label}</button>)}</div>{!submitted ? <button className={styles.submit} type="button" disabled={!answer} onClick={() => setSubmitted(true)}>Check predominant plane</button> : <div className={`${styles.feedback} ${correct ? styles.correct : styles.partly}`} role="status" aria-live="polite"><strong>{correct ? "That matches the movement" : "Use the movement clue"}</strong><p>{correct ? `The ${card.name.toLowerCase()} is predominantly ${planes[card.answer].label.toLowerCase()} because ${card.clue.toLowerCase()}` : `The selected plane is not the best match for this pattern. ${card.clue}`}</p>{correct ? <button type="button" onClick={next}>{index === planeSorterCards.length - 1 ? "Finish sorter" : "Next movement"}</button> : <button type="button" onClick={() => { setAnswer(null); setSubmitted(false); }}>Retry movement</button>}</div>}</section>;
}

type PhasePart = "phase" | "joint" | "action";
const phaseDescriptionCards = [
  { prompt: "Describe the highlighted knee as the client lowers.", phase: "descent", joint: "knee", action: "flexion", sentence: "During the descent, the knee moves into flexion as its angle decreases." },
  { prompt: "Describe the highlighted ankle as the client lowers.", phase: "descent", joint: "ankle", action: "dorsiflexion", sentence: "During the descent, the ankle moves into dorsiflexion as the shin moves closer to the foot." },
  { prompt: "Describe the highlighted ankle as the client returns to standing.", phase: "return", joint: "ankle", action: "towards-neutral", sentence: "During the return, the ankle moves from dorsiflexion back towards neutral." },
] as const;

const phaseOptions = [
  ["descent", "Descent"],
  ["return", "Return"],
] as const;
const jointOptions = [
  ["hip", "Hip"],
  ["knee", "Knee"],
  ["ankle", "Ankle"],
] as const;
const actionOptions = [
  ["flexion", "Flexion"],
  ["extension", "Extension"],
  ["dorsiflexion", "Dorsiflexion"],
  ["towards-neutral", "Back towards neutral"],
  ["muscle", "Quadriceps contraction"],
] as const;

export function PhaseDescriptionBuilder() {
  const [index, setIndex] = useState(0);
  const [parts, setParts] = useState<Partial<Record<PhasePart, string>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [complete, setComplete] = useState(false);
  const card = phaseDescriptionCards[index];
  const correct = parts.phase === card.phase && parts.joint === card.joint && parts.action === card.action;

  function choose(part: PhasePart, value: string) {
    setParts((current) => ({ ...current, [part]: value }));
    setSubmitted(false);
  }

  function next() {
    if (index === phaseDescriptionCards.length - 1) setComplete(true);
    else setIndex((current) => current + 1);
    setParts({});
    setSubmitted(false);
  }

  if (complete) return <section className={styles.checkPanel} data-testid="phase-description-builder" aria-labelledby="phase-description-complete-heading"><p className={styles.kicker}>Phase descriptions complete</p><h3 id="phase-description-complete-heading">Name the joint before the action.</h3><p>You now have a repeatable sentence pattern: phase, joint and action, followed by the visible angle or position clue. The ankle return is described as movement back towards neutral; that wording avoids implying a calf raise.</p><button className={styles.submit} type="button" onClick={() => { setIndex(0); setParts({}); setSubmitted(false); setComplete(false); }}>Practise the builder again</button></section>;

  const fields: Array<[PhasePart, string, readonly (readonly [string, string])[]]> = [["phase", "Phase", phaseOptions], ["joint", "Joint", jointOptions], ["action", "Action", actionOptions]];
  return <section className={styles.checkPanel} data-testid="phase-description-builder" aria-labelledby="phase-description-heading"><p className={styles.kicker}>Build the description · {index + 1} of {phaseDescriptionCards.length}</p><h3 id="phase-description-heading">{card.prompt}</h3><p>Choose one part for each field, then check the complete observation.</p><div className={styles.phaseMapGrid}>{fields.map(([part, label, options]) => <fieldset key={part}><legend>{label}</legend><div className={styles.answerGrid}>{options.map(([id, optionLabel]) => <button key={id} type="button" aria-pressed={parts[part] === id} onClick={() => choose(part, id)}>{optionLabel}</button>)}</div></fieldset>)}</div>{!submitted ? <button className={styles.submit} type="button" disabled={!parts.phase || !parts.joint || !parts.action} onClick={() => setSubmitted(true)}>Check description</button> : <div className={`${styles.feedback} ${correct ? styles.correct : styles.misconception}`} role="status" aria-live="polite"><strong>{correct ? "That sentence is precise" : "Keep the phase, joint and action separate"}</strong><p>{correct ? card.sentence : `The useful model is: ${card.sentence} A phase is not itself a joint action, and naming a muscle does not answer a joint-action question.`}</p>{correct ? <button type="button" onClick={next}>{index === phaseDescriptionCards.length - 1 ? "Finish builder" : "Next description"}</button> : <button type="button" onClick={() => { setParts({}); setSubmitted(false); }}>Retry description</button>}</div>}</section>;
}

type DetectiveField = { id: string; label: string; prompt: string; answer: string; options: readonly (readonly [string, string])[]; why: string };
type DetectiveCard = { title: string; frameLabel: string; fields: readonly DetectiveField[] };
const detectiveCards: readonly DetectiveCard[] = [
  { title: "Bodyweight squat descent", frameLabel: "Standing → bottom", fields: [
    { id: "focus", label: "Focus", prompt: "Which landmark is highlighted?", answer: "knee", options: [["knee", "Knee"], ["elbow", "Elbow"], ["shoulder", "Shoulder"]], why: "The highlighted bend is at the knee." },
    { id: "phase", label: "Phase", prompt: "Which phase is shown?", answer: "descent", options: [["descent", "Descent"], ["ascent", "Ascent"], ["static", "Static hold"]], why: "The sequence moves from standing towards the bottom position." },
    { id: "action", label: "Action", prompt: "What is the principal knee action?", answer: "flexion", options: [["flexion", "Flexion"], ["extension", "Extension"], ["abduction", "Abduction"]], why: "The knee angle decreases during the descent, which is flexion." },
    { id: "plane", label: "Predominant plane", prompt: "Which plane best describes the main pattern?", answer: "sagittal", options: [["sagittal", "Sagittal"], ["frontal", "Frontal"], ["transverse", "Transverse"]], why: "The principal hip and knee flexion-extension pattern is predominantly sagittal." },
  ] },
  { title: "Elbow curl lowering", frameLabel: "Arm flexed → arm lengthens", fields: [
    { id: "focus", label: "Focus", prompt: "Which joint is highlighted?", answer: "elbow", options: [["elbow", "Elbow"], ["knee", "Knee"], ["hip", "Hip"]], why: "The changing angle is at the elbow." },
    { id: "phase", label: "Phase", prompt: "Which direction is shown?", answer: "lowering", options: [["lowering", "Lowering"], ["lifting", "Lifting"], ["static", "Static hold"]], why: "The forearm is moving away from the upper arm during the lowering phase." },
    { id: "action", label: "Action", prompt: "What is the elbow action?", answer: "extension", options: [["extension", "Extension"], ["flexion", "Flexion"], ["rotation", "Rotation"]], why: "The elbow angle increases as the arm lengthens, which is extension." },
    { id: "plane", label: "Predominant plane", prompt: "Which plane best describes the curl?", answer: "sagittal", options: [["sagittal", "Sagittal"], ["frontal", "Frontal"], ["transverse", "Transverse"]], why: "Elbow flexion and extension occur predominantly through the sagittal plane." },
  ] },
  { title: "Lateral raise lifting", frameLabel: "Arms by sides → arms away", fields: [
    { id: "focus", label: "Focus", prompt: "Which joint is highlighted?", answer: "shoulder", options: [["shoulder", "Shoulder"], ["ankle", "Ankle"], ["elbow", "Elbow"]], why: "The arm is moving at the shoulder relative to the trunk." },
    { id: "phase", label: "Phase", prompt: "Which direction is shown?", answer: "lifting", options: [["lifting", "Lifting"], ["lowering", "Lowering"], ["static", "Static hold"]], why: "The arms are moving away from the sides during the lifting phase." },
    { id: "action", label: "Action", prompt: "What is the principal shoulder action?", answer: "abduction", options: [["abduction", "Abduction"], ["adduction", "Adduction"], ["flexion", "Flexion"]], why: "The arms move away from the body's midline: abduction." },
    { id: "plane", label: "Predominant plane", prompt: "Which plane best describes the raise?", answer: "frontal", options: [["frontal", "Frontal"], ["sagittal", "Sagittal"], ["transverse", "Transverse"]], why: "Shoulder abduction is predominantly frontal-plane movement." },
  ] },
  { title: "Standing torso rotation", frameLabel: "Trunk facing centre → trunk rotated", fields: [
    { id: "focus", label: "Focus", prompt: "Which region is highlighted?", answer: "trunk", options: [["trunk", "Trunk"], ["knee", "Knee"], ["wrist", "Wrist"]], why: "The visible change is rotation through the trunk." },
    { id: "phase", label: "Phase", prompt: "Which direction is shown?", answer: "rotation", options: [["rotation", "Rotation"], ["squat", "Squat descent"], ["static", "Static hold"]], why: "The trunk changes orientation around a vertical line." },
    { id: "action", label: "Action", prompt: "What action is being observed?", answer: "rotation", options: [["rotation", "Rotation"], ["flexion", "Flexion"], ["abduction", "Abduction"]], why: "The trunk turns around its longitudinal axis: rotation." },
    { id: "plane", label: "Predominant plane", prompt: "Which plane best describes the rotation?", answer: "transverse", options: [["transverse", "Transverse"], ["sagittal", "Sagittal"], ["frontal", "Frontal"]], why: "Controlled axial rotation is predominantly transverse-plane movement." },
  ] },
];

export function MovementDetective() {
  const [cardIndex, setCardIndex] = useState(0);
  const [fieldIndex, setFieldIndex] = useState(0);
  const [answer, setAnswer] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [complete, setComplete] = useState(false);
  const card = detectiveCards[cardIndex];
  const field = card.fields[fieldIndex];
  const correct = answer === field.answer;

  function next() {
    if (fieldIndex < card.fields.length - 1) setFieldIndex((current) => current + 1);
    else if (cardIndex < detectiveCards.length - 1) { setCardIndex((current) => current + 1); setFieldIndex(0); }
    else setComplete(true);
    setAnswer(null);
    setSubmitted(false);
  }

  if (complete) return <section className={styles.checkPanel} data-testid="movement-detective" aria-labelledby="detective-complete-heading"><p className={styles.kicker}>Four movement cards complete</p><h3 id="detective-complete-heading">Evidence before exercise names.</h3><p>You identified the focus, phase, action and predominant plane across a squat, curl, lateral raise and torso rotation. The same exercise name can contain different joint actions in different phases, so the observation sequence stays first.</p><button className={styles.submit} type="button" onClick={() => { setCardIndex(0); setFieldIndex(0); setAnswer(null); setSubmitted(false); setComplete(false); }}>Review the cards again</button></section>;

  return <section className={styles.checkPanel} data-testid="movement-detective" aria-labelledby="detective-heading"><p className={styles.kicker}>Movement detective · card {cardIndex + 1} of {detectiveCards.length}</p><h3 id="detective-heading">{card.title}</h3><p><strong>{card.frameLabel}</strong></p><p>{field.prompt}</p><p className={styles.liveUpdate} role="status" aria-live="polite">Step {fieldIndex + 1} of {card.fields.length}: {field.label}</p><div className={styles.answerGrid}>{field.options.map(([id, label]) => <button key={id} type="button" aria-pressed={answer === id} disabled={submitted} onClick={() => setAnswer(id)}>{label}</button>)}</div>{!submitted ? <button className={styles.submit} type="button" disabled={!answer} onClick={() => setSubmitted(true)}>Check observation</button> : <div className={`${styles.feedback} ${correct ? styles.correct : styles.misconception}`} role="status" aria-live="polite"><strong>{correct ? "That observation fits" : "Inspect the highlighted clue"}</strong><p>{correct ? field.why : `The useful clue is not the exercise name alone. ${field.why}`}</p>{correct ? <button type="button" onClick={next}>{fieldIndex === card.fields.length - 1 && cardIndex === detectiveCards.length - 1 ? "Finish detective" : "Next observation"}</button> : <button type="button" onClick={() => { setAnswer(null); setSubmitted(false); }}>Retry observation</button>}</div>}</section>;
}

const diagnosisCards = [
  { title: "Squat descent · knee", prompt: "Which explanation is precise enough for another trainer?", options: [["precise", "During the descent, the knee moves into flexion as its angle decreases"], ["down", "The leg bends down"], ["muscle", "The quadriceps contracts, so the knee is flexing"]], answer: "precise", why: "It names the phase, joint, action and observable angle change." },
  { title: "Lateral raise · shoulder", prompt: "Which explanation uses the correct reference?", options: [["precise", "During lifting, the shoulder moves into abduction as the arm travels away from the midline"], ["up", "The arms go up, so the shoulders extend"], ["name", "It is a lateral raise, so the action is lateral"]], answer: "precise", why: "It identifies the shoulder action relative to the body's midline and names the phase." },
  { title: "Torso rotation", prompt: "Which explanation is most useful?", options: [["precise", "During controlled rotation, the trunk turns predominantly through the transverse plane around the longitudinal axis"], ["exercise", "It is a twist, so it is transverse"], ["vague", "The upper body moves sideways"]], answer: "precise", why: "It names the region, action, predominant plane and corresponding axis." },
] as const;

export function ExplanationDiagnosis() {
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [complete, setComplete] = useState(false);
  const card = diagnosisCards[index];
  const correct = answer === card.answer;

  if (complete) return <section className={styles.checkPanel} data-testid="explanation-diagnosis" aria-labelledby="diagnosis-complete-heading"><p className={styles.kicker}>Diagnosis complete</p><h3 id="diagnosis-complete-heading">Precise does not mean long.</h3><p>The strongest explanations name the relevant joint or region, phase, action and visible clue. Extra muscle or exercise-name language cannot replace the requested evidence.</p><button className={styles.submit} type="button" onClick={() => { setIndex(0); setAnswer(null); setSubmitted(false); setComplete(false); }}>Diagnose again</button></section>;

  return <section className={styles.checkPanel} data-testid="explanation-diagnosis" aria-labelledby="diagnosis-heading"><p className={styles.kicker}>Diagnose the explanation · {index + 1} of {diagnosisCards.length}</p><h3 id="diagnosis-heading">{card.title}</h3><p>{card.prompt}</p><div className={styles.answerGrid}>{card.options.map(([id, label]) => <button key={id} type="button" aria-pressed={answer === id} disabled={submitted} onClick={() => setAnswer(id)}>{label}</button>)}</div>{!submitted ? <button className={styles.submit} type="button" disabled={!answer} onClick={() => setSubmitted(true)}>Check explanation</button> : <div className={`${styles.feedback} ${correct ? styles.correct : styles.misconception}`} role="status" aria-live="polite"><strong>{correct ? "That explanation carries the evidence" : "Find what the sentence is missing"}</strong><p>{correct ? card.why : `A label, exercise name or muscle action is not enough. ${card.why}`}</p>{correct ? <button type="button" onClick={() => { if (index === diagnosisCards.length - 1) setComplete(true); else setIndex((current) => current + 1); setAnswer(null); setSubmitted(false); }}>{index === diagnosisCards.length - 1 ? "Finish diagnosis" : "Next explanation"}</button> : <button type="button" onClick={() => { setAnswer(null); setSubmitted(false); }}>Retry explanation</button>}</div>}</section>;
}

const mixedCaseTasks = [
  { title: "1 · Viewpoint", prompt: "A coach faces a client. Which left/right reference should the case use?", options: [["subject", "The client's left"], ["viewer", "The coach's left"]], answer: "subject", why: "Directional language belongs to the subject being described." },
  { title: "2 · Directional comparison", prompt: "The knee is ____ to the ankle.", options: [["proximal", "Proximal"], ["distal", "Distal"]], answer: "proximal", why: "The knee is nearer the lower limb's attachment to the trunk." },
  { title: "3 · Predominant plane", prompt: "The squat's main hip and knee pattern is predominantly which plane?", options: [["sagittal", "Sagittal"], ["frontal", "Frontal"], ["transverse", "Transverse"]], answer: "sagittal", why: "The main flexion-extension pattern is predominantly sagittal, without claiming it is only sagittal." },
  { title: "4 · Corresponding axis", prompt: "Which axis pairs with the squat's predominant plane?", options: [["medio-lateral", "Medio-lateral"], ["anterior-posterior", "Anterior-posterior"], ["longitudinal", "Longitudinal"]], answer: "medio-lateral", why: "The medio-lateral axis is perpendicular to the sagittal plane." },
  { title: "5 · Phase-specific action", prompt: "During squat descent, which pair is accurate?", options: [["flexion", "Hip flexion and knee flexion"], ["extension", "Hip extension and knee extension"], ["muscle", "Quadriceps contraction"]], answer: "flexion", why: "Both hip and knee angles decrease during descent; a muscle name is a different analysis." },
  { title: "6 · Repair the sentence", prompt: "Which revision is precise enough for another trainer?", options: [["precise", "During descent, the knee moves into flexion as its angle decreases"], ["vague", "The leg bends down"], ["name", "It is a squat, so it is flexion"]], answer: "precise", why: "The revision names the phase, joint, action and observable evidence." },
] as const;

export function MixedMovementCase() {
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [complete, setComplete] = useState(false);
  const task = mixedCaseTasks[index];
  const correct = answer === task.answer;

  if (complete) return <section className={styles.checkPanel} data-testid="mixed-movement-case" aria-labelledby="mixed-case-complete-heading"><p className={styles.kicker}>Six-step case complete</p><h3 id="mixed-case-complete-heading">Your next review is visible.</h3><p>Strong in this challenge: combining the viewpoint, comparison and phase evidence. Check again soon: matching planes and axes, because those relationships are easy to reverse when the movement example changes.</p><button className={styles.submit} type="button" onClick={() => { setIndex(0); setAnswer(null); setSubmitted(false); setComplete(false); }}>Run the case again</button></section>;

  return <section className={styles.checkPanel} data-testid="mixed-movement-case" aria-labelledby="mixed-case-heading"><p className={styles.kicker}>Six-step movement case · {index + 1} of {mixedCaseTasks.length}</p><h3 id="mixed-case-heading">{task.title}</h3><p>{task.prompt}</p><div className={styles.answerGrid}>{task.options.map(([id, label]) => <button key={id} type="button" aria-pressed={answer === id} disabled={submitted} onClick={() => setAnswer(id)}>{label}</button>)}</div>{!submitted ? <button className={styles.submit} type="button" disabled={!answer} onClick={() => setSubmitted(true)}>Check case step</button> : <div className={`${styles.feedback} ${correct ? styles.correct : styles.misconception}`} role="status" aria-live="polite"><strong>{correct ? "The case evidence lines up" : "Re-anchor the case"}</strong><p>{correct ? task.why : `Use the named reference in this step. ${task.why}`}</p>{correct ? <button type="button" onClick={() => { if (index === mixedCaseTasks.length - 1) setComplete(true); else setIndex((current) => current + 1); setAnswer(null); setSubmitted(false); }}>{index === mixedCaseTasks.length - 1 ? "Finish case" : "Next case step"}</button> : <button type="button" onClick={() => { setAnswer(null); setSubmitted(false); }}>Retry case step</button>}</div>}</section>;
}

const transferCards = [
  { title: "Fresh frontal-plane transfer", prompt: "During a lateral raise, the arm moves away from the midline. Which pair is most precise?", options: [["frontal-abduction", "Shoulder abduction, predominantly frontal"], ["sagittal-flexion", "Shoulder flexion, predominantly sagittal"], ["up-extension", "The arms go up, so the shoulder extends"]], answer: "frontal-abduction", why: "The midline and plane provide evidence rather than the exercise name or overall direction." },
  { title: "Fresh transverse-plane transfer", prompt: "During controlled standing torso rotation, which description is best?", options: [["rotation", "Trunk rotation, predominantly transverse around the longitudinal axis"], ["side", "The trunk moves sideways in the frontal plane"], ["squat", "The knees flex because the body turns"]], answer: "rotation", why: "The region, action, predominant plane and axis all match the observed turn." },
  { title: "Alternate squat viewpoint", prompt: "From a back view of a squat, what remains unchanged?", options: [["subject", "The subject-relative left/right and joint-action references"], ["screen", "The screen-left side becomes the subject's left"], ["nothing", "All anatomical terms change with the viewpoint"]], answer: "subject", why: "A new viewpoint changes the display, not the subject-relative reference or the joint evidence." },
] as const;

export function MixedTransferSet() {
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [complete, setComplete] = useState(false);
  const card = transferCards[index];
  const correct = answer === card.answer;

  if (complete) return <section className={styles.checkPanel} data-testid="mixed-transfer-set" aria-labelledby="transfer-complete-heading"><p className={styles.kicker}>Transfer set complete</p><h3 id="transfer-complete-heading">The method transfers beyond one squat picture.</h3><p>You applied the same references to frontal-plane, transverse-plane and alternate-viewpoint examples. Choose the next revision from your check feedback rather than treating one successful case as permanent security.</p><button className={styles.submit} type="button" onClick={() => { setIndex(0); setAnswer(null); setSubmitted(false); setComplete(false); }}>Repeat transfer set</button></section>;

  return <section className={styles.checkPanel} data-testid="mixed-transfer-set" aria-labelledby="transfer-heading"><p className={styles.kicker}>Transfer example · {index + 1} of {transferCards.length}</p><h3 id="transfer-heading">{card.title}</h3><p>{card.prompt}</p><div className={styles.answerGrid}>{card.options.map(([id, label]) => <button key={id} type="button" aria-pressed={answer === id} disabled={submitted} onClick={() => setAnswer(id)}>{label}</button>)}</div>{!submitted ? <button className={styles.submit} type="button" disabled={!answer} onClick={() => setSubmitted(true)}>Check transfer</button> : <div className={`${styles.feedback} ${correct ? styles.correct : styles.misconception}`} role="status" aria-live="polite"><strong>{correct ? "The method transfers" : "Use the named reference"}</strong><p>{correct ? card.why : `The fresh example still needs a specific reference. ${card.why}`}</p>{correct ? <button type="button" onClick={() => { if (index === transferCards.length - 1) setComplete(true); else setIndex((current) => current + 1); setAnswer(null); setSubmitted(false); }}>{index === transferCards.length - 1 ? "Finish transfer" : "Next transfer"}</button> : <button type="button" onClick={() => { setAnswer(null); setSubmitted(false); }}>Retry transfer</button>}</div>}</section>;
}

type Stage = "standing" | "descent" | "return";
type Joint = "hip" | "knee" | "ankle";
type JointAnswer = "flexion" | "extension" | "dorsiflexion" | "towards-neutral" | "muscle";

const stageLabels: Record<Stage, string> = { standing: "Standing", descent: "Lower", return: "Return" };
const jointLabels: Record<Joint, string> = { hip: "Hip", knee: "Knee", ankle: "Ankle" };
const actions: Record<Exclude<Stage, "standing">, Record<Joint, { answer: JointAnswer; label: string; clue: string }>> = {
  descent: {
    hip: { answer: "flexion", label: "flexion", clue: "the angle at the hip decreases" },
    knee: { answer: "flexion", label: "flexion", clue: "the angle at the knee decreases" },
    ankle: { answer: "dorsiflexion", label: "dorsiflexion", clue: "the shin moves closer to the top of the foot" },
  },
  return: {
    hip: { answer: "extension", label: "extension", clue: "the angle at the hip increases" },
    knee: { answer: "extension", label: "extension", clue: "the angle at the knee increases" },
    ankle: { answer: "towards-neutral", label: "movement from dorsiflexion back towards neutral", clue: "the shin moves away from the top of the foot without becoming a calf raise" },
  },
};

const actionChoices: Array<{ id: JointAnswer; label: string }> = [
  { id: "flexion", label: "Flexion" }, { id: "extension", label: "Extension" },
  { id: "dorsiflexion", label: "Dorsiflexion" }, { id: "towards-neutral", label: "Back towards neutral" },
  { id: "muscle", label: "Quadriceps contraction" },
];

export function SquatJointSequence() {
  const [stage, setStage] = useState<Stage>("standing");
  const [joint, setJoint] = useState<Joint>("knee");
  const [answer, setAnswer] = useState<JointAnswer | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [mapAnswers, setMapAnswers] = useState<Partial<Record<Joint, JointAnswer>>>({});
  const [mapSubmitted, setMapSubmitted] = useState(false);
  const action = stage === "standing" ? null : actions[stage][joint];
  const correct = answer === action?.answer;

  function resetAnswer() { setAnswer(null); setSubmitted(false); setMapSubmitted(false); }
  function chooseStage(next: Stage) { setStage(next); resetAnswer(); }
  function chooseJoint(next: Joint) { setJoint(next); resetAnswer(); }

  return (
    <div className={styles.lab} data-testid="squat-joint-sequence">
      <div className={styles.squatControls}>
        <fieldset><legend>Squat stage</legend><div className={styles.selector}>{(Object.keys(stageLabels) as Stage[]).map((item) => <button key={item} type="button" aria-pressed={stage === item} onClick={() => chooseStage(item)}>{stageLabels[item]}</button>)}</div></fieldset>
        <fieldset><legend>Joint focus</legend><div className={styles.selector}>{(Object.keys(jointLabels) as Joint[]).map((item) => <button key={item} type="button" aria-pressed={joint === item} onClick={() => chooseJoint(item)}>{jointLabels[item]}</button>)}</div></fieldset>
      </div>

      <div className={styles.squatWorkspace}>
        <div className={styles.frames} aria-label="Three-stage squat sequence">
          {(Object.keys(stageLabels) as Stage[]).map((item) => (
            <figure key={item} className={`${styles.squatFrame} ${stage === item ? styles.activeFrame : ""}`} aria-current={stage === item ? "step" : undefined}>
              <div className={`${styles.squatPerson} ${styles[item]}`} aria-hidden="true"><span className={styles.head} /><span className={styles.torso} /><span className={`${styles.jointMarker} ${styles[joint]}`} /></div>
              <figcaption>{stageLabels[item]}</figcaption>
            </figure>
          ))}
        </div>

        <section className={styles.actionPanel} aria-labelledby="joint-action-heading">
          <p className={styles.kicker}>Current observation</p>
          <h3 id="joint-action-heading">{stageLabels[stage]} · {jointLabels[joint]}</h3>
          {stage === "standing" ? <p>Standing is the comparison position. Choose Lower or Return to identify an action.</p> : (
            <>
              <p>Which action best describes the {joint} during the {stage} phase?</p>
              <div className={styles.answerGrid}>{actionChoices.map((item) => <button key={item.id} type="button" aria-pressed={answer === item.id} disabled={submitted} onClick={() => setAnswer(item.id)}>{item.label}</button>)}</div>
              {!submitted ? <button className={styles.submit} type="button" disabled={!answer} onClick={() => setSubmitted(true)}>Check action</button> : (
                <div className={`${styles.feedback} ${correct ? styles.correct : answer === "muscle" ? styles.misconception : styles.partly}`} role="status" aria-live="polite">
                  <strong>{correct ? "Correct" : answer === "muscle" ? "Needs another look" : "Partly correct"}</strong>
                  <p>{correct ? `During the ${stage}, the ${joint} moves into ${action?.label} because ${action?.clue}.` : answer === "muscle" ? `Quadriceps contraction names muscle action, but the question asks for the visible action at the ${joint} during the ${stage}.` : `You chose a joint action, but it does not match the observed change at the ${joint} during the ${stage}. Look at the highlighted angle.`}</p>
                  {!correct && <p><b>Misconception to check:</b> {answer === "muscle" ? "joint action and muscle action are interchangeable" : "one phase gives every joint the same action"}.</p>}
                  {!correct && <button type="button" onClick={resetAnswer}>Retry action</button>}
                </div>
              )}
            </>
          )}
          <p className={styles.liveUpdate} role="status" aria-live="polite">Showing the {joint} in the {stage} stage.</p>
        </section>
      </div>
      {stage !== "standing" && <section className={styles.phaseMap} aria-labelledby="phase-map-heading">
        <p className={styles.kicker}>Compare the phase</p><h3 id="phase-map-heading">Match all three joints before you continue</h3>
        <p>Correct work stays selected when one joint still needs another look.</p>
        <div className={styles.phaseMapGrid}>{(Object.keys(jointLabels) as Joint[]).map((item) => <fieldset key={item}><legend>{jointLabels[item]}</legend><div className={styles.answerGrid}>{actionChoices.filter((choice) => choice.id !== "muscle").map((choice) => <button key={choice.id} type="button" aria-label={`${choice.label} for ${jointLabels[item]}`} aria-pressed={mapAnswers[item] === choice.id} disabled={mapSubmitted && mapAnswers[item] === actions[stage][item].answer} onClick={() => { setMapAnswers((current) => ({ ...current, [item]: choice.id })); setMapSubmitted(false); }}>{choice.label}</button>)}</div></fieldset>)}</div>
        {!mapSubmitted ? <button className={styles.submit} type="button" disabled={Object.keys(mapAnswers).length !== 3} onClick={() => setMapSubmitted(true)}>Check the phase map</button> : <div className={`${styles.feedback} ${Object.entries(actions[stage]).every(([item, value]) => mapAnswers[item as Joint] === value.answer) ? styles.correct : styles.partly}`} role="status" aria-live="polite">
          {Object.entries(actions[stage]).every(([item, value]) => mapAnswers[item as Joint] === value.answer) ? <><strong>All three observations line up</strong><p>You named each joint action for this phase rather than applying one label to the whole body.</p></> : <><strong>Partly correct — keep the correct joints</strong><p>{(Object.keys(jointLabels) as Joint[]).filter((item) => mapAnswers[item] !== actions[stage][item].answer).map((item) => jointLabels[item]).join(" and ")} still need another look. The correct selections remain in place.</p><button type="button" onClick={() => { setMapAnswers((current) => Object.fromEntries((Object.keys(current) as Joint[]).filter((item) => current[item] === actions[stage][item].answer).map((item) => [item, current[item]]))); setMapSubmitted(false); }}>Retry unresolved joints</button></>}
        </div>}
      </section>}
    </div>
  );
}
