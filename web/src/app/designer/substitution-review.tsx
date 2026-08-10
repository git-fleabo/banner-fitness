"use client";

import { useEffect, useState } from "react";

type Exercise = { id: string; name: string; pattern: string; target: string[]; equipment: string[]; difficulty: string; complexity: string };

export function SubstitutionReviewLauncher({ clientId, exercises }: { clientId: string; exercises: Array<{ name: string; exerciseId?: string; pattern: string; target: string; equipment: string }> }) {
  const [open, setOpen] = useState(false);
  return <>{open && <SubstitutionReview clientId={clientId} exercises={exercises} onClose={() => setOpen(false)} />}<button className="substitution-review-floating" onClick={() => setOpen(true)}>Find substitutions</button></>;
}

function SubstitutionReview({ clientId, exercises, onClose }: { clientId: string; exercises: Array<{ name: string; exerciseId?: string; pattern: string; target: string; equipment: string }>; onClose: () => void }) {
  const [selected, setSelected] = useState(() => exercises.find((exercise) => exercise.exerciseId)?.exerciseId ?? "");
  const [candidates, setCandidates] = useState<Exercise[]>([]);
  const [source, setSource] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const sourceExercise = exercises.find((exercise) => exercise.exerciseId === selected) ?? exercises[0];
  useEffect(() => { if (!selected) return; fetch(`/api/designer/substitutions?clientId=${encodeURIComponent(clientId)}&exerciseId=${encodeURIComponent(selected)}`, { credentials: "same-origin", cache: "no-store" }).then((response) => response.ok ? response.json() as Promise<{ source: Exercise; candidates: Exercise[] }> : Promise.reject(new Error("Substitutions unavailable"))).then((data) => { setSource(data.source); setCandidates(data.candidates); }).catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Substitutions unavailable")).finally(() => setLoading(false)); }, [clientId, selected]);
  return <div className="modal-backdrop"><section className="substitution-review-modal" role="dialog" aria-modal="true" aria-labelledby="substitution-review-heading"><header><div><p className="eyebrow">EXERCISE SUBSTITUTION</p><h2 id="substitution-review-heading">Preserve the training objective</h2><p>Suggestions are ranked by movement pattern, target musculature and the client’s recorded location equipment. Choose and apply the final change in the session editor.</p></div><button className="close-button" onClick={onClose}>×</button></header>{exercises.length ? <label className="substitution-select">EXERCISE TO REPLACE<select value={selected || sourceExercise?.exerciseId || ""} onChange={(event) => { setLoading(true); setError(""); setSelected(event.target.value); }}>{exercises.filter((exercise) => exercise.exerciseId).map((exercise) => <option key={exercise.exerciseId} value={exercise.exerciseId}>{exercise.name} · {exercise.pattern}</option>)}</select></label> : <p className="library-empty">No prescriptions are available for substitution.</p>}{loading ? <div className="prompt-builder-loading">Finding objective-preserving alternatives…</div> : error ? <p className="form-error" role="alert">{error}</p> : source && <><div className="substitution-source"><strong>{source.name}</strong><span>{source.pattern} · {source.target.join(" · ")} · {source.equipment.join(", ")}</span></div><div className="substitution-list">{candidates.map((candidate) => <article key={candidate.id}><div><strong>{candidate.name}</strong><small>{candidate.pattern} · {candidate.target.join(" · ")}</small></div><span>{candidate.equipment.join(", ")}</span><button className="text-button" onClick={() => navigator.clipboard?.writeText(`${candidate.name} — ${candidate.pattern}; ${candidate.target.join(", ")}`)}>Copy option</button></article>)}{!candidates.length && <p className="library-empty">No close alternative matched the recorded equipment. Review the location or use the full library.</p>}</div></>}<footer><button className="primary-button" onClick={onClose}>Close</button></footer></section></div>;
}
