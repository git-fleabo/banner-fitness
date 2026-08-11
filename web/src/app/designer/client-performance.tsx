"use client";

import { useEffect, useState } from "react";

import { saveClientPerformanceRecordAction } from "./actions";

type PerformanceRecord = { id: string; exerciseId: string | null; exerciseName: string | null; metricType: string; metricName: string | null; performanceDate: string; value: string | number; unit: string; repetitions: number | null; loadKg: string | number | null; source: string; confidence: string | null; techniqueAcceptable: boolean; painReported: boolean; notes: string | null };
type ExerciseOption = { id: string; name: string };

const today = () => new Date().toISOString().slice(0, 10);
const metricLabel = (type: string) => ({ one_rm: "1RM", estimated_one_rm: "Estimated 1RM", rep_max: "Rep max", other: "Other measure" }[type] ?? type);

export function ClientPerformanceLauncher({ clientId, notify }: { clientId: string; notify: (message: string) => void }) {
  const [open, setOpen] = useState(false);
  return <>{open && <ClientPerformance clientId={clientId} onClose={() => setOpen(false)} notify={notify} />}<button className="client-performance-floating" onClick={() => setOpen(true)}>Performance baselines</button></>;
}

function ClientPerformance({ clientId, onClose, notify }: { clientId: string; onClose: () => void; notify: (message: string) => void }) {
  const [records, setRecords] = useState<PerformanceRecord[]>([]);
  const [exercises, setExercises] = useState<ExerciseOption[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [metricType, setMetricType] = useState("one_rm");
  const [exerciseId, setExerciseId] = useState("");
  const [metricName, setMetricName] = useState("");
  const [performanceDate, setPerformanceDate] = useState(today);
  const [value, setValue] = useState("");
  const [unit, setUnit] = useState("kg");
  const [repetitions, setRepetitions] = useState("");
  const [loadKg, setLoadKg] = useState("");
  const [source, setSource] = useState("tested");
  const [confidence, setConfidence] = useState("moderate");
  const [techniqueAcceptable, setTechniqueAcceptable] = useState(true);
  const [painReported, setPainReported] = useState(false);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch(`/api/designer/client?clientId=${encodeURIComponent(clientId)}`, { credentials: "same-origin", cache: "no-store" }).then((response) => response.ok ? response.json() as Promise<{ performanceRecords: PerformanceRecord[] }> : Promise.reject(new Error("Performance records unavailable"))),
      fetch("/api/designer/exercises", { credentials: "same-origin", cache: "no-store" }).then((response) => response.ok ? response.json() as Promise<{ exercises: ExerciseOption[] }> : Promise.reject(new Error("Exercise library unavailable"))),
    ]).then(([clientData, exerciseData]) => { setRecords(clientData.performanceRecords ?? []); setExercises(exerciseData.exercises ?? []); }).catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Performance records unavailable")).finally(() => setLoaded(true));
  }, [clientId]);

  async function save() {
    setSaving(true); setError("");
    try {
      await saveClientPerformanceRecordAction({ clientId, exerciseId: exerciseId || undefined, metricType: metricType as "one_rm" | "estimated_one_rm" | "rep_max" | "other", metricName: metricName || undefined, performanceDate, value: Number(value), unit, repetitions: repetitions ? Number(repetitions) : undefined, loadKg: loadKg ? Number(loadKg) : undefined, source: source as "tested" | "estimated" | "client_reported" | "workout_result" | "other", confidence: confidence as "high" | "moderate" | "low", techniqueAcceptable, painReported, notes: notes || undefined });
      notify("Performance baseline saved");
      const refreshed = await fetch(`/api/designer/client?clientId=${encodeURIComponent(clientId)}`, { credentials: "same-origin", cache: "no-store" }).then((response) => response.json() as Promise<{ performanceRecords: PerformanceRecord[] }>);
      setRecords(refreshed.performanceRecords ?? []);
      setValue(""); setRepetitions(""); setLoadKg(""); setNotes(""); setPainReported(false); setTechniqueAcceptable(true); setPerformanceDate(today());
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : "Performance baseline could not be saved"); } finally { setSaving(false); }
  }

  return <div className="modal-backdrop"><section className="exercise-create-modal performance-modal" role="dialog" aria-modal="true" aria-labelledby="performance-heading"><header><div><p className="eyebrow">CLIENT PERFORMANCE</p><h2 id="performance-heading">Performance baselines</h2><p>Record dated observations such as a tested 1RM, estimated 1RM or rep max. These support PT judgement and do not automatically prescribe load or require maximal testing.</p></div><button className="close-button" onClick={onClose}>×</button></header>{loaded && <><div className="performance-record-list"><div className="performance-section-heading"><strong>Recorded observations</strong><span>{records.length} record{records.length === 1 ? "" : "s"}</span></div>{records.length ? records.map((record) => <article className="performance-record" key={record.id}><div><strong>{record.exerciseName ?? record.metricName ?? "General measure"}</strong><span>{metricLabel(record.metricType)} · {record.value} {record.unit}{record.metricType === "rep_max" && record.loadKg ? ` at ${record.loadKg} kg` : ""}</span></div><small>{record.performanceDate} · {record.source.replaceAll("_", " ")}{record.painReported ? " · pain reported" : ""}</small></article>) : <p className="progress-empty">No performance baselines recorded yet.</p>}</div><div className="performance-form"><div className="performance-section-heading"><strong>Add observation</strong><span>Optional, dated and contextual</span></div><div className="exercise-create-fields"><label>MEASURE<select value={metricType} onChange={(event) => setMetricType(event.target.value)}><option value="one_rm">1RM</option><option value="estimated_one_rm">Estimated 1RM</option><option value="rep_max">Rep max</option><option value="other">Other measure</option></select></label><label>EXERCISE<select value={exerciseId} onChange={(event) => setExerciseId(event.target.value)}><option value="">Select exercise</option>{exercises.map((exercise) => <option key={exercise.id} value={exercise.id}>{exercise.name}</option>)}</select></label><label>METRIC NAME<input value={metricName} onChange={(event) => setMetricName(event.target.value)} placeholder="Required for non-exercise measures" /></label><label>DATE<input type="date" value={performanceDate} onChange={(event) => setPerformanceDate(event.target.value)} /></label><label>VALUE<input type="number" min="0.01" step="0.01" value={value} onChange={(event) => setValue(event.target.value)} placeholder="100" /></label><label>UNIT<input value={unit} onChange={(event) => setUnit(event.target.value)} placeholder="kg" /></label><label>REPETITIONS<input type="number" min="1" max="100" value={repetitions} onChange={(event) => setRepetitions(event.target.value)} placeholder="For rep max" /></label><label>LOAD KG<input type="number" min="0.01" step="0.01" value={loadKg} onChange={(event) => setLoadKg(event.target.value)} placeholder="For rep max" /></label><label>SOURCE<select value={source} onChange={(event) => setSource(event.target.value)}><option value="tested">PT tested</option><option value="estimated">PT estimated</option><option value="client_reported">Client reported</option><option value="workout_result">Workout result</option><option value="other">Other</option></select></label><label>CONFIDENCE<select value={confidence} onChange={(event) => setConfidence(event.target.value)}><option value="high">High</option><option value="moderate">Moderate</option><option value="low">Low</option></select></label></div><div className="exercise-create-checks"><label><input type="checkbox" checked={techniqueAcceptable} onChange={(event) => setTechniqueAcceptable(event.target.checked)} /> Technique acceptable</label><label><input type="checkbox" checked={painReported} onChange={(event) => setPainReported(event.target.checked)} /> Pain reported</label></div><label className="performance-notes-field">CONTEXT NOTES<textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Test conditions, confidence, tolerance or relevant context" /></label></div></>}{error && <p className="form-error" role="alert">{error}</p>}<footer><button className="secondary-button" onClick={onClose}>Close</button><button className="primary-button" onClick={save} disabled={saving || !loaded || !value || (!exerciseId && !metricName.trim()) || (metricType === "rep_max" && (!repetitions || !loadKg))}>{saving ? "Saving…" : "Save observation →"}</button></footer></section></div>;
}
