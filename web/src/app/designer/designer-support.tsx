"use client";

import { useEffect, useState } from "react";

import { saveProgrammeAction } from "./actions";

export type EditorExercise = { name: string; pattern: string; prescription: string; target: string; equipment: string; sets?: number; repsMin?: number; repsMax?: number; intensityValue?: string; restSeconds?: number; tempo?: string; progressionRule?: string; note?: string };
type SavedSession = { dayOfWeek: number; name: string; exercises: EditorExercise[] };
type LibraryExercise = { name: string; pattern: string; target: string; equipment: string };

export function MobileNav({ onClose, onOverview, onClients, onProgrammes, onLibrary, onSettings }: { onClose: () => void; onOverview: () => void; onClients: () => void; onProgrammes: () => void; onLibrary: () => void; onSettings: () => void }) {
  return <div className="mobile-nav-backdrop" onClick={onClose}><nav className="mobile-nav-panel" onClick={(event) => event.stopPropagation()}><div className="brand-mark"><span>F</span><div><strong>THE FACTORY</strong><small>CONSTRUCTION</small></div></div><button className="close-button" onClick={onClose}>×</button><button onClick={onOverview}>⌂ Overview</button><button onClick={onClients}>♧ Clients</button><button onClick={onProgrammes}>▦ Programmes</button><button onClick={onLibrary}>◈ Exercise library</button><button onClick={onSettings}>⚙ Settings</button><small className="mobile-nav-user">Noaman · Personal trainer</small></nav></div>;
}

export function SessionEditorModal({ clientName, goal, days, week, savedSessions, onClose, onSaved, notify }: { clientName: string; goal: string; days: number; week: EditorExercise[]; savedSessions?: SavedSession[]; onClose: () => void; onSaved?: () => void; notify: (message: string) => void }) {
  const [activeDay, setActiveDay] = useState(1);
  const initialSessions = savedSessions?.length ? Object.fromEntries(savedSessions.map((session) => [String(session.dayOfWeek), session.exercises])) : { "1": week, "3": week.slice(0, 4), "5": week[5] ? [week[5]] : [] };
  const initialNames = savedSessions?.length ? Object.fromEntries(savedSessions.map((session) => [String(session.dayOfWeek), session.name])) : { "1": "Monday - Strength / Hypertrophy", "3": "Wednesday - Full body", "5": "Friday - Conditioning" };
  const [names, setNames] = useState<Record<string, string>>(initialNames);
  const [sessions, setSessions] = useState<Record<string, EditorExercise[]>>(initialSessions);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [libraryQuery, setLibraryQuery] = useState("");
  const [library, setLibrary] = useState<LibraryExercise[]>([]);
  const currentExercises = sessions[String(activeDay)] ?? [];
  const removeExercise = (name: string) => setSessions((current) => ({ ...current, [String(activeDay)]: currentExercises.filter((exercise) => exercise.name !== name) }));
  const addExercise = (exercise: EditorExercise) => setSessions((current) => ({ ...current, [String(activeDay)]: [...currentExercises, exercise] }));
  const updateExercise = (index: number, changes: Partial<EditorExercise>) => setSessions((current) => ({ ...current, [String(activeDay)]: currentExercises.map((exercise, exerciseIndex) => exerciseIndex === index ? { ...exercise, ...changes } : exercise) }));
  const moveExercise = (index: number, delta: number) => { const nextIndex = index + delta; if (nextIndex < 0 || nextIndex >= currentExercises.length) return; const reordered = [...currentExercises]; [reordered[index], reordered[nextIndex]] = [reordered[nextIndex], reordered[index]]; setSessions((current) => ({ ...current, [String(activeDay)]: reordered })); };
  useEffect(() => { fetch("/api/designer/exercises", { credentials: "same-origin", cache: "no-store" }).then((response) => response.ok ? response.json() as Promise<{ exercises: Array<{ name: string; pattern: string; target: unknown; equipment: unknown }> }> : Promise.reject(new Error("Exercise library unavailable"))).then((data) => setLibrary(data.exercises.map((exercise) => ({ name: exercise.name, pattern: exercise.pattern, target: Array.isArray(exercise.target) ? exercise.target.join(" · ") : String(exercise.target ?? ""), equipment: Array.isArray(exercise.equipment) ? exercise.equipment.join(", ") : String(exercise.equipment ?? "") })))).catch(() => undefined); }, []);
  const availableLibrary = library.filter((exercise) => !currentExercises.some((current) => current.name === exercise.name) && `${exercise.name} ${exercise.pattern} ${exercise.target}`.toLowerCase().includes(libraryQuery.toLowerCase())).slice(0, 8);
  async function save() {
    setSaving(true); setError("");
    try {
      await saveProgrammeAction({ clientName, goalSummary: goal, trainingDays: days, sessionDurationMinutes: 45, sessionNames: names, exercises: sessions["1"].map(toDraftExercise), sessionExercises: Object.fromEntries(Object.entries(sessions).map(([day, exercises]) => [day, exercises.map(toDraftExercise)])) });
      notify("All three sessions saved as a new draft version"); onSaved?.(); onClose();
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : "Session draft could not be saved"); } finally { setSaving(false); }
  }
  return <div className="modal-backdrop"><section className="session-editor-modal" role="dialog" aria-modal="true" aria-labelledby="session-editor-heading"><header><div><p className="eyebrow">PROGRAMME EDITOR</p><h2 id="session-editor-heading">Edit all sessions</h2><p>Changes save as a new eight-week draft version for {clientName}.</p></div><button className="close-button" onClick={onClose}>×</button></header><div className="session-editor-tabs">{[[1, "Monday"], [3, "Wednesday"], [5, "Friday"]].map(([day, label]) => <button key={day} className={activeDay === day ? "active" : ""} onClick={() => setActiveDay(Number(day))}>{label}<small>{sessions[String(day)]?.length ?? 0} exercises</small></button>)}</div><label className="session-name-label">SESSION NAME<input value={names[String(activeDay)] ?? ""} onChange={(event) => setNames({ ...names, [String(activeDay)]: event.target.value })} /></label><div className="session-exercise-editor">{currentExercises.map((exercise, index) => <div className="session-exercise-row" key={exercise.name}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{exercise.name}</strong><small>{exercise.pattern}</small></div><div className="session-exercise-actions"><button onClick={() => moveExercise(index, -1)} disabled={index === 0} aria-label={`Move ${exercise.name} up`}>↑</button><button onClick={() => moveExercise(index, 1)} disabled={index === currentExercises.length - 1} aria-label={`Move ${exercise.name} down`}>↓</button><button onClick={() => removeExercise(exercise.name)}>Remove</button></div><PrescriptionFields exercise={exercise} onChange={(changes) => updateExercise(index, changes)} /></div>)}</div><div className="exercise-picker"><label>ADD FROM EXERCISE LIBRARY<input value={libraryQuery} onChange={(event) => setLibraryQuery(event.target.value)} placeholder="Search movement, pattern or muscle" /></label>{libraryQuery && availableLibrary.map((exercise) => <button key={exercise.name} className="exercise-picker-option" onClick={() => addExercise({ ...exercise, prescription: "3 × 8–12", sets: 3, repsMin: 8, repsMax: 12, intensityValue: "2 RIR", restSeconds: 90, tempo: "", progressionRule: "When all sets reach the top of the range at target RIR with acceptable technique, add a small load increment." })}><strong>{exercise.name}</strong><small>{exercise.pattern} · {exercise.target} · {exercise.equipment}</small><span>+ Add</span></button>)}{libraryQuery && !availableLibrary.length && <p className="library-empty">No matching available exercises.</p>}</div>{error && <p className="form-error" role="alert">{error}</p>}<footer><button className="secondary-button" onClick={onClose}>Cancel</button><button className="primary-button" onClick={save} disabled={saving || currentExercises.length === 0}>{saving ? "Saving sessions…" : "Save all sessions →"}</button></footer></section></div>;
}

function toDraftExercise(exercise: EditorExercise) {
  const sets = exercise.sets ?? Number(exercise.prescription.match(/^\d+/)?.[0] ?? 2);
  const repsMin = exercise.repsMin ?? Number(exercise.prescription.match(/×\s*(\d+)/)?.[1] ?? 8);
  const repsMax = exercise.repsMax ?? Number(exercise.prescription.match(/–(\d+)/)?.[1] ?? repsMin);
  return { name: exercise.name, pattern: exercise.pattern, sets, repsMin, repsMax, intensityValue: exercise.intensityValue ?? "2 RIR", restSeconds: exercise.restSeconds ?? 90, tempo: exercise.tempo ?? "", progressionRule: exercise.progressionRule ?? "" };
}

function PrescriptionFields({ exercise, onChange }: { exercise: EditorExercise; onChange: (changes: Partial<EditorExercise>) => void }) {
  const sets = exercise.sets ?? Number(exercise.prescription.match(/^\d+/)?.[0] ?? 2);
  const repsMin = exercise.repsMin ?? Number(exercise.prescription.match(/×\s*(\d+)/)?.[1] ?? 8);
  const repsMax = exercise.repsMax ?? Number(exercise.prescription.match(/–(\d+)/)?.[1] ?? repsMin);
  return <div className="prescription-fields"><label>SETS<input type="number" min="1" max="20" value={sets} onChange={(event) => onChange({ sets: Number(event.target.value) || 1 })} /></label><label>REPS MIN<input type="number" min="1" max="100" value={repsMin} onChange={(event) => onChange({ repsMin: Number(event.target.value) || 1 })} /></label><label>REPS MAX<input type="number" min="1" max="100" value={repsMax} onChange={(event) => onChange({ repsMax: Number(event.target.value) || repsMin })} /></label><label>INTENSITY<input value={exercise.intensityValue ?? "2 RIR"} onChange={(event) => onChange({ intensityValue: event.target.value })} /></label><label>REST (SEC)<input type="number" min="0" max="1800" value={exercise.restSeconds ?? 90} onChange={(event) => onChange({ restSeconds: Number(event.target.value) || 0 })} /></label><label>TEMPO<input value={exercise.tempo ?? ""} onChange={(event) => onChange({ tempo: event.target.value })} placeholder="3-1-1-0" /></label><label className="progression-field">PROGRESSION RULE<input value={exercise.progressionRule ?? ""} onChange={(event) => onChange({ progressionRule: event.target.value })} placeholder="When all sets reach top of range…" /></label></div>;
}
