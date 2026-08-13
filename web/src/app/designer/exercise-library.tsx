"use client";

import { useEffect, useState } from "react";

import { createExerciseAction } from "./actions";
import { ExerciseEditorModal } from "./exercise-editor";
import { Icon } from "./semantic-icon";

export type LibraryExercise = {
  id: string;
  name: string;
  pattern: string;
  target: unknown;
  secondary?: unknown;
  equipment: unknown;
  difficulty: string;
  complexity: string;
  suitability: unknown;
  compound: boolean;
  unilateral: boolean;
  tags?: unknown;
  regressions: unknown;
  progressions: unknown;
  alternatives: unknown;
  coachingCues: unknown;
  commonErrors: unknown;
  cautionTags: unknown;
  ownerProfileId?: string | null;
};

export const list = (value: unknown) => Array.isArray(value) ? value.map(String) : [];

export function ExerciseLibrary({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [difficulty, setDifficulty] = useState("all");
  const [pattern, setPattern] = useState("all");
  const [items, setItems] = useState<LibraryExercise[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<LibraryExercise | null>(null);

  useEffect(() => {
    fetch(`/api/designer/exercises?q=${encodeURIComponent(query)}`, { credentials: "same-origin", cache: "no-store" })
      .then((response) => response.ok ? response.json() as Promise<{ exercises: LibraryExercise[] }> : Promise.reject(new Error("Exercise library unavailable")))
      .then((data) => setItems(data.exercises))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [query]);

  const patterns = Array.from(new Set(items.map((item) => item.pattern))).sort();
  const filtered = items.filter((item) => (difficulty === "all" || item.difficulty === difficulty) && (pattern === "all" || item.pattern === pattern));

  function replaceEdited(updated: LibraryExercise) {
    setItems((current) => [updated, ...current.filter((item) => item.id !== updated.id && item.name !== updated.name)]);
    setEditing(null);
  }

  return <div className="library-view">
    <div className="page-heading"><div><p className="eyebrow">MOVEMENT DATABASE</p><h1>Exercise library</h1><p className="subheading">{items.length} structured exercises with editable regressions, progressions, cues, cautions and programming tags.</p></div><button className="primary-button" onClick={onClose}>← Dashboard</button></div>
    <div className="library-toolbar"><div className="library-search"><Icon name="search" /><input value={query} onChange={(event) => { setLoading(true); setQuery(event.target.value); }} placeholder="Search exercises, patterns, muscles or equipment..." /></div><select className="library-filter" value={difficulty} onChange={(event) => setDifficulty(event.target.value)}><option value="all">All levels</option><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select><select className="library-filter" value={pattern} onChange={(event) => setPattern(event.target.value)}><option value="all">All patterns</option>{patterns.map((value) => <option key={value} value={value}>{value}</option>)}</select><button className="secondary-button" onClick={() => setShowAdd(true)}>+ Add exercise</button></div>
    <p className="library-legend"><span className="exercise-legend-dot">●</span> Green marker = compound movement; open marker = single-joint or isolation movement.</p>
    {loading ? <p className="library-empty">Loading the structured exercise catalogue…</p> : <div className="library-grid">{filtered.map((exercise) => { const isExpanded = expanded === exercise.id; const cautions = list(exercise.cautionTags); return <article className={`library-card ${isExpanded ? "expanded" : ""}`} key={exercise.id}><div className={`exercise-illustration ${exercise.compound ? "is-compound" : "is-isolation"}`} aria-label={exercise.compound ? "Compound movement" : "Single-joint movement"} title={exercise.compound ? "Compound movement" : "Single-joint movement"}>{exercise.compound ? "◉" : "◌"}</div><div className="library-card-copy"><div className="library-card-top"><span className="library-tag">{exercise.pattern}</span><span className={`library-level ${exercise.difficulty}`}>{exercise.difficulty}</span></div><h3>{exercise.name}</h3><p>{list(exercise.target).join(" · ")} · {list(exercise.equipment).join(", ")}</p><div className="library-meta"><span>{exercise.complexity} complexity</span><span>{exercise.unilateral ? "Unilateral" : "Bilateral"}</span><span>{list(exercise.suitability).slice(0, 2).join(" · ")}</span></div>{cautions.length > 0 && <div className="library-caution">Caution tags: {cautions.join(", ")}</div>}<div className="library-card-actions"><button className="text-button" onClick={() => setExpanded(isExpanded ? null : exercise.id)}>{isExpanded ? "Hide details ↑" : "View details →"}</button><button className="text-button" onClick={() => setEditing(exercise)}>{exercise.ownerProfileId ? "Edit exercise →" : "Edit as custom →"}</button></div>{isExpanded && <div className="library-detail"><p><b>Secondary muscles:</b> {list(exercise.secondary).join(" · ") || "Not yet recorded"}</p><p><b>Tags:</b> {list(exercise.tags).join(" · ") || "None recorded"}</p><p><b>Cues:</b> {list(exercise.coachingCues).join(" · ") || "Not yet recorded"}</p><p><b>Regressions:</b> {list(exercise.regressions).join(" · ") || "None recorded"}</p><p><b>Progressions:</b> {list(exercise.progressions).join(" · ") || "None recorded"}</p><p><b>Alternatives:</b> {list(exercise.alternatives).join(" · ") || "None recorded"}</p><p><b>Common errors:</b> {list(exercise.commonErrors).join(" · ") || "None recorded"}</p></div>}</div></article>; })}</div>}
    {!loading && filtered.length === 0 && <p className="library-empty">No exercises match those filters.</p>}
    {showAdd && <ExerciseCreateModal onClose={() => setShowAdd(false)} onCreated={(exercise) => { setItems((current) => [exercise, ...current]); setShowAdd(false); }} />}
    {editing && <ExerciseEditorModal exercise={editing} onClose={() => setEditing(null)} onSaved={replaceEdited} />}
  </div>;
}

function ExerciseCreateModal({onClose,onCreated}:{onClose:()=>void;onCreated:(exercise:LibraryExercise)=>void}) {
  const [name,setName] = useState("");
  const [pattern,setPattern] = useState("Squat");
  const [target,setTarget] = useState("");
  const [equipment,setEquipment] = useState("");
  const [difficulty,setDifficulty] = useState<"beginner" | "intermediate" | "advanced">("beginner");
  const [complexity,setComplexity] = useState<"low" | "moderate" | "high">("low");
  const [compound,setCompound] = useState(true);
  const [unilateral,setUnilateral] = useState(false);
  const [saving,setSaving] = useState(false);
  const [error,setError] = useState("");
  async function save() {
    setSaving(true); setError("");
    try { const result = await createExerciseAction({ name, pattern, target: target.split(",").map((value) => value.trim()).filter(Boolean), equipment: equipment.split(",").map((value) => value.trim()).filter(Boolean), difficulty, complexity, compound, unilateral }); onCreated(result.exercise); }
    catch (saveError) { setError(saveError instanceof Error ? saveError.message : "Exercise could not be created"); }
    finally { setSaving(false); }
  }
  return <div className="modal-backdrop"><section className="exercise-create-modal" role="dialog" aria-modal="true" aria-labelledby="exercise-create-heading"><header><div><p className="eyebrow">EXERCISE LIBRARY</p><h2 id="exercise-create-heading">Add a custom exercise</h2><p>Keep the entry structured so it can be searched and used in the programme builder.</p></div><button className="close-button" onClick={onClose}>×</button></header><div className="exercise-create-fields"><label>NAME<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Half-kneeling cable press" /></label><label>MOVEMENT PATTERN<select value={pattern} onChange={(event) => setPattern(event.target.value)}><option>Squat</option><option>Hinge</option><option>Lunge</option><option>Horizontal push</option><option>Horizontal pull</option><option>Vertical push</option><option>Vertical pull</option><option>Carry</option><option>Anti-rotation</option><option>Conditioning</option><option>Mobility</option></select></label><label>PRIMARY MUSCLES<input value={target} onChange={(event) => setTarget(event.target.value)} placeholder="Chest, triceps" /></label><label>EQUIPMENT<input value={equipment} onChange={(event) => setEquipment(event.target.value)} placeholder="Cable, bench" /></label><label>DIFFICULTY<select value={difficulty} onChange={(event) => setDifficulty(event.target.value as typeof difficulty)}><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select></label><label>TECHNICAL COMPLEXITY<select value={complexity} onChange={(event) => setComplexity(event.target.value as typeof complexity)}><option value="low">Low</option><option value="moderate">Moderate</option><option value="high">High</option></select></label></div><div className="exercise-create-checks"><label><input type="checkbox" checked={compound} onChange={(event) => setCompound(event.target.checked)} /> Compound</label><label><input type="checkbox" checked={unilateral} onChange={(event) => setUnilateral(event.target.checked)} /> Unilateral</label></div>{error && <p className="form-error" role="alert">{error}</p>}<footer><button className="secondary-button" onClick={onClose}>Cancel</button><button className="primary-button" onClick={save} disabled={saving || !name.trim() || !target.trim() || !equipment.trim()}>{saving ? "Adding exercise…" : "Add exercise →"}</button></footer></section></div>;
}
