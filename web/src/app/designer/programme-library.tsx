"use client";

import { useEffect, useState } from "react";

import { duplicateProgrammeTemplateAction, listProgrammeTemplatesAction } from "./actions";
import { SessionEditorModal } from "./designer-support";
import type { EditorExercise, SavedSession } from "@/lib/programme-editor";
import { filterProgrammeLibraryTemplates } from "@/lib/programme-library";

export type ProgrammeLibraryTemplate = Awaited<ReturnType<typeof listProgrammeTemplatesAction>>[number];
type ProgrammeTemplate = ProgrammeLibraryTemplate;
type ProgrammeLibraryClient = { id: string; firstName: string; lastName: string };
const equipmentFilters = [{ value: "Barbell", label: "Barbell" }, { value: "Dumbbells", label: "Dumbbells" }, { value: "Machines", label: "Machines" }, { value: "Cable", label: "Cable" }, { value: "Bodyweight", label: "Bodyweight" }, { value: "Kettlebell", label: "Kettlebell" }, { value: "TRX", label: "TRX" }, { value: "Gymnastic rings", label: "Rings" }, { value: "Resistance band", label: "Bands" }];
const filterPresets = [
  { id: "beginner-2-day-minimal", label: "Beginner · 2 days · minimal equipment", goal: "all", frequency: "2", equipment: "all", experience: "Beginner", framework: "all" },
  { id: "strength-3-day-barbell", label: "Strength · 3 days · barbell", goal: "General strength", frequency: "3", equipment: "Barbell", experience: "all", framework: "all" },
  { id: "hypertrophy-4-day", label: "Hypertrophy · 4 days", goal: "Hypertrophy", frequency: "4", equipment: "all", experience: "all", framework: "all" },
  { id: "sport-support", label: "Sport support", goal: "all", frequency: "all", equipment: "all", experience: "all", framework: "Sport support" },
] as const;

export function ProgrammeLibrary({ clients, onClose, onApply, notify }: { clients: ProgrammeLibraryClient[]; onClose: () => void; onApply: (template: ProgrammeTemplate, client: ProgrammeLibraryClient) => void; notify: (message: string) => void }) {
  const [templates, setTemplates] = useState<ProgrammeTemplate[]>([]);
  const [query, setQuery] = useState("");
  const [goalFilter, setGoalFilter] = useState("all");
  const [frequencyFilter, setFrequencyFilter] = useState("all");
  const [equipmentFilter, setEquipmentFilter] = useState("all");
  const [experienceFilter, setExperienceFilter] = useState("all");
  const [frameworkFilter, setFrameworkFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<ProgrammeTemplate | null>(null);
  const [editing, setEditing] = useState<ProgrammeTemplate | null>(null);
  const [duplicateSource, setDuplicateSource] = useState<ProgrammeTemplate | null>(null);
  const [duplicateName, setDuplicateName] = useState("");
  const [applySource, setApplySource] = useState<ProgrammeTemplate | null>(null);
  const [applyClientId, setApplyClientId] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try { setTemplates(await listProgrammeTemplatesAction()); }
    catch (loadError) { setError(loadError instanceof Error ? loadError.message : "Programme library could not be loaded"); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const goals = Array.from(new Set(templates.map((template) => template.goal))).sort();
  const experienceLevels = Array.from(new Set(templates.map((template) => template.experienceLevel).filter(Boolean))).sort();
  const frameworkTypes = Array.from(new Set(templates.map((template) => template.frameworkType).filter(Boolean))).sort();
  const filtered = filterProgrammeLibraryTemplates(templates, { query, goal: goalFilter, frequency: frequencyFilter === "all" ? "all" : Number(frequencyFilter), equipment: equipmentFilter, experienceLevel: experienceFilter, frameworkType: frameworkFilter });
  const activePresetId = filterPresets.find((preset) => !query && goalFilter === preset.goal && frequencyFilter === preset.frequency && equipmentFilter === preset.equipment && experienceFilter === preset.experience && frameworkFilter === preset.framework)?.id;

  function resetFilters() {
    setQuery("");
    setGoalFilter("all");
    setFrequencyFilter("all");
    setEquipmentFilter("all");
    setExperienceFilter("all");
    setFrameworkFilter("all");
  }

  function applyPreset(preset: typeof filterPresets[number]) {
    setQuery("");
    setGoalFilter(preset.goal);
    setFrequencyFilter(preset.frequency);
    setEquipmentFilter(preset.equipment);
    setExperienceFilter(preset.experience);
    setFrameworkFilter(preset.framework);
  }

  async function duplicate() {
    if (!duplicateSource || !duplicateName.trim()) return;
    setSaving(true);
    try {
      const result = await duplicateProgrammeTemplateAction({ templateId: duplicateSource.id, name: duplicateName.trim() });
      notify(`Duplicated ${result.name}`);
      setDuplicateSource(null);
      setDuplicateName("");
      await load();
    } catch (duplicateError) { setError(duplicateError instanceof Error ? duplicateError.message : "Programme template could not be duplicated"); }
    finally { setSaving(false); }
  }

  function applyTemplate() {
    if (!applySource) return;
    const client = clients.find((candidate) => candidate.id === applyClientId);
    if (!client) return;
    onApply(applySource, client);
    setApplySource(null);
    setApplyClientId("");
  }

  return <div className="programme-library-view">
    <div className="page-heading"><div><p className="eyebrow">REUSABLE PROGRAMMES</p><h1>Programme library</h1><p className="subheading">Reusable PT-owned starting points. Adapt each template to the client, then save and quality-check a client-specific version.</p></div><button className="secondary-button" onClick={onClose}>← Dashboard</button></div>
    <div className="programme-library-toolbar"><div className="programme-library-search-row"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search programme templates…" aria-label="Search programme templates" /><button className="secondary-button" onClick={() => void load()}>Refresh</button></div><div className="programme-library-filter-row"><select value={goalFilter} onChange={(event) => setGoalFilter(event.target.value)} aria-label="Filter programme templates by goal"><option value="all">All goals</option>{goals.map((goal) => <option key={goal} value={goal}>{goal}</option>)}</select><select value={frequencyFilter} onChange={(event) => setFrequencyFilter(event.target.value)} aria-label="Filter programme templates by frequency"><option value="all">Any frequency</option>{[2, 3, 4, 5, 6].map((frequency) => <option key={frequency} value={frequency}>{frequency} days / week</option>)}</select><select value={equipmentFilter} onChange={(event) => setEquipmentFilter(event.target.value)} aria-label="Filter programme templates by equipment"><option value="all">Any equipment</option>{equipmentFilters.map((equipment) => <option key={equipment.value} value={equipment.value}>{equipment.label}</option>)}</select><select value={experienceFilter} onChange={(event) => setExperienceFilter(event.target.value)} aria-label="Filter programme templates by experience level"><option value="all">Any experience</option>{experienceLevels.map((level) => <option key={level} value={level}>{level}</option>)}</select><select value={frameworkFilter} onChange={(event) => setFrameworkFilter(event.target.value)} aria-label="Filter programme templates by framework"><option value="all">Any framework</option>{frameworkTypes.map((framework) => <option key={framework} value={framework}>{framework}</option>)}</select><button className="secondary-button" onClick={resetFilters}>Reset</button></div></div>
    <div className="programme-library-presets" aria-label="Saved programme filters"><span>QUICK VIEWS</span>{filterPresets.map((preset) => <button key={preset.id} className={`preset-button ${activePresetId === preset.id ? "active" : ""}`} aria-pressed={activePresetId === preset.id} onClick={() => applyPreset(preset)}>{preset.label}</button>)}</div>
    {error && <p className="form-error programme-library-error" role="alert">{error}</p>}
    {loading ? <p className="library-empty">Loading the programme library…</p> : filtered.length ? <div className="programme-library-grid">{filtered.map((template) => <article className="programme-library-card" key={template.id}><div className="programme-library-card-heading"><div><p className="eyebrow">{template.goal}</p><h2>{template.label}</h2></div><span>{template.sessions.length} sessions</span></div><p>{template.description || "Reusable starting point for PT adaptation."}</p><div className="programme-library-meta"><span>{template.sessionDurationMinutes} min</span><span>{template.sessions.reduce((sum, session) => sum + session.exercises.length, 0)} exercises</span><span>{template.experienceLevel ?? "Varied"}</span><span>{template.frameworkType ?? "Custom"}</span></div><div className="programme-library-actions"><button className="primary-button" onClick={() => { setApplySource(template); setApplyClientId(clients[0]?.id ?? ""); }}>Apply to client →</button><button className="secondary-button" onClick={() => setPreview(template)}>Preview →</button><button className="secondary-button" onClick={() => { setDuplicateSource(template); setDuplicateName(`${template.label} copy`); }}>Duplicate</button><button className="secondary-button" onClick={() => setEditing(template)}>Edit →</button></div></article>)}</div> : <div className="empty-client-state"><h3>No programme templates match</h3><p>Try another combination of goal, frequency, equipment, experience or framework.</p><button className="secondary-button" onClick={resetFilters}>Reset filters</button></div>}
    {preview && <ProgrammeTemplatePreview template={preview} onClose={() => setPreview(null)} />}
    {duplicateSource && <div className="modal-backdrop"><section className="small-modal" role="dialog" aria-modal="true" aria-labelledby="duplicate-template-heading"><header><div><p className="eyebrow">PROGRAMME LIBRARY</p><h2 id="duplicate-template-heading">Duplicate template</h2><p>Create a separate editable copy of {duplicateSource.label}.</p></div><button className="close-button" onClick={() => setDuplicateSource(null)}>×</button></header><label>NEW TEMPLATE NAME<input value={duplicateName} onChange={(event) => setDuplicateName(event.target.value)} /></label><footer><button className="secondary-button" onClick={() => setDuplicateSource(null)}>Cancel</button><button className="primary-button" onClick={duplicate} disabled={saving || !duplicateName.trim()}>{saving ? "Duplicating…" : "Duplicate template →"}</button></footer></section></div>}
    {applySource && <div className="modal-backdrop"><section className="small-modal" role="dialog" aria-modal="true" aria-labelledby="apply-template-heading"><header><div><p className="eyebrow">PROGRAMME LIBRARY</p><h2 id="apply-template-heading">Apply to a client</h2><p>Choose a client, then review and adapt this template before saving a new client-specific draft.</p></div><button className="close-button" onClick={() => setApplySource(null)}>×</button></header><div className="apply-template-summary"><strong>{applySource.label}</strong><span>{applySource.goal} · {applySource.sessions.length} sessions · {applySource.sessionDurationMinutes} min</span></div><label>CLIENT<select value={applyClientId} onChange={(event) => setApplyClientId(event.target.value)}><option value="">Select a client</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.firstName} {client.lastName}</option>)}</select></label>{!clients.length && <p className="library-empty">Create a client before applying a reusable programme.</p>}<footer><button className="secondary-button" onClick={() => setApplySource(null)}>Cancel</button><button className="primary-button" onClick={applyTemplate} disabled={!applyClientId || !clients.length}>Open client draft →</button></footer></section></div>}
    {editing && <SessionEditorModal clientName={editing.label} goal={editing.goal} days={editing.sessions.length} sessionDurationMinutes={editing.sessionDurationMinutes} week={editing.sessions[0]?.exercises ?? [] as EditorExercise[]} savedSessions={editing.sessions.map((session, index): SavedSession => ({ dayOfWeek: index + 1, name: session.name, exercises: session.exercises }))} templateId={editing.id} onClose={() => setEditing(null)} onTemplateSaved={() => { setEditing(null); void load(); }} notify={notify} />}
  </div>;
}

function ProgrammeTemplatePreview({ template, onClose }: { template: ProgrammeTemplate; onClose: () => void }) {
  return <div className="modal-backdrop"><section className="small-modal programme-template-preview" role="dialog" aria-modal="true" aria-labelledby="programme-template-preview-heading"><header><div><p className="eyebrow">PROGRAMME LIBRARY</p><h2 id="programme-template-preview-heading">{template.label}</h2><p>{template.description || "Reusable PT-owned starting point."}</p></div><button className="close-button" onClick={onClose}>×</button></header><div className="programme-template-preview-list">{template.sessions.map((session) => <article key={session.name}><strong>{session.name}</strong><small>{session.exercises.length} exercises</small><ul>{session.exercises.map((exercise) => <li key={exercise.name}>{exercise.name}<span>{exercise.prescription} · {exercise.intensityValue ?? "effort not recorded"}</span></li>)}</ul></article>)}</div><footer><button className="primary-button" onClick={onClose}>Close preview</button></footer></section></div>;
}
