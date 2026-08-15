"use client";

import { useEffect, useState } from "react";

import { Dialog } from "@/components/dialog";
import { ErrorAlert, LoadingState } from "@/components/a11y";

export type Decision = { prescriptionId: string; exerciseName: string; pattern: string; prescription: string; intensityValue: string; progressionRule: string | null; weekNumber: number; dayOfWeek: number; sessionName: string; lastDate: string | null; decision: { action: "progress" | "hold" | "regress" | "no-data"; reason: string; nextLoadKg?: number } | null };
type DecisionGroup = { weekNumber: number; sessionName: string; dayOfWeek: number; decisions: Decision[] };

export function groupProgressionDecisions(decisions: Decision[]): DecisionGroup[] {
  const groups = new Map<string, DecisionGroup>();
  for (const decision of decisions) {
    const key = `${decision.weekNumber}:${decision.dayOfWeek}:${decision.sessionName}`;
    const group = groups.get(key) ?? { weekNumber: decision.weekNumber, sessionName: decision.sessionName, dayOfWeek: decision.dayOfWeek, decisions: [] };
    group.decisions.push(decision);
    groups.set(key, group);
  }
  return [...groups.values()];
}

export function ProgressionReviewLauncher({ clientId }: { clientId: string }) {
  const [open, setOpen] = useState(false);
  return <>{open && <ProgressionReview clientId={clientId} onClose={() => setOpen(false)} />}<button className="progression-review-floating" onClick={() => setOpen(true)}>Review progression</button></>;
}

function ProgressionReview({ clientId, onClose }: { clientId: string; onClose: () => void }) {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentWeek, setCurrentWeek] = useState(1);
  useEffect(() => { fetch(`/api/designer/progression?clientId=${encodeURIComponent(clientId)}`, { credentials: "same-origin", cache: "no-store" }).then((response) => response.ok ? response.json() as Promise<{ programme: { currentWeek: number } | null; decisions: Decision[] }> : Promise.reject(new Error("Progression review unavailable"))).then((data) => { setDecisions(data.decisions); setCurrentWeek(data.programme?.currentWeek ?? 1); }).catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Progression review unavailable")).finally(() => setLoading(false)); }, [clientId]);
  const groups = groupProgressionDecisions(decisions);
  return <Dialog className="progression-review-modal" titleId="progression-review-heading" onClose={onClose} closeLabel="Close progression review"><header><div><p className="eyebrow">PROGRAMME ADAPTATION</p><h2 id="progression-review-heading">Progression review</h2><p>Review each prescription in its planned week and session. Week {currentWeek} is the current programme week; later weeks remain planned history.</p></div></header>{loading ? <LoadingState>Reviewing logged performance…</LoadingState> : error ? <ErrorAlert>{error}</ErrorAlert> : decisions.length === 0 ? <p className="library-empty">No saved programme prescriptions yet.</p> : <div className="progression-review-groups">{groups.map((group) => <section className={`progression-review-group${group.weekNumber === currentWeek ? " current" : ""}`} key={`${group.weekNumber}-${group.dayOfWeek}-${group.sessionName}`}><div className="progression-group-heading"><div><p className="eyebrow">WEEK {group.weekNumber} · DAY {group.dayOfWeek}</p><h3>{group.sessionName}</h3></div>{group.weekNumber === currentWeek ? <span className="progression-current-badge">DUE NOW</span> : <span className="progression-planned-badge">PLANNED</span>}</div><div className="progression-review-list">{group.decisions.map((item) => <article key={item.prescriptionId}><div><strong>{item.exerciseName}</strong><small>{item.pattern} · {item.prescription} · {item.intensityValue}</small></div><span className={`progression-action ${item.decision?.action ?? "pending"}`}>{item.decision?.action ?? (group.weekNumber === currentWeek ? "due" : "planned")}</span><p>{item.decision ? item.decision.reason : group.weekNumber === currentWeek ? "No logged set result yet. This is the next planned exposure to review." : "No result recorded for this planned exposure yet."}{item.decision?.nextLoadKg !== undefined ? ` Suggested next load: ${item.decision.nextLoadKg} kg.` : ""}</p><small>{item.lastDate ? `Latest result ${item.lastDate}` : "No result recorded"}</small></article>)}</div></section>)}</div>}<footer><button className="primary-button" onClick={onClose}>Close review</button></footer></Dialog>;
}
