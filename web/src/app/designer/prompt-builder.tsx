"use client";

import { useEffect, useState } from "react";

import { Dialog } from "@/components/dialog";
import { ErrorAlert, LoadingState } from "@/components/a11y";
import { programmePromptFilename } from "@/lib/pt-prompt";

type PromptBundleResponse = { markdown: string; json: Record<string, unknown>; meta: { workoutResultCount: number; performanceRecordCount: number; programmeVersion: number | null } };

export function PromptBuilderLauncher({ clientId, notify }: { clientId: string; notify: (message: string) => void }) {
  const [open, setOpen] = useState(false);
  return <>{open && <PromptBuilder clientId={clientId} onClose={() => setOpen(false)} notify={notify} />}<button className="prompt-builder-floating" onClick={() => setOpen(true)}>PT review prompt</button></>;
}

function PromptBuilder({ clientId, onClose, notify }: { clientId: string; onClose: () => void; notify: (message: string) => void }) {
  const [bundle, setBundle] = useState<PromptBundleResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [includeIdentifiers, setIncludeIdentifiers] = useState(false);

  useEffect(() => {
    fetch(`/api/designer/prompt-bundle?clientId=${encodeURIComponent(clientId)}&redact=${includeIdentifiers ? "false" : "true"}`, { credentials: "same-origin", cache: "no-store" })
      .then((response) => response.ok ? response.json() as Promise<PromptBundleResponse> : response.json().then((body: { error?: string }) => Promise.reject(new Error(body.error || "Prompt bundle unavailable"))))
      .then((data) => { setBundle(data); setError(""); })
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Prompt bundle unavailable"))
      .finally(() => setLoading(false));
  }, [clientId, includeIdentifiers]);

  async function copyPrompt() {
    if (!bundle) return;
    try { await navigator.clipboard.writeText(bundle.markdown); notify("PT review prompt copied; paste it into your AI tool, then paste the complete JSON response into Import AI draft"); }
    catch { notify("Copy was blocked; select the prompt text manually"); }
  }

  async function downloadGuidance() {
    try {
      const response = await fetch("/banner-fitness-pt-prompt-skill.md", { cache: "no-store" });
      if (!response.ok) throw new Error("Guidance unavailable");
      const blob = new Blob([await response.text()], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a"); link.href = url; link.download = "banner-fitness-ai-guidance.md"; link.click(); URL.revokeObjectURL(url);
    } catch { notify("AI guidance could not be downloaded"); }
  }

  return <Dialog className="prompt-builder-modal" titleId="prompt-builder-heading" onClose={onClose} closeLabel="Close PT review prompt"><header><div><p className="eyebrow">AI-ASSISTED PT PROMPT</p><h2 id="prompt-builder-heading">Build PT review prompt</h2><p>Copy this current, privacy-conscious client bundle into your AI tool. Nothing is sent automatically.</p></div></header><div className="prompt-builder-options"><label><input type="checkbox" checked={includeIdentifiers} onChange={(event) => { setLoading(true); setIncludeIdentifiers(event.target.checked); }} /> Include client name and date of birth</label><span>{bundle ? `${bundle.meta.workoutResultCount} workout results · ${bundle.meta.performanceRecordCount} performance baselines · ${bundle.meta.programmeVersion ? `programme v${bundle.meta.programmeVersion}` : "no programme"}` : "Preparing bundle…"}</span></div>{loading ? <LoadingState>Preparing client context, screening, goals, performance, programme and history…</LoadingState> : error ? <ErrorAlert>{error}</ErrorAlert> : <><p className="ai-handoff-copy"><strong>Next:</strong> Copy prompt → run it in your AI tool → copy the complete JSON response → open <strong>Import AI draft</strong> in PT Tools.</p><textarea className="prompt-builder-preview" value={bundle?.markdown ?? ""} readOnly aria-label="PT review prompt preview" /></>}{bundle && <footer><button className="secondary-button" onClick={downloadGuidance}>Download AI guidance</button><button className="secondary-button" onClick={() => download(`${programmePromptFilename}.json`, JSON.stringify(bundle.json, null, 2), "application/json")}>Download JSON</button><button className="secondary-button" onClick={() => download(`${programmePromptFilename}.md`, bundle.markdown, "text/markdown")}>Download Markdown</button><button className="primary-button" onClick={copyPrompt}>Copy prompt →</button></footer>}<small className="prompt-builder-footnote">Privacy: identifiers are excluded by default. Review and remove sensitive information before pasting into a third-party AI tool.</small></Dialog>;
}

function download(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a"); link.href = url; link.download = filename; link.click(); URL.revokeObjectURL(url);
}
