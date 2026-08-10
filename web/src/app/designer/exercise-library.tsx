"use client";

import { useEffect, useState } from "react";

type LibraryExercise = { id: string; name: string; pattern: string; target: unknown; equipment: unknown; difficulty: string; complexity: string; suitability: unknown; compound: boolean; unilateral: boolean; regressions: unknown; progressions: unknown; alternatives: unknown; coachingCues: unknown; commonErrors: unknown; cautionTags: unknown };

const list = (value: unknown) => Array.isArray(value) ? value.map(String) : [];

export function ExerciseLibrary({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [difficulty, setDifficulty] = useState("all");
  const [pattern, setPattern] = useState("all");
  const [items, setItems] = useState<LibraryExercise[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/designer/exercises?q=${encodeURIComponent(query)}`, { credentials: "same-origin", cache: "no-store" })
      .then((response) => response.ok ? response.json() as Promise<{ exercises: LibraryExercise[] }> : Promise.reject(new Error("Exercise library unavailable")))
      .then((data) => setItems(data.exercises))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [query]);

  const patterns = Array.from(new Set(items.map((item) => item.pattern))).sort();
  const filtered = items.filter((item) => (difficulty === "all" || item.difficulty === difficulty) && (pattern === "all" || item.pattern === pattern));

  return <div className="library-view"><div className="page-heading"><div><p className="eyebrow">MOVEMENT DATABASE</p><h1>Exercise library</h1><p className="subheading">{items.length} structured exercises with regressions, progressions, cues, cautions and programming tags.</p></div><button className="primary-button" onClick={onClose}>← Dashboard</button></div><div className="library-toolbar"><div className="library-search">⌕<input value={query} onChange={(event) => { setLoading(true); setQuery(event.target.value); }} placeholder="Search exercises, patterns, muscles or equipment..." /></div><select className="library-filter" value={difficulty} onChange={(event) => setDifficulty(event.target.value)}><option value="all">All levels</option><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select><select className="library-filter" value={pattern} onChange={(event) => setPattern(event.target.value)}><option value="all">All patterns</option>{patterns.map((value) => <option key={value} value={value}>{value}</option>)}</select></div>{loading ? <p className="library-empty">Loading the structured exercise catalogue…</p> : <div className="library-grid">{filtered.map((exercise) => { const isExpanded = expanded === exercise.id; const cautions = list(exercise.cautionTags); return <article className={`library-card ${isExpanded ? "expanded" : ""}`} key={exercise.id}><div className="exercise-illustration">{exercise.compound ? "◉" : "◌"}</div><div className="library-card-copy"><div className="library-card-top"><span className="library-tag">{exercise.pattern}</span><span className={`library-level ${exercise.difficulty}`}>{exercise.difficulty}</span></div><h3>{exercise.name}</h3><p>{list(exercise.target).join(" · ")} · {list(exercise.equipment).join(", ")}</p><div className="library-meta"><span>{exercise.complexity} complexity</span><span>{exercise.unilateral ? "Unilateral" : "Bilateral"}</span><span>{list(exercise.suitability).slice(0, 2).join(" · ")}</span></div>{cautions.length > 0 && <div className="library-caution">Caution tags: {cautions.join(", ")}</div>}<button className="text-button" onClick={() => setExpanded(isExpanded ? null : exercise.id)}>{isExpanded ? "Hide details ↑" : "View details →"}</button>{isExpanded && <div className="library-detail"><p><b>Cues:</b> {list(exercise.coachingCues).join(" · ") || "Not yet recorded"}</p><p><b>Regressions:</b> {list(exercise.regressions).join(" · ") || "None recorded"}</p><p><b>Progressions:</b> {list(exercise.progressions).join(" · ") || "None recorded"}</p><p><b>Alternatives:</b> {list(exercise.alternatives).join(" · ") || "None recorded"}</p><p><b>Common errors:</b> {list(exercise.commonErrors).join(" · ") || "None recorded"}</p></div>}</div></article>; })}</div>}{!loading && filtered.length === 0 && <p className="library-empty">No exercises match those filters.</p>}</div>;
}
