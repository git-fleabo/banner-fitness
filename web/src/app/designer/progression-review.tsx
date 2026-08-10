"use client";

import { useEffect, useState } from "react";

type Decision = { prescriptionId: string; exerciseName: string; pattern: string; prescription: string; intensityValue: string; progressionRule: string | null; lastDate: string | null; decision: { action: "progress" | "hold" | "regress"; reason: string; nextLoadKg?: number } | null };

export function ProgressionReviewLauncher({ clientId }: { clientId: string }) {
  const [open, setOpen] = useState(false);
  return <>{open && <ProgressionReview clientId={clientId} onClose={() => setOpen(false)} />}<button className="progression-review-floating" onClick={() => setOpen(true)}>Review progression</button></>;
}

function ProgressionReview({ clientId, onClose }: { clientId: string; onClose: () => void }) {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => { fetch(`/api/designer/progression?clientId=${encodeURIComponent(clientId)}`, { credentials: "same-origin", cache: "no-store" }).then((response) => response.ok ? response.json() as Promise<{ decisions: Decision[] }> : Promise.reject(new Error("Progression review unavailable"))).then((data) => setDecisions(data.decisions)).catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Progression review unavailable")).finally(() => setLoading(false)); }, [clientId]);
  return <div className="modal-backdrop"><section className="progression-review-modal" role="dialog" aria-modal="true" aria-labelledby="progression-review-heading"><header><div><p className="eyebrow">PROGRAMME ADAPTATION</p><h2 id="progression-review-heading">Progression review</h2><p>Rule-based suggestions from the latest logged set data. PT approval is always required; pain, technique and recovery gates take priority over load increases.</p></div><button className="close-button" onClick={onClose}>×</button></header>{loading ? <div className="prompt-builder-loading">Reviewing logged performance…</div> : error ? <p className="form-error" role="alert">{error}</p> : decisions.length === 0 ? <p className="library-empty">No saved programme prescriptions yet.</p> : <div className="progression-review-list">{decisions.map((item) => <article key={item.prescriptionId}><div><strong>{item.exerciseName}</strong><small>{item.pattern} · {item.prescription} · {item.intensityValue}</small></div><span className={`progression-action ${item.decision?.action ?? "pending"}`}>{item.decision?.action ?? "pending"}</span><p>{item.decision ? item.decision.reason : "No logged set result yet. Record a result before changing the next exposure."}{item.decision?.nextLoadKg !== undefined ? ` Suggested next load: ${item.decision.nextLoadKg} kg.` : ""}</p><small>{item.lastDate ? `Latest result ${item.lastDate}` : "No result recorded"}</small></article>)}</div>}<footer><button className="primary-button" onClick={onClose}>Close review</button></footer></section></div>;
}
