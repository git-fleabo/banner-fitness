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
