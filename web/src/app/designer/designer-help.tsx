"use client";

export function DesignerHelp({ onClose }: { onClose: () => void }) {
  return <div className="modal-backdrop"><section className="designer-help-modal" role="dialog" aria-modal="true" aria-labelledby="designer-help-heading">
    <header>
      <div><p className="eyebrow">BANNER FITNESS HELP</p><h2 id="designer-help-heading">How to use the PT workspace</h2><p>Use the workspace to capture client context, build programmes and make your professional review visible and auditable.</p></div>
      <button className="close-button" onClick={onClose} aria-label="Close help">×</button>
    </header>
    <div className="designer-help-sections">
      <details open><summary>Adding a new client</summary><p>Choose <strong>New client</strong> from the dashboard. Capture the client’s goal, intended training frequency, preferred weekdays, session length, training location and confirmed equipment. Complete the initial screening flags you already have, then save the profile. You can add more detail later.</p></details>
      <details><summary>Recording assessment and safety context</summary><p>Open the client workspace and use <strong>Review screening</strong> or <strong>Edit assessment</strong> to record injuries, pain, limitations, restrictions, clearance context and your PT review notes. The system highlights contradictions and unresolved information; it does not diagnose or replace referral or clearance processes.</p></details>
      <details><summary>Creating or editing a programme</summary><p>Open a client, choose <strong>Edit all sessions</strong>, then add the sessions and exercises you intend to prescribe. Record sets, repetitions, effort, rest and progression rules where known. Save a draft to create a version and run the contextual quality checks.</p></details>
      <details><summary>Reviewing programme quality</summary><p>The quality review considers the programme alongside the client’s screening, goals, experience, schedule, equipment, activity and logged information. Resolve blocking or significant findings first. Advisories can be acknowledged with a reason where a qualified PT has considered them.</p></details>
      <details><summary>Managing programme versions</summary><p>Use the lifecycle controls in the client workspace to review, assign, activate, pause or complete a programme. Use <strong>Generate new version</strong> when you want a new editable snapshot; existing versions remain in the audit trail.</p></details>
      <details><summary>Recording performance and progress</summary><p>PT Tools includes performance baselines such as tested or estimated 1RM, rep max observations, client preferences, progress trends, progression review and exercise substitutions. Keep observations dated and add context such as technique quality, confidence or pain reports.</p></details>
      <details><summary>Using the PT review prompt</summary><p>Open <strong>PT review prompt</strong> from the client workspace to create a current, privacy-conscious bundle for an AI tool. If no programme exists, the prompt asks the AI to help generate one. Review the output and apply changes through the programme editor; nothing is sent automatically.</p></details>
      <details><summary>Dashboard and client command centre</summary><p>Use the dashboard filters to focus on clients needing attention, without recent activity, with draft programmes or without a programme. Select a client row to open the workspace. The roster is a management view; the client workspace is where decisions and records are made.</p></details>
      <details><summary>Professional responsibility</summary><p>Banner Fitness is decision support for a qualified PT. It does not diagnose conditions, prescribe medical treatment or bypass PAR-Q, referral or professional-clearance processes. The PT remains responsible for screening, programme decisions, monitoring and approval.</p></details>
    </div>
    <footer><button className="primary-button" onClick={onClose}>Close help</button></footer>
  </section></div>;
}
