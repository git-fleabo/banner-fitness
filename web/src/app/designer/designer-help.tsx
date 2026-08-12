"use client";

import { useMemo, useState } from "react";

const topics = [
  { group: "Start", title: "Adding a new client", body: <>Choose <strong>New client</strong> from the dashboard. Capture the client&apos;s goal, intended training frequency, preferred weekdays, session length, training location and confirmed equipment. Complete the initial screening flags you already have, then save the profile. You can add more detail later.</> },
  { group: "Start", title: "Dashboard and client command centre", body: <>Use the dashboard filters to focus on clients needing attention, without recent activity, with draft programmes or without a programme. Select a client row to open the workspace. The roster is a management view; the client workspace is where decisions and records are made.</> },
  { group: "Client records", title: "Recording assessment and safety context", body: <>Open the client workspace and use <strong>Review screening</strong> or <strong>Edit assessment</strong> to record injuries, pain, limitations, restrictions, clearance context and your PT review notes. The system highlights contradictions and unresolved information; it does not diagnose or replace referral or clearance processes.</> },
  { group: "Client records", title: "Recording performance and progress", body: <>PT Tools includes performance baselines such as tested or estimated 1RM, rep max observations, client preferences, progress trends, progression review and exercise substitutions. Keep observations dated and add context such as technique quality, confidence or pain reports.</> },
  { group: "Programmes", title: "Creating or editing a programme", body: <>Open a client, choose <strong>Edit all sessions</strong>, then add the sessions and exercises you intend to prescribe. Record sets, repetitions, effort, rest and progression rules where known. Save a draft to create a version and run the contextual quality checks.</> },
  { group: "Programmes", title: "Reviewing programme quality", body: <>The quality review considers the programme alongside the client&apos;s screening, goals, experience, schedule, equipment, activity and logged information. Resolve blocking or significant findings first. Advisories can be acknowledged with a reason where a qualified PT has considered them.</> },
  { group: "Programmes", title: "Managing programme versions", body: <>Use the lifecycle controls in the client workspace to review, assign, activate, pause or complete a programme. Use <strong>Generate new version</strong> when you want a new editable snapshot; existing versions remain in the audit trail.</> },
  { group: "AI tools", title: "Using the PT review prompt", body: <>Open <strong>PT review prompt</strong> from the client workspace to create a current, privacy-conscious bundle for an AI tool. If no programme exists, the prompt asks the AI to help generate one. Review the output and apply changes through the programme editor; nothing is sent automatically.</> },
  { group: "AI tools", title: "Importing an AI programme draft", body: <>Use <strong>Import AI draft</strong> when an AI tool has returned a complete Banner Fitness JSON draft. Validate the response, review the proposed sessions and exercises, then approve only to open it in the normal programme editor. Approval does not save it; the PT remains responsible for screening, exercise selection, progression and final approval.</> },
  { group: "Safety", title: "Professional responsibility", body: <>Banner Fitness is decision support for a qualified PT. It does not diagnose conditions, prescribe medical treatment or bypass PAR-Q, referral or professional-clearance processes. The PT remains responsible for screening, programme decisions, monitoring and approval.</> },
] as const;

export function DesignerHelp({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return normalized ? topics.filter((topic) => `${topic.group} ${topic.title}`.toLowerCase().includes(normalized)) : topics;
  }, [query]);
  const groups = [...new Set(filtered.map((topic) => topic.group))];

  return <div className="modal-backdrop"><section className="designer-help-modal" role="dialog" aria-modal="true" aria-labelledby="designer-help-heading">
    <header>
      <div><p className="eyebrow">BANNER FITNESS HELP</p><h2 id="designer-help-heading">How to use the PT workspace</h2><p>Use the workspace to capture client context, build programmes and make your professional review visible and auditable.</p></div>
      <button className="close-button" onClick={onClose} aria-label="Close help">×</button>
    </header>
    <label className="help-search">SEARCH HELP<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search clients, programmes, AI or safety…" /></label>
    <div className="designer-help-sections">
      {groups.length ? groups.map((group) => <section className="help-topic-group" key={group}><p className="eyebrow">{group}</p>{filtered.filter((topic) => topic.group === group).map((topic, index) => <details open={index === 0 && !query} key={topic.title}><summary>{topic.title}</summary><p>{topic.body}</p></details>)}</section>) : <p className="dashboard-empty">No help topics match “{query}”. Try a broader term.</p>}
    </div>
    <footer><button className="primary-button" onClick={onClose}>Close help</button></footer>
  </section></div>;
}
