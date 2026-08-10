"use client";

import { useState } from "react";

import { updateExerciseAction } from "./actions";
import type { LibraryExercise } from "./exercise-library";

const toList = (value: unknown) => Array.isArray(value) ? value.map(String) : [];
const fromList = (value: string) => value.split(",").map((item) => item.trim()).filter(Boolean);

export function ExerciseEditorModal({ exercise, onClose, onSaved }: { exercise: LibraryExercise; onClose: () => void; onSaved: (exercise: LibraryExercise) => void }) {
  const [name, setName] = useState(exercise.name);
  const [pattern, setPattern] = useState(exercise.pattern);
  const [target, setTarget] = useState(toList(exercise.target).join(", "));
  const [secondary, setSecondary] = useState(toList(exercise.secondary).join(", "));
  const [equipment, setEquipment] = useState(toList(exercise.equipment).join(", "));
  const [difficulty, setDifficulty] = useState(exercise.difficulty);
  const [complexity, setComplexity] = useState(exercise.complexity);
  const [tags, setTags] = useState(toList(exercise.tags).join(", "));
  const [suitability, setSuitability] = useState(toList(exercise.suitability).join(", "));
  const [regressions, setRegressions] = useState(toList(exercise.regressions).join(", "));
  const [progressions, setProgressions] = useState(toList(exercise.progressions).join(", "));
  const [alternatives, setAlternatives] = useState(toList(exercise.alternatives).join(", "));
  const [coachingCues, setCoachingCues] = useState(toList(exercise.coachingCues).join(", "));
  const [commonErrors, setCommonErrors] = useState(toList(exercise.commonErrors).join(", "));
  const [cautionTags, setCautionTags] = useState(toList(exercise.cautionTags).join(", "));
  const [compound, setCompound] = useState(exercise.compound);
  const [unilateral, setUnilateral] = useState(exercise.unilateral);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setSaving(true); setError("");
    try {
      const result = await updateExerciseAction({ exerciseId: exercise.id, name, pattern, primaryMuscles: fromList(target), secondaryMuscles: fromList(secondary), equipment: fromList(equipment), difficulty: difficulty as "beginner" | "intermediate" | "advanced", complexity: complexity as "low" | "moderate" | "high", suitability: fromList(suitability), compound, unilateral, tags: fromList(tags), regressions: fromList(regressions), progressions: fromList(progressions), alternatives: fromList(alternatives), coachingCues: fromList(coachingCues), commonErrors: fromList(commonErrors), cautionTags: fromList(cautionTags) });
      onSaved(result.exercise as LibraryExercise);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Exercise could not be saved");
    } finally { setSaving(false); }
  }

  return <div className="modal-backdrop"><section className="exercise-create-modal exercise-edit-modal" role="dialog" aria-modal="true" aria-labelledby="exercise-edit-heading"><header><div><p className="eyebrow">EXERCISE LIBRARY</p><h2 id="exercise-edit-heading">{exercise.ownerProfileId ? "Edit exercise" : "Create an editable copy"}</h2><p>{exercise.ownerProfileId ? "Update the structured metadata used by search, substitutions and programming checks." : "Built-in exercises are protected. Save an owner-scoped copy to customise it safely."}</p></div><button className="close-button" onClick={onClose}>×</button></header><div className="exercise-create-fields"><label>NAME<input value={name} onChange={(event) => setName(event.target.value)} /></label><label>MOVEMENT PATTERN<select value={pattern} onChange={(event) => setPattern(event.target.value)}><option>Squat</option><option>Hinge</option><option>Lunge</option><option>Horizontal push</option><option>Horizontal pull</option><option>Vertical push</option><option>Vertical pull</option><option>Carry</option><option>Rotation</option><option>Anti-rotation</option><option>Anti-extension</option><option>Anti-lateral flexion</option><option>Locomotion</option><option>Conditioning</option><option>Power</option><option>Mobility</option></select></label><label>PRIMARY MUSCLES<input value={target} onChange={(event) => setTarget(event.target.value)} /></label><label>SECONDARY MUSCLES<input value={secondary} onChange={(event) => setSecondary(event.target.value)} /></label><label>EQUIPMENT<input value={equipment} onChange={(event) => setEquipment(event.target.value)} /></label><label>DIFFICULTY<select value={difficulty} onChange={(event) => setDifficulty(event.target.value)}><option>beginner</option><option>intermediate</option><option>advanced</option></select></label><label>TECHNICAL COMPLEXITY<select value={complexity} onChange={(event) => setComplexity(event.target.value)}><option>low</option><option>moderate</option><option>high</option></select></label><label>PROGRAMMING SUITABILITY<input value={suitability} onChange={(event) => setSuitability(event.target.value)} placeholder="strength, hypertrophy, endurance" /></label><label>TAGS<input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="beginner-friendly, gym" /></label></div><div className="exercise-edit-textareas"><label>REGRESSIONS<textarea value={regressions} onChange={(event) => setRegressions(event.target.value)} placeholder="Goblet squat, box squat" /></label><label>PROGRESSIONS<textarea value={progressions} onChange={(event) => setProgressions(event.target.value)} placeholder="Front squat, tempo squat" /></label><label>ALTERNATIVES<textarea value={alternatives} onChange={(event) => setAlternatives(event.target.value)} placeholder="Leg press, split squat" /></label><label>COACHING CUES<textarea value={coachingCues} onChange={(event) => setCoachingCues(event.target.value)} /></label><label>COMMON ERRORS<textarea value={commonErrors} onChange={(event) => setCommonErrors(event.target.value)} /></label><label>CAUTION TAGS<textarea value={cautionTags} onChange={(event) => setCautionTags(event.target.value)} placeholder="screening review, technique" /></label></div><div className="exercise-create-checks"><label><input type="checkbox" checked={compound} onChange={(event) => setCompound(event.target.checked)} /> Compound</label><label><input type="checkbox" checked={unilateral} onChange={(event) => setUnilateral(event.target.checked)} /> Unilateral</label></div>{error && <p className="form-error" role="alert">{error}</p>}<footer><button className="secondary-button" onClick={onClose}>Cancel</button><button className="primary-button" onClick={save} disabled={saving || !name.trim() || !target.trim() || !equipment.trim()}>{saving ? "Saving exercise…" : "Save exercise →"}</button></footer></section></div>;
}
