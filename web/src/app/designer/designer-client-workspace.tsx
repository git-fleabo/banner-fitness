"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { logWorkoutResultAction, recordProgrammeOverrideAction, resolveScreeningAction, saveProgrammeAction, transitionProgrammeAction, updateSessionSchedulingAction, updateClientAction, updateClientAssessmentAction, updateClientLocationAction, updateClientProfileAction } from "./actions";
import { type QualityReview, type QualitySettings } from "@/lib/pt-quality";
import type { ClientTimelineItem } from "@/lib/pt-client-timeline";
import type { AiProgrammeImportApproval } from "@/lib/pt-ai-import";
import { PT_GOALS } from "@/lib/pt-goals";
import { PromptBuilderLauncher } from "./prompt-builder";
import { AiProgrammeImportLauncher } from "./ai-import";
import { ClientPreferencesLauncher } from "./client-preferences";
import { ClientPerformanceLauncher } from "./client-performance";
import { ProgressionReviewLauncher } from "./progression-review";
import { SubstitutionReviewLauncher } from "./substitution-review";
import { ClientProgressLauncher } from "./client-progress";
const SCREENING_FIELDS = [
  ["chestPain", ""], ["cardiovascularHistory", ""], ["dizzinessOrFainting", ""],
  ["unusualBreathlessness", ""], ["diagnosedDisease", ""], ["medicalIssue", ""],
  ["medicationAffectingExercise", ""], ["recentSurgery", ""],
  ["injuryOrMusculoskeletalLimitation", ""], ["pregnancyOrPostpartum", ""],
  ["otherConcern", ""],
] as const;
type Exercise = {
  name: string;
  pattern: string;
  prescription: string;
  target: string;
  equipment: string;
  intensityValue?: string;
  restSeconds?: number;
  tempo?: string;
  progressionRule?: string;
  method?: string;
  note?: string;
  exerciseId?: string;
  prescriptionId?: string;
  sets?: number;
  repsMin?: number;
  repsMax?: number;
};
type PerformanceRecord = {
  id: string;
  exerciseId: string | null;
  exerciseName: string | null;
  metricType: string;
  metricName: string | null;
  performanceDate: string;
  value: string | number;
  unit: string;
  repetitions: number | null;
  loadKg: string | number | null;
  source: string;
  confidence: string | null;
  techniqueAcceptable: boolean;
  painReported: boolean;
  notes: string | null;
};
type ClientDetail = {
  client: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    clientColour?: string | null;
    dateOfBirth: string | null;
    sexOrGender: string | null;
    trainingExperience: string | null;
    heightCm: number | null;
    weightKg: number | null;
    occupation: string | null;
    dailyActivity: string | null;
    sessionDurationMinutes: number | null;
    preferredDays: unknown;
    sleepHours: string | null;
    stressLevel: string | null;
    notes: string | null;
    createdAt?: string;
    updatedAt?: string;
  };
  assessment: {
    clearanceRequired: boolean;
    riskFlags: unknown;
    responses: unknown;
    reviewDate: string | null;
    assessmentDate: string;
    ptNotes: string | null;
    injuryNotes: string | null;
    contraindicationNotes: string | null;
  } | null;
  goal: {
    goalType: string;
    target: string | null;
    metric: string | null;
  } | null;
  location: { name: string; locationType: string; equipment: unknown } | null;
  preferences: {
    likedExercises?: unknown;
    dislikedExercises?: unknown;
    preferredStyle?: string | null;
    preferredStructure?: string | null;
    preferredEquipment?: unknown;
    cardioModalities?: unknown;
    varietyPreference?: string | null;
    confidenceNotes?: string | null;
  } | null;
  performanceRecords: PerformanceRecord[];
  programmeHistory: Array<{
    id: string;
    name: string;
    goalSummary: string;
    status: string;
    version: number;
    updatedAt: string;
    createdAt?: string;
    aiImported?: boolean;
  }>;
  timeline: ClientTimelineItem[];
  quality: QualityReview | null;
  programme: {
    id: string;
    name: string;
    goalSummary: string;
    status: string;
    currentWeek: number;
    durationWeeks: number;
    version: number;
    rationale: string | null;
    aiImported: boolean;
    week: {
      id: string;
      weekNumber: number;
      focus: string;
      volumeTarget: string | null;
      intensityTarget: string | null;
    } | null;
    weekOptions: Array<{
      weekNumber: number;
      focus: string;
      volumeTarget: string | null;
      intensityTarget: string | null;
    }>;
    sessions: Array<{
      id: string;
      dayOfWeek: number;
      scheduledTime: string | null;
      managementMode: "pt_managed" | "self_managed";
      name: string;
      sessionType: string;
      durationMinutes: number;
      exercises: Exercise[];
    }>;
    events: Array<{
      id: string;
      action: string;
      details: unknown;
      createdAt: string;
    }>;
  } | null;
};
function clientColor(value: string, storedColour?: string | null) {
  const stored = ["emerald", "blue", "orange", "violet", "rose", "lime", "sky", "magenta", "ochre", "teal", "coral", "indigo"].indexOf(storedColour ?? "");
  if (stored >= 0) return `client-color-${stored}`;
  let hash = 0;
  for (const character of value)
    hash = (hash * 31 + character.charCodeAt(0)) | 0;
  return `client-color-${Math.abs(hash) % 12}`;
}
const WEEKDAYS = [{ value: 1, label: "Monday" }, { value: 2, label: "Tuesday" }, { value: 3, label: "Wednesday" }, { value: 4, label: "Thursday" }, { value: 5, label: "Friday" }, { value: 6, label: "Saturday" }, { value: 7, label: "Sunday" }];
const preferredDayValues = (value: unknown) => Array.isArray(value) ? value.filter((item): item is number => typeof item === "number") : [];
function CaseStudyDraftButton({
  clientId,
  hasExisting,
  onSaved,
  notify,
}: {
  clientId: string;
  hasExisting: boolean;
  onSaved: () => void;
  notify: (message: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  async function generate() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/designer/case-study-draft", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ clientId }),
      });
      const result = (await response.json()) as {
        programmeLabel?: string;
        error?: string;
      };
      if (!response.ok)
        throw new Error(
          result.error || "Case-study draft could not be generated",
        );
      notify(
        `${result.programmeLabel || "Case-study draft"} created for PT review`,
      );
      onSaved();
    } catch (generateError) {
      setError(
        generateError instanceof Error
          ? generateError.message
          : "Case-study draft could not be generated",
      );
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="case-study-draft-panel">
      <div>
        <p className="eyebrow">RULE-BASED TEST DRAFT</p>
        <strong>
          {hasExisting
            ? "Generate revised case-study version"
            : "Generate case-study programme"}
        </strong>
        <small>
          Creates an editable draft using the client profile, experience, goals,
          equipment and screening flags. No AI is used.
        </small>
      </div>
      <button className="primary-button" onClick={generate} disabled={loading}>
        {loading
          ? "Generating…"
          : hasExisting
            ? "Generate new version →"
            : "Generate draft →"}
      </button>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
export function ClientWorkspace({
  clientId,
  name,
  goal,
  days,
  preferredDays,
  setGoal,
  setDays,
  setPreferredDays,
  screening,
  setScreening,
  expanded,
  setExpanded,
  activeWorkspaceSection,
  onWorkspaceSectionChange,
  onClose,
  onEditSessions,
  onScreeningUpdated,
  onClientUpdated,
  notify,
  week,
  programme,
  location,
  detail,
  loading,
  error,
  mobileWorkoutSessionId,
  mobileWorkoutSessionName,
  mobileWorkoutDayOfWeek,
  onMobileWorkoutOpened,
  weekNumber,
  onWeekChange,
  qualitySettings,
  onProgrammeChanged,
  caseStudyDraft,
}: {
  clientId: string;
  name: string;
  goal: string;
  days: number;
  preferredDays: number[];
  setGoal: (v: string) => void;
  setDays: (v: number) => void;
  setPreferredDays: (v: number[]) => void;
  screening: boolean;
  setScreening: (v: boolean) => void;
  expanded: string | null;
  setExpanded: (v: string | null) => void;
  activeWorkspaceSection: "overview" | "assessment" | "programme" | "quality" | "history";
  onWorkspaceSectionChange: (
    section: "overview" | "assessment" | "programme" | "quality" | "history",
  ) => void;
  onClose: () => void;
  onEditSessions: () => void;
  onScreeningUpdated: () => void;
  onClientUpdated: () => void;
  notify: (v: string) => void;
  week: Exercise[];
  programme: ClientDetail["programme"];
  location: ClientDetail["location"] | undefined;
  detail: ClientDetail | null;
  loading: boolean;
  error: string;
  mobileWorkoutSessionId?: string | null;
  mobileWorkoutSessionName?: string | null;
  mobileWorkoutDayOfWeek?: number | null;
  onMobileWorkoutOpened?: () => void;
  weekNumber: number | null;
  onWeekChange: (week: number | null) => void;
  qualitySettings: QualitySettings;
  onProgrammeChanged: () => void;
  caseStudyDraft?: {
    clientId: string;
    hasExisting: boolean;
    onSaved: () => void;
  };
}) {
  const [saving, setSaving] = useState(false);
  const [showWorkoutLog, setShowWorkoutLog] = useState(false);
  const [showScreeningReview, setShowScreeningReview] = useState(false);
  const [showClientEdit, setShowClientEdit] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null,
  );
  const launchedSession =
    programme?.sessions.find((session) => session.id === mobileWorkoutSessionId) ??
    programme?.sessions.find(
      (session) =>
        session.name === mobileWorkoutSessionName &&
        session.dayOfWeek === mobileWorkoutDayOfWeek,
    );
  const selectedSession =
    launchedSession ??
    programme?.sessions.find((session) => session.id === selectedSessionId) ??
    programme?.sessions[0];
  const selectedExercises = selectedSession?.exercises ?? week;
  useEffect(() => {
    if (!mobileWorkoutSessionId || loading || !launchedSession) return;
    if (selectedSession?.id !== launchedSession.id) {
      setSelectedSessionId(launchedSession.id);
    }
    const openTimer = window.setTimeout(() => {
      setShowWorkoutLog(true);
      onMobileWorkoutOpened?.();
    }, 0);
    return () => window.clearTimeout(openTimer);
  }, [launchedSession, loading, mobileWorkoutSessionId, onMobileWorkoutOpened, selectedSession?.id]);
  useEffect(() => {
    if (programme || loading) return;
    const manageButton = document.querySelector<HTMLButtonElement>(
      ".workspace-drawer .plan-header .more-button",
    );
    if (!manageButton) return;
    manageButton.textContent = "Build programme";
    manageButton.setAttribute("aria-label", "Build programme");
    const openBuilder = (event: Event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      onEditSessions();
    };
    manageButton.addEventListener("click", openBuilder, true);
    return () => manageButton.removeEventListener("click", openBuilder, true);
  }, [programme, loading, onEditSessions]);
  useEffect(() => {
    const drawer = document.querySelector<HTMLElement>(".workspace-drawer");
    if (!drawer) return;
    const colour = clientColor(name, detail?.client.clientColour);
    drawer.classList.add(colour);
    return () => drawer.classList.remove(colour);
  }, [name, loading, detail?.client.clientColour]);
  function scrollToSection(
    _id: string,
    section:
      | "overview"
      | "assessment"
      | "programme"
      | "quality"
      | "history" = "overview",
  ) {
    onWorkspaceSectionChange(section);
  }
  if (loading)
    return (
      <div className="workspace-overlay">
        <div className="workspace-drawer workspace-loading">
          <header className="workspace-header">
            <div>
              <p className="eyebrow">CLIENT WORKSPACE</p>
              <h1>{name}</h1>
              <p className="panel-muted">Loading client record…</p>
            </div>
            <button className="close-button" onClick={onClose}>
              ×
            </button>
          </header>
          <div className="workspace-loading-card">
            <div className="loading-orbit">A</div>
            <h2>Loading client workspace</h2>
            <p>Retrieving assessment, programme history and saved sessions.</p>
          </div>
        </div>
      </div>
    );
  if (error)
    return (
      <div className="workspace-overlay">
        <div className="workspace-drawer workspace-loading">
          <header className="workspace-header">
            <div>
              <p className="eyebrow">CLIENT WORKSPACE</p>
              <h1>{name}</h1>
              <p className="panel-muted">Client details could not be loaded</p>
            </div>
            <button className="close-button" onClick={onClose}>
              ×
            </button>
          </header>
          <div className="workspace-loading-card">
            <h2>Unable to load this client</h2>
            <p>{error}</p>
            <button
              className="primary-button"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  async function saveDraft() {
    if (!selectedExercises.length) {
      notify("Add exercises before saving the first draft");
      return;
    }
    setSaving(true);
    try {
      const draftSessions =
        programme?.sessions ?? (selectedSession ? [selectedSession] : []);
      const toDraft = (exercise: Exercise) => ({
        name: exercise.name,
        pattern: exercise.pattern,
        sets:
          exercise.sets ??
          Number(exercise.prescription.match(/^\d+/)?.[0] ?? 2),
        repsMin:
          exercise.repsMin ??
          Number(exercise.prescription.match(/×\s*(\d+)/)?.[1] ?? 8),
        repsMax:
          exercise.repsMax ??
          Number(exercise.prescription.match(/–(\d+)/)?.[1] ?? 12),
        intensityValue: exercise.intensityValue ?? "2 RIR",
        restSeconds: exercise.restSeconds ?? 90,
        tempo: exercise.tempo ?? "",
        progressionRule: exercise.progressionRule ?? "",
      });
      const firstDraftExercises =
        draftSessions[0]?.exercises ?? selectedExercises;
      const result = await saveProgrammeAction({
        clientId,
        clientName: name,
        goalSummary: goal,
        trainingDays: draftSessions.length || days,
        sessionDurationMinutes:
          draftSessions[0]?.durationMinutes ??
          detail?.client.sessionDurationMinutes ??
          45,
        sessionDays: draftSessions.map((session) => session.dayOfWeek),
        sessionNames: Object.fromEntries(
          draftSessions.map((session) => [
            String(session.dayOfWeek),
            session.name,
          ]),
        ),
        sessionTimes: Object.fromEntries(
          draftSessions.map((session) => [String(session.dayOfWeek), session.scheduledTime ?? ""]),
        ),
        sessionManagement: Object.fromEntries(
          draftSessions.map((session) => [String(session.dayOfWeek), session.managementMode ?? "pt_managed"]),
        ),
        exercises: firstDraftExercises.map(toDraft),
        sessionExercises: Object.fromEntries(
          draftSessions.map((session) => [
            String(session.dayOfWeek),
            session.exercises.map(toDraft),
          ]),
        ),
      });
      notify(`Draft saved · version ${result.version}`);
      onProgrammeChanged();
    } catch (error) {
      notify(
        error instanceof Error ? error.message : "Draft could not be saved",
      );
    } finally {
      setSaving(false);
    }
  }
  async function downloadReport() {
    const reportWindow = window.open(
      `/api/designer/report?clientName=${encodeURIComponent(name)}&format=html`,
      "_blank",
      "noopener,noreferrer",
    );
    if (!reportWindow) notify("Allow pop-ups to open the print-ready report");
    else notify("Print-ready report opened");
  }
  const qualityReadiness =
    detail?.quality?.approvalReadiness === "blocked"
      ? "Blocked"
      : detail?.quality?.approvalReadiness === "needs_review"
        ? "Needs review"
        : detail?.quality?.approvalReadiness === "pt_consideration"
          ? "PT consideration"
          : "Ready for PT approval";
  return (
    <>
      <div className="workspace-overlay">
        <div className="workspace-drawer">
          <header className="workspace-header">
            <div>
              <p className="eyebrow">CLIENT WORKSPACE</p>
              <h1>{name}</h1>
              <p className="panel-muted">
                {loading
                  ? "Loading client record…"
                  : `${days} days / week · ${selectedSession?.durationMinutes ?? 45} min · ${location?.name ?? "Location not set"}`}
              </p>
            </div>
            <button className="close-button" onClick={onClose}>
              ×
            </button>
          </header>
          <div
            className="workspace-tabs"
            role="tablist"
            aria-label="Client workspace sections"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeWorkspaceSection === "overview"}
              className={activeWorkspaceSection === "overview" ? "active" : ""}
              onClick={() => scrollToSection("client-overview", "overview")}
            >
              Overview
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeWorkspaceSection === "assessment"}
              className={
                activeWorkspaceSection === "assessment" ? "active" : ""
              }
              onClick={() => scrollToSection("client-assessment", "assessment")}
            >
              Assessment
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeWorkspaceSection === "programme"}
              className={activeWorkspaceSection === "programme" ? "active" : ""}
              onClick={() => scrollToSection("client-programme", "programme")}
            >
              Programme
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeWorkspaceSection === "quality"}
              className={activeWorkspaceSection === "quality" ? "active" : ""}
              onClick={() => scrollToSection("client-quality-tab", "quality")}
            >
              Quality
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeWorkspaceSection === "history"}
              className={activeWorkspaceSection === "history" ? "active" : ""}
              onClick={() => scrollToSection("client-history", "history")}
            >
              History
            </button>
          </div>
          <div className="workspace-body">
            {activeWorkspaceSection === "overview" && (
              <div
                className="client-column workspace-section workspace-section-selected"
                id="client-overview"
              >
                <section className="client-hero">
                  <div className="large-avatar">
                    {name
                      .split(" ")
                      .map((part) => part[0])
                      .join("")
                      .slice(0, 2)}
                  </div>
                  <div>
                    <span className="status-pill">Active client</span>
                    <h2>{goal}</h2>
                    <p>
                      {days} days / week ·{" "}
                      {location?.locationType ?? "Training location not set"}
                    </p>
                  </div>
                </section>
                <section
                  className={`warning-card ${screening ? "warning-card-attention" : "warning-card-clear"}`}
                >
                  <div className="warning-symbol">{screening ? "!" : "✓"}</div>
                  <div>
                    <strong>
                      {screening
                        ? "Screening review required"
                        : "Screening recorded"}
                    </strong>
                    <p>
                      {screening
                        ? "Review the stored screening flags and follow the appropriate referral or clearance process before finalising high-risk work."
                        : "No current screening flags require escalation."}
                    </p>
                  </div>
                  {screening ? (
                    <button onClick={() => setShowScreeningReview(true)}>
                      Review screening →
                    </button>
                  ) : (
                    <span className="warning-card-status">No action required</span>
                  )}
                </section>
                <section className="inner-panel client-snapshot-panel">
                  <div className="inner-heading">
                    <h3>Client snapshot</h3>
                    <button
                      className="text-button"
                      onClick={() => setShowClientEdit(true)}
                    >
                      Edit
                    </button>
                  </div>
                  <label>
                    PRIMARY GOAL
                    <select
                      value={goal}
                      onChange={(e) => setGoal(e.target.value)}
                    >
                      {PT_GOALS.map((option) => (
                        <option key={option}>{option}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    TRAINING DAYS
                    <div className="segmented">
                      {[2, 3, 4].map((day) => (
                        <button
                          key={day}
                          className={days === day ? "selected" : ""}
                          onClick={() => setDays(day)}
                        >
                          {day} days
                        </button>
                      ))}
                    </div>
                  </label>
                  <div className="mini-facts">
                    <span>
                      <b>Sleep</b> {detail?.client.sleepHours ?? "Not recorded"}
                    </span>
                    <span>
                      <b>Stress</b>{" "}
                      {detail?.client.stressLevel ?? "Not recorded"}
                    </span>
                    <span>
                      <b>Assessment</b>{" "}
                      {detail?.assessment?.assessmentDate ?? "Not recorded"}
                    </span>
                    <span>
                      <b>Location</b> {location?.name ?? "Not recorded"}
                    </span>
                  </div>
                  {detail?.client.notes && (
                    <p className="client-notes-preview">
                      <b>Notes</b> {detail.client.notes}
                    </p>
                  )}
                </section>
              </div>
            )}
            {activeWorkspaceSection === "programme" && (
              <aside
                className="plan-column workspace-section workspace-section-selected"
                id="client-programme"
              >
                <div className="plan-header">
                  <div>
                    <p className="eyebrow">
                      {programme ? "SAVED PROGRAMME" : "PROGRAMME BUILDER"}
                    </p>
                    <h2>
                      {programme
                        ? `${programme.name} / Week ${programme.week?.weekNumber ?? programme.currentWeek}`
                        : "No programme saved yet"}
                    </h2>
                  </div>
                  <button
                    className="more-button"
                    onClick={() =>
                      scrollToSection("programme-actions", "programme")
                    }
                    aria-label="Jump to programme actions"
                  >
                    Manage
                  </button>
                </div>
                {programme ? (
                  <>
                    <label className="week-selector">
                      <span>
                        <small>PROGRAMME WEEK</small>
                        <strong>
                          Week{" "}
                          {programme.week?.weekNumber ?? programme.currentWeek}
                        </strong>
                      </span>
                      <select
                        value={weekNumber ?? programme.currentWeek}
                        onChange={(event) =>
                          onWeekChange(Number(event.target.value))
                        }
                      >
                        {(programme.weekOptions.length
                          ? programme.weekOptions
                          : [
                              {
                                weekNumber: programme.currentWeek,
                                focus:
                                  programme.week?.focus ?? "Programme week",
                                volumeTarget: null,
                                intensityTarget: null,
                              },
                            ]
                        ).map((option) => (
                          <option
                            key={option.weekNumber}
                            value={option.weekNumber}
                          >
                            Week {option.weekNumber} · {option.focus}
                          </option>
                        ))}
                      </select>
                    </label>
                    <div className="session-tabs">
                      {programme.sessions.map((session) => (
                        <button
                          type="button"
                          key={session.id}
                          className={
                            session.id === selectedSession?.id ? "active" : ""
                          }
                          onClick={() => setSelectedSessionId(session.id)}
                        >
                          {[
                            "Sunday",
                            "Monday",
                            "Tuesday",
                            "Wednesday",
                            "Thursday",
                            "Friday",
                            "Saturday",
                          ][session.dayOfWeek % 7]
                            .slice(0, 3)
                            .toUpperCase()}{" "}
                          <b>{session.name}</b>
                        </button>
                      ))}
                    </div>
                    <div className="session-title">
                      <div>
                        <h3>
                          {selectedSession?.name ?? "Programme sessions"}
                          {programme.aiImported && <span className="ai-origin-badge">AI-drafted · PT approved</span>}
                        </h3>
                        <p>
                          {selectedSession?.durationMinutes ?? 0} min · {selectedSession?.scheduledTime ? `at ${selectedSession.scheduledTime} · ` : ""}{selectedSession?.managementMode === "self_managed" ? "Self-managed · " : "PT-managed · "}Week{" "}
                          {programme.week?.weekNumber ?? programme.currentWeek}
                        </p>
                      </div>
                      <div className="session-actions">
                        <button
                          className="session-editor-launcher"
                          onClick={onEditSessions}
                        >
                          Edit all sessions
                        </button>
                        <button
                          className="edit-button"
                          onClick={() => setShowWorkoutLog(true)}
                        >
                          Log result
                        </button>
                      </div>
                    </div>
                    {selectedSession && (
                      <SessionSchedulingPanel
                        sessionId={selectedSession.id}
                        scheduledTime={selectedSession.scheduledTime}
                        managementMode={selectedSession.managementMode}
                        onSaved={onProgrammeChanged}
                        notify={notify}
                      />
                    )}
                    <div className="exercise-list">
                      {selectedExercises.length ? (
                        selectedExercises.map((exercise, index) => (
                          <ExerciseCard
                            key={exercise.name}
                            exercise={exercise}
                            index={index}
                            expanded={expanded === exercise.name}
                            onToggle={() =>
                              setExpanded(
                                expanded === exercise.name
                                  ? null
                                  : exercise.name,
                              )
                            }
                            notify={notify}
                            onEdit={onEditSessions}
                          />
                        ))
                      ) : (
                        <div className="dashboard-empty">
                          No prescriptions saved for this session yet.
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="dashboard-empty">
                    No saved programme is linked to this client yet. Build and
                    save a draft from the programme editor once exercises are
                    selected.
                  </div>
                )}
                <div className="quality-card">
                  <div className="quality-score">
                    {programme ? (detail?.quality?.score ?? "—") : ""}
                  </div>
                  <div>
                    <strong>Programme quality check</strong>
                    <p>
                      {programme
                        ? detail?.quality
                          ? `${qualityReadiness} · ${detail.quality.emptySessions} of ${detail.quality.scheduledSessions} scheduled sessions empty · ${detail.quality.counts.significant} significant · ${detail.quality.counts.advisory} advisories`
                          : "Quality review is not available yet."
                        : "Quality checks will appear after a draft programme is saved."}
                    </p>
                  </div>
                  {programme && (
                    <button
                      className="more-button"
                      onClick={() =>
                        scrollToSection("client-quality-summary", "programme")
                      }
                      aria-label="Review programme quality"
                    >
                      Review
                    </button>
                  )}
                </div>
                {caseStudyDraft && (
                  <CaseStudyDraftButton
                    clientId={clientId}
                    hasExisting={caseStudyDraft.hasExisting}
                    onSaved={caseStudyDraft.onSaved}
                    notify={notify}
                  />
                )}
                <div className="plan-footer-actions" id="programme-actions">
                  <button className="outline-button" onClick={downloadReport}>
                    Download report
                  </button>
                  <button
                    className="assign-button"
                    onClick={selectedExercises.length ? saveDraft : onEditSessions}
                    disabled={saving}
                  >
                    {saving
                      ? "Saving draft…"
                      : selectedExercises.length
                        ? "Save draft & review →"
                        : "Build programme →"}
                  </button>
                </div>
              </aside>
            )}
          </div>
        </div>
        {showWorkoutLog && selectedSession && (
          <WorkoutLogModalV2
            clientId={detail?.client.id ?? ""}
            clientName={name}
            session={selectedSession}
            onClose={() => {
              setShowWorkoutLog(false);
            }}
            onSaved={() => {
              setShowWorkoutLog(false);
              notify("Workout result saved");
            }}
          />
        )}
      </div>
      {showScreeningReview && (
        <ScreeningReviewDialog
          clientId={clientId}
          onClose={() => setShowScreeningReview(false)}
          onSaved={() => {
            setShowScreeningReview(false);
            onScreeningUpdated();
          }}
          notify={notify}
        />
      )}
      {showClientEdit && detail && (
        <ClientEditDialog
          client={detail.client}
          onClose={() => setShowClientEdit(false)}
          onSaved={() => {
            setShowClientEdit(false);
            onClientUpdated();
          }}
          notify={notify}
        />
      )}
    </>
  );
}
const GUIDED_ONBOARDING_STAGES = [
  {
    title: "Client details",
    summary: "Profile, goals, schedule and session length",
    action: "Review profile",
  },
  {
    title: "Assessment & safety",
    summary: "Screening, constraints and PT notes",
    action: "Open assessment",
  },
  {
    title: "Preferences",
    summary: "Communication, coaching and session preferences",
    action: "Open preferences",
  },
  {
    title: "Location & equipment",
    summary: "Confirm what is available at this location",
    action: "Review location",
  },
  {
    title: "Programme setup",
    summary: "Build, review and save the first programme",
    action: "Build programme",
  },
  {
    title: "Log the first workout",
    summary: "Record what happened and use it to guide the next session",
    action: "Open programme",
  },
] as const;
export function WorkspaceSupportPortal({
  clientId,
  name,
  goal,
  days,
  detail,
  programme,
  screening,
  qualitySettings,
  activeWorkspaceSection,
  onWorkspaceSectionChange,
  guidedOnboarding,
  onFinishGuidedOnboarding,
  onEditSessions,
  onAiImportApproved,
  onScreeningUpdated,
  onClientUpdated,
  onProgrammeChanged,
  notify,
}: {
  clientId: string;
  name: string;
  goal: string;
  days: number;
  detail: ClientDetail | null;
  programme: ClientDetail["programme"];
  screening: boolean;
  qualitySettings: QualitySettings;
  activeWorkspaceSection: "overview" | "assessment" | "programme" | "quality" | "history";
  onWorkspaceSectionChange: (
    section: "overview" | "assessment" | "programme" | "quality" | "history",
  ) => void;
  guidedOnboarding: boolean;
  onFinishGuidedOnboarding: () => void;
  onEditSessions: () => void;
  onAiImportApproved: (approval: AiProgrammeImportApproval) => void;
  onScreeningUpdated: () => void;
  onClientUpdated: () => void;
  onProgrammeChanged: () => void;
  notify: (message: string) => void;
}) {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const [showAssessment, setShowAssessment] = useState(false);
  const [showRationale, setShowRationale] = useState(false);
  const [guidedStep, setGuidedStep] = useState(1);
  const [completedStages, setCompletedStages] = useState<number[]>([0]);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [moreToolsOpen, setMoreToolsOpen] = useState(false);
  useEffect(() => {
    // The drawer is the sibling portal host created by the parent workspace.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTarget(document.querySelector<HTMLElement>(".workspace-drawer"));
  }, []);
  useEffect(() => {
    if (!preferencesOpen) return;
    window.setTimeout(
      () =>
        document
          .querySelector<HTMLElement>(".client-preferences-modal input")
          ?.focus(),
      0,
    );
  }, [preferencesOpen]);
  if (!target || !detail) return null;
  const initialPreferredDays = preferredDayValues(detail.client.preferredDays);
  const currentStage = GUIDED_ONBOARDING_STAGES[guidedStep];
  function openGuidedStage() {
    if (guidedStep === 0) {
      onWorkspaceSectionChange("overview");
      document
        .getElementById("client-overview")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else if (guidedStep === 1) {
      onWorkspaceSectionChange("assessment");
      setShowAssessment(true);
    } else if (guidedStep === 2) {
      onWorkspaceSectionChange("overview");
      setPreferencesOpen(true);
    } else if (guidedStep === 3) {
      onWorkspaceSectionChange("overview");
      document
        .getElementById("client-location")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
      window.setTimeout(
        () =>
          document
            .querySelector<HTMLElement>("#client-location input")
            ?.focus(),
        250,
      );
    } else if (guidedStep === 4) {
      onWorkspaceSectionChange("programme");
      onEditSessions();
    } else {
      onWorkspaceSectionChange("programme");
      document
        .getElementById("client-programme")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
      notify(
        programme
          ? "Use Log result on the assigned session to record the workout"
          : "Build and save the programme before logging the first workout",
      );
    }
  }
  function completeGuidedStage() {
    setCompletedStages((current) =>
      current.includes(guidedStep) ? current : [...current, guidedStep],
    );
    setGuidedStep((current) =>
      Math.min(current + 1, GUIDED_ONBOARDING_STAGES.length - 1),
    );
  }
  async function copyRationale() {
    const rationale = programme?.rationale ?? "";
    if (!rationale) {
      notify("Save a programme draft to create a rationale");
      return;
    }
    try {
      await navigator.clipboard.writeText(rationale);
      notify("Rationale copied to clipboard");
    } catch {
      notify("Copy was blocked; select the rationale text manually");
    }
  }
  return createPortal(
    <div
      className={`workspace-support-stack workspace-support-${activeWorkspaceSection}`}
    >
      {guidedOnboarding && (
        <section
          className="guided-onboarding-panel"
          aria-labelledby="guided-onboarding-title"
        >
          <div className="guided-onboarding-header">
            <div>
              <p className="eyebrow">NEW CLIENT ONBOARDING</p>
              <h2 id="guided-onboarding-title">
                New Client Onboarding
              </h2>
              <p>
                Work through the stages in order, or jump to any stage when you
                already have the information. You can finish this guide at any
                time.
              </p>
            </div>
            <button
              type="button"
              className="text-button"
              onClick={onFinishGuidedOnboarding}
            >
              Skip guide
            </button>
          </div>
          <div
            className="guided-onboarding-progress"
            aria-label="Onboarding stages"
          >
            {GUIDED_ONBOARDING_STAGES.map((stage, index) => (
              <button
                type="button"
                key={stage.title}
                className={`${index === guidedStep ? "active" : ""} ${completedStages.includes(index) ? "complete" : ""}`}
                onClick={() => setGuidedStep(index)}
              >
                <span>{completedStages.includes(index) ? "✓" : index + 1}</span>
                <strong>{stage.title}</strong>
              </button>
            ))}
          </div>
          <div className="guided-onboarding-stage">
            <div>
              <p className="eyebrow">
                STAGE {guidedStep + 1} OF {GUIDED_ONBOARDING_STAGES.length}
              </p>
              <h3>{currentStage.title}</h3>
              <p>{currentStage.summary}</p>
            </div>
            <div className="guided-onboarding-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() =>
                  setGuidedStep((current) => Math.max(0, current - 1))
                }
                disabled={guidedStep === 0}
              >
                Back
              </button>
              <button
                type="button"
                className="outline-button"
                onClick={openGuidedStage}
              >
                {currentStage.action} →
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={
                  guidedStep === GUIDED_ONBOARDING_STAGES.length - 1
                    ? onFinishGuidedOnboarding
                    : completeGuidedStage
                }
              >
                {guidedStep === GUIDED_ONBOARDING_STAGES.length - 1
                  ? "Finish guide"
                  : "Mark complete & continue"}
              </button>
            </div>
          </div>
        </section>
      )}
      <section className="inner-panel assessment-panel" id="client-assessment">
        <div className="inner-heading">
          <div>
            <p className="eyebrow">ASSESSMENT & SAFETY</p>
            <h3>Screening and constraints</h3>
          </div>
          <button
            className="text-button"
            onClick={() => setShowAssessment(true)}
          >
            Edit assessment
          </button>
        </div>
        <div className="assessment-facts">
          <span>
            <b>Status</b>
            {screening ? "Review required" : "Reviewed / no current flag"}
          </span>
          <span>
            <b>Assessment date</b>
            {detail.assessment?.assessmentDate ?? "Not recorded"}
          </span>
          <span>
            <b>Review date</b>
            {detail.assessment?.reviewDate ?? "Not recorded"}
          </span>
        </div>
        <div className="assessment-notes">
          <p>
            <b>Injuries, pain or limitations</b>
            {detail.assessment?.injuryNotes || "None recorded"}
          </p>
          <p>
            <b>Contraindications / restrictions</b>
            {detail.assessment?.contraindicationNotes || "None recorded"}
          </p>
          <p>
            <b>PT assessment notes</b>
            {detail.assessment?.ptNotes || "None recorded"}
          </p>
        </div>
        {screening && (
          <div className="screening-clearance-banner" role="alert">
            <span className="screening-clearance-icon" aria-hidden="true">!</span>
            <div>
              <strong>Clearance / screening action required</strong>
              <p>
                This safety flag is carried into programme review and can block
                assignment. Resolve the screening or clearance decision here
                before assigning.
              </p>
            </div>
          </div>
        )}
      </section>
      <ClientTimelinePanel items={detail.timeline} />
      <div className="workspace-support-grid">
        {programme && (
          <ProgrammeQualityCardV3
            programme={programme}
            quality={detail.quality}
            onChanged={onProgrammeChanged}
            onOpenSection={onWorkspaceSectionChange}
          />
        )}
        <ProgrammeHistoryPanelV2
          history={detail.programmeHistory}
          events={programme?.events ?? []}
        />
        {programme && (
          <ProgrammeLifecycleControls
            programme={programme}
            onChanged={onProgrammeChanged}
            notify={notify}
          />
        )}
      </div>
      <div className="workspace-actions-row">
        <ClientSnapshotSaveButton
          clientId={clientId}
          goal={goal}
          days={days}
          preferredDays={initialPreferredDays}
          duration={
            programme?.sessions[0]?.durationMinutes ??
            detail.client.sessionDurationMinutes ??
            45
          }
          notify={notify}
        />
        {!programme && <FirstProgrammeButton onClick={onEditSessions} />}
      </div>
      <PreferredDaysPanel
        clientId={clientId}
        initialDays={initialPreferredDays}
        goal={goal}
        duration={
          programme?.sessions[0]?.durationMinutes ??
          detail.client.sessionDurationMinutes ??
          45
        }
        notify={notify}
        onSaved={onClientUpdated}
      />
      <LocationEquipmentPanel
        clientId={clientId}
        location={detail.location}
        notify={notify}
        onSaved={onClientUpdated}
      />
      <section className="pt-tools-panel">
        <div>
          <p className="eyebrow">PT TOOLS</p>
          <h3>Review and adapt</h3>
          <p>
            Open focused tools when you need them. The main client record stays
            uncluttered.
          </p>
        </div>
        <div className="pt-tools-grid">
          <div className="pt-tools-group-label">CORE TOOLS</div>
          <ClientProgressLauncher clientId={clientId} />
          <ClientPerformanceLauncher clientId={clientId} notify={notify} />
          <ClientPreferencesLauncher
            clientId={clientId}
            notify={notify}
            open={preferencesOpen}
            onOpenChange={setPreferencesOpen}
          />
          <button type="button" className="pt-tools-more-button" onClick={() => setMoreToolsOpen((value) => !value)} aria-expanded={moreToolsOpen}>
            {moreToolsOpen ? "Hide advanced tools" : "More tools"}
          </button>
          {moreToolsOpen && (<div className="pt-tools-advanced"><div className="pt-tools-group-label">ADVANCED TOOLS</div>
          {programme && <ProgressionReviewLauncher clientId={clientId} />}{" "}
          {programme && (
            <SubstitutionReviewLauncher
              clientId={clientId}
              exercises={programme.sessions.flatMap(
                (session) => session.exercises,
              )}
            />
          )}
          <PromptBuilderLauncher clientId={clientId} notify={notify} />
          <AiProgrammeImportLauncher
            clientName={name}
            existingSessions={programme?.sessions}
            notify={notify}
            onApproved={onAiImportApproved}
          />
          {programme && (
            <button
              type="button"
              className="pt-tool-button pt-tool-rationale"
              onClick={() => setShowRationale((value) => !value)}
              aria-expanded={showRationale}
            >
              Programming rationale
            </button>
          )}
          <a
            className="client-data-export-link"
            href={`/api/designer/client/export?clientId=${encodeURIComponent(clientId)}`}
            download
          >
            Export client record
          </a>
          </div>)}
        </div>
      </section>
      {showRationale && programme && (
        <section
          className="rationale-panel workspace-section-selected"
          id="client-rationale"
        >
          <div className="inner-heading">
            <div>
              <p className="eyebrow">PROGRAMMING CONTEXT</p>
              <h3>Programming rationale</h3>
            </div>
            <span className="sparkle">✦</span>
          </div>
          <p>
            {programme.rationale ??
              "No rationale has been recorded for this programme yet."}
          </p>
          <button className="outline-button" onClick={copyRationale}>
            Copy rationale
          </button>
        </section>
      )}
      {showAssessment && (
        <ClientAssessmentDialog
          clientId={clientId}
          assessment={detail.assessment}
          onClose={() => setShowAssessment(false)}
          onSaved={() => {
            setShowAssessment(false);
            onScreeningUpdated();
          }}
          notify={notify}
        />
      )}
    </div>,
    target,
  );
}
function ClientTimelinePanel({ items }: { items: ClientTimelineItem[] }) {
  const [expanded, setExpanded] = useState(false);
  const labels: Record<ClientTimelineItem["kind"], string> = {
    profile: "Profile",
    assessment: "Screening",
    goal: "Goal",
    location: "Location",
    preferences: "Preferences",
    programme: "Programme",
    quality: "Quality review",
    event: "Programme event",
    workout: "Workout",
    performance: "Performance",
  };
  return (
    <section
      className={`client-timeline-panel ${expanded ? "is-expanded" : "is-collapsed"}`}
      id="client-timeline"
    >
      <div className="panel-heading">
        <div>
          <p className="eyebrow">CLIENT TIMELINE</p>
          <h2>What has changed</h2>
        </div>
        <div className="client-timeline-controls">
          <span>
            {items.length} record{items.length === 1 ? "" : "s"}
          </span>
          <button
            type="button"
            className="text-button"
            onClick={() => setExpanded((value) => !value)}
            aria-expanded={expanded}
          >
            {expanded ? "Collapse" : "Show history"}
          </button>
        </div>
      </div>
      {expanded &&
        (items.length ? (
          <div className="client-timeline-list">
            {items.slice(0, 20).map((item) => (
              <article
                className={`client-timeline-item timeline-${item.tone}`}
                key={item.id}
              >
                <span className="client-timeline-marker" aria-hidden="true" />
                <div>
                  <div className="client-timeline-meta">
                    <strong>{labels[item.kind]}</strong>
                    <time dateTime={item.date}>
                      {new Date(item.date).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </time>
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.detail}</p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="dashboard-empty">
            The timeline will appear as the client record develops.
          </p>
        ))}
      {expanded && items.length > 20 && (
        <small className="panel-muted">Showing the latest 20 records.</small>
      )}
    </section>
  );
}
function LocationEquipmentPanel({
  clientId,
  location,
  notify,
  onSaved,
}: {
  clientId: string;
  location: ClientDetail["location"];
  notify: (message: string) => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(location?.name ?? "");
  const [locationType, setLocationType] = useState(
    location?.locationType ?? "Full gym",
  );
  const [equipment, setEquipment] = useState<string[]>(
    Array.isArray(location?.equipment)
      ? location.equipment.filter(
          (item): item is string => typeof item === "string",
        )
      : [],
  );
  const [saving, setSaving] = useState(false);
  const options = [
    "Dumbbells",
    "Machines",
    "Cable",
    "Barbell",
    "Trap bar",
    "Rack",
    "Bands",
    "Bike",
    "Kettlebell",
    "TRX",
    "Gymnastic rings",
    "Open space",
  ];
  const hasRecordedLocation = Boolean(location?.name);
  const confirmedEquipment = hasRecordedLocation
    ? options.filter((item) => equipment.includes(item))
    : [];
  const unconfirmedEquipment = hasRecordedLocation
    ? options.filter((item) => !equipment.includes(item))
    : [];
  function toggle(item: string) {
    setEquipment((current) =>
      current.includes(item)
        ? current.filter((value) => value !== item)
        : [...current, item],
    );
  }
  async function save() {
    setSaving(true);
    try {
      await updateClientLocationAction({
        clientId,
        name: name || "Training location",
        locationType,
        equipment,
      });
      notify("Location equipment saved; quality checks refreshed");
      onSaved();
    } catch (error) {
      notify(
        error instanceof Error ? error.message : "Location could not be saved",
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <section
      id="client-location"
      className="inner-panel location-equipment-panel"
    >
      <div className="inner-heading">
        <div>
          <p className="eyebrow">TRAINING LOCATION</p>
          <h3>Equipment confirmation</h3>
        </div>
        <span className="panel-muted">Exact matches</span>
      </div>
      <div className="onboarding-fields">
        <label>
          Location name
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <label>
          Location type
          <select
            value={locationType}
            onChange={(event) => setLocationType(event.target.value)}
          >
            <option>Full gym</option>
            <option>Home gym</option>
            <option>Minimal equipment</option>
            <option>Outdoor</option>
          </select>
        </label>
      </div>
      <p className="equipment-help">
        Select only equipment confirmed at this location. Unchecked items stay
        unverified for programme quality checks.
      </p>
      {!hasRecordedLocation && (
        <div className="equipment-unknown-state">
          <strong>Unknown — no location has been saved yet.</strong>
          <span>
            Save the location details before treating any equipment as confirmed
            or not confirmed.
          </span>
        </div>
      )}
      <div className="equipment-groups">
        <div className="equipment-group">
          <strong>
            Confirmed available here <span>{confirmedEquipment.length}</span>
          </strong>
          <div className="equipment-picker">
            {confirmedEquipment.length ? (
              confirmedEquipment.map((item) => (
                <button
                  type="button"
                  key={item}
                  className="chosen"
                  onClick={() => toggle(item)}
                >
                  ✓ {item}
                </button>
              ))
            ) : (
              <small>
                {hasRecordedLocation
                  ? "No equipment confirmed yet."
                  : "Unknown until this location is saved."}
              </small>
            )}
          </div>
        </div>
        <div className="equipment-group equipment-group-muted">
          <strong>
            Not confirmed at this location{" "}
            <span>{unconfirmedEquipment.length}</span>
          </strong>
          <div className="equipment-picker">
            {unconfirmedEquipment.map((item) => (
              <button type="button" key={item} onClick={() => toggle(item)}>
                + {item}
              </button>
            ))}
          </div>
          {hasRecordedLocation && !unconfirmedEquipment.length && (
            <small>Every listed option is confirmed.</small>
          )}
        </div>
      </div>
      <button
        className="workspace-save-button"
        onClick={save}
        disabled={saving}
      >
        {saving ? "Saving location details…" : "Save location details"}
      </button>
    </section>
  );
}
function ProgrammeQualityCardV3({
  programme,
  quality,
  onChanged,
  onOpenSection,
}: {
  programme: NonNullable<ClientDetail["programme"]>;
  quality: QualityReview | null;
  onChanged: () => void;
  onOpenSection: (section: "overview" | "assessment" | "programme" | "quality" | "history") => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [showOverride, setShowOverride] = useState(false);
  const [selectedKey, setSelectedKey] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const review = quality;
  const visibleFindings =
    review?.findings.filter((item) => !item.acknowledged) ?? [];
  const actionable = visibleFindings.filter(
    (item) => item.severity === "advisory" || item.severity === "info",
  );
  async function recordDecision() {
    const item = review?.findings.find(
      (finding) => finding.key === selectedKey,
    );
    if (!item || !reason.trim()) return;
    setSaving(true);
    try {
      await recordProgrammeOverrideAction({
        programmeId: programme.id,
        warningCodes: [item.key],
        reason,
        decision: "acknowledged",
      });
      setSelectedKey("");
      setReason("");
      setShowOverride(false);
      onChanged();
    } finally {
      setSaving(false);
    }
  }
  const readiness =
    review?.approvalReadiness === "blocked"
      ? "Blocked"
      : review?.approvalReadiness === "needs_review"
        ? "Needs review"
        : review?.approvalReadiness === "pt_consideration"
          ? "PT consideration"
          : "Ready for PT approval";
  return (
    <section
      id="client-quality-summary"
      className={`quality-summary${collapsed ? " is-collapsed" : ""}`}
      aria-label="Live programme quality summary"
    >
      <div className="quality-summary-heading">
        <div>
          <p className="eyebrow">LIVE QUALITY CHECK</p>
          <strong>
            Quality {review?.score ?? "—"} · {readiness}
          </strong>
        </div>
        <button
          className="quality-collapse-button"
          onClick={() => setCollapsed(!collapsed)}
          aria-expanded={!collapsed}
        >
          {collapsed ? "Show" : "Hide"}
        </button>
        <button className="quality-update-button" onClick={onChanged}>
          Update
        </button>
      </div>
      {!collapsed && review && (
        <>
          <p className="quality-summary-meta">
            {review.counts.blocking} blocking · {review.counts.significant}{" "}
            significant · {review.counts.advisory} advisories ·{" "}
            {review.totalSets} total sets
          </p>
          {visibleFindings.length ? (
            <div className="quality-finding-list">
              {visibleFindings
                .sort(
                  (a, b) =>
                    ["blocking", "significant", "advisory", "info"].indexOf(
                      a.severity,
                    ) -
                    ["blocking", "significant", "advisory", "info"].indexOf(
                      b.severity,
                    ),
                )
                .map((item) => (
                  <article
                    className={`quality-finding quality-${item.severity}`}
                    key={item.key}
                  >
                    <div>
                      <strong>{item.title}</strong>
                      <span>
                        {item.severity} · {item.category} · {item.requirement}
                      </span>
                    </div>
                    <p>{item.message}</p>
                    <small>Why it matters: {item.rationale}</small>
                    <small>Consider: {item.suggestedActions.join(" ")}</small>
                    {(item.ruleId === "missing-training-experience" || item.category === "equipment") && (
                      <button type="button" className="quality-finding-link" onClick={() => onOpenSection("overview")}>
                        {item.category === "equipment" ? "Update location & equipment" : "Open client details →"}
                      </button>
                    )}
                    {item.evidence && (
                      <small>
                        Evidence: {item.evidence.source}{" "}
                        {item.evidence.evidenceVersion}
                      </small>
                    )}
                  </article>
                ))}
            </div>
          ) : (
            <p className="quality-summary-good">
              No current findings. The programme is ready for PT approval
              consideration.
            </p>
          )}
          {actionable.length > 0 && (
            <>
              <button
                className="quality-override-button"
                onClick={() => setShowOverride(!showOverride)}
              >
                {showOverride ? "Close PT decision" : "Acknowledge an advisory"}
              </button>
              {showOverride && (
                <div className="quality-override-form">
                  <label>
                    FINDING
                    <select
                      value={selectedKey}
                      onChange={(event) => setSelectedKey(event.target.value)}
                    >
                      <option value="">Choose a finding</option>
                      {actionable.map((item) => (
                        <option key={item.key} value={item.key}>
                          {item.title}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    PT DECISION
                    <textarea
                      value={reason}
                      onChange={(event) => setReason(event.target.value)}
                      placeholder="Record the professional reason for acknowledging this consideration…"
                    />
                  </label>
                  <button
                    onClick={recordDecision}
                    disabled={
                      saving || !selectedKey || reason.trim().length < 3
                    }
                  >
                    {saving ? "Recording…" : "Save PT decision"}
                  </button>
                </div>
              )}
            </>
          )}
          {review.findings.some((item) => item.acknowledged) && (
            <p className="quality-summary-good">
              Acknowledged findings are hidden for this unchanged source
              context. A relevant data change will re-evaluate them.
            </p>
          )}
          <small>
            Last recalculated{" "}
            {new Date(review.evaluatedAt).toLocaleString("en-GB")} · ruleset{" "}
            {review.rulesetVersion} · evidence {review.evidence.evidenceVersion}
            . Decision support for the qualified PT; not diagnosis or medical
            clearance.
          </small>
        </>
      )}
    </section>
  );
}
function ProgrammeHistoryPanelV2({
  history,
  events,
}: {
  history: ClientDetail["programmeHistory"];
  events: Array<{
    id: string;
    action: string;
    details: unknown;
    createdAt: string;
  }>;
}) {
  return (
    <section className="programme-history-panel" id="client-history">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">AUDIT TRAIL</p>
          <h2>Programme history</h2>
        </div>
        <span>
          {history.length} version{history.length === 1 ? "" : "s"} ·{" "}
          {events.length} event{events.length === 1 ? "" : "s"}
        </span>
      </div>
      {history.length ? (
        history.map((item) => (
          <div className="history-version" key={item.id}>
            <strong>Version {item.version}</strong>
            <span>
              {item.name} · {item.status}
            </span>
            <small>
              {new Date(item.updatedAt).toLocaleDateString("en-GB")}
            </small>
          </div>
        ))
      ) : (
        <p className="dashboard-empty">
          No programme versions yet. Save the first draft to start the audit
          trail.
        </p>
      )}
      {events.slice(0, 6).map((event) => (
        <div className="history-event" key={event.id}>
          <strong>{event.action.replaceAll("_", " ")}</strong>
          <small>{new Date(event.createdAt).toLocaleDateString("en-GB")}</small>
        </div>
      ))}
    </section>
  );
}
function ClientAssessmentDialog({
  clientId,
  assessment,
  onClose,
  onSaved,
  notify,
}: {
  clientId: string;
  assessment: ClientDetail["assessment"];
  onClose: () => void;
  onSaved: () => void;
  notify: (message: string) => void;
}) {
  const initialScreening =
    assessment?.responses &&
    typeof assessment.responses === "object" &&
    !Array.isArray(assessment.responses)
      ? Object.fromEntries(
          SCREENING_FIELDS.map(([key]) => [
            key,
            Boolean((assessment.responses as Record<string, unknown>)[key]),
          ]),
        )
      : Object.fromEntries(SCREENING_FIELDS.map(([key]) => [key, false]));
  const [screeningAnswers] = useState<Record<string, boolean>>(initialScreening);
  const [injuryNotes, setInjuryNotes] = useState(assessment?.injuryNotes ?? "");
  const [contraindicationNotes, setContraindicationNotes] = useState(
    assessment?.contraindicationNotes ?? "",
  );
  const [clearanceRequired, setClearanceRequired] = useState(
    Boolean(assessment?.clearanceRequired),
  );
  const [ptNotes, setPtNotes] = useState(assessment?.ptNotes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  async function save() {
    setSaving(true);
    setError("");
    try {
      await updateClientAssessmentAction({
        clientId,
        screening: screeningAnswers,
        injuryNotes,
        contraindicationNotes,
        clearanceRequired,
        ptNotes,
      });
      notify("Assessment and safety notes saved");
      onSaved();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Assessment could not be saved",
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <div className="modal-backdrop">
      <section
        className="assessment-edit-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="assessment-edit-heading"
      >
        <header>
          <div>
            <p className="eyebrow">ASSESSMENT & SAFETY</p>
            <h2 id="assessment-edit-heading">Edit client constraints</h2>
            <p>
              Record facts and your professional review. These notes are
              included in the PT prompt bundle and do not diagnose a condition.
            </p>
          </div>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </header>
        <label>
          INJURIES, PAIN OR MUSCULOSKELETAL LIMITATIONS
          <textarea
            value={injuryNotes}
            onChange={(event) => setInjuryNotes(event.target.value)}
            placeholder="Current or previous injuries, pain reports, movement limitations…"
          />
        </label>
        <label>
          CONTRAINDICATIONS, RESTRICTIONS OR CLEARANCE CONTEXT
          <textarea
            value={contraindicationNotes}
            onChange={(event) => setContraindicationNotes(event.target.value)}
            placeholder="Restrictions, referral context, clearance boundaries…"
          />
        </label>
        <label className="log-checkbox">
          <input
            type="checkbox"
            checked={clearanceRequired}
            onChange={(event) => setClearanceRequired(event.target.checked)}
          />
          <span>Keep screening / clearance review required</span>
        </label>
        <label>
          PT ASSESSMENT NOTES
          <textarea
            value={ptNotes}
            onChange={(event) => setPtNotes(event.target.value)}
            placeholder="What was reviewed and what should the next programme consider?"
          />
        </label>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <footer>
          <button className="secondary-button" onClick={onClose}>
            Cancel
          </button>
          <button className="primary-button" onClick={save} disabled={saving}>
            {saving ? "Saving assessment…" : "Save assessment →"}
          </button>
        </footer>
      </section>
    </div>
  );
}
function ScreeningReviewDialog({
  clientId,
  onClose,
  onSaved,
  notify,
}: {
  clientId: string;
  onClose: () => void;
  onSaved: () => void;
  notify: (message: string) => void;
}) {
  const [outcome, setOutcome] = useState<
    "pt_review_completed" | "professional_clearance_obtained"
  >("pt_review_completed");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  async function save() {
    setSaving(true);
    setError("");
    try {
      await resolveScreeningAction({ clientId, outcome, reason });
      notify("Screening review recorded; programme can now be assigned");
      onSaved();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Screening review could not be recorded",
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <div className="modal-backdrop">
      <section
        className="screening-review-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="screening-review-heading"
      >
        <header>
          <div>
            <p className="eyebrow">SCREENING DECISION</p>
            <h2 id="screening-review-heading">Record the PT review</h2>
            <p>
              This records your professional decision against the assessment. It
              does not diagnose a condition or replace appropriate healthcare
              clearance.
            </p>
          </div>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </header>
        <label>
          OUTCOME
          <select
            value={outcome}
            onChange={(event) =>
              setOutcome(event.target.value as typeof outcome)
            }
          >
            <option value="pt_review_completed">
              PT review completed — suitable to proceed within scope
            </option>
            <option value="professional_clearance_obtained">
              Appropriate professional clearance obtained
            </option>
          </select>
        </label>
        <label>
          DECISION NOTES
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Record what you reviewed, any referral or clearance decision, and the boundaries for programming…"
          />
        </label>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <footer>
          <button className="secondary-button" onClick={onClose}>
            Cancel
          </button>
          <button
            className="primary-button"
            onClick={save}
            disabled={saving || reason.trim().length < 10}
          >
            {saving ? "Recording…" : "Record screening decision →"}
          </button>
        </footer>
      </section>
    </div>
  );
}
function ClientEditDialog({
  client,
  onClose,
  onSaved,
  notify,
}: {
  client: ClientDetail["client"];
  onClose: () => void;
  onSaved: () => void;
  notify: (message: string) => void;
}) {
  const [firstName, setFirstName] = useState(client.firstName);
  const [lastName, setLastName] = useState(client.lastName);
  const [email, setEmail] = useState(client.email ?? "");
  const [dateOfBirth, setDateOfBirth] = useState(client.dateOfBirth ?? "");
  const [sexOrGender, setSexOrGender] = useState(client.sexOrGender ?? "");
  const [trainingExperience, setTrainingExperience] = useState(
    client.trainingExperience ?? "",
  );
  const [heightCm, setHeightCm] = useState(client.heightCm?.toString() ?? "");
  const [weightKg, setWeightKg] = useState(client.weightKg?.toString() ?? "");
  const [occupation, setOccupation] = useState(client.occupation ?? "");
  const [dailyActivity, setDailyActivity] = useState(
    client.dailyActivity ?? "",
  );
  const [sleepHours, setSleepHours] = useState(client.sleepHours ?? "");
  const [stressLevel, setStressLevel] = useState(client.stressLevel ?? "");
  const [sessionDurationMinutes, setSessionDurationMinutes] = useState(
    client.sessionDurationMinutes ?? 45,
  );
  const [notes, setNotes] = useState(client.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  async function save() {
    setSaving(true);
    setError("");
    try {
      await updateClientProfileAction({
        clientId: client.id,
        firstName,
        lastName,
        email,
        dateOfBirth,
        sexOrGender,
        trainingExperience,
        heightCm: heightCm ? Number(heightCm) : undefined,
        weightKg: weightKg ? Number(weightKg) : undefined,
        occupation,
        dailyActivity,
        sleepHours,
        stressLevel,
        sessionDurationMinutes,
        notes,
      });
      notify("Client details and notes saved");
      onSaved();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Client details could not be saved",
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <div className="modal-backdrop">
      <section
        className="client-edit-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="client-edit-heading"
      >
        <header>
          <div>
            <p className="eyebrow">CLIENT PROFILE</p>
            <h2 id="client-edit-heading">Edit client details</h2>
            <p>
              Age is derived from date of birth. Notes are private PT notes and
              are not shown in the client portal.
            </p>
          </div>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </header>
        <div className="client-edit-fields">
          <label>
            FIRST NAME
            <input
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
            />
          </label>
          <label>
            LAST NAME
            <input
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
            />
          </label>
          <label>
            EMAIL
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Optional"
            />
          </label>
          <label>
            DATE OF BIRTH
            <input
              type="date"
              value={dateOfBirth}
              onChange={(event) => setDateOfBirth(event.target.value)}
            />
          </label>
          <label>
            SEX / GENDER
            <input
              value={sexOrGender}
              onChange={(event) => setSexOrGender(event.target.value)}
              placeholder="Optional"
            />
          </label>
          <label>
            TRAINING EXPERIENCE
            <select
              value={trainingExperience}
              onChange={(event) => setTrainingExperience(event.target.value)}
            >
              <option value="">Not recorded</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </label>
          <label>
            HEIGHT (CM)
            <input
              type="number"
              min="50"
              max="260"
              value={heightCm}
              onChange={(event) => setHeightCm(event.target.value)}
            />
          </label>
          <label>
            WEIGHT (KG)
            <input
              type="number"
              min="20"
              max="400"
              value={weightKg}
              onChange={(event) => setWeightKg(event.target.value)}
            />
          </label>
          <label>
            OCCUPATION
            <input
              value={occupation}
              onChange={(event) => setOccupation(event.target.value)}
            />
          </label>
          <label>
            DAILY ACTIVITY
            <textarea
              value={dailyActivity}
              onChange={(event) => setDailyActivity(event.target.value)}
              placeholder="Typical movement outside training"
            />
          </label>
          <label>
            SLEEP
            <input
              value={sleepHours}
              onChange={(event) => setSleepHours(event.target.value)}
              placeholder="7–8 hours"
            />
          </label>
          <label>
            STRESS
            <select
              value={stressLevel}
              onChange={(event) => setStressLevel(event.target.value)}
            >
              <option value="">Not recorded</option>
              <option>Low</option>
              <option>Moderate</option>
              <option>High</option>
            </select>
          </label>
          <label>
            SESSION LENGTH
            <select
              value={sessionDurationMinutes}
              onChange={(event) =>
                setSessionDurationMinutes(Number(event.target.value))
              }
            >
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>60 minutes</option>
              <option value={75}>75 minutes</option>
              <option value={90}>90 minutes</option>
            </select>
          </label>
        </div>
        <label className="client-notes-field">
          PT NOTES
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Goals, preferences, constraints, coaching observations and follow-up notes…"
          />
        </label>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <footer>
          <button className="secondary-button" onClick={onClose}>
            Cancel
          </button>
          <button
            className="primary-button"
            onClick={save}
            disabled={saving || !firstName.trim() || !lastName.trim()}
          >
            {saving ? "Saving details…" : "Save client details →"}
          </button>
        </footer>
      </section>
    </div>
  );
}
function ClientSnapshotSaveButton({
  clientId,
  goal,
  days,
  preferredDays,
  duration,
  notify,
}: {
  clientId: string;
  goal: string;
  days: number;
  preferredDays: number[];
  duration: number;
  notify: (message: string) => void;
}) {
  const [saving, setSaving] = useState(false);
  async function save() {
    setSaving(true);
    try {
      await updateClientAction({
        clientId,
        goalType: goal,
        trainingDays: days,
        preferredDays,
        sessionDurationMinutes: duration,
      });
      notify("Client snapshot saved");
    } catch (error) {
      notify(
        error instanceof Error
          ? error.message
          : "Client snapshot could not be saved",
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <button className="workspace-save-button" onClick={save} disabled={saving}>
      {saving ? "Saving client…" : "Save client changes"}
    </button>
  );
}
function PreferredDaysPanel({
  clientId,
  initialDays,
  goal,
  duration,
  notify,
  onSaved,
}: {
  clientId: string;
  initialDays: number[];
  goal: string;
  duration: number;
  notify: (message: string) => void;
  onSaved: () => void;
}) {
  const [selectedDays, setSelectedDays] = useState<number[]>(
    initialDays.length ? initialDays : [1, 3, 5],
  );
  const [saving, setSaving] = useState(false);
  function toggleDay(day: number) {
    setSelectedDays((current) =>
      current.includes(day)
        ? current.length > 1
          ? current.filter((value) => value !== day)
          : current
        : [...current, day].sort((a, b) => a - b),
    );
  }
  async function save() {
    setSaving(true);
    try {
      await updateClientAction({
        clientId,
        goalType: goal,
        trainingDays: selectedDays.length,
        preferredDays: selectedDays,
        sessionDurationMinutes: duration,
      });
      notify("Training days saved");
      onSaved();
    } catch (error) {
      notify(
        error instanceof Error
          ? error.message
          : "Training days could not be saved",
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <section className="inner-panel training-days-panel">
      <div className="inner-heading">
        <div>
          <p className="eyebrow">TRAINING SCHEDULE</p>
          <h3>Preferred training days</h3>
        </div>
        <span className="panel-muted">
          {selectedDays.length} day{selectedDays.length === 1 ? "" : "s"} / week
        </span>
      </div>
      <p className="panel-muted">
        Choose the actual days the client can train. The programme calendar can
        then use these named weekdays.
      </p>
      <div className="weekday-picker">
        {WEEKDAYS.map((day) => (
          <button
            type="button"
            key={day.value}
            className={selectedDays.includes(day.value) ? "selected" : ""}
            onClick={() => toggleDay(day.value)}
          >
            {day.label}
          </button>
        ))}
      </div>
      <button
        className="workspace-save-button"
        onClick={save}
        disabled={saving}
      >
        {saving ? "Saving days…" : "Save training days"}
      </button>
    </section>
  );
}
function FirstProgrammeButton({ onClick }: { onClick: () => void }) {
  return (
    <button className="first-programme-button" onClick={onClick}>
      Build first draft
    </button>
  );
}
function ProgrammeLifecycleControls({
  programme,
  onChanged,
  notify,
}: {
  programme: NonNullable<ClientDetail["programme"]>;
  onChanged: () => void;
  notify: (message: string) => void;
}) {
  const options: Record<string, string[]> = {
    draft: ["reviewed", "archived"],
    reviewed: ["draft", "assigned"],
    assigned: ["active", "paused", "completed"],
    active: ["paused", "completed"],
    paused: ["assigned", "archived"],
    completed: ["archived"],
    archived: [],
  };
  const descriptions: Record<string, string> = {
    draft: "Working draft — still being built or edited.",
    reviewed:
      "PT-reviewed — quality and screening checks have been considered.",
    assigned:
      "Assigned — released to the client, awaiting the active start point.",
    active: "Active — the current live programme used for scheduled work.",
    paused: "Paused — temporarily held with a documented reason.",
    completed: "Completed — finished block retained for history.",
    archived: "Archived — retained for record-keeping and no longer active.",
  };
  const [collapsed, setCollapsed] = useState(true);
  const [target, setTarget] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const available = options[programme.status] ?? [];
  async function changeStatus(nextTarget = target) {
    if (!nextTarget) return;
    setSaving(true);
    setError("");
    try {
      await transitionProgrammeAction({
        programmeId: programme.id,
        status: nextTarget as
          | "draft"
          | "reviewed"
          | "assigned"
          | "active"
          | "paused"
          | "completed"
          | "archived",
        reason,
      });
      notify(`Programme moved to ${nextTarget}`);
      onChanged();
    } catch (transitionError) {
      setError(
        transitionError instanceof Error
          ? transitionError.message
          : "Programme status could not be changed",
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <section className={`lifecycle-panel${collapsed ? " is-collapsed" : ""}`}>
      <div className="lifecycle-heading">
        <div>
          <p className="eyebrow">PROGRAMME LIFECYCLE</p>
          <strong>Current status: {programme.status}</strong>
        </div>
        <button
          className="lifecycle-collapse-button"
          onClick={() => setCollapsed(!collapsed)}
          aria-expanded={!collapsed}
        >
          {collapsed ? "Manage" : "Hide"}
        </button>
      </div>
      {collapsed ? (
        <div className="lifecycle-quick-actions">
          <p className="lifecycle-summary">Draft → Reviewed → Assigned → Active</p>
          {available.filter((status) => status !== "archived" && status !== "paused").map((status) => (
            <button key={status} type="button" onClick={() => changeStatus(status)} disabled={saving}>
              {saving ? "Saving…" : `Move to ${status}`}
            </button>
          ))}
          <button type="button" className="lifecycle-collapse-button" onClick={() => setCollapsed(false)}>More options</button>
        </div>
      ) : (
        <>
          <p className="lifecycle-description">
            {descriptions[programme.status]}
          </p>
          <div className="lifecycle-phases">
            {["draft", "reviewed", "assigned", "active"].map((phase) => (
              <span
                key={phase}
                className={phase === programme.status ? "current" : ""}
              >
                {phase}
              </span>
            ))}
          </div>
          {available.length ? (
            <>
              <select
                value={target}
                onChange={(event) => setTarget(event.target.value)}
              >
                <option value="">Choose next status</option>
                {available.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              {(target === "paused" || target === "archived") && (
                <input
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="Reason required for this transition"
                />
              )}
              <button
                onClick={() => changeStatus()}
                disabled={
                  saving ||
                  !target ||
                  ((target === "paused" || target === "archived") &&
                    reason.trim().length < 3)
                }
              >
                {saving ? "Saving…" : "Update status"}
              </button>
            </>
          ) : (
            <small>No further lifecycle transitions available.</small>
          )}
          {error && (
            <p role="alert">
              {error} Use Review screening in the client workspace if this is a
              screening gate.
            </p>
          )}
        </>
      )}
    </section>
  );
}
function SessionSchedulingPanel({
  sessionId,
  scheduledTime,
  managementMode,
  onSaved,
  notify,
}: {
  sessionId: string;
  scheduledTime: string | null;
  managementMode: "pt_managed" | "self_managed";
  onSaved: () => void;
  notify: (message: string) => void;
}) {
  const [time, setTime] = useState(scheduledTime ?? "");
  const [mode, setMode] = useState<"pt_managed" | "self_managed">(managementMode);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    // The parent refresh replaces these props after a successful schedule update.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTime(scheduledTime ?? "");
    setMode(managementMode);
  }, [scheduledTime, managementMode]);
  async function save() {
    setSaving(true);
    try {
      await updateSessionSchedulingAction({ sessionId, scheduledTime: time || null, managementMode: mode });
      notify("Session scheduling updated");
      onSaved();
    } catch (error) {
      notify(error instanceof Error ? error.message : "Session scheduling could not be updated");
    } finally {
      setSaving(false);
    }
  }
  return (
    <div className="session-scheduling-panel">
      <label>
        TIME
        <input type="time" value={time} onChange={(event) => setTime(event.target.value)} />
      </label>
      <label>
        DELIVERY
        <select value={mode} onChange={(event) => setMode(event.target.value as "pt_managed" | "self_managed")}>
          <option value="pt_managed">PT-managed</option>
          <option value="self_managed">Self-managed</option>
        </select>
      </label>
      <button type="button" className="secondary-button" onClick={() => void save()} disabled={saving}>
        {saving ? "Saving…" : "Update schedule"}
      </button>
    </div>
  );
}
function ExerciseCard({
  exercise,
  index,
  expanded,
  onToggle,
  notify,
  onEdit,
}: {
  exercise: Exercise;
  index: number;
  expanded: boolean;
  onToggle: () => void;
  notify: (v: string) => void;
  onEdit?: () => void;
}) {
  return (
    <article className={`exercise-card ${expanded ? "expanded" : ""}`}>
      <div className="exercise-number">
        {String(index + 1).padStart(2, "0")}
      </div>
      <div className="exercise-main">
        <div className="exercise-title">
          <div>
            <h3>{exercise.name}</h3>
            <span>
              {exercise.pattern} · {exercise.target}
            </span>
          </div>
        </div>
        <div className="exercise-prescription">
          <strong>{exercise.prescription}</strong>
          <span>{exercise.intensityValue ?? "2 RIR"}</span>
          <span>Rest {exercise.restSeconds ?? 90}s</span>
          {exercise.tempo && <span>Tempo {exercise.tempo}</span>}
        </div>
        {expanded && (
          <div className="exercise-detail">
            <p>
              <b>Why this exercise?</b>{" "}
              {exercise.note ??
                "Chosen to match the client's goal and current capacity."}
            </p>
            <p>
              <b>Progression:</b>{" "}
              {exercise.progressionRule ??
                "Progress when the target range and intensity are achieved with acceptable technique."}
            </p>
            <div className="detail-actions">
              <button
                onClick={() =>
                  onEdit
                    ? onEdit()
                    : notify(`Alternatives for ${exercise.name} opened`)
                }
              >
                Swap exercise
              </button>
              <button
                onClick={() =>
                  onEdit ? onEdit() : notify("Progression rule opened")
                }
              >
                Progress
              </button>
              <button
                onClick={() =>
                  onEdit ? onEdit() : notify("Exercise regressed")
                }
              >
                Regress
              </button>
            </div>
          </div>
        )}
      </div>
      <button
        className="expand-button"
        onClick={onToggle}
        aria-label={`Show options for ${exercise.name}`}
      >
        {expanded ? "⌃" : "⌄"}
      </button>
    </article>
  );
}
function WorkoutLogModalV2({
  clientId,
  clientName,
  session,
  onClose,
  onSaved,
}: {
  clientId: string;
  clientName: string;
  session: NonNullable<ClientDetail["programme"]>["sessions"][number];
  onClose: () => void;
  onSaved: (metrics?: {
    volumeLoadKg: number;
    repetitionLoad: number;
    averageRpe: number | null;
    averageRir: number | null;
  }) => void;
}) {
  const [status, setStatus] = useState<
    "completed" | "partial" | "missed" | "skipped"
  >("completed");
  const [sessionRpe, setSessionRpe] = useState(7);
  const [energy, setEnergy] = useState(3);
  const [painReported, setPainReported] = useState(false);
  const [notes, setNotes] = useState("");
  const [sets, setSets] = useState(() =>
    session.exercises.flatMap((exercise) =>
      Array.from({ length: exercise.sets ?? 1 }, (_, index) => ({
        prescriptionId: exercise.prescriptionId ?? "",
        setNumber: index + 1,
        exerciseName: exercise.name,
        reps: exercise.repsMin ?? 0,
        loadKg: 0,
        rpe: 7,
        rir: 2,
        techniqueAcceptable: true,
        painReported: false,
      })),
    ),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [mobileSetIndex, setMobileSetIndex] = useState(0);
  const [mobileReview, setMobileReview] = useState(false);
  const [mobileDetailsOpen, setMobileDetailsOpen] = useState(false);
  const [mobileDraftReady, setMobileDraftReady] = useState(false);
  const [mobileDraftRestored, setMobileDraftRestored] = useState(false);
  const mobileDraftKey = `banner-floor-draft:${clientId}:${session.id}:${new Date().toISOString().slice(0, 10)}`;
  useEffect(() => {
    const restoreTimer = window.setTimeout(() => {
      try {
        const rawDraft = window.localStorage.getItem(mobileDraftKey);
        if (rawDraft) {
          const draft = JSON.parse(rawDraft) as {
            sets?: typeof sets;
            status?: typeof status;
            sessionRpe?: number;
            energy?: number;
            painReported?: boolean;
            notes?: string;
            mobileSetIndex?: number;
            mobileReview?: boolean;
          };
          if (Array.isArray(draft.sets) && draft.sets.length) setSets(draft.sets);
          if (draft.status) setStatus(draft.status);
          if (typeof draft.sessionRpe === "number") setSessionRpe(draft.sessionRpe);
          if (typeof draft.energy === "number") setEnergy(draft.energy);
          if (typeof draft.painReported === "boolean") setPainReported(draft.painReported);
          if (typeof draft.notes === "string") setNotes(draft.notes);
          if (typeof draft.mobileSetIndex === "number") setMobileSetIndex(Math.max(0, draft.mobileSetIndex));
          if (typeof draft.mobileReview === "boolean") setMobileReview(draft.mobileReview);
          setMobileDraftRestored(true);
        }
      } catch {
        window.localStorage.removeItem(mobileDraftKey);
      } finally {
        setMobileDraftReady(true);
      }
    }, 0);
    return () => window.clearTimeout(restoreTimer);
  }, [mobileDraftKey]);
  useEffect(() => {
    if (!mobileDraftReady || !window.matchMedia("(max-width: 980px)").matches) return;
    const saveTimer = window.setTimeout(() => {
      window.localStorage.setItem(
        mobileDraftKey,
        JSON.stringify({
          sets,
          status,
          sessionRpe,
          energy,
          painReported,
          notes,
          mobileSetIndex,
          mobileReview,
        }),
      );
    }, 250);
    return () => window.clearTimeout(saveTimer);
  }, [
    mobileDraftKey,
    mobileDraftReady,
    mobileReview,
    mobileSetIndex,
    notes,
    painReported,
    energy,
    sessionRpe,
    sets,
    status,
  ]);
  const mobileSet = sets[mobileSetIndex];
  function updateSet(index: number, changes: Partial<(typeof sets)[number]>) {
    setSets((current) =>
      current.map((row, rowIndex) =>
        rowIndex === index ? { ...row, ...changes } : row,
      ),
    );
  }
  async function submit() {
    setSaving(true);
    setError("");
    try {
      const result = await logWorkoutResultAction({
        clientId,
        sessionId: session.id,
        scheduledDate: new Date().toISOString().slice(0, 10),
        status,
        sessionRpe,
        energy,
        painReported,
        notes,
        sets: sets
          .filter((set) => set.prescriptionId)
          .map((set) => ({
            prescriptionId: set.prescriptionId,
            setNumber: set.setNumber,
            reps: set.reps,
            loadKg: set.loadKg,
            rpe: set.rpe,
            rir: set.rir,
            techniqueAcceptable: set.techniqueAcceptable,
            painReported: set.painReported,
          })),
      });
      window.localStorage.removeItem(mobileDraftKey);
      onSaved(result.metrics);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Workout result could not be saved",
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <div className="modal-backdrop">
      <section
        className="log-modal workout-log-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="log-v2-heading"
      >
        <header>
          <div>
            <p className="eyebrow">SESSION RESULT</p>
            <h2 id="log-v2-heading">
              Log {clientName}&apos;s {session.name}
            </h2>
            <p>
              Record the completed session against its actual programme
              prescriptions.
            </p>
          </div>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </header>
        <div className="mobile-workout-floor">
          {!mobileReview ? (
            <>
              <p className="mobile-floor-eyebrow">
                {clientName} · {session.name}
              </p>
              <h3 className="mobile-floor-title">
                {mobileSet?.exerciseName ?? "Session complete"}
              </h3>
              <p className="mobile-floor-muted">
                {mobileSet
                  ? `Set ${mobileSet.setNumber} of ${sets.filter((row) => row.exerciseName === mobileSet.exerciseName).length} · Exercise ${new Set(sets.slice(0, mobileSetIndex + 1).map((row) => row.exerciseName)).size} of ${new Set(sets.map((row) => row.exerciseName)).size}`
                  : "All prescribed sets are logged"}
              </p>
              {mobileDraftRestored && (
                <p className="mobile-floor-draft-notice" role="status">
                  Draft restored from this device
                </p>
              )}
              {mobileSet ? (
                <>
                  <div className="mobile-floor-set-card">
                    <div className="mobile-floor-set-heading">
                      <strong>SET {mobileSet.setNumber}</strong>
                      <span>READY</span>
                    </div>
                    <div className="mobile-floor-inputs">
                      <label>
                        REPS
                        <input
                          inputMode="numeric"
                          type="number"
                          min="0"
                          value={mobileSet.reps}
                          onChange={(event) =>
                            updateSet(mobileSetIndex, {
                              reps: Number(event.target.value),
                            })
                          }
                        />
                      </label>
                      <label>
                        LOAD · KG
                        <input
                          inputMode="decimal"
                          type="number"
                          min="0"
                          value={mobileSet.loadKg}
                          onChange={(event) =>
                            updateSet(mobileSetIndex, {
                              loadKg: Number(event.target.value),
                            })
                          }
                        />
                      </label>
                    </div>
                    <div className="mobile-floor-helper">
                      <span>RPE {mobileSet.rpe} · RIR {mobileSet.rir}</span>
                      <button
                        type="button"
                        onClick={() =>
                          updateSet(mobileSetIndex, {
                            reps: mobileSet.reps,
                            loadKg: mobileSet.loadKg,
                          })
                        }
                      >
                        Repeat last set
                      </button>
                    </div>
                  </div>
                  <div className="mobile-floor-actions">
                    <button
                      className="secondary-button"
                      type="button"
                      onClick={() =>
                        setMobileSetIndex((current) =>
                          Math.min(current + 1, sets.length),
                        )
                      }
                    >
                      Skip
                    </button>
                    <button
                      className="primary-button"
                      type="button"
                      onClick={() => {
                        if (mobileSetIndex >= sets.length - 1) {
                          setMobileReview(true);
                        } else {
                          setMobileSetIndex((current) => current + 1);
                        }
                      }}
                    >
                      {mobileSetIndex >= sets.length - 1
                        ? "Review session →"
                        : "Complete set →"}
                    </button>
                  </div>
                  <button
                    className="mobile-floor-details"
                    type="button"
                    onClick={() => setMobileDetailsOpen((current) => !current)}
                  >
                    Technique, RPE, RIR and pain <span>{mobileDetailsOpen ? "Hide details⌃" : "More details⌄"}</span>
                  </button>
                  {mobileDetailsOpen && (
                    <div className="mobile-floor-details-panel">
                      <label>
                        RPE
                        <input
                          inputMode="numeric"
                          type="number"
                          min="1"
                          max="10"
                          value={mobileSet.rpe}
                          onChange={(event) =>
                            updateSet(mobileSetIndex, {
                              rpe: Number(event.target.value),
                            })
                          }
                        />
                      </label>
                      <label>
                        RIR
                        <input
                          inputMode="numeric"
                          type="number"
                          min="0"
                          max="10"
                          value={mobileSet.rir}
                          onChange={(event) =>
                            updateSet(mobileSetIndex, {
                              rir: Number(event.target.value),
                            })
                          }
                        />
                      </label>
                      <label className="mobile-floor-pain">
                        <input
                          type="checkbox"
                          checked={mobileSet.painReported}
                          onChange={(event) =>
                            updateSet(mobileSetIndex, {
                              painReported: event.target.checked,
                            })
                          }
                        />
                        Pain or discomfort
                      </label>
                    </div>
                  )}
                </>
              ) : (
                <button
                  className="primary-button mobile-floor-wide-button"
                  type="button"
                  onClick={() => setMobileReview(true)}
                >
                  Review session →
                </button>
              )}
            </>
          ) : (
            <>
              <p className="mobile-floor-eyebrow">SESSION REVIEW</p>
              <h3 className="mobile-floor-title">Ready to finish?</h3>
              <p className="mobile-floor-muted">
                Review the session before saving it to the client record.
              </p>
              <div className="mobile-floor-summary">
                <div><strong>{new Set(sets.slice(0, mobileSetIndex + 1).map((row) => row.exerciseName)).size}/{new Set(sets.map((row) => row.exerciseName)).size}</strong><span>Exercises</span></div>
                <div><strong>{mobileSetIndex + 1}</strong><span>Sets logged</span></div>
                <div><strong>{sessionRpe}</strong><span>Session RPE</span></div>
              </div>
              <label className="mobile-floor-check">
                <input
                  type="checkbox"
                  checked={painReported}
                  onChange={(event) => setPainReported(event.target.checked)}
                />
                Client reported pain or discomfort
              </label>
              <label className="mobile-floor-notes">
                NOTES
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Technique, recovery, substitutions..."
                />
              </label>
              <button
                className="primary-button mobile-floor-wide-button"
                type="button"
                onClick={submit}
                disabled={saving || !clientId}
              >
                {saving ? "Saving result…" : "Save workout result ✓"}
              </button>
              <button
                className="secondary-button mobile-floor-wide-button"
                type="button"
                onClick={() => setMobileReview(false)}
              >
                Back to session
              </button>
            </>
          )}
        </div>
        <div className="desktop-workout-log">
        <div className="log-fields">
          <label>
            STATUS
            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as typeof status)
              }
            >
              <option value="completed">Completed</option>
              <option value="partial">Partially completed</option>
              <option value="missed">Missed</option>
              <option value="skipped">Skipped</option>
            </select>
          </label>
          <label>
            SESSION RPE
            <select
              value={sessionRpe}
              onChange={(event) => setSessionRpe(Number(event.target.value))}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                <option key={value} value={value}>
                  {value} / 10
                </option>
              ))}
            </select>
          </label>
          <label>
            ENERGY
            <select
              value={energy}
              onChange={(event) => setEnergy(Number(event.target.value))}
            >
              <option value={1}>1 · Very low</option>
              <option value={2}>2 · Low</option>
              <option value={3}>3 · Usual</option>
              <option value={4}>4 · Good</option>
              <option value={5}>5 · High</option>
            </select>
          </label>
        </div>
        <div className="set-log">
          <div className="set-log-heading">
            <strong>Set observations</strong>
            <span>Reps / load / RPE / RIR</span>
          </div>
          {sets.length ? (
            sets.map((set, index) => (
              <div
                className="set-log-row set-log-row-detailed"
                key={`${set.prescriptionId}-${set.setNumber}`}
              >
                <span>
                  {set.exerciseName} · {set.setNumber}
                </span>
                <input
                  aria-label={`${set.exerciseName} set ${set.setNumber} reps`}
                  type="number"
                  min="0"
                  value={set.reps}
                  onChange={(event) =>
                    setSets((current) =>
                      current.map((row, rowIndex) =>
                        rowIndex === index
                          ? { ...row, reps: Number(event.target.value) }
                          : row,
                      ),
                    )
                  }
                />
                <input
                  aria-label={`${set.exerciseName} set ${set.setNumber} load`}
                  type="number"
                  min="0"
                  value={set.loadKg}
                  onChange={(event) =>
                    setSets((current) =>
                      current.map((row, rowIndex) =>
                        rowIndex === index
                          ? { ...row, loadKg: Number(event.target.value) }
                          : row,
                      ),
                    )
                  }
                />
                <input
                  aria-label={`${set.exerciseName} set ${set.setNumber} RPE`}
                  type="number"
                  min="1"
                  max="10"
                  value={set.rpe}
                  onChange={(event) =>
                    setSets((current) =>
                      current.map((row, rowIndex) =>
                        rowIndex === index
                          ? { ...row, rpe: Number(event.target.value) }
                          : row,
                      ),
                    )
                  }
                />
                <input
                  aria-label={`${set.exerciseName} set ${set.setNumber} RIR`}
                  type="number"
                  min="0"
                  max="10"
                  value={set.rir}
                  onChange={(event) =>
                    setSets((current) =>
                      current.map((row, rowIndex) =>
                        rowIndex === index
                          ? { ...row, rir: Number(event.target.value) }
                          : row,
                      ),
                    )
                  }
                />
              </div>
            ))
          ) : (
            <p className="dashboard-empty">
              No prescription rows are available for this session.
            </p>
          )}
        </div>
        <label className="log-checkbox">
          <input
            type="checkbox"
            checked={painReported}
            onChange={(event) => setPainReported(event.target.checked)}
          />
          <span>Client reported pain or discomfort</span>
        </label>
        <label className="log-notes">
          NOTES
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Technique, recovery, enjoyment, substitutions..."
          />
        </label>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <footer>
          <button className="secondary-button" onClick={onClose}>
            Cancel
          </button>
          <button
            className="primary-button"
            onClick={submit}
            disabled={saving || !clientId}
          >
            {saving ? "Saving result…" : "Save workout result →"}
          </button>
        </footer>
        </div>
      </section>
    </div>
  );
}
