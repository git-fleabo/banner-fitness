"use client";

import { useEffect, useState } from "react";

type ProgressData = {
  summary: { totalSessions: number; completedSessions: number; adherence: number | null; totalVolumeLoadKg: number; totalRepetitionLoad: number; averageSessionRpe: number | null; painReports: number };
  trend: Array<{ date: string; label: string; status: string; volumeLoadKg: number; repetitionLoad: number; sessionRpe: number | null; averageRpe: number | null; averageRir: number | null }>;
  exercises: Array<{ exerciseName: string; pattern: string; sessions: number; totalReps: number; volumeLoadKg: number; bestLoadKg: number; latestLoadKg: number; latestDate: string | null }>;
  results: Array<{ id: string; scheduledDate: string; sessionName: string | null; status: string; sessionRpe: number | null; energy: number | null; painReported: boolean; durationMinutes: number | null; volumeLoadKg: number; repetitionLoad: number; averageRpe: number | null; averageRir: number | null; notes: string | null }>;
};

function formatKg(value: number) { return `${Math.round(value).toLocaleString("en-GB")} kg`; }
function chartPath(values: number[], width = 560, height = 170) {
  if (!values.length) return "";
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  return values.map((value, index) => `${index === 0 ? "M" : "L"} ${(index / Math.max(values.length - 1, 1)) * width} ${height - ((value - min) / range) * (height - 18)}`).join(" ");
}

export function ClientProgressLauncher({ clientId }: { clientId: string }) {
  const [open, setOpen] = useState(false);
  return <>{open && <ClientProgress clientId={clientId} onClose={() => setOpen(false)} />}<button className="client-progress-floating" onClick={() => setOpen(true)}>Client progress</button></>;
}

function ClientProgress({ clientId, onClose }: { clientId: string; onClose: () => void }) {
  const [data, setData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    fetch(`/api/designer/progress?clientId=${encodeURIComponent(clientId)}`, { credentials: "same-origin", cache: "no-store" }).then((response) => response.ok ? response.json() as Promise<ProgressData> : Promise.reject(new Error("Progress data unavailable"))).then(setData).catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Progress data unavailable")).finally(() => setLoading(false));
  }, [clientId]);
  const volumeValues = data?.trend.map((item) => item.volumeLoadKg) ?? [];
  return <div className="modal-backdrop"><section className="progress-modal" role="dialog" aria-modal="true" aria-labelledby="client-progress-heading"><header><div><p className="eyebrow">CLIENT PROGRESS</p><h2 id="client-progress-heading">Progress, load and performance</h2><p>Use this view to identify trends across logged sessions. Metrics support PT review; they do not measure programme quality on their own.</p></div><button className="close-button" onClick={onClose}>×</button></header>{loading ? <div className="prompt-builder-loading">Loading progress data…</div> : error ? <p className="form-error" role="alert">{error}</p> : data ? <div className="progress-content"><div className="progress-metric-grid"><div><span>Adherence</span><strong>{data.summary.adherence === null ? "—" : `${data.summary.adherence}%`}</strong><small>{data.summary.completedSessions} completed of {data.summary.totalSessions} logged</small></div><div><span>Volume load</span><strong>{formatKg(data.summary.totalVolumeLoadKg)}</strong><small>Sum of reps × load</small></div><div><span>Repetition load</span><strong>{data.summary.totalRepetitionLoad.toLocaleString("en-GB")}</strong><small>Total logged repetitions</small></div><div><span>Average session RPE</span><strong>{data.summary.averageSessionRpe ?? "—"}</strong><small>Subjective whole-session effort</small></div></div><section className="progress-chart-card"><div className="progress-section-heading"><div><p className="eyebrow">LOAD TREND</p><h3>Volume load by session</h3></div><small>Only logged set data contributes</small></div>{volumeValues.length ? <svg className="progress-chart" viewBox="0 0 560 190" role="img" aria-label="Volume load trend"><path d={chartPath(volumeValues)} fill="none" stroke="var(--designer-teal)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" /><line x1="0" y1="170" x2="560" y2="170" stroke="var(--designer-line)" />{volumeValues.map((value, index) => <circle key={`${value}-${index}`} cx={(index / Math.max(volumeValues.length - 1, 1)) * 560} cy={170 - (value / Math.max(...volumeValues, 1)) * 152} r="5" fill="var(--designer-teal)" />)}</svg> : <p className="progress-empty">Log a workout with actual reps and loads to see a trend.</p>}</section><div className="progress-two-column"><section className="progress-table-card"><div className="progress-section-heading"><div><p className="eyebrow">EXERCISE DETAIL</p><h3>Exercise trends</h3></div></div>{data.exercises.length ? <div className="progress-table-wrap"><table><thead><tr><th>Exercise</th><th>Sessions</th><th>Reps</th><th>Volume</th><th>Best load</th></tr></thead><tbody>{data.exercises.map((exercise) => <tr key={exercise.exerciseName}><th>{exercise.exerciseName}<small>{exercise.pattern}</small></th><td>{exercise.sessions}</td><td>{exercise.totalReps}</td><td>{formatKg(exercise.volumeLoadKg)}</td><td>{exercise.bestLoadKg ? formatKg(exercise.bestLoadKg) : "—"}</td></tr>)}</tbody></table></div> : <p className="progress-empty">No exercise results recorded yet.</p>}</section><section className="progress-table-card"><div className="progress-section-heading"><div><p className="eyebrow">SESSION LOG</p><h3>Recent results</h3></div></div>{data.results.length ? <div className="progress-table-wrap"><table><thead><tr><th>Date</th><th>Session</th><th>Status</th><th>RPE</th><th>Volume</th></tr></thead><tbody>{data.results.slice(0, 8).map((result) => <tr key={result.id}><td>{new Date(`${result.scheduledDate}T12:00:00`).toLocaleDateString("en-GB")}</td><td>{result.sessionName ?? "Workout"}</td><td>{result.status}</td><td>{result.sessionRpe ?? "—"}</td><td>{formatKg(result.volumeLoadKg)}</td></tr>)}</tbody></table></div> : <p className="progress-empty">No workout results recorded yet.</p>}</section></div><p className="progress-footnote">Volume load is calculated as actual repetitions × actual load in kilograms. Repetition load is the total actual repetitions. RPE/RIR averages are rounded and should be interpreted alongside technique, pain, recovery and context.</p></div> : null}<footer><button className="primary-button" onClick={onClose}>Close progress</button></footer></section></div>;
}
