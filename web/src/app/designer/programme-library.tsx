"use client";

import { useEffect, useState } from "react";

import { duplicateProgrammeTemplateAction, listProgrammeTemplatesAction } from "./actions";
import { SessionEditorModal } from "./designer-support";
import type { EditorExercise, SavedSession } from "@/lib/programme-editor";

export type ProgrammeLibraryTemplate = Awaited<ReturnType<typeof listProgrammeTemplatesAction>>[number];
type ProgrammeTemplate = ProgrammeLibraryTemplate;
type ProgrammeLibraryClient = { id: string; firstName: string; lastName: string };

export function ProgrammeLibrary({ clients, onClose, onApply, notify }: { clients: ProgrammeLibraryClient[]; onClose: () => void; onApply: (template: ProgrammeTemplate, client: ProgrammeLibraryClient) => void; notify: (message: string) => void }) {
  const [templates, setTemplates] = useState<ProgrammeTemplate[]>([]);
  const [query, setQuery] = useState("");
  const [goalFilter, setGoalFilter] = useState("all");
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
  const filtered = templates.filter((template) => {
    const haystack = `${template.label} ${template.goal} ${template.description}`.toLowerCase();
    return (goalFilter === "all" || template.goal === goalFilter) && (!query.trim() || haystack.includes(query.trim().toLowerCase()));
  });

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
    <div className="page-heading"><div><p className="eyebrow">REUSABLE PROGRAMMES</p><h1>Programme library</h1><p className="subheading">Reusable PT-owned starting points. Adapt each template to the client, then save and quality-check a client-specific version.</p></div><button className="primary-button" onClick={onClose}>← Dashboard</button></div>
    <div className="programme-library-toolbar"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search programme templates…" aria-label="Search programme templates" /><select value={goalFilter} onChange={(event) => setGoalFilter(event.target.value)} aria-label="Filter programme templates by goal"><option value="all">All goals</option>{goals.map((goal) => <option key={goal} value={goal}>{goal}</option>)}</select><button className="secondary-button" onClick={() => void load()}>Refresh</button></div>
    {error && <p className="form-error programme-library-error" role="alert">{error}</p>}
    {loading ? <p className="library-empty">Loading the programme library…</p> : filtered.length ? <div className="programme-library-grid">{filtered.map((template) => <article className="programme-library-card" key={template.id}><div className="programme-library-card-heading"><div><p className="eyebrow">{template.goal}</p><h2>{template.label}</h2></div><span>{template.sessions.length} sessions</span></div><p>{template.description || "Reusable starting point for PT adaptation."}</p><div className="programme-library-meta"><span>{template.sessionDurationMinutes} min</span><span>{template.sessions.reduce((sum, session) => sum + session.exercises.length, 0)} exercises</span><span>PT-owned</span></div><div className="programme-library-actions"><button className="primary-button" onClick={() => { setApplySource(template); setApplyClientId(clients[0]?.id ?? ""); }}>Apply to client →</button><button className="text-button" onClick={() => setPreview(template)}>Preview →</button><button className="text-button" onClick={() => { setDuplicateSource(template); setDuplicateName(`${template.label} copy`); }}>Duplicate</button><button className="text-button" onClick={() => setEditing(template)}>Edit →</button></div></article>)}</div> : <div className="empty-client-state"><h3>No programme templates match</h3><p>Try another goal or search term.</p></div>}
    {preview && <ProgrammeTemplatePreview template={preview} onClose={() => setPreview(null)} />}
    {duplicateSource && <div className="modal-backdrop"><section className="small-modal" role="dialog" aria-modal="true" aria-labelledby="duplicate-template-heading"><header><div><p className="eyebrow">PROGRAMME LIBRARY</p><h2 id="duplicate-template-heading">Duplicate template</h2><p>Create a separate editable copy of {duplicateSource.label}.</p></div><button className="close-button" onClick={() => setDuplicateSource(null)}>×</button></header><label>NEW TEMPLATE NAME<input value={duplicateName} onChange={(event) => setDuplicateName(event.target.value)} /></label><footer><button className="secondary-button" onClick={() => setDuplicateSource(null)}>Cancel</button><button className="primary-button" onClick={duplicate} disabled={saving || !duplicateName.trim()}>{saving ? "Duplicating…" : "Duplicate template →"}</button></footer></section></div>}
    {applySource && <div className="modal-backdrop"><section className="small-modal" role="dialog" aria-modal="true" aria-labelledby="apply-template-heading"><header><div><p className="eyebrow">PROGRAMME LIBRARY</p><h2 id="apply-template-heading">Apply to a client</h2><p>Choose a client, then review and adapt this template before saving a new client-specific draft.</p></div><button className="close-button" onClick={() => setApplySource(null)}>×</button></header><div className="apply-template-summary"><strong>{applySource.label}</strong><span>{applySource.goal} · {applySource.sessions.length} sessions · {applySource.sessionDurationMinutes} min</span></div><label>CLIENT<select value={applyClientId} onChange={(event) => setApplyClientId(event.target.value)}><option value="">Select a client</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.firstName} {client.lastName}</option>)}</select></label>{!clients.length && <p className="library-empty">Create a client before applying a reusable programme.</p>}<footer><button className="secondary-button" onClick={() => setApplySource(null)}>Cancel</button><button className="primary-button" onClick={applyTemplate} disabled={!applyClientId || !clients.length}>Open client draft →</button></footer></section></div>}
    {editing && <SessionEditorModal clientName={editing.label} goal={editing.goal} days={editing.sessions.length} sessionDurationMinutes={editing.sessionDurationMinutes} week={editing.sessions[0]?.exercises ?? [] as EditorExercise[]} savedSessions={editing.sessions.map((session, index): SavedSession => ({ dayOfWeek: index + 1, name: session.name, exercises: session.exercises }))} templateId={editing.id} onClose={() => setEditing(null)} onTemplateSaved={() => { setEditing(null); void load(); }} notify={notify} />}
  </div>;
}

function ProgrammeTemplatePreview({ template, onClose }: { template: ProgrammeTemplate; onClose: () => void }) {
  return <div className="modal-backdrop"><section className="small-modal programme-template-preview" role="dialog" aria-modal="true" aria-labelledby="programme-template-preview-heading"><header><div><p className="eyebrow">PROGRAMME LIBRARY</p><h2 id="programme-template-preview-heading">{template.label}</h2><p>{template.description || "Reusable PT-owned starting point."}</p></div><button className="close-button" onClick={onClose}>×</button></header><div className="programme-template-preview-list">{template.sessions.map((session) => <article key={session.name}><strong>{session.name}</strong><small>{session.exercises.length} exercises</small><ul>{session.exercises.map((exercise) => <li key={exercise.name}>{exercise.name}<span>{exercise.prescription} · {exercise.intensityValue ?? "effort not recorded"}</span></li>)}</ul></article>)}</div><footer><button className="primary-button" onClick={onClose}>Close preview</button></footer></section></div>;
}
