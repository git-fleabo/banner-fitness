"use client";

import { useEffect, useState } from "react";

import { updateClientPreferencesAction } from "./actions";

type Preferences = { likedExercises?: unknown; dislikedExercises?: unknown; preferredStyle?: string | null; preferredStructure?: string | null; preferredEquipment?: unknown; cardioModalities?: unknown; varietyPreference?: string | null; confidenceNotes?: string | null };
const list = (value: unknown) => Array.isArray(value) ? value.map(String).join(", ") : "";
const values = (value: string) => value.split(",").map((item) => item.trim()).filter(Boolean);

export function ClientPreferencesLauncher({ clientId, notify }: { clientId: string; notify: (message: string) => void }) {
  const [open, setOpen] = useState(false);
  return <>{open && <ClientPreferences clientId={clientId} onClose={() => setOpen(false)} notify={notify} />}<button className="client-preferences-floating" onClick={() => setOpen(true)}>Client preferences</button></>;
}

function ClientPreferences({ clientId, onClose, notify }: { clientId: string; onClose: () => void; notify: (message: string) => void }) {
  const [loaded, setLoaded] = useState(false);
  const [likedExercises, setLikedExercises] = useState("");
  const [dislikedExercises, setDislikedExercises] = useState("");
  const [preferredStyle, setPreferredStyle] = useState("");
  const [preferredStructure, setPreferredStructure] = useState("");
  const [preferredEquipment, setPreferredEquipment] = useState("");
  const [cardioModalities, setCardioModalities] = useState("");
  const [varietyPreference, setVarietyPreference] = useState("balanced");
  const [confidenceNotes, setConfidenceNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/designer/client?clientId=${encodeURIComponent(clientId)}`, { credentials: "same-origin", cache: "no-store" }).then((response) => response.ok ? response.json() as Promise<{ preferences: Preferences | null }> : Promise.reject(new Error("Preferences unavailable"))).then(({ preferences }) => { const current = preferences ?? {}; setLikedExercises(list(current.likedExercises)); setDislikedExercises(list(current.dislikedExercises)); setPreferredStyle(current.preferredStyle ?? ""); setPreferredStructure(current.preferredStructure ?? ""); setPreferredEquipment(list(current.preferredEquipment)); setCardioModalities(list(current.cardioModalities)); setVarietyPreference(current.varietyPreference ?? "balanced"); setConfidenceNotes(current.confidenceNotes ?? ""); }).catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Preferences unavailable")).finally(() => setLoaded(true));
  }, [clientId]);

  async function save() {
    setSaving(true); setError("");
    try { await updateClientPreferencesAction({ clientId, likedExercises: values(likedExercises), dislikedExercises: values(dislikedExercises), preferredStyle, preferredStructure, preferredEquipment: values(preferredEquipment), cardioModalities: values(cardioModalities), varietyPreference, confidenceNotes }); notify("Client preferences saved"); onClose(); } catch (saveError) { setError(saveError instanceof Error ? saveError.message : "Preferences could not be saved"); } finally { setSaving(false); }
  }

  return <div className="modal-backdrop"><section className="exercise-create-modal client-preferences-modal" role="dialog" aria-modal="true" aria-labelledby="client-preferences-heading"><header><div><p className="eyebrow">CLIENT PROFILE</p><h2 id="client-preferences-heading">Preferences and confidence</h2><p>These inputs influence exercise selection, substitutions, session structure and adherence. Separate comma-delimited items with commas.</p></div><button className="close-button" onClick={onClose}>×</button></header>{!loaded ? <div className="prompt-builder-loading">Loading saved preferences…</div> : <><div className="exercise-create-fields"><label>LIKED EXERCISES<input value={likedExercises} onChange={(event) => setLikedExercises(event.target.value)} placeholder="Dumbbells, machines, rows" /></label><label>DISLIKED EXERCISES<input value={dislikedExercises} onChange={(event) => setDislikedExercises(event.target.value)} placeholder="Running, burpees" /></label><label>PREFERRED STYLE<input value={preferredStyle} onChange={(event) => setPreferredStyle(event.target.value)} placeholder="Strength and hypertrophy" /></label><label>PREFERRED STRUCTURE<input value={preferredStructure} onChange={(event) => setPreferredStructure(event.target.value)} placeholder="Full body, paired sets" /></label><label>PREFERRED EQUIPMENT<input value={preferredEquipment} onChange={(event) => setPreferredEquipment(event.target.value)} placeholder="Dumbbells, machines, cable" /></label><label>CARDIO MODALITIES<input value={cardioModalities} onChange={(event) => setCardioModalities(event.target.value)} placeholder="Bike, walking, rowing" /></label><label>VARIETY PREFERENCE<select value={varietyPreference} onChange={(event) => setVarietyPreference(event.target.value)}><option value="consistent">Mostly consistent</option><option value="balanced">Balanced</option><option value="varied">More variety</option></select></label></div><label className="preferences-wide-field">CONFIDENCE, COMFORT AND ADHERENCE NOTES<textarea value={confidenceNotes} onChange={(event) => setConfidenceNotes(event.target.value)} placeholder="Exercises they feel confident or uncomfortable performing, environmental preferences, solo/coached preference, motivation notes…" /></label></>}{error && <p className="form-error" role="alert">{error}</p>}<footer><button className="secondary-button" onClick={onClose}>Cancel</button><button className="primary-button" onClick={save} disabled={saving || !loaded}>{saving ? "Saving preferences…" : "Save preferences →"}</button></footer></section></div>;
}
