"use client";

import { useState } from "react";

import { saveProgrammeAction } from "./actions";

export type EditorExercise = { name: string; pattern: string; prescription: string; target: string; equipment: string; note?: string };

export function MobileNav({ onClose, onOverview, onClients, onLibrary }: { onClose: () => void; onOverview: () => void; onClients: () => void; onLibrary: () => void }) {
  return <div className="mobile-nav-backdrop" onClick={onClose}><nav className="mobile-nav-panel" onClick={(event) => event.stopPropagation()}><div className="brand-mark"><span>O</span><div><strong>ORIGIN</strong><small>PT STUDIO</small></div></div><button className="close-button" onClick={onClose}>×</button><button onClick={onOverview}>⌂ Overview</button><button onClick={onClients}>♧ Clients</button><button>▦ Programmes</button><button onClick={onLibrary}>◈ Exercise library</button><small className="mobile-nav-user">Noaman · Personal trainer</small></nav></div>;
}

export function SessionEditorModal({ clientName, goal, days, week, onClose, notify }: { clientName: string; goal: string; days: number; week: EditorExercise[]; onClose: () => void; notify: (message: string) => void }) {
  const [activeDay, setActiveDay] = useState(1);
  const [names, setNames] = useState<Record<string, string>>({ "1": "Monday - Strength / Hypertrophy", "3": "Wednesday - Full body", "5": "Friday - Conditioning" });
  const [sessions, setSessions] = useState<Record<string, EditorExercise[]>>({ "1": week, "3": week.slice(0, 4), "5": [week[5]] });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const currentExercises = sessions[String(activeDay)] ?? [];
  const removeExercise = (name: string) => setSessions((current) => ({ ...current, [String(activeDay)]: currentExercises.filter((exercise) => exercise.name !== name) }));
  const addExercise = () => { const available = week.find((exercise) => !currentExercises.some((current) => current.name === exercise.name)); if (available) setSessions((current) => ({ ...current, [String(activeDay)]: [...currentExercises, available] })); };
  async function save() {
    setSaving(true); setError("");
    try {
      await saveProgrammeAction({ clientName, goalSummary: goal, trainingDays: days, sessionDurationMinutes: 45, sessionNames: names, exercises: sessions["1"].map(toDraftExercise), sessionExercises: Object.fromEntries(Object.entries(sessions).map(([day, exercises]) => [day, exercises.map(toDraftExercise)])) });
      notify("All three sessions saved as a new draft version"); onClose();
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : "Session draft could not be saved"); } finally { setSaving(false); }
  }
  return <div className="modal-backdrop"><section className="session-editor-modal" role="dialog" aria-modal="true" aria-labelledby="session-editor-heading"><header><div><p className="eyebrow">PROGRAMME EDITOR</p><h2 id="session-editor-heading">Edit all sessions</h2><p>Changes save as a new eight-week draft version for {clientName}.</p></div><button className="close-button" onClick={onClose}>×</button></header><div className="session-editor-tabs">{[[1, "Monday"], [3, "Wednesday"], [5, "Friday"]].map(([day, label]) => <button key={day} className={activeDay === day ? "selected" : ""} onClick={() => setActiveDay(Number(day))}>{label}<small>{sessions[String(day)]?.length ?? 0} exercises</small></button>)}</div><label className="session-name-label">SESSION NAME<input value={names[String(activeDay)]} onChange={(event) => setNames({ ...names, [String(activeDay)]: event.target.value })} /></label><div className="session-exercise-editor">{currentExercises.map((exercise, index) => <div className="session-exercise-row" key={exercise.name}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{exercise.name}</strong><small>{exercise.pattern} · {exercise.prescription}</small></div><button onClick={() => removeExercise(exercise.name)}>Remove</button></div>)}{currentExercises.length < week.length && <button className="add-exercise-row" onClick={addExercise}>+ Add next available exercise</button>}</div>{error && <p className="form-error" role="alert">{error}</p>}<footer><button className="secondary-button" onClick={onClose}>Cancel</button><button className="primary-button" onClick={save} disabled={saving || currentExercises.length === 0}>{saving ? "Saving sessions…" : "Save all sessions →"}</button></footer></section></div>;
}

function toDraftExercise(exercise: EditorExercise) {
  return { name: exercise.name, pattern: exercise.pattern, sets: Number(exercise.prescription.match(/^\d+/)?.[0] ?? 2), repsMin: Number(exercise.prescription.match(/×\s*(\d+)/)?.[1] ?? 8), repsMax: Number(exercise.prescription.match(/–(\d+)/)?.[1] ?? 12), intensityValue: "2 RIR", restSeconds: 90, tempo: "" };
}
