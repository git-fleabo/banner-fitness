"use client";

import { useEffect, useState } from "react";

import { getDesignerSettingsAction, updateDesignerSettingsAction } from "./actions";
import { defaultQualitySettings, type QualitySettings } from "@/lib/pt-quality";

const checks: Array<[keyof QualitySettings, string, string]> = [
  ["checkScreening", "Screening and clearance", "Keep screening flags visible before assignment."],
  ["checkFrequency", "Weekly frequency", "Compare saved sessions with the client's weekly target."],
  ["checkBalance", "Push / pull balance", "Flag a large difference in pressing and pulling exercise counts."],
  ["checkVolume", "Per-session volume", "Flag sessions above the configured set threshold."],
  ["checkProgression", "Progression documentation", "Flag exercises without a recorded progression rule."],
  ["checkDuration", "Session duration", "Flag prescriptions that may exceed the saved session length."],
];

export function DesignerSettings({ onClose, onSaved }: { onClose: () => void; onSaved: (settings: QualitySettings) => void }) {
  const [settings, setSettings] = useState<QualitySettings>(defaultQualitySettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getDesignerSettingsAction().then(setSettings).catch(() => setError("Settings could not be loaded; defaults are shown." )).finally(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true); setError("");
    try {
      const saved = await updateDesignerSettingsAction(settings);
      setSettings(saved); onSaved(saved); onClose();
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : "Settings could not be saved"); }
    finally { setSaving(false); }
  }

  return <div className="modal-backdrop"><section className="settings-modal" role="dialog" aria-modal="true" aria-labelledby="settings-heading"><header><div><p className="eyebrow">WORKSPACE SETTINGS</p><h2 id="settings-heading">Quality checks</h2><p>These are advisory rules applied to every saved client programme, including ordinary new clients. They support PT review; they do not diagnose or automatically approve a plan.</p></div><button className="close-button" onClick={onClose}>×</button></header><div className="settings-content"><div className="settings-section"><div className="settings-section-heading"><div><p className="eyebrow">PROGRAMME REVIEW</p><h3>Choose the signals you want to see</h3></div><span>{loading ? "Loading…" : "Applies globally"}</span></div>{checks.map(([key, label, description]) => <label className="settings-toggle" key={key}><span><strong>{label}</strong><small>{description}</small></span><input type="checkbox" checked={Boolean(settings[key])} onChange={(event) => setSettings((current) => ({ ...current, [key]: event.target.checked }))} /></label>)}</div><div className="settings-section settings-numbers"><div className="settings-section-heading"><div><p className="eyebrow">THRESHOLDS</p><h3>Make the checks fit your practice</h3></div></div><label>MAX SETS PER SESSION<input type="number" min={1} max={100} value={settings.maxSetsPerSession} onChange={(event) => setSettings((current) => ({ ...current, maxSetsPerSession: Number(event.target.value) }))} /><small>Advisory only; the PT can override a warning.</small></label><label>PRESS / PULL TOLERANCE<input type="number" min={0} max={10} value={settings.pressPullTolerance} onChange={(event) => setSettings((current) => ({ ...current, pressPullTolerance: Number(event.target.value) }))} /><small>How many more pressing exercises than pulling exercises are tolerated.</small></label></div></div>{error && <p className="form-error" role="alert">{error}</p>}<footer><button className="secondary-button" onClick={onClose}>Cancel</button><button className="primary-button" onClick={save} disabled={saving || loading}>{saving ? "Saving settings…" : "Save settings →"}</button></footer></section></div>;
}
