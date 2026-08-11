"use client";

import { useEffect, useState } from "react";

import { Icon } from "./semantic-icon";

import { deleteProgrammeTemplateAction, listProgrammeTemplatesAction, saveProgrammeAction, saveProgrammeTemplateAction } from "./actions";
import { buildEditorSessionState, buildProgrammeTemplateState, starterProgrammeTemplates, weekdayLabels, type EditorExercise, type ProgrammeTemplateDefinition, type SavedSession } from "@/lib/programme-editor";

export type { EditorExercise } from "@/lib/programme-editor";
type LibraryExercise = { name: string; pattern: string; target: string; equipment: string };

export function MobileNav({ onClose, onOverview, onClients, onProgrammes, onLibrary, onSettings }: { onClose: () => void; onOverview: () => void; onClients: () => void; onProgrammes: () => void; onLibrary: () => void; onSettings: () => void }) {
  return <div className="mobile-nav-backdrop" onClick={onClose}><nav className="mobile-nav-panel" onClick={(event) => event.stopPropagation()}><div className="brand-mark"><img src="/banner-fitness-logo.png" alt="Banner Fitness" /></div><button className="close-button" onClick={onClose}>×</button><button onClick={onOverview}><Icon name="overview" /> Overview</button><button onClick={onClients}><Icon name="clients" /> Clients</button><button onClick={onProgrammes}><Icon name="programmes" /> Programmes</button><button onClick={onLibrary}><Icon name="library" /> Exercise library</button><button onClick={onSettings}><Icon name="settings" /> Settings</button><small className="mobile-nav-user">Noaman · Personal trainer</small></nav></div>;
}

export function SessionEditorModal({ clientId, clientName, goal, days, preferredDays, sessionDurationMinutes, week, savedSessions, onClose, onSaved, notify }: { clientId?: string; clientName: string; goal: string; days: number; preferredDays?: number[]; sessionDurationMinutes?: number; week: EditorExercise[]; savedSessions?: SavedSession[]; onClose: () => void; onSaved?: () => void; notify: (message: string) => void }) {
  const initialState = buildEditorSessionState({ preferredDays, trainingDays: days, week, savedSessions });
  const [sessionDays, setSessionDays] = useState(initialState.days);
  const [activeDay, setActiveDay] = useState(initialState.days[0] ?? 1);
  const [names, setNames] = useState<Record<string, string>>(initialState.names);
  const [sessions, setSessions] = useState<Record<string, EditorExercise[]>>(initialState.sessions);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [libraryQuery, setLibraryQuery] = useState("");
  const [library, setLibrary] = useState<LibraryExercise[]>([]);
  const [customTemplates, setCustomTemplates] = useState<ProgrammeTemplateDefinition[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [templateName, setTemplateName] = useState("");
  const [savingTemplate, setSavingTemplate] = useState(false);
  const currentExercises = sessions[String(activeDay)] ?? [];
  function applyTemplate(templateId: string) {
    const template = [...starterProgrammeTemplates, ...customTemplates].find((candidate) => candidate.id === templateId);
    const next = template ? buildProgrammeTemplateState(template, preferredDays, days) : null;
    if (!next) { setSelectedTemplateId(""); return; }
    setSelectedTemplateId(templateId);
    setSessionDays(next.days);
    setActiveDay(next.days[0] ?? 1);
    setNames(next.names);
    setSessions(next.sessions);
  }
  async function saveAsTemplate() {
    if (!templateName.trim()) { setError("Enter a name for this programme template first."); return; }
    setSavingTemplate(true); setError("");
    try {
      const templateSessions = sessionDays.map((day) => ({ name: names[String(day)]?.trim() || `${weekdayLabels[day]} session`, exercises: sessionsForTemplate(sessions[String(day)] ?? []) }));
      const result = await saveProgrammeTemplateAction({ name: templateName.trim(), goalSummary: goal, sessionDurationMinutes: sessionDurationMinutes ?? 45, sessions: templateSessions });
      const savedTemplate: ProgrammeTemplateDefinition = { id: result.templateId, label: result.name, description: `${templateSessions.length} editable session${templateSessions.length === 1 ? "" : "s"} for ${goal}.`, goal, sessionDurationMinutes: sessionDurationMinutes ?? 45, sessions: templateSessions };
      setCustomTemplates((current) => [savedTemplate, ...current.filter((template) => template.id !== savedTemplate.id)]);
      setSelectedTemplateId(savedTemplate.id);
      setTemplateName("");
      notify(`Saved ${result.name} to your programme templates`);
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : "Programme template could not be saved"); } finally { setSavingTemplate(false); }
  }
  async function deleteSelectedTemplate() {
    const selected = customTemplates.find((template) => template.id === selectedTemplateId);
    if (!selected) return;
    setSavingTemplate(true); setError("");
    try { await deleteProgrammeTemplateAction({ templateId: selected.id }); setCustomTemplates((current) => current.filter((template) => template.id !== selected.id)); setSelectedTemplateId(""); notify(`${selected.label} removed from your programme templates`); } catch (deleteError) { setError(deleteError instanceof Error ? deleteError.message : "Programme template could not be removed"); } finally { setSavingTemplate(false); }
  }
  const removeExercise = (name: string) => setSessions((current) => ({ ...current, [String(activeDay)]: currentExercises.filter((exercise) => exercise.name !== name) }));
  const addExercise = (exercise: EditorExercise) => setSessions((current) => ({ ...current, [String(activeDay)]: [...currentExercises, exercise] }));
  const updateExercise = (index: number, changes: Partial<EditorExercise>) => setSessions((current) => ({ ...current, [String(activeDay)]: currentExercises.map((exercise, exerciseIndex) => exerciseIndex === index ? { ...exercise, ...changes } : exercise) }));
  const moveExercise = (index: number, delta: number) => { const nextIndex = index + delta; if (nextIndex < 0 || nextIndex >= currentExercises.length) return; const reordered = [...currentExercises]; [reordered[index], reordered[nextIndex]] = [reordered[nextIndex], reordered[index]]; setSessions((current) => ({ ...current, [String(activeDay)]: reordered })); };
  useEffect(() => { fetch("/api/designer/exercises", { credentials: "same-origin", cache: "no-store" }).then((response) => response.ok ? response.json() as Promise<{ exercises: Array<{ name: string; pattern: string; target: unknown; equipment: unknown }> }> : Promise.reject(new Error("Exercise library unavailable"))).then((data) => setLibrary(data.exercises.map((exercise) => ({ name: exercise.name, pattern: exercise.pattern, target: Array.isArray(exercise.target) ? exercise.target.join(" · ") : String(exercise.target ?? ""), equipment: Array.isArray(exercise.equipment) ? exercise.equipment.join(", ") : String(exercise.equipment ?? "") })))).catch(() => undefined); if (!savedSessions?.length) void listProgrammeTemplatesAction().then(setCustomTemplates).catch(() => undefined); }, [savedSessions?.length]);
  const availableLibrary = library.filter((exercise) => !currentExercises.some((current) => current.name === exercise.name) && `${exercise.name} ${exercise.pattern} ${exercise.target}`.toLowerCase().includes(libraryQuery.toLowerCase())).slice(0, 8);
  async function save() {
    setSaving(true); setError("");
    try {
      const firstSession = sessions[String(sessionDays[0])] ?? [];
      await saveProgrammeAction({ clientId, clientName, goalSummary: goal, trainingDays: sessionDays.length, sessionDurationMinutes: sessionDurationMinutes ?? 45, sessionDays, sessionNames: names, exercises: firstSession.map(toDraftExercise), sessionExercises: Object.fromEntries(sessionDays.map((day) => [String(day), (sessions[String(day)] ?? []).map(toDraftExercise)])) });
      notify(`${sessionDays.length} session${sessionDays.length === 1 ? "" : "s"} saved as a new draft version`); onSaved?.(); onClose();
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : "Session draft could not be saved"); } finally { setSaving(false); }
  }
  return <div className="modal-backdrop"><section className="session-editor-modal" role="dialog" aria-modal="true" aria-labelledby="session-editor-heading"><header><div><p className="eyebrow">PROGRAMME EDITOR</p><h2 id="session-editor-heading">{savedSessions?.length ? "Edit all sessions" : "Build first programme draft"}</h2><p>{savedSessions?.length ? `Changes save as a new eight-week draft version for ${clientName} and capture the current client context.` : `Add the exercises you want to review for ${clientName}. The saved version will capture the current client context and trigger quality checks.`}</p></div><button className="close-button" onClick={onClose}>×</button></header>{!savedSessions?.length && <div className="starter-template-picker"><label>STARTER OR SAVED TEMPLATE<select value={selectedTemplateId} onChange={(event) => applyTemplate(event.target.value)}><option value="">Start from the client context</option><optgroup label="Starter templates">{starterProgrammeTemplates.map((template) => <option key={template.id} value={template.id}>{template.label} · {template.goal}</option>)}</optgroup>{customTemplates.length > 0 && <optgroup label="Your saved templates">{customTemplates.map((template) => <option key={template.id} value={template.id}>{template.label} · {template.goal}</option>)}</optgroup>}</select></label>{customTemplates.some((template) => template.id === selectedTemplateId) && <button type="button" className="template-delete-button" onClick={deleteSelectedTemplate} disabled={savingTemplate}>Remove saved template</button>}<small>Templates are editable starting points. Choosing one replaces the current unsaved session draft.</small></div>}<div className="template-save-row"><label>SAVE CURRENT SESSIONS AS TEMPLATE<input value={templateName} onChange={(event) => setTemplateName(event.target.value)} placeholder="e.g. 3-day general strength" /></label><button type="button" className="secondary-button" onClick={saveAsTemplate} disabled={savingTemplate || !sessionDays.some((day) => (sessions[String(day)] ?? []).length)}>{savingTemplate ? "Saving template…" : "Save template"}</button></div><div className="session-editor-tabs">{sessionDays.map((day) => <button key={day} className={activeDay === day ? "active" : ""} onClick={() => setActiveDay(day)}>{weekdayLabels[day]}<small> · {sessions[String(day)]?.length ?? 0} exercises</small></button>)}</div><label className="session-name-label">SESSION NAME<input value={names[String(activeDay)] ?? ""} onChange={(event) => setNames({ ...names, [String(activeDay)]: event.target.value })} /></label><div className="session-exercise-editor">{currentExercises.map((exercise, index) => <div className="session-exercise-row" key={exercise.name}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{exercise.name}</strong><small>{exercise.pattern}</small></div><div className="session-exercise-actions"><button onClick={() => moveExercise(index, -1)} disabled={index === 0} aria-label={`Move ${exercise.name} up`}>↑</button><button onClick={() => moveExercise(index, 1)} disabled={index === currentExercises.length - 1} aria-label={`Move ${exercise.name} down`}>↓</button><button onClick={() => removeExercise(exercise.name)}>Remove</button></div><PrescriptionFields exercise={exercise} onChange={(changes) => updateExercise(index, changes)} /></div>)}</div><div className="exercise-picker"><label>ADD FROM EXERCISE LIBRARY<input value={libraryQuery} onChange={(event) => setLibraryQuery(event.target.value)} placeholder="Search movement, pattern or muscle" /></label>{libraryQuery && availableLibrary.map((exercise) => <button key={exercise.name} className="exercise-picker-option" onClick={() => addExercise({ ...exercise, prescription: "3 × 8–12", sets: 3, repsMin: 8, repsMax: 12, intensityValue: "2 RIR", restSeconds: 90, tempo: "", progressionRule: "When all sets reach the top of the range at target RIR with acceptable technique, add a small load increment." })}><strong>{exercise.name}</strong><small>{exercise.pattern} · {exercise.target} · {exercise.equipment}</small><span>+ Add</span></button>)}{libraryQuery && !availableLibrary.length && <p className="library-empty">No matching available exercises.</p>}</div>{error && <p className="form-error" role="alert">{error}</p>}<footer><button className="secondary-button" onClick={onClose}>Cancel</button><button className="primary-button" onClick={save} disabled={saving || !(sessions[String(sessionDays[0])] ?? []).length}>{saving ? "Saving sessions…" : "Save all sessions →"}</button></footer></section></div>;
}

function sessionsForTemplate(exercises: EditorExercise[]) {
  return exercises.map((exercise) => ({ name: exercise.name, pattern: exercise.pattern, prescription: exercise.prescription, target: exercise.target, equipment: exercise.equipment, sets: exercise.sets ?? Number(exercise.prescription.match(/^\d+/)?.[0] ?? 2), repsMin: exercise.repsMin, repsMax: exercise.repsMax, intensityValue: exercise.intensityValue ?? "2 RIR", restSeconds: exercise.restSeconds, tempo: exercise.tempo, progressionRule: exercise.progressionRule, note: exercise.note }));
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
