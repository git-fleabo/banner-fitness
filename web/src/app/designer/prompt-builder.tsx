"use client";

import { useEffect, useState } from "react";

import { programmePromptFilename } from "@/lib/pt-prompt";

type PromptBundleResponse = { markdown: string; json: Record<string, unknown>; meta: { redacted: boolean; programmeVersion: number | null; programmeCount: number; workoutResultCount: number; performanceRecordCount: number } };

export function PromptBuilderLauncher({clientId,notify}:{clientId:string;notify:(message:string)=>void}) {
  const [open,setOpen] = useState(false);
  return <>{open && <PromptBuilder clientId={clientId} onClose={() => setOpen(false)} notify={notify} />}<button className="prompt-builder-floating" onClick={() => setOpen(true)}>PT review prompt</button></>;
}

function PromptBuilder({clientId,onClose,notify}:{clientId:string;onClose:()=>void;notify:(message:string)=>void}) {
  const [includeIdentifiers,setIncludeIdentifiers] = useState(false);
  const [bundle,setBundle] = useState<PromptBundleResponse | null>(null);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/designer/prompt-bundle?clientId=${encodeURIComponent(clientId)}&redact=${includeIdentifiers ? "false" : "true"}`, { credentials: "same-origin", cache: "no-store" })
      .then((response) => response.ok ? response.json() as Promise<PromptBundleResponse> : response.json().then((body: { error?: string }) => Promise.reject(new Error(body.error || "Prompt bundle unavailable"))))
      .then((data) => { if (!cancelled) setBundle(data); })
      .catch((loadError) => { if (!cancelled) setError(loadError instanceof Error ? loadError.message : "Prompt bundle unavailable"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [clientId,includeIdentifiers]);

  async function copyPrompt() {
    if (!bundle) return;
    try { await navigator.clipboard.writeText(bundle.markdown); notify("PT review prompt copied to clipboard"); }
    catch { notify("Copy was blocked; select the prompt text manually"); }
  }

  function download(filename:string, contents:string, type:string) {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([contents], { type }));
    link.download = filename; link.click(); URL.revokeObjectURL(link.href);
  }

  async function downloadSkill() {
    try {
      const response = await fetch("/banner-fitness-pt-prompt-skill.md", { cache: "no-store" });
      if (!response.ok) throw new Error("Skill unavailable");
      download("banner-fitness-pt-prompt.md", await response.text(), "text/markdown");
      notify("Banner Fitness AI skill downloaded");
    } catch {
      notify("Banner Fitness AI skill is temporarily unavailable");
    }
  }

  return <div className="modal-backdrop"><section className="prompt-builder-modal" role="dialog" aria-modal="true" aria-labelledby="prompt-builder-heading"><header><div><p className="eyebrow">AI-ASSISTED PT PROMPT</p><h2 id="prompt-builder-heading">Build PT review prompt</h2><p>Packages the current client record into a review or programme-generation prompt for ChatGPT or another AI tool. Nothing is sent automatically.</p></div><button className="close-button" onClick={onClose}>×</button></header><div className="prompt-builder-options"><label><input type="checkbox" checked={includeIdentifiers} onChange={(event) => setIncludeIdentifiers(event.target.checked)} /> Include client name and date of birth</label><span>{bundle ? `${bundle.meta.workoutResultCount} workout results · ${bundle.meta.performanceRecordCount} performance baselines · ${bundle.meta.programmeVersion ? `programme v${bundle.meta.programmeVersion}` : "no programme"}` : "Preparing bundle…"}</span></div>{loading ? <div className="prompt-builder-loading">Preparing the client, screening, goals, performance, programme and history bundle…</div> : error ? <p className="form-error" role="alert">{error}</p> : <textarea className="prompt-builder-preview" value={bundle?.markdown ?? ""} readOnly aria-label="PT review prompt preview" />}{bundle && <footer><button className="secondary-button" onClick={downloadSkill}>Download AI skill</button><button className="secondary-button" onClick={() => download(`${programmePromptFilename}.json`, JSON.stringify(bundle.json,null,2), "application/json")}>Download JSON</button><button className="secondary-button" onClick={() => download(`${programmePromptFilename}.md`, bundle.markdown, "text/markdown")}>Download Markdown</button><button className="primary-button" onClick={copyPrompt}>Copy prompt →</button></footer>}<small className="prompt-builder-footnote">Privacy: identifiers are excluded by default. Review and remove any sensitive information before pasting into a third-party AI tool.</small></section></div>;
}
