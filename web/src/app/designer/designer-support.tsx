"use client";

import { useEffect, useMemo, useState } from "react";

import { Icon } from "./semantic-icon";

import { deleteProgrammeTemplateAction, listProgrammeTemplatesAction, saveProgrammeAction, saveProgrammeTemplateAction, updateProgrammeTemplateAction } from "./actions";
import { buildEditorSessionState, buildProgrammeTemplateState, buildWeekPreview, copySessionToDay, starterProgrammeTemplates as baseStarterProgrammeTemplates, weekdayLabels, type EditorExercise, type ProgrammeTemplateDefinition, type SavedSession } from "@/lib/programme-editor";
import type { AiProgrammeImportApproval } from "@/lib/pt-ai-import";
import { filterProgrammeLibraryTemplates, programmeLibrarySeed } from "@/lib/programme-library";

export type { EditorExercise } from "@/lib/programme-editor";
type LibraryExercise = { name: string; pattern: string; target: string; equipment: string };

export function MobileNav({ onClose, onOverview, onClients, onProgrammes, onProgrammeLibrary, onLibrary, onSettings }: { onClose: () => void; onOverview: () => void; onClients: () => void; onProgrammes: () => void; onProgrammeLibrary: () => void; onLibrary: () => void; onSettings: () => void }) {
  return <div className="mobile-nav-backdrop" onClick={onClose}><nav className="mobile-nav-panel" onClick={(event) => event.stopPropagation()}><div className="brand-mark"><img src="/banner-fitness-logo.jpg" alt="Banner Fitness" /></div><button className="close-button" onClick={onClose}>×</button><button onClick={onOverview}><Icon name="overview" /> Overview</button><button onClick={onClients}><Icon name="clients" /> Clients</button><button onClick={onProgrammes}><Icon name="programmes" /> Programmes</button><button onClick={onProgrammeLibrary}><Icon name="programmes" /> Programme library</button><button onClick={onLibrary}><Icon name="library" /> Exercise library</button><button onClick={onSettings}><Icon name="settings" /> Settings</button><small className="mobile-nav-user">Noaman · Personal trainer</small></nav></div>;
}

export function SessionEditorModal({ clientId, clientName, goal, days, preferredDays, sessionDurationMinutes, week, savedSessions, templateId, importApproval, onClose, onSaved, onTemplateSaved, notify }: { clientId?: string; clientName: string; goal: string; days: number; preferredDays?: number[]; sessionDurationMinutes?: number; week: EditorExercise[]; savedSessions?: SavedSession[]; templateId?: string; importApproval?: AiProgrammeImportApproval | null; onClose: () => void; onSaved?: () => void; onTemplateSaved?: () => void; notify: (message: string) => void }) {
  const effectiveGoal = importApproval?.goalSummary || goal;
  const effectiveDuration = importApproval?.sessionDurationMinutes ?? sessionDurationMinutes;
  const initialState = buildEditorSessionState({ preferredDays, trainingDays: days, week, savedSessions });
  const [sessionDays, setSessionDays] = useState(initialState.days);
  const [activeDay, setActiveDay] = useState(initialState.days[0] ?? 1);
  const [names, setNames] = useState<Record<string, string>>(initialState.names);
  const [times, setTimes] = useState<Record<string, string>>(Object.fromEntries(initialState.days.map((day) => [String(day), savedSessions?.find((session) => session.dayOfWeek === day)?.scheduledTime ?? ""])));
  const [managementModes, setManagementModes] = useState<Record<string, "pt_managed" | "self_managed">>(Object.fromEntries(initialState.days.map((day) => [String(day), savedSessions?.find((session) => session.dayOfWeek === day)?.managementMode ?? "pt_managed"])) as Record<string, "pt_managed" | "self_managed">);
  const [sessions, setSessions] = useState<Record<string, EditorExercise[]>>(initialState.sessions);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [libraryQuery, setLibraryQuery] = useState("");
  const [library, setLibrary] = useState<LibraryExercise[]>([]);
  const [customTemplates, setCustomTemplates] = useState<ProgrammeTemplateDefinition[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [templateName, setTemplateName] = useState(templateId ? clientName : "");
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [copyTargetDay, setCopyTargetDay] = useState(initialState.days[1] ?? initialState.days[0] ?? 1);
  const [previewOpen, setPreviewOpen] = useState(false);
  const currentExercises = sessions[String(activeDay)] ?? [];
  const recommendedTemplates = useMemo(() => filterProgrammeLibraryTemplates(programmeLibrarySeed, { goal: effectiveGoal }).sort((a, b) => (a.difficultyLevel ?? 1) - (b.difficultyLevel ?? 1)).slice(0, 5), [effectiveGoal]);
  const starterProgrammeTemplates = [...recommendedTemplates, ...baseStarterProgrammeTemplates];
  const preview = buildWeekPreview({ days: sessionDays, sessions, names });
  const resolvedCopyTargetDay = sessionDays.includes(copyTargetDay) && copyTargetDay !== activeDay ? copyTargetDay : sessionDays.find((day) => day !== activeDay) ?? activeDay;
  function applyTemplate(templateId: string) {
    const template = [...recommendedTemplates, ...starterProgrammeTemplates, ...customTemplates].find((candidate) => candidate.id === templateId);
    const next = template ? buildProgrammeTemplateState(template, preferredDays, days) : null;
    if (!next) { setSelectedTemplateId(""); return; }
    const hasUnsavedExercises = sessionDays.some((day) => (sessions[String(day)] ?? []).length > 0);
    if (hasUnsavedExercises && !window.confirm("Choosing this template will replace the current unsaved sessions. Continue?")) return;
    setSelectedTemplateId(templateId);
    setSessionDays(next.days);
    setActiveDay(next.days[0] ?? 1);
    setNames(next.names);
    setSessions(next.sessions);
    setTimes(Object.fromEntries(next.days.map((day) => [String(day), ""])));
    setManagementModes(Object.fromEntries(next.days.map((day) => [String(day), "pt_managed"])) as Record<string, "pt_managed" | "self_managed">);
  }
  async function saveAsTemplate() {
    if (templateId) { await saveTemplateChanges(); return; }
    if (!templateName.trim()) { setError("Enter a name for this programme template first."); return; }
    setSavingTemplate(true); setError("");
    try {
      const templateSessions = sessionDays.map((day) => ({ name: names[String(day)]?.trim() || `${weekdayLabels[day]} session`, exercises: sessionsForTemplate(sessions[String(day)] ?? []) }));
      const result = await saveProgrammeTemplateAction({ name: templateName.trim(), goalSummary: goal, sessionDurationMinutes: sessionDurationMinutes ?? 45, sessions: templateSessions });
      if ("error" in result) throw new Error(result.error);
      const savedTemplate: ProgrammeTemplateDefinition = { id: result.templateId, label: result.name, description: `${templateSessions.length} editable session${templateSessions.length === 1 ? "" : "s"} for ${goal}.`, goal, sessionDurationMinutes: sessionDurationMinutes ?? 45, sessions: templateSessions };
      setCustomTemplates((current) => [savedTemplate, ...current.filter((template) => template.id !== savedTemplate.id)]);
      setSelectedTemplateId(savedTemplate.id);
      setTemplateName("");
      notify(`Saved ${result.name} to your programme templates`);
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : "Programme template could not be saved"); } finally { setSavingTemplate(false); }
  }
  async function saveTemplateChanges() {
    if (!templateId || !templateName.trim()) { setError("Enter a name for this programme template first."); return; }
    setSavingTemplate(true); setError("");
    try {
      const templateSessions = sessionDays.map((day) => ({ name: names[String(day)]?.trim() || `${weekdayLabels[day]} session`, exercises: sessionsForTemplate(sessions[String(day)] ?? []) }));
      const result = await updateProgrammeTemplateAction({ templateId, name: templateName.trim(), description: `${templateSessions.length} editable session${templateSessions.length === 1 ? "" : "s"} for ${goal}.`, goalSummary: goal, sessionDurationMinutes: sessionDurationMinutes ?? 45, sessions: templateSessions });
      notify(`Updated ${result.name}`);
      onClose();
      queueMicrotask(() => onTemplateSaved?.());
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : "Programme template could not be updated"); } finally { setSavingTemplate(false); }
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
  function copyCurrentSession() {
    if (resolvedCopyTargetDay === activeDay) return;
    if ((sessions[String(resolvedCopyTargetDay)] ?? []).length && !window.confirm(`Replace the unsaved ${weekdayLabels[resolvedCopyTargetDay]} session?`)) return;
    const next = copySessionToDay({ days: sessionDays, sessions, names, sourceDay: activeDay, targetDay: resolvedCopyTargetDay });
    setSessions(next.sessions);
    setNames(next.names);
    setActiveDay(resolvedCopyTargetDay);
    notify(`Copied ${names[String(activeDay)] || "session"} to ${weekdayLabels[resolvedCopyTargetDay]}`);
  }
  useEffect(() => { fetch("/api/designer/exercises", { credentials: "same-origin", cache: "no-store" }).then((response) => response.ok ? response.json() as Promise<{ exercises: Array<{ name: string; pattern: string; target: unknown; equipment: unknown }> }> : Promise.reject(new Error("Exercise library unavailable"))).then((data) => setLibrary(data.exercises.map((exercise) => ({ name: exercise.name, pattern: exercise.pattern, target: Array.isArray(exercise.target) ? exercise.target.join(" · ") : String(exercise.target ?? ""), equipment: Array.isArray(exercise.equipment) ? exercise.equipment.join(", ") : String(exercise.equipment ?? "") })))).catch(() => undefined); if (!savedSessions?.length) void listProgrammeTemplatesAction().then((templates) => setCustomTemplates([...recommendedTemplates, ...templates])).catch(() => setCustomTemplates(recommendedTemplates)); }, [savedSessions?.length, recommendedTemplates]);
  const availableLibrary = library.filter((exercise) => !currentExercises.some((current) => current.name === exercise.name) && `${exercise.name} ${exercise.pattern} ${exercise.target}`.toLowerCase().includes(libraryQuery.toLowerCase())).slice(0, 8);
  async function save() {
    if (templateId) { await saveTemplateChanges(); return; }
    setSaving(true); setError("");
    let saved = false;
    try {
      const firstSession = sessions[String(sessionDays[0])] ?? [];
      await saveProgrammeAction({ clientId, clientName, goalSummary: effectiveGoal, trainingDays: sessionDays.length, sessionDurationMinutes: effectiveDuration ?? 45, sessionDays, sessionNames: names, sessionTimes: times, sessionManagement: managementModes, exercises: firstSession.map(toDraftExercise), sessionExercises: Object.fromEntries(sessionDays.map((day) => [String(day), (sessions[String(day)] ?? []).map(toDraftExercise)])), methodology: importApproval?.methodology, rationale: importApproval?.rationale, weekPlans: importApproval?.weekPlans, importAudit: importApproval?.audit });
      // Finish local state updates before closing the modal. The parent refresh
      // can unmount this component immediately after onClose is called.
      setSaving(false);
      notify(`${sessionDays.length} session${sessionDays.length === 1 ? "" : "s"} saved as a new draft version`);
      // Close the editor before refreshing the parent workspace. The refresh clears
      // the loaded client detail while it refetches; keeping this modal mounted
      // during that transition can trigger a stale Server Components render.
      onClose();
      // Let the close render commit before the parent starts its data refresh.
      // This keeps the action response and the modal unmount in separate turns.
      queueMicrotask(() => onSaved?.());
      saved = true;
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : "Session draft could not be saved"); } finally { if (!saved) setSaving(false); }
  }
  return <div className="modal-backdrop"><section className="session-editor-modal" role="dialog" aria-modal="true" aria-labelledby="session-editor-heading"><header><div><p className="eyebrow">PROGRAMME EDITOR</p><h2 id="session-editor-heading">{importApproval ? "Review imported draft" : savedSessions?.length ? "Edit all sessions" : "Build first programme draft"}</h2><p>{importApproval ? `Review the validated AI draft for ${clientName}. It has not been saved.` : savedSessions?.length ? `Changes save as a new eight-week draft version for ${clientName} and capture the current client context.` : `Add the exercises you want to review for ${clientName}. The saved version will capture the current client context and trigger quality checks.`}</p></div><button className="close-button" onClick={onClose}>×</button></header>{!savedSessions?.length && !importApproval && <div className="starter-template-picker"><label>STARTER OR SAVED TEMPLATE<select value={selectedTemplateId} onChange={(event) => applyTemplate(event.target.value)}><option value="">Start from the client context</option><optgroup label="Starter templates">{starterProgrammeTemplates.map((template) => <option key={template.id} value={template.id}>{template.label} · {template.goal}</option>)}</optgroup>{customTemplates.length > 0 && <optgroup label="Your saved templates">{customTemplates.map((template) => <option key={template.id} value={template.id}>{template.label} · {template.goal}</option>)}</optgroup>}</select></label>{customTemplates.some((template) => template.id === selectedTemplateId) && <button type="button" className="template-delete-button" onClick={deleteSelectedTemplate} disabled={savingTemplate}>Remove saved template</button>}<small>Templates are editable starting points. Choosing one replaces the current unsaved session draft.</small></div>}<div className="template-save-row"><label>SAVE CURRENT SESSIONS AS TEMPLATE<input value={templateName} onChange={(event) => setTemplateName(event.target.value)} placeholder="e.g. 3-day general strength" /></label><button type="button" className="secondary-button" onClick={saveAsTemplate} disabled={savingTemplate || !sessionDays.some((day) => (sessions[String(day)] ?? []).length)}>{savingTemplate ? "Saving template…" : "Save template"}</button></div><div className="session-editor-tabs">{sessionDays.map((day) => <button key={day} className={activeDay === day ? "active" : ""} onClick={() => setActiveDay(day)}>{weekdayLabels[day]}<small> · {sessions[String(day)]?.length ?? 0} exercises</small></button>)}</div><div className="session-editor-actions"><label>COPY CURRENT SESSION TO<select aria-label="Copy current session to" value={resolvedCopyTargetDay} onChange={(event) => setCopyTargetDay(Number(event.target.value))}>{sessionDays.filter((day) => day !== activeDay).map((day) => <option key={day} value={day}>{weekdayLabels[day]}</option>)}</select></label><button type="button" className="secondary-button" onClick={copyCurrentSession} disabled={sessionDays.length < 2 || resolvedCopyTargetDay === activeDay}>Copy session</button><button type="button" className="outline-button" onClick={() => setPreviewOpen(true)}>Preview week</button><small>Copying replaces the selected target session in this unsaved draft.</small></div><label className="session-name-label">SESSION NAME<input value={names[String(activeDay)] ?? ""} onChange={(event) => setNames({ ...names, [String(activeDay)]: event.target.value })} /></label><div className="session-exercise-editor">{currentExercises.map((exercise, index) => <div className="session-exercise-row" key={exercise.name}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{exercise.name}</strong><small>{exercise.pattern}</small></div><div className="session-exercise-actions"><button onClick={() => moveExercise(index, -1)} disabled={index === 0} aria-label={`Move ${exercise.name} up`}>↑</button><button onClick={() => moveExercise(index, 1)} disabled={index === currentExercises.length - 1} aria-label={`Move ${exercise.name} down`}>↓</button><button onClick={() => removeExercise(exercise.name)}>Remove</button></div><PrescriptionFields exercise={exercise} onChange={(changes) => updateExercise(index, changes)} /></div>)}</div><div className="exercise-picker"><label>ADD FROM EXERCISE LIBRARY<input value={libraryQuery} onChange={(event) => setLibraryQuery(event.target.value)} placeholder="Search movement, pattern or muscle" /></label>{libraryQuery && availableLibrary.map((exercise) => <button key={exercise.name} className="exercise-picker-option" onClick={() => addExercise({ ...exercise, prescription: "3 × 8–12", sets: 3, repsMin: 8, repsMax: 12, intensityValue: "2 RIR", restSeconds: 90, tempo: "", progressionRule: "When all sets reach the top of the range at target RIR with acceptable technique, add a small load increment." })}><strong>{exercise.name}</strong><small>{exercise.pattern} · {exercise.target} · {exercise.equipment}</small><span>+ Add</span></button>)}{libraryQuery && !availableLibrary.length && <p className="library-empty">No matching available exercises.</p>}</div>{error && <p className="form-error" role="alert">{error}</p>}<footer><button className="secondary-button" onClick={onClose}>Cancel</button><button className="primary-button" onClick={() => setPreviewOpen(true)} disabled={saving || !(sessions[String(sessionDays[0])] ?? []).length}>{saving ? "Saving sessions…" : "Preview week & save →"}</button></footer>{previewOpen && <WeekPreviewDialog preview={preview} onClose={() => setPreviewOpen(false)} onSave={save} saving={saving} />}</section></div>;
}

function WeekPreviewDialog({ preview, onClose, onSave, saving }: { preview: ReturnType<typeof buildWeekPreview>; onClose: () => void; onSave: () => void; saving: boolean }) {
  const totalSets = preview.reduce((sum, session) => sum + session.totalSets, 0);
  return <div className="week-preview-backdrop"><section className="week-preview-modal" role="dialog" aria-modal="true" aria-labelledby="week-preview-heading"><header><div><p className="eyebrow">WEEK PREVIEW</p><h2 id="week-preview-heading">Review before saving</h2><p>This is the unsaved week that will become the next programme version.</p></div><button className="close-button" onClick={onClose}>×</button></header><div className="week-preview-summary"><strong>{preview.length} sessions</strong><span>{preview.reduce((sum, session) => sum + session.exerciseCount, 0)} exercises</span><span>{totalSets} total sets</span></div><div className="week-preview-list">{preview.map((session) => <article key={session.day}><div><strong>{session.label}</strong><span>{session.name}</span></div><small>{session.exerciseCount} exercises · {session.totalSets} sets</small>{session.exercises.length ? <ul>{session.exercises.map((exercise) => <li key={exercise.name}><span>{exercise.name}</span><small>{exercise.sets ?? exercise.prescription.match(/^\d+/)?.[0] ?? "—"} sets · {exercise.repsMin ?? "—"}–{exercise.repsMax ?? "—"} reps · {exercise.intensityValue ?? "effort not recorded"}</small></li>)}</ul> : <p className="week-preview-empty">No exercises saved for this session.</p>}</article>)}</div><footer><button className="secondary-button" onClick={onClose}>Back to editor</button><button className="primary-button" onClick={onSave} disabled={saving}>{saving ? "Saving version…" : "Save as new version →"}</button></footer></section></div>;
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
