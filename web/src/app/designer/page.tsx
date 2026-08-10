"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { createClientAction, logWorkoutResultAction, saveProgrammeAction } from "./actions";

type Exercise = {
  name: string;
  pattern: string;
  prescription: string;
  target: string;
  equipment: string;
  method?: string;
  note?: string;
};

type OverviewData = { counts: { clients: number; draftProgrammes: number; adherence: number | null }; clients: Array<{ id: string; firstName: string; lastName: string }>; programmes: Array<{ id: string; clientId: string; name: string; status: string; currentWeek: number; durationWeeks: number }> };

const exercises: Exercise[] = [
  { name: "Leg Press", pattern: "Squat", prescription: "3 × 8–12", target: "Quads · glutes", equipment: "Machine", note: "Stable lower-body strength stimulus" },
  { name: "DB Bench Press", pattern: "Horizontal push", prescription: "3 × 8–12", target: "Chest · triceps", equipment: "Dumbbells", note: "Client-preferred pressing option" },
  { name: "Seated Cable Row", pattern: "Horizontal pull", prescription: "3 × 8–12", target: "Back · biceps", equipment: "Cable", note: "Balances pressing volume" },
  { name: "DB Romanian Deadlift", pattern: "Hinge", prescription: "2 × 8–10", target: "Hamstrings · glutes", equipment: "Dumbbells", note: "Moderate posterior-chain volume" },
  { name: "Cable Lateral Raise", pattern: "Shoulder accessory", prescription: "2 × 12–15", target: "Lateral delts", equipment: "Cable", note: "Low-fatigue accessory" },
  { name: "Bike Intervals", pattern: "Conditioning", prescription: "8 min · 30:60", target: "Aerobic fitness", equipment: "Bike", method: "Intervals", note: "Time-efficient conditioning without running" },
];

function Icon({ children }: { children: React.ReactNode }) {
  return <span className="ds-icon" aria-hidden="true">{children}</span>;
}

export default function DesignerPage() {
  const router = useRouter();
  const [accessState, setAccessState] = useState<"checking" | "active">("checking");
  const [activeNav, setActiveNav] = useState("Overview");
  const [client, setClient] = useState("Maya Thompson");
  const [showClient, setShowClient] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const [screening, setScreening] = useState(false);
  const [goal, setGoal] = useState("Fat loss + muscle retention");
  const [days, setDays] = useState(3);
  const [overview, setOverview] = useState<OverviewData | null>(null);

  useEffect(() => {
    fetch("/api/designer/access", { credentials: "same-origin", cache: "no-store" })
      .then((response) => {
        if (response.status === 401) { router.replace("/auth/sign-in?next=/designer"); return; }
        if (!response.ok) { router.replace("/learn"); return; }
        setAccessState("active");
        return fetch("/api/designer/overview", { credentials: "same-origin", cache: "no-store" }).then((overviewResponse) => overviewResponse.ok ? overviewResponse.json() as Promise<OverviewData> : Promise.reject(new Error("Overview unavailable"))).then(setOverview).catch(() => undefined);
      })
      .catch(() => router.replace("/auth/sign-in?next=/designer"));
  }, [router]);

  const week = useMemo(() => exercises, []);
  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2400);
  };

  if (accessState === "checking") return <main className="designer-loading"><div className="loading-orbit">O</div><p>Checking your PT workspace…</p></main>;

  return (
    <main className="designer-shell">
      <aside className="designer-sidebar">
        <div className="brand-mark"><span>O</span><div><strong>ORIGIN</strong><small>PT STUDIO</small></div></div>
        <div className="workspace-label">WORKSPACE <span>⌄</span></div>
        <nav className="designer-nav" aria-label="Main navigation">
          {["Overview", "Clients", "Programmes", "Exercise library"].map((item, index) => (
            <button key={item} className={activeNav === item ? "active" : ""} onClick={() => { setActiveNav(item); setShowLibrary(item === "Exercise library"); }}>
              <Icon>{["⌂", "♧", "▦", "◈"][index]}</Icon>{item}
              {item === "Clients" && <em>12</em>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button className="sidebar-link"><Icon>⚙</Icon>Settings</button>
          <div className="profile-chip"><div className="avatar">NO</div><div><strong>Noaman</strong><small>Personal trainer</small></div><span>•••</span></div>
        </div>
      </aside>

      <section className="designer-content">
        <header className="designer-header"><div className="mobile-brand">ORIGIN / PT STUDIO</div><div className="header-search">⌕ <span>Search clients, programmes...</span><kbd>⌘ K</kbd></div><div className="header-actions"><button className="icon-button">?</button><button className="icon-button">♢</button><div className="mini-avatar">NO</div></div></header>

        {showLibrary ? <Library onClose={() => { setShowLibrary(false); setActiveNav("Overview"); }} /> : <>
          <div className="page-heading"><div><p className="eyebrow">MONDAY, 10 AUGUST 2026</p><h1>Good morning, Noaman <span>✦</span></h1><p className="subheading">Here&apos;s what needs your attention today.</p></div><button className="primary-button" onClick={() => setShowOnboarding(true)}>+ New client</button></div>

          <div className="stat-grid">
            <Stat label="Active clients" value={overview ? String(overview.counts.clients) : "—"} detail={overview?.counts.clients ? "Owner-scoped Neon records" : "Create your first client"} tone="green" icon="♧" />
            <Stat label="Programmes to review" value={overview ? String(overview.counts.draftProgrammes) : "—"} detail="Drafts awaiting PT review" tone="amber" icon="◷" />
            <Stat label="Avg. adherence" value={overview?.counts.adherence === null ? "—" : overview ? `${overview.counts.adherence}%` : "—"} detail="Last 30 days of logged results" tone="blue" icon="↗" />
            <Stat label="Sessions this week" value="18" detail="6 remaining" tone="purple" icon="▦" />
          </div>

          <div className="dashboard-grid">
            <section className="panel attention-panel"><div className="panel-heading"><div><p className="eyebrow">ACTION REQUIRED</p><h2>Needs your attention</h2></div><button className="text-button">View all →</button></div><Attention name="Maya Thompson" text="Programme review due · Week 4" tag="Review" tone="orange" initials="MT" onClick={() => setShowClient(true)} /><Attention name="Alex Morgan" text="Reported discomfort after last session" tag="Check-in" tone="red" initials="AM" onClick={() => notify("Client check-in queued")}/><Attention name="Sam Williams" text="Low adherence · 2 sessions missed" tag="Follow up" tone="blue" initials="SW" onClick={() => notify("Follow-up reminder queued")}/></section>
            <section className="panel schedule-panel"><div className="panel-heading"><div><p className="eyebrow">YOUR DAY</p><h2>Monday schedule</h2></div><button className="text-button">Full calendar →</button></div><Schedule time="09:00" name="Maya Thompson" type="Strength · Lower" color="lavender"/><Schedule time="11:30" name="Alex Morgan" type="Movement check-in" color="mint"/><Schedule time="14:00" name="Programme work" type="Focus time" color="sand"/><Schedule time="17:30" name="Sam Williams" type="Full body · 45 min" color="peach"/></section>
          </div>

            <section className="panel programme-panel"><div className="panel-heading programme-top"><div><p className="eyebrow">CURRENT PROGRAMME</p><h2>{client} <span className="status-pill">Active</span></h2><p className="panel-muted">Fat loss + muscle retention · 8-week foundation · Week 4 of 8</p></div><div className="programme-actions"><button className="secondary-button" onClick={() => notify("Client-facing preview ready")}>Preview client view</button><button className="primary-button" onClick={() => setShowClient(true)}>Open programme →</button></div></div><div className="progress-line"><span style={{width:"48%"}}></span></div><div className="programme-meta"><span>Progress <strong>48%</strong></span><span>Next review <strong>17 Aug 2026</strong></span><span>Adherence <strong className="good-text">91%</strong></span><span className="rationale-link">✦ Rule-based rationale available</span></div></section>
        </>}
      </section>
      {showClient && <ClientWorkspace name={client} goal={goal} days={days} setGoal={setGoal} setDays={setDays} screening={screening} setScreening={setScreening} expanded={expanded} setExpanded={setExpanded} onClose={() => setShowClient(false)} notify={notify} week={week} />}
      {showOnboarding && <ClientOnboarding onClose={() => setShowOnboarding(false)} onCreated={(name, riskCount) => { setClient(name); setScreening(riskCount > 0); setShowOnboarding(false); setShowClient(true); notify(riskCount ? `Client created with ${riskCount} screening flag${riskCount === 1 ? "" : "s"}` : "Client created and ready to programme"); }} />}
      {toast && <div className="toast">✓ {toast}</div>}
    </main>
  );
}

function Stat({label,value,detail,tone,icon}:{label:string;value:string;detail:string;tone:string;icon:string}) { return <div className="stat-card"><div className={`stat-icon ${tone}`}>{icon}</div><div><p>{label}</p><strong>{value}</strong><small className={tone === "green" || tone === "blue" ? "good-text" : ""}>{detail}</small></div></div>; }
function Attention({name,text,tag,tone,initials,onClick}:{name:string;text:string;tag:string;tone:string;initials:string;onClick:()=>void}) { return <button className="attention-row" onClick={onClick}><div className={`avatar avatar-${tone}`}>{initials}</div><div className="attention-copy"><strong>{name}</strong><span>{text}</span></div><span className={`attention-tag ${tone}`}>{tag}</span><span className="row-arrow">→</span></button>; }
function Schedule({time,name,type,color}:{time:string;name:string;type:string;color:string}) { return <div className="schedule-row"><time>{time}</time><div className={`schedule-card ${color}`}><strong>{name}</strong><span>{type}</span></div></div>; }

function ClientWorkspace({name,goal,days,setGoal,setDays,screening,setScreening,expanded,setExpanded,onClose,notify,week}:{name:string;goal:string;days:number;setGoal:(v:string)=>void;setDays:(v:number)=>void;screening:boolean;setScreening:(v:boolean)=>void;expanded:string|null;setExpanded:(v:string|null)=>void;onClose:()=>void;notify:(v:string)=>void;week:Exercise[]}) {
  const [saving, setSaving] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState(4);
  const [showWorkoutLog, setShowWorkoutLog] = useState(false);
  async function saveDraft() {
    setSaving(true);
    try {
      const result = await saveProgrammeAction({ clientName: name, goalSummary: goal, trainingDays: days, sessionDurationMinutes: 45, exercises: week.map((exercise) => ({ name: exercise.name, pattern: exercise.pattern, sets: Number(exercise.prescription.match(/^\d+/)?.[0] ?? 2), repsMin: Number(exercise.prescription.match(/×\s*(\d+)/)?.[1] ?? 8), repsMax: Number(exercise.prescription.match(/–(\d+)/)?.[1] ?? 12), intensityValue: "2 RIR", restSeconds: 90, tempo: "" })) });
      notify(`Draft saved · version ${result.version}`);
    } catch (error) {
      notify(error instanceof Error ? error.message : "Draft could not be saved");
    } finally {
      setSaving(false);
    }
  }
  async function downloadReport() {
    const response = await fetch(`/api/designer/report?clientName=${encodeURIComponent(name)}`, { credentials: "same-origin", cache: "no-store" });
    if (!response.ok) { notify("Save this client before downloading a report"); return; }
    const blob = await response.blob(); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = `${name.replaceAll(" ", "-").toLowerCase()}-progress-report.json`; link.click(); URL.revokeObjectURL(url); notify("Progress report downloaded");
  }
  return <div className="workspace-overlay"><div className="workspace-drawer"><header className="workspace-header"><div><p className="eyebrow">CLIENT WORKSPACE</p><h1>{name}</h1><p className="panel-muted">42 years · Intermediate · Commercial gym</p></div><button className="close-button" onClick={onClose}>×</button></header><div className="workspace-tabs"><span className="active">Overview</span><span>Assessment</span><span>Programme</span><span>History</span></div><div className="workspace-body"><div className="client-column"><section className="client-hero"><div className="large-avatar">MT</div><div><span className="status-pill">Active client</span><h2>{goal}</h2><p>{days} days / week · 45 min · Likes dumbbells & machines</p></div></section><section className="warning-card"><div className="warning-symbol">!</div><div><strong>Screening review required</strong><p>{screening ? "Client reports occasional dizziness during intense activity. Consider referral or medical clearance before high-intensity work." : "No responses recorded for the current PAR-Q review."}</p></div><button onClick={() => setScreening(!screening)}>{screening ? "View assessment" : "Review now"} →</button></section><div className="two-col"><section className="inner-panel"><div className="inner-heading"><h3>Client snapshot</h3><button className="text-button">Edit</button></div><label>PRIMARY GOAL<select value={goal} onChange={e => setGoal(e.target.value)}><option>Fat loss + muscle retention</option><option>General strength</option><option>Hypertrophy</option><option>General fitness</option></select></label><label>TRAINING DAYS<div className="segmented">{[2,3,4].map(day => <button key={day} className={days === day ? "selected" : ""} onClick={() => setDays(day)}>{day} days</button>)}</div></label><div className="mini-facts"><span><b>Sleep</b> 7h average</span><span><b>Stress</b> Moderate</span><span><b>Adherence</b> —</span><span><b>Session RPE</b> —</span></div></section><section className="inner-panel rationale-box"><div className="inner-heading"><h3>Programming rationale</h3><span className="sparkle">✦</span></div><p>Full-body sessions keep frequency practical across {days} training days. Moderate volume supports muscle retention while leaving recovery capacity for daily activity.</p><button className="outline-button" onClick={() => notify("Rationale copied to notes")}>Copy rationale</button></section></div></div><aside className="plan-column"><div className="plan-header"><div><p className="eyebrow">DRAFT PROGRAMME</p><h2>Foundation / Week {selectedWeek}</h2></div><button className="more-button">•••</button></div><div className="week-selector"><button onClick={() => setSelectedWeek(Math.max(1, selectedWeek - 1))}>‹</button><strong>Week {selectedWeek} <small>Programme week</small></strong><button onClick={() => setSelectedWeek(Math.min(8, selectedWeek + 1))}>›</button></div><div className="week-pills">{[1,2,3,4,5,6,7,8].map(value => <button key={value} className={selectedWeek === value ? "selected" : ""} onClick={() => setSelectedWeek(value)}>{value}</button>)}</div><div className="session-tabs"><span className="active">MON <b>Full body</b></span><span>WED <b>Full body</b></span><span>FRI <b>Conditioning</b></span></div><div className="session-title"><div><h3>Monday · Strength / Hypertrophy</h3><p>45 min · Week {selectedWeek}</p></div><div className="session-actions"><button className="edit-button" onClick={() => setShowWorkoutLog(true)}>Log result</button><button className="edit-button" onClick={() => notify("Session editing enabled")}>Edit</button></div></div><div className="exercise-list">{week.map((exercise,index) => <ExerciseCard key={exercise.name} exercise={exercise} index={index} expanded={expanded === exercise.name} onToggle={() => setExpanded(expanded === exercise.name ? null : exercise.name)} notify={notify}/>)}</div><div className="quality-card"><div className="quality-score">86</div><div><strong>Programme quality check</strong><p>Rule-based checks passed for goal and equipment. One consideration below.</p><span className="quality-warning">! Pressing volume is slightly higher than pulling volume</span></div><button onClick={() => notify("Quality details opened")}>→</button></div><div className="plan-footer-actions"><button className="outline-button" onClick={downloadReport}>Download report</button><button className="assign-button" onClick={saveDraft} disabled={saving}>{saving ? "Saving draft…" : "Save draft & review →"}</button></div></aside></div></div>{showWorkoutLog && <WorkoutLogModal clientName={name} onClose={() => setShowWorkoutLog(false)} onSaved={() => { setShowWorkoutLog(false); notify("Workout result saved"); }} />}</div>;
}

function ClientOnboarding({onClose,onCreated}:{onClose:()=>void;onCreated:(name:string,riskCount:number)=>void}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [goalType, setGoalType] = useState("General fitness");
  const [trainingDays, setTrainingDays] = useState(3);
  const [sessionDurationMinutes, setSessionDurationMinutes] = useState(45);
  const [locationName, setLocationName] = useState("Commercial gym");
  const [locationType, setLocationType] = useState("Full gym");
  const [equipment, setEquipment] = useState(["Dumbbells", "Machines", "Cable"]);
  const [screening, setScreening] = useState({ chestPain: false, cardiovascularHistory: false, dizzinessOrFainting: false, unusualBreathlessness: false, diagnosedDisease: false, medicalIssue: false, medicationAffectingExercise: false, recentSurgery: false, injuryOrMusculoskeletalLimitation: false, pregnancyOrPostpartum: false, otherConcern: false });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const riskQuestions: Array<[keyof typeof screening, string]> = [["chestPain", "Chest pain or discomfort during activity?"], ["dizzinessOrFainting", "Dizziness or fainting?"], ["unusualBreathlessness", "Unusual shortness of breath?"], ["medicalIssue", "Current medical issue needing consideration?"]];
  function toggleEquipment(item: string) { setEquipment((current) => current.includes(item) ? current.filter((value) => value !== item) : [...current, item]); }
  async function submit() {
    setSaving(true); setError("");
    try {
      const result = await createClientAction({ firstName, lastName, goalType, trainingDays, sessionDurationMinutes, locationName, locationType, equipment, screening });
      onCreated(`${firstName.trim()} ${lastName.trim()}`, result.riskFlags.length);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Client could not be created");
    } finally { setSaving(false); }
  }
  return <div className="workspace-overlay"><div className="onboarding-drawer"><header className="workspace-header"><div><p className="eyebrow">NEW CLIENT · STEP 1 OF 3</p><h1>Start a client profile</h1><p className="panel-muted">Capture enough context to programme responsibly. You can complete the assessment later.</p></div><button className="close-button" onClick={onClose}>×</button></header><div className="onboarding-body"><section className="onboarding-section"><div className="section-title"><span>01</span><div><h2>Client details</h2><p>Personal information and the first programming variables.</p></div></div><div className="onboarding-fields"><label>FIRST NAME<input value={firstName} onChange={event => setFirstName(event.target.value)} placeholder="Maya" /></label><label>LAST NAME<input value={lastName} onChange={event => setLastName(event.target.value)} placeholder="Thompson" /></label><label>PRIMARY GOAL<select value={goalType} onChange={event => setGoalType(event.target.value)}><option>General fitness</option><option>Fat loss + muscle retention</option><option>General strength</option><option>Hypertrophy</option><option>Cardiovascular fitness</option><option>Movement quality</option></select></label><label>SESSION LENGTH<select value={sessionDurationMinutes} onChange={event => setSessionDurationMinutes(Number(event.target.value))}><option value={30}>30 minutes</option><option value={45}>45 minutes</option><option value={60}>60 minutes</option><option value={75}>75 minutes</option></select></label></div><label className="wide-field">TRAINING DAYS<div className="segmented onboarding-segmented">{[2,3,4,5].map(day => <button type="button" key={day} className={trainingDays === day ? "selected" : ""} onClick={() => setTrainingDays(day)}>{day} days</button>)}</div></label></section><section className="onboarding-section"><div className="section-title"><span>02</span><div><h2>Location & equipment</h2><p>Exercises will be filtered against this location unless you override it.</p></div></div><div className="onboarding-fields"><label>LOCATION NAME<input value={locationName} onChange={event => setLocationName(event.target.value)} /></label><label>LOCATION TYPE<select value={locationType} onChange={event => setLocationType(event.target.value)}><option>Full gym</option><option>Home gym</option><option>Minimal equipment</option><option>Outdoor</option></select></label></div><div className="equipment-picker">{["Dumbbells", "Machines", "Cable", "Barbell", "Bands", "Bike", "Kettlebell"].map(item => <button type="button" key={item} className={equipment.includes(item) ? "chosen" : ""} onClick={() => toggleEquipment(item)}>{equipment.includes(item) ? "✓ " : "+ "}{item}</button>)}</div></section><section className="onboarding-section screening-section"><div className="section-title"><span>03</span><div><h2>Initial screening</h2><p>These flags do not diagnose. They help the PT decide whether additional screening, referral or clearance is appropriate.</p></div></div><div className="screening-grid">{riskQuestions.map(([key, label]) => <label key={key} className={screening[key] ? "screening-choice flagged" : "screening-choice"}><input type="checkbox" checked={screening[key]} onChange={event => setScreening({ ...screening, [key]: event.target.checked })} /><span>{label}</span></label>)}</div><p className="screening-note">Any positive response will be recorded on the assessment and kept visible to the PT before programme finalisation.</p></section>{error && <p className="form-error" role="alert">{error}</p>}<footer className="onboarding-footer"><button className="secondary-button" onClick={onClose}>Cancel</button><button className="primary-button" onClick={submit} disabled={saving || !firstName.trim() || !lastName.trim()}>{saving ? "Creating profile…" : "Create client profile →"}</button></footer></div></div></div>;
}

function WorkoutLogModal({clientName,onClose,onSaved}:{clientName:string;onClose:()=>void;onSaved:()=>void}) {
  const [status, setStatus] = useState<"completed" | "partial" | "missed" | "skipped">("completed");
  const [sessionRpe, setSessionRpe] = useState(7);
  const [energy, setEnergy] = useState(3);
  const [painReported, setPainReported] = useState(false);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  async function submit() {
    setSaving(true); setError("");
    try { await logWorkoutResultAction({ clientName, scheduledDate: new Date().toISOString().slice(0, 10), status, sessionRpe, energy, painReported, notes }); onSaved(); }
    catch (submitError) { setError(submitError instanceof Error ? submitError.message : "Workout result could not be saved"); }
    finally { setSaving(false); }
  }
  return <div className="modal-backdrop"><section className="log-modal" role="dialog" aria-modal="true" aria-labelledby="log-heading"><header><div><p className="eyebrow">SESSION RESULT</p><h2 id="log-heading">Log {clientName}&apos;s workout</h2><p>Capture what happened, not just what was prescribed.</p></div><button className="close-button" onClick={onClose}>×</button></header><div className="log-fields"><label>STATUS<select value={status} onChange={event => setStatus(event.target.value as typeof status)}><option value="completed">Completed</option><option value="partial">Partially completed</option><option value="missed">Missed</option><option value="skipped">Skipped</option></select></label><label>SESSION RPE<select value={sessionRpe} onChange={event => setSessionRpe(Number(event.target.value))}>{[1,2,3,4,5,6,7,8,9,10].map(value => <option key={value} value={value}>{value} / 10</option>)}</select></label><label>ENERGY<select value={energy} onChange={event => setEnergy(Number(event.target.value))}><option value={1}>1 · Very low</option><option value={2}>2 · Low</option><option value={3}>3 · Usual</option><option value={4}>4 · Good</option><option value={5}>5 · High</option></select></label></div><label className="log-checkbox"><input type="checkbox" checked={painReported} onChange={event => setPainReported(event.target.checked)} /><span>Client reported pain or discomfort</span></label><label className="log-notes">NOTES<textarea value={notes} onChange={event => setNotes(event.target.value)} placeholder="Technique, recovery, enjoyment, substitutions..." /></label>{error && <p className="form-error" role="alert">{error}</p>}<footer><button className="secondary-button" onClick={onClose}>Cancel</button><button className="primary-button" onClick={submit} disabled={saving}>{saving ? "Saving result…" : "Save workout result →"}</button></footer></section></div>;
}

function ExerciseCard({exercise,index,expanded,onToggle,notify}:{exercise:Exercise;index:number;expanded:boolean;onToggle:()=>void;notify:(v:string)=>void}) { return <article className={`exercise-card ${expanded ? "expanded" : ""}`}><div className="exercise-number">{String(index+1).padStart(2,"0")}</div><div className="exercise-main"><div className="exercise-title"><div><h3>{exercise.name}</h3><span>{exercise.pattern} · {exercise.target}</span></div><button className="kebab">•••</button></div><div className="exercise-prescription"><strong>{exercise.prescription}</strong><span>RIR 2</span><span>Rest 90s</span></div>{expanded && <div className="exercise-detail"><p><b>Why this exercise?</b> {exercise.note ?? "Chosen to match the client's goal and current capacity."}</p><div className="detail-actions"><button onClick={() => notify(`Alternatives for ${exercise.name} opened`)}>Swap exercise</button><button onClick={() => notify("Progression rule added")}>Progress</button><button onClick={() => notify("Exercise regressed")}>Regress</button></div></div>}</div><button className="expand-button" onClick={onToggle} aria-label={`Show options for ${exercise.name}`}>{expanded ? "⌃" : "⌄"}</button></article>; }

function Library({onClose}:{onClose:()=>void}) { const [query,setQuery] = useState(""); const [items,setItems] = useState<Exercise[]>(exercises); const [loading,setLoading] = useState(true); useEffect(() => { fetch(`/api/designer/exercises?q=${encodeURIComponent(query)}`, { credentials: "same-origin", cache: "no-store" }).then(response => response.ok ? response.json() as Promise<{ exercises: Array<{ name: string; pattern: string; target: unknown; equipment: unknown }> }> : Promise.reject(new Error("Exercise library unavailable"))).then(data => setItems(data.exercises.map(item => ({ name: item.name, pattern: item.pattern, prescription: "", target: Array.isArray(item.target) ? item.target.join(" · ") : String(item.target ?? ""), equipment: Array.isArray(item.equipment) ? item.equipment.join(" · ") : String(item.equipment ?? "") })))).catch(() => setItems(exercises.filter(e => `${e.name} ${e.pattern} ${e.target}`.toLowerCase().includes(query.toLowerCase())))).finally(() => setLoading(false)); }, [query]); const filtered = items.filter(e => `${e.name} ${e.pattern} ${e.target}`.toLowerCase().includes(query.toLowerCase())); return <div className="library-view"><div className="page-heading"><div><p className="eyebrow">MOVEMENT DATABASE</p><h1>Exercise library</h1><p className="subheading">A structured, searchable catalogue built for practical programming decisions.</p></div><button className="primary-button" onClick={() => onClose()}>← Dashboard</button></div><div className="library-toolbar"><div className="library-search">⌕<input value={query} onChange={e => { setLoading(true); setQuery(e.target.value); }} placeholder="Search exercises, patterns or muscles..." /></div><button className="secondary-button">Filter ▾</button><button className="secondary-button">+ Add exercise</button></div>{loading ? <p className="library-empty">Loading the structured exercise catalogue…</p> : <div className="library-grid">{filtered.map(exercise => <article className="library-card" key={exercise.name}><div className="exercise-illustration">{exercise.pattern === "Conditioning" ? "◒" : "◉"}</div><div><span className="library-tag">{exercise.pattern}</span><h3>{exercise.name}</h3><p>{exercise.target} · {exercise.equipment}</p><button className="text-button">View details →</button></div></article>)}</div>}</div>; }
