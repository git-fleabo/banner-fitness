"use client";

import { useMemo, useState } from "react";

type Exercise = {
  name: string;
  pattern: string;
  prescription: string;
  target: string;
  equipment: string;
  method?: string;
  note?: string;
};

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
  const [activeNav, setActiveNav] = useState("Overview");
  const client = "Maya Thompson";
  const [showClient, setShowClient] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const [screening, setScreening] = useState(false);
  const [goal, setGoal] = useState("Fat loss + muscle retention");
  const [days, setDays] = useState(3);

  const week = useMemo(() => exercises, []);
  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2400);
  };

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
          <div className="profile-chip"><div className="avatar">JS</div><div><strong>Jordan Smith</strong><small>Personal trainer</small></div><span>•••</span></div>
        </div>
      </aside>

      <section className="designer-content">
        <header className="designer-header"><div className="mobile-brand">ORIGIN / PT STUDIO</div><div className="header-search">⌕ <span>Search clients, programmes...</span><kbd>⌘ K</kbd></div><div className="header-actions"><button className="icon-button">?</button><button className="icon-button">♢</button><div className="mini-avatar">JS</div></div></header>

        {showLibrary ? <Library onClose={() => { setShowLibrary(false); setActiveNav("Overview"); }} /> : <>
          <div className="page-heading"><div><p className="eyebrow">MONDAY, 10 AUGUST 2026</p><h1>Good morning, Jordan <span>✦</span></h1><p className="subheading">Here&apos;s what needs your attention today.</p></div><button className="primary-button" onClick={() => { setShowClient(true); notify("New client workspace opened"); }}>+ New client</button></div>

          <div className="stat-grid">
            <Stat label="Active clients" value="12" detail="↑ 2 this month" tone="green" icon="♧" />
            <Stat label="Programmes to review" value="3" detail="2 due this week" tone="amber" icon="◷" />
            <Stat label="Avg. adherence" value="87%" detail="↑ 4.2% vs last month" tone="blue" icon="↗" />
            <Stat label="Sessions this week" value="18" detail="6 remaining" tone="purple" icon="▦" />
          </div>

          <div className="dashboard-grid">
            <section className="panel attention-panel"><div className="panel-heading"><div><p className="eyebrow">ACTION REQUIRED</p><h2>Needs your attention</h2></div><button className="text-button">View all →</button></div><Attention name="Maya Thompson" text="Programme review due · Week 4" tag="Review" tone="orange" initials="MT" onClick={() => setShowClient(true)} /><Attention name="Alex Morgan" text="Reported discomfort after last session" tag="Check-in" tone="red" initials="AM" onClick={() => notify("Client check-in queued")}/><Attention name="Sam Williams" text="Low adherence · 2 sessions missed" tag="Follow up" tone="blue" initials="SW" onClick={() => notify("Follow-up reminder queued")}/></section>
            <section className="panel schedule-panel"><div className="panel-heading"><div><p className="eyebrow">YOUR DAY</p><h2>Monday schedule</h2></div><button className="text-button">Full calendar →</button></div><Schedule time="09:00" name="Maya Thompson" type="Strength · Lower" color="lavender"/><Schedule time="11:30" name="Alex Morgan" type="Movement check-in" color="mint"/><Schedule time="14:00" name="Programme work" type="Focus time" color="sand"/><Schedule time="17:30" name="Sam Williams" type="Full body · 45 min" color="peach"/></section>
          </div>

          <section className="panel programme-panel"><div className="panel-heading programme-top"><div><p className="eyebrow">CURRENT PROGRAMME</p><h2>Maya Thompson <span className="status-pill">Active</span></h2><p className="panel-muted">Fat loss + muscle retention · 8-week foundation · Week 4 of 8</p></div><div className="programme-actions"><button className="secondary-button" onClick={() => notify("Client-facing preview ready")}>Preview client view</button><button className="primary-button" onClick={() => setShowClient(true)}>Open programme →</button></div></div><div className="progress-line"><span style={{width:"48%"}}></span></div><div className="programme-meta"><span>Progress <strong>48%</strong></span><span>Next review <strong>17 Aug 2026</strong></span><span>Adherence <strong className="good-text">91%</strong></span><span className="rationale-link">✦ AI rationale available</span></div></section>
        </>}
      </section>
      {showClient && <ClientWorkspace name={client} goal={goal} days={days} setGoal={setGoal} setDays={setDays} screening={screening} setScreening={setScreening} expanded={expanded} setExpanded={setExpanded} onClose={() => setShowClient(false)} notify={notify} week={week} />}
      {toast && <div className="toast">✓ {toast}</div>}
    </main>
  );
}

function Stat({label,value,detail,tone,icon}:{label:string;value:string;detail:string;tone:string;icon:string}) { return <div className="stat-card"><div className={`stat-icon ${tone}`}>{icon}</div><div><p>{label}</p><strong>{value}</strong><small className={tone === "green" || tone === "blue" ? "good-text" : ""}>{detail}</small></div></div>; }
function Attention({name,text,tag,tone,initials,onClick}:{name:string;text:string;tag:string;tone:string;initials:string;onClick:()=>void}) { return <button className="attention-row" onClick={onClick}><div className={`avatar avatar-${tone}`}>{initials}</div><div className="attention-copy"><strong>{name}</strong><span>{text}</span></div><span className={`attention-tag ${tone}`}>{tag}</span><span className="row-arrow">→</span></button>; }
function Schedule({time,name,type,color}:{time:string;name:string;type:string;color:string}) { return <div className="schedule-row"><time>{time}</time><div className={`schedule-card ${color}`}><strong>{name}</strong><span>{type}</span></div></div>; }

function ClientWorkspace({name,goal,days,setGoal,setDays,screening,setScreening,expanded,setExpanded,onClose,notify,week}:{name:string;goal:string;days:number;setGoal:(v:string)=>void;setDays:(v:number)=>void;screening:boolean;setScreening:(v:boolean)=>void;expanded:string|null;setExpanded:(v:string|null)=>void;onClose:()=>void;notify:(v:string)=>void;week:Exercise[]}) {
  return <div className="workspace-overlay"><div className="workspace-drawer"><header className="workspace-header"><div><p className="eyebrow">CLIENT WORKSPACE</p><h1>{name}</h1><p className="panel-muted">42 years · Intermediate · Commercial gym</p></div><button className="close-button" onClick={onClose}>×</button></header><div className="workspace-tabs"><span className="active">Overview</span><span>Assessment</span><span>Programme</span><span>History</span></div><div className="workspace-body"><div className="client-column"><section className="client-hero"><div className="large-avatar">MT</div><div><span className="status-pill">Active client</span><h2>Fat loss + muscle retention</h2><p>3 days / week · 45 min · Likes dumbbells & machines</p></div></section><section className="warning-card"><div className="warning-symbol">!</div><div><strong>Screening review required</strong><p>{screening ? "Client reports occasional dizziness during intense activity. Consider referral or medical clearance before high-intensity work." : "No responses recorded for the current PAR-Q review."}</p></div><button onClick={() => setScreening(!screening)}>{screening ? "View assessment" : "Review now"} →</button></section><div className="two-col"><section className="inner-panel"><div className="inner-heading"><h3>Client snapshot</h3><button className="text-button">Edit</button></div><label>PRIMARY GOAL<select value={goal} onChange={e => setGoal(e.target.value)}><option>Fat loss + muscle retention</option><option>General strength</option><option>Hypertrophy</option><option>General fitness</option></select></label><label>TRAINING DAYS<div className="segmented">{[2,3,4].map(day => <button key={day} className={days === day ? "selected" : ""} onClick={() => setDays(day)}>{day} days</button>)}</div></label><div className="mini-facts"><span><b>Sleep</b> 7h average</span><span><b>Stress</b> Moderate</span><span><b>Adherence</b> 91%</span><span><b>Session RPE</b> 7.1 avg</span></div></section><section className="inner-panel rationale-box"><div className="inner-heading"><h3>Programming rationale</h3><span className="sparkle">✦</span></div><p>Full-body sessions keep frequency practical across {days} training days. Moderate volume supports muscle retention while leaving recovery capacity for daily activity.</p><button className="outline-button" onClick={() => notify("Rationale copied to notes")}>Copy rationale</button></section></div></div><aside className="plan-column"><div className="plan-header"><div><p className="eyebrow">DRAFT PROGRAMME</p><h2>Foundation / Week 4</h2></div><button className="more-button">•••</button></div><div className="week-selector"><button>‹</button><strong>Week 4 <small>10–16 Aug</small></strong><button>›</button></div><div className="session-tabs"><span className="active">MON <b>Full body</b></span><span>WED <b>Full body</b></span><span>FRI <b>Conditioning</b></span></div><div className="session-title"><div><h3>Monday · Strength / Hypertrophy</h3><p>45 min · Commercial gym</p></div><button className="edit-button" onClick={() => notify("Session editing enabled")}>Edit</button></div><div className="exercise-list">{week.map((exercise,index) => <ExerciseCard key={exercise.name} exercise={exercise} index={index} expanded={expanded === exercise.name} onToggle={() => setExpanded(expanded === exercise.name ? null : exercise.name)} notify={notify}/>)}</div><div className="quality-card"><div className="quality-score">86</div><div><strong>Programme quality check</strong><p>Good alignment with goal and equipment. One consideration below.</p><span className="quality-warning">! Pressing volume is slightly higher than pulling volume</span></div><button onClick={() => notify("Quality details opened")}>→</button></div><button className="assign-button" onClick={() => notify("Draft saved — ready for PT approval")}>Save draft & review →</button></aside></div></div></div>;
}

function ExerciseCard({exercise,index,expanded,onToggle,notify}:{exercise:Exercise;index:number;expanded:boolean;onToggle:()=>void;notify:(v:string)=>void}) { return <article className={`exercise-card ${expanded ? "expanded" : ""}`}><div className="exercise-number">{String(index+1).padStart(2,"0")}</div><div className="exercise-main"><div className="exercise-title"><div><h3>{exercise.name}</h3><span>{exercise.pattern} · {exercise.target}</span></div><button className="kebab">•••</button></div><div className="exercise-prescription"><strong>{exercise.prescription}</strong><span>RIR 2</span><span>Rest 90s</span></div>{expanded && <div className="exercise-detail"><p><b>Why this exercise?</b> {exercise.note ?? "Chosen to match the client's goal and current capacity."}</p><div className="detail-actions"><button onClick={() => notify(`Alternatives for ${exercise.name} opened`)}>Swap exercise</button><button onClick={() => notify("Progression rule added")}>Progress</button><button onClick={() => notify("Exercise regressed")}>Regress</button></div></div>}</div><button className="expand-button" onClick={onToggle} aria-label={`Show options for ${exercise.name}`}>{expanded ? "⌃" : "⌄"}</button></article>; }

function Library({onClose}:{onClose:()=>void}) { const [query,setQuery] = useState(""); const filtered = exercises.filter(e => `${e.name} ${e.pattern} ${e.target}`.toLowerCase().includes(query.toLowerCase())); return <div className="library-view"><div className="page-heading"><div><p className="eyebrow">MOVEMENT DATABASE</p><h1>Exercise library</h1><p className="subheading">A structured, searchable catalogue built for practical programming decisions.</p></div><button className="primary-button" onClick={() => onClose()}>← Dashboard</button></div><div className="library-toolbar"><div className="library-search">⌕<input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search exercises, patterns or muscles..." /></div><button className="secondary-button">Filter ▾</button><button className="secondary-button">+ Add exercise</button></div><div className="library-grid">{filtered.map(exercise => <article className="library-card" key={exercise.name}><div className="exercise-illustration">{exercise.pattern === "Conditioning" ? "◒" : "◉"}</div><div><span className="library-tag">{exercise.pattern}</span><h3>{exercise.name}</h3><p>{exercise.target} · {exercise.equipment}</p><button className="text-button">View details →</button></div></article>)}</div></div>; }
