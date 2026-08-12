"use client";

import { useState } from "react";

import { buildImportDiff, parseAiProgrammeImport, toEditorSessions, type AiProgrammeImportApproval } from "@/lib/pt-ai-import";

type ExistingSession = { dayOfWeek: number; name: string; exercises: Array<{ name: string }> };

function errorMessage(error: unknown) {
  if (!error || typeof error !== "object" || !("issues" in error)) return error instanceof Error ? error.message : "The AI response could not be validated.";
  const issues = (error as { issues: Array<{ path: (string | number)[]; message: string }> }).issues;
  return issues.slice(0, 5).map((issue) => `${issue.path.length ? `${issue.path.join(".")}: ` : ""}${issue.message}`).join("\n");
}

function dayLabel(day: number) {
  return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][day % 7] ?? `Day ${day}`;
}

export function AiProgrammeImportLauncher({ clientName, existingSessions, notify, onApproved }: { clientName: string; existingSessions?: ExistingSession[]; notify: (message: string) => void; onApproved: (approval: AiProgrammeImportApproval) => void }) {
  const [open, setOpen] = useState(false);
  return <>{open && <AiProgrammeImportModal clientName={clientName} existingSessions={existingSessions} notify={notify} onClose={() => setOpen(false)} onApproved={(approval) => { setOpen(false); onApproved(approval); }} />}<button type="button" className="pt-tool-button ai-import-button" onClick={() => setOpen(true)}>Import AI draft</button></>;
}

function AiProgrammeImportModal({ clientName, existingSessions, notify, onClose, onApproved }: { clientName: string; existingSessions?: ExistingSession[]; notify: (message: string) => void; onClose: () => void; onApproved: (approval: AiProgrammeImportApproval) => void }) {
  const [response, setResponse] = useState("");
  const [parsed, setParsed] = useState<ReturnType<typeof parseAiProgrammeImport> | null>(null);
  const [error, setError] = useState("");
  const [validated, setValidated] = useState(false);

  function validate() {
    setError("");
    setParsed(null);
    setValidated(false);
    try { setParsed(parseAiProgrammeImport(response)); setValidated(true); }
    catch (parseError) { setError(errorMessage(parseError)); }
  }

  function approve() {
    if (!parsed) return;
    const sessions = toEditorSessions(parsed);
    onApproved({ sessions, goalSummary: parsed.programme.goalSummary, sessionDurationMinutes: parsed.programme.sessionDurationMinutes, methodology: parsed.programme.methodology, rationale: parsed.programme.rationale, weekPlans: parsed.programme.weekPlans?.map((plan) => ({ focus: plan.focus, volumeTarget: plan.volumeTarget || "Not specified", intensityTarget: plan.intensityTarget || "Not specified" })), audit: { source: "ai_import", schemaVersion: parsed.schemaVersion, ...parsed.source } });
    notify("AI draft approved for PT review in the programme editor");
  }

  const importedSessions = parsed ? toEditorSessions(parsed) : [];
  const diff = parsed ? buildImportDiff(existingSessions, importedSessions) : null;
  return <div className="modal-backdrop"><section className="ai-import-modal" role="dialog" aria-modal="true" aria-labelledby="ai-import-heading"><header><div><p className="eyebrow">CONTROLLED AI IMPORT</p><h2 id="ai-import-heading">Review an AI programme draft</h2><p>Paste the structured JSON response from the PT review prompt for {clientName}. Nothing is saved while you validate or review this preview.</p></div><button className="close-button" onClick={onClose} aria-label="Close AI import">×</button></header><label className="ai-import-input-label">PASTE STRUCTURED JSON RESPONSE<textarea value={response} onChange={(event) => { setResponse(event.target.value); setValidated(false); setError(""); }} placeholder={'```json\n{\n  "format": "banner-fitness-programme-draft",\n  "schemaVersion": "1",\n  "programme": { ... }\n}\n```'} /></label>{error && <p className="form-error ai-import-error" role="alert">{error}</p>}{!validated && <div className="ai-import-actions"><button className="secondary-button" onClick={onClose}>Cancel</button><button className="primary-button" onClick={validate} disabled={!response.trim()}>Validate response →</button></div>}{validated && parsed && diff && <><div className="ai-import-validation"><strong>Validated Banner Fitness draft</strong><span>Schema v{parsed.schemaVersion} · {parsed.source?.tool || "AI tool not recorded"}</span></div><div className="ai-import-diff"><div className="ai-import-diff-summary"><strong>{diff.isNewProgramme ? "New programme draft" : "Proposed next programme version"}</strong><span>{diff.importedSessionCount} sessions · {diff.importedExerciseCount} exercises · {diff.changedSessionCount} changed sessions</span></div><p>{diff.isNewProgramme ? "No programme exists yet. This complete draft will open in the editor for PT review." : `${diff.existingSessionCount} current sessions and ${diff.existingExerciseCount} current exercises are being compared with the proposed draft.`}</p>{diff.sessionSummaries.map((session) => <article key={session.dayOfWeek}><div><strong>{dayLabel(session.dayOfWeek)}</strong><span>{session.name}</span></div><small>{session.exerciseCount} exercises{session.changed ? " · proposed change" : " · unchanged structure"}</small></article>)}</div><div className="ai-import-notice"><strong>PT approval gate</strong><p>Approve this import only to open it in the normal programme editor. You will still review prescriptions and the week preview before the app creates a new version. Rejecting or closing this window saves nothing.</p></div><div className="ai-import-actions"><button className="secondary-button" onClick={() => { setParsed(null); setValidated(false); }}>Back to response</button><button className="secondary-button" onClick={onClose}>Reject</button><button className="primary-button" onClick={approve}>Approve &amp; open editor →</button></div></>}</section></div>;
}
