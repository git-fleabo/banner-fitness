"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";

import {
  createClientAction,
  deleteClientAction,
  logWorkoutResultAction,
  recordProgrammeOverrideAction,
  resolveScreeningAction,
  saveProgrammeAction,
  transitionProgrammeAction,
  updateSessionSchedulingAction,
  updateClientAction,
  updateClientAssessmentAction,
  updateClientLocationAction,
  updateClientProfileAction,
} from "./actions";
import { MobileNav, SessionEditorModal } from "./designer-support";
import { DesignerSettings } from "./designer-settings";
import { TeamAccess } from "./team-access";
import { ExerciseLibrary } from "./exercise-library";
import {
  ProgrammeLibrary,
  type ProgrammeLibraryTemplate,
} from "./programme-library";
import { PromptBuilderLauncher } from "./prompt-builder";
import { AiProgrammeImportLauncher } from "./ai-import";
import { ClientPreferencesLauncher } from "./client-preferences";
import { ClientPerformanceLauncher } from "./client-performance";
import { ProgressionReviewLauncher } from "./progression-review";
import { SubstitutionReviewLauncher } from "./substitution-review";
import { ClientProgressLauncher } from "./client-progress";
import { DesignerHelp } from "./designer-help";
import { Icon, type SemanticIconName } from "./semantic-icon";
import { hasRecordedScreeningReview } from "@/lib/pt-programming";
import {
  buildQualityWarnings,
  defaultQualitySettings,
  type QualityReview,
  type QualitySettings,
} from "@/lib/pt-quality";
import type { ClientTimelineItem } from "@/lib/pt-client-timeline";
import { mapLibraryTemplateToClientSessions } from "@/lib/programme-library";
import type { AiProgrammeImportApproval } from "@/lib/pt-ai-import";
import type { SavedSession } from "@/lib/programme-editor";
import { PT_GOALS } from "@/lib/pt-goals";

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

type DashboardClient = {
  id: string;
  firstName: string;
  lastName: string;
  clientColour?: string | null;
  status: string;
  updatedAt: string;
  programme: {
    id: string;
    name: string;
    status: string;
    currentWeek: number;
    durationWeeks: number;
    version: number;
  } | null;
  goal: {
    goalType: string;
    target: string | null;
    metric: string | null;
  } | null;
  location: { name: string } | null;
  lastWorkout: {
    date: string;
    status: string;
    painReported: boolean;
    energy: number | null;
    sessionRpe: number | null;
  } | null;
  adherence: number | null;
  nextSession: { day: string; name: string; durationMinutes: number } | null;
  quality: {
    score: number;
    approvalReadiness: string;
    blockingCount: number;
    significantCount: number;
    advisoryCount: number;
    evaluatedAt: string;
  } | null;
  dataGaps: string[];
  needsAttention: boolean;
};
type OverviewData = {
  counts: {
    clients: number;
    draftProgrammes: number;
    adherence: number | null;
    sessionsThisWeek: number;
  };
  clients: Array<{
    id: string;
    firstName: string;
    lastName: string;
    clientColour?: string | null;
    updatedAt: string;
  }>;
  dashboardClients: DashboardClient[];
  programmes: Array<{
    id: string;
    clientId: string;
    name: string;
    goalSummary?: string;
    status: string;
    currentWeek: number;
    durationWeeks: number;
    version: number;
  }>;
  attention: Array<{
    id: string;
    clientId: string;
    name: string;
    text: string;
    tag: string;
    tone: string;
  }>;
  schedule: Array<{
    id: string;
    clientId: string;
    clientName: string;
    day: string;
    dayOfWeek: number;
    name: string;
    sessionType: string;
    durationMinutes: number;
    clientColour?: string | null;
    scheduledTime: string | null;
    managementMode: "pt_managed" | "self_managed";
    date: string;
    status: string;
  }>;
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

function hasUnresolvedScreening(assessment: ClientDetail["assessment"]) {
  if (!assessment || hasRecordedScreeningReview(assessment.ptNotes))
    return false;
  return Boolean(
    assessment.clearanceRequired ||
      assessment.injuryNotes ||
      assessment.contraindicationNotes ||
      (Array.isArray(assessment.riskFlags) && assessment.riskFlags.length),
  );
}

const exercises: Exercise[] = [
  {
    name: "Leg Press",
    pattern: "Squat",
    prescription: "3 × 8–12",
    target: "Quads · glutes",
    equipment: "Machine",
    note: "Stable lower-body strength stimulus",
  },
  {
    name: "DB Bench Press",
    pattern: "Horizontal push",
    prescription: "3 × 8–12",
    target: "Chest · triceps",
    equipment: "Dumbbells",
    note: "Client-preferred pressing option",
  },
  {
    name: "Seated Cable Row",
    pattern: "Horizontal pull",
    prescription: "3 × 8–12",
    target: "Back · biceps",
    equipment: "Cable",
    note: "Balances pressing volume",
  },
  {
    name: "DB Romanian Deadlift",
    pattern: "Hinge",
    prescription: "2 × 8–10",
    target: "Hamstrings · glutes",
    equipment: "Dumbbells",
    note: "Moderate posterior-chain volume",
  },
  {
    name: "Cable Lateral Raise",
    pattern: "Shoulder accessory",
    prescription: "2 × 12–15",
    target: "Lateral delts",
    equipment: "Cable",
    note: "Low-fatigue accessory",
  },
  {
    name: "Bike Intervals",
    pattern: "Conditioning",
    prescription: "8 min · 30:60",
    target: "Aerobic fitness",
    equipment: "Bike",
    method: "Intervals",
    note: "Time-efficient conditioning without running",
  },
];

const WEEKDAYS = [
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
  { value: 7, label: "Sun" },
];
const SCREENING_FIELDS = [
  ["chestPain", "Chest pain or discomfort during activity?"],
  [
    "cardiovascularHistory",
    "Known cardiovascular disease, history or symptoms?",
  ],
  [
    "dizzinessOrFainting",
    "Dizziness, fainting or unexplained light-headedness?",
  ],
  ["unusualBreathlessness", "Unusual shortness of breath?"],
  ["diagnosedDisease", "Known metabolic, cardiovascular or renal disease?"],
  ["medicalIssue", "Current medical issue needing consideration?"],
  [
    "medicationAffectingExercise",
    "Medication that may affect exercise response?",
  ],
  ["recentSurgery", "Recent surgery or procedure?"],
  [
    "injuryOrMusculoskeletalLimitation",
    "Current injury, pain or musculoskeletal limitation?",
  ],
  ["pregnancyOrPostpartum", "Pregnancy or postpartum considerations?"],
  ["otherConcern", "Any other health concern requiring review?"],
] as const;
const preferredDayValues = (value: unknown) =>
  Array.isArray(value)
    ? value.filter(
        (day): day is number =>
          typeof day === "number" &&
          Number.isInteger(day) &&
          day >= 1 &&
          day <= 7,
      )
    : [];

export default function DesignerPage() {
  const router = useRouter();
  const [accessState, setAccessState] = useState<"checking" | "active">(
    "checking",
  );
  const [activeNav, setActiveNav] = useState("Overview");
  const [client, setClient] = useState("Maya Thompson");
  const [clientId, setClientId] = useState<string | null>(null);
  const [clientDetail, setClientDetail] = useState<ClientDetail | null>(null);
  const [detailRefresh, setDetailRefresh] = useState(0);
  const [showClient, setShowClient] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [guidedOnboarding, setGuidedOnboarding] = useState(false);
  const [activeWorkspaceSection, setActiveWorkspaceSection] = useState<
    "overview" | "assessment" | "programme" | "quality" | "history"
  >("overview");
  const [showClients, setShowClients] = useState(false);
  const [showProgrammes, setShowProgrammes] = useState(false);
  const [showProgrammeLibrary, setShowProgrammeLibrary] = useState(false);
  const [pendingLibraryTemplate, setPendingLibraryTemplate] =
    useState<ProgrammeLibraryTemplate | null>(null);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showSessionEditor, setShowSessionEditor] = useState(false);
  const [importedSessions, setImportedSessions] = useState<
    SavedSession[] | null
  >(null);
  const [importApproval, setImportApproval] =
    useState<AiProgrammeImportApproval | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showTeam, setShowTeam] = useState(false);
  const [accountRole, setAccountRole] = useState<"owner" | "pt">("pt");
  const [showHelp, setShowHelp] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const [screening, setScreening] = useState(false);
  const [goal, setGoal] = useState("Fat loss + muscle retention");
  const [days, setDays] = useState(3);
  const [preferredDays, setPreferredDays] = useState<number[]>([1, 3, 5]);
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [dashboardRosterView, setDashboardRosterView] = useState<
    "all" | "needs_attention" | "no_activity" | "drafts" | "no_programme"
  >("all");
  const [detailError, setDetailError] = useState("");
  const [programmeWeek, setProgrammeWeek] = useState<number | null>(null);
  const [qualitySettings, setQualitySettings] = useState<QualitySettings>(
    defaultQualitySettings,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/designer/access", {
      credentials: "same-origin",
      cache: "no-store",
    })
      .then((response) => {
        if (response.status === 401) {
          router.replace("/auth/sign-in?next=/designer");
          return;
        }
        if (!response.ok) {
          router.replace("/learn");
          return;
        }
        void response
          .json()
          .then((accessData: { role?: "owner" | "pt" }) =>
            setAccountRole(accessData.role === "owner" ? "owner" : "pt"),
          );
        setAccessState("active");
        void fetch("/api/designer/overview", {
          credentials: "same-origin",
          cache: "no-store",
        })
          .then(async (overviewResponse) => {
            if (overviewResponse.ok)
              setOverview((await overviewResponse.json()) as OverviewData);
          })
          .catch(() => undefined);
        void import("./actions")
          .then(({ getDesignerSettingsAction }) => getDesignerSettingsAction())
          .then(setQualitySettings)
          .catch(() => undefined);
        return undefined;
      })
      .catch(() => router.replace("/auth/sign-in?next=/designer"));
  }, [router]);

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2400);
  };

  const refreshOverview = () => {
    void fetch("/api/designer/overview", {
      credentials: "same-origin",
      cache: "no-store",
    })
      .then(async (response) => {
        if (response.ok) setOverview((await response.json()) as OverviewData);
      })
      .catch(() => undefined);
  };

  useEffect(() => {
    if (!showClient || !clientId) return;
    const controller = new AbortController();
    const weekQuery = programmeWeek ? `&weekNumber=${programmeWeek}` : "";
    fetch(
      `/api/designer/client?clientId=${encodeURIComponent(clientId)}${weekQuery}`,
      {
        credentials: "same-origin",
        cache: "no-store",
        signal: controller.signal,
      },
    )
      .then((response) =>
        response.ok
          ? (response.json() as Promise<ClientDetail>)
          : Promise.reject(new Error("Client details unavailable")),
      )
      .then((data) => {
        setDetailError("");
        setClientDetail(data);
        setProgrammeWeek(
          (current) =>
            current ??
            data.programme?.week?.weekNumber ??
            data.programme?.currentWeek ??
            null,
        );
        setClient(`${data.client.firstName} ${data.client.lastName}`);
        if (data.goal?.goalType) setGoal(data.goal.goalType);
        const savedDays = preferredDayValues(data.client.preferredDays);
        if (savedDays.length) {
          setPreferredDays(savedDays);
          setDays(savedDays.length);
        }
        setScreening(hasUnresolvedScreening(data.assessment));
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError")
          return;
        setDetailError(
          error instanceof Error
            ? error.message
            : "Client details could not be loaded",
        );
        notify("Client details could not be loaded");
      });
    return () => controller.abort();
  }, [clientId, showClient, detailRefresh, programmeWeek]);

  useEffect(() => {
    if (!showClient) return;
    const closeOnBackdrop = (event: PointerEvent) => {
      if (
        (event.target as HTMLElement | null)?.classList.contains(
          "workspace-overlay",
        )
      ) {
        setShowClient(false);
      }
    };
    document.addEventListener("pointerdown", closeOnBackdrop);
    return () => document.removeEventListener("pointerdown", closeOnBackdrop);
  }, [showClient]);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleShortcut);
    return () => document.removeEventListener("keydown", handleShortcut);
  }, []);

  function searchWorkspace(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      notify("Type a client or programme name to search");
      return;
    }
    const clientMatch = overview?.clients.find((item) =>
      `${item.firstName} ${item.lastName}`.toLowerCase().includes(query),
    );
    const programmeMatch = overview?.programmes.find(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.goalSummary?.toLowerCase().includes(query),
    );
    const match =
      clientMatch ??
      (programmeMatch
        ? overview?.clients.find((item) => item.id === programmeMatch.clientId)
        : undefined);
    if (!match) {
      setShowClients(true);
      setShowLibrary(false);
      setShowProgrammes(false);
      setActiveNav("Clients");
      notify("No matching client or programme found");
      return;
    }
    setProgrammeWeek(null);
    setClientId(match.id);
    setClientDetail(null);
    setDetailError("");
    setClient(`${match.firstName} ${match.lastName}`);
    setShowClients(false);
    setShowProgrammes(false);
    setShowLibrary(false);
    setActiveNav("Overview");
    setShowClient(true);
    setSearchQuery("");
  }

  if (accessState === "checking")
    return (
      <main className="designer-loading">
        <div className="loading-orbit">A</div>
        <p>Checking your PT workspace…</p>
      </main>
    );

  return (
    <main className="designer-shell">
      <aside className="designer-sidebar">
        <div className="brand-mark">
          <img src="/banner-fitness-logo-hex.png" alt="Banner Fitness" />
        </div>
        <div className="workspace-label">WORKSPACE</div>
        <nav className="designer-nav" aria-label="Main navigation">
          {[
            "Overview",
            "Clients",
            "Programmes",
            "Programme library",
            "Exercise library",
          ].map((item, index) => (
            <button
              key={item}
              className={activeNav === item ? "active" : ""}
              onClick={() => {
                setActiveNav(item);
                setShowLibrary(item === "Exercise library");
                setShowClients(item === "Clients");
                setShowProgrammes(item === "Programmes");
                setShowProgrammeLibrary(item === "Programme library");
              }}
            >
              <Icon
                name={
                  (
                    [
                      "overview",
                      "clients",
                      "programmes",
                      "library",
                      "exercise-library",
                    ] as SemanticIconName[]
                  )[index]
                }
              />
              {item}
              {item === "Clients" && (
                <em>{overview ? overview.counts.clients : "—"}</em>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button
            className="sidebar-link"
            onClick={() => setShowSettings(true)}
          >
            <Icon name="settings" />
            Settings
          </button>
          <div className="profile-chip">
            <div className="avatar">NO</div>
            <div>
              <strong>Noaman</strong>
              <small>Personal trainer</small>
            </div>
          </div>
        </div>
      </aside>

      <section className="designer-content">
        <header className="designer-header">
          <div className="mobile-brand">
            <img src="/banner-fitness-logo-hex.png" alt="Banner Fitness" />
          </div>
          <form className="header-search" onSubmit={searchWorkspace}>
            <Icon name="search" />
            <input
              ref={searchInputRef}
              id="workspace-search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search clients, programmes..."
              aria-label="Search clients and programmes"
            />
            <kbd>⌘ K</kbd>
          </form>
          <div className="header-actions">
            <button
              className="help-launcher"
              onClick={() => setShowHelp(true)}
              aria-label="Open help and app instructions"
            >
              <Icon name="help" />
              <span>Help</span>
            </button>
            <div className="mini-avatar">NO</div>
          </div>
        </header>

        {showLibrary ? (
          <ExerciseLibrary
            onClose={() => {
              setShowLibrary(false);
              setActiveNav("Overview");
            }}
          />
        ) : showProgrammeLibrary ? (
          <ProgrammeLibrary
            clients={overview?.clients ?? []}
            onClose={() => {
              setShowProgrammeLibrary(false);
              setActiveNav("Overview");
            }}
            onApply={(template, selectedClient) => {
              setProgrammeWeek(null);
              setClientId(selectedClient.id);
              setClientDetail(null);
              setDetailError("");
              setClient(
                `${selectedClient.firstName} ${selectedClient.lastName}`,
              );
              setPendingLibraryTemplate(template);
              setShowProgrammeLibrary(false);
              setActiveNav("Overview");
              setShowClient(true);
            }}
            notify={notify}
          />
        ) : showProgrammes ? (
          <ProgrammeList
            programmes={overview?.programmes ?? []}
            clients={overview?.clients ?? []}
            onClose={() => {
              setShowProgrammes(false);
              setActiveNav("Overview");
            }}
            onOpen={(id, name) => {
              setProgrammeWeek(null);
              setClientId(id);
              setClientDetail(null);
              setDetailError("");
              setClient(name);
              setShowProgrammes(false);
              setActiveNav("Overview");
              setShowClient(true);
            }}
          />
        ) : showClients ? (
          <ClientList
            onClose={() => {
              setShowClients(false);
              setActiveNav("Overview");
            }}
            onNew={() => setShowOnboarding(true)}
            onOpen={(id, name) => {
              setProgrammeWeek(null);
              setClientId(id);
              setClientDetail(null);
              setDetailError("");
              setClient(name);
              setShowClients(false);
              setActiveNav("Overview");
              setShowClient(true);
            }}
          />
        ) : (
          <>
            <div className="page-heading">
              <div>
                <p className="eyebrow">
                  {new Intl.DateTimeFormat("en-GB", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                    .format(new Date())
                    .toUpperCase()}
                </p>
                <h1>Overview</h1>
              </div>
              <button
                className="primary-button"
                onClick={() => setShowOnboarding(true)}
              >
                + New client
              </button>
            </div>

            <div className="stat-grid">
              <Stat
                label="Active clients"
                value={overview ? String(overview.counts.clients) : "—"}
                detail={
                  overview?.counts.clients
                    ? "Your clients"
                    : "Create your first client"
                }
                tone="green"
                icon="clients"
              />
              <Stat
                label="Programmes to review"
                value={overview ? String(overview.counts.draftProgrammes) : "—"}
                detail="Drafts awaiting PT review"
                tone="amber"
                icon="review"
              />
              <Stat
                label="Avg. adherence"
                value={
                  overview?.counts.adherence === null
                    ? "—"
                    : overview
                      ? `${overview.counts.adherence}%`
                      : "—"
                }
                detail="Last 30 days of logged results"
                tone="blue"
                icon="adherence"
              />
              <Stat
                label="Sessions this week"
                value={
                  overview ? String(overview.counts.sessionsThisWeek) : "—"
                }
                detail={
                  overview?.counts.sessionsThisWeek
                    ? "From saved programme sessions"
                    : "No sessions scheduled yet"
                }
                tone="purple"
                icon="sessions"
              />
            </div>

            {overview && overview.counts.clients === 0 && (
              <FirstClientGuide
                onNewClient={() => setShowOnboarding(true)}
                onLibrary={() => {
                  setShowLibrary(true);
                  setActiveNav("Exercise library");
                }}
                onProgrammeLibrary={() => {
                  setShowProgrammeLibrary(true);
                  setActiveNav("Programme library");
                }}
              />
            )}

            <DashboardClientRoster
              clients={overview?.dashboardClients ?? []}
              loading={!overview}
              view={dashboardRosterView}
              onViewChange={setDashboardRosterView}
              onOpen={(id, name) => {
                setProgrammeWeek(null);
                setClientId(id);
                setClientDetail(null);
                setDetailError("");
                setClient(name);
                setShowClient(true);
              }}
            />

            <ProgrammeCalendar
              inline
              remainingOnly
              schedule={overview?.schedule ?? []}
              onClose={() => setShowCalendar(false)}
              onOpen={(id, name) => {
                setProgrammeWeek(null);
                setClientId(id);
                setClientDetail(null);
                setDetailError("");
                setClient(name);
                setActiveWorkspaceSection("programme");
                setShowClient(true);
              }}
            />
          </>
        )}
      </section>
      {showClient && (
        <ClientWorkspace
          clientId={clientId ?? ""}
          name={client}
          goal={goal}
          days={days}
          preferredDays={preferredDays}
          setGoal={setGoal}
          setDays={setDays}
          setPreferredDays={setPreferredDays}
          screening={screening}
          setScreening={setScreening}
          expanded={expanded}
          setExpanded={setExpanded}
          activeWorkspaceSection={activeWorkspaceSection}
          onWorkspaceSectionChange={setActiveWorkspaceSection}
          onClose={() => {
            setShowClient(false);
          }}
          onEditSessions={() => {
            setImportedSessions(null);
            setImportApproval(null);
            setShowSessionEditor(true);
          }}
          onScreeningUpdated={() => {
            refreshOverview();
            setClientDetail(null);
            setDetailRefresh((current) => current + 1);
          }}
          onClientUpdated={() => {
            refreshOverview();
            setClientDetail(null);
            setDetailRefresh((current) => current + 1);
          }}
          notify={notify}
          week={clientDetail?.programme?.sessions[0]?.exercises ?? []}
          programme={clientDetail?.programme ?? null}
          location={clientDetail?.location}
          detail={clientDetail}
          loading={!clientDetail && !detailError}
          error={detailError}
          weekNumber={programmeWeek}
          onWeekChange={setProgrammeWeek}
          qualitySettings={qualitySettings}
          onProgrammeChanged={() => {
            refreshOverview();
            setClientDetail(null);
            setDetailRefresh((current) => current + 1);
          }}
          caseStudyDraft={
            clientId &&
            clientDetail?.assessment?.ptNotes?.includes(
              "Module 7 case-study source",
            )
              ? {
                  clientId,
                  hasExisting: Boolean(clientDetail.programme),
                  onSaved: () => {
                    refreshOverview();
                    setClientDetail(null);
                    setDetailRefresh((current) => current + 1);
                  },
                }
              : undefined
          }
        />
      )}
      {showClient && clientId && (
        <WorkspaceSupportPortal
          clientId={clientId}
          name={client}
          goal={goal}
          days={days}
          detail={clientDetail}
          programme={clientDetail?.programme ?? null}
          screening={screening}
          qualitySettings={qualitySettings}
          activeWorkspaceSection={activeWorkspaceSection}
          onWorkspaceSectionChange={setActiveWorkspaceSection}
          guidedOnboarding={guidedOnboarding}
          onFinishGuidedOnboarding={() => setGuidedOnboarding(false)}
          onEditSessions={() => {
            setImportedSessions(null);
            setImportApproval(null);
            setShowSessionEditor(true);
          }}
          onAiImportApproved={(approval) => {
            setImportedSessions(approval.sessions);
            setImportApproval(approval);
            setShowSessionEditor(true);
          }}
          onScreeningUpdated={() => {
            refreshOverview();
            setClientDetail(null);
            setDetailRefresh((current) => current + 1);
          }}
          onClientUpdated={() => {
            refreshOverview();
            setClientDetail(null);
            setDetailRefresh((current) => current + 1);
          }}
          onProgrammeChanged={() => {
            refreshOverview();
            setClientDetail(null);
            setDetailRefresh((current) => current + 1);
          }}
          notify={notify}
        />
      )}
      {showCalendar && (
        <ProgrammeCalendar
          schedule={overview?.schedule ?? []}
          onClose={() => setShowCalendar(false)}
          onOpen={(id, name) => {
            setShowCalendar(false);
            setProgrammeWeek(null);
            setClientId(id);
            setClientDetail(null);
            setDetailError("");
            setClient(name);
            setActiveWorkspaceSection("programme");
            setShowClient(true);
          }}
        />
      )}
      {showClient && clientId && pendingLibraryTemplate && clientDetail && (
        <SessionEditorModal
          clientId={clientId}
          clientName={client}
          goal={clientDetail.goal?.goalType ?? pendingLibraryTemplate.goal}
          days={pendingLibraryTemplate.sessions.length}
          preferredDays={preferredDays}
          sessionDurationMinutes={
            clientDetail.client.sessionDurationMinutes ??
            pendingLibraryTemplate.sessionDurationMinutes
          }
          week={pendingLibraryTemplate.sessions[0]?.exercises ?? []}
          savedSessions={mapLibraryTemplateToClientSessions(
            pendingLibraryTemplate,
            preferredDays,
          )}
          onClose={() => setPendingLibraryTemplate(null)}
          onSaved={() => {
            setPendingLibraryTemplate(null);
            refreshOverview();
            setClientDetail(null);
            setDetailRefresh((current) => current + 1);
          }}
          notify={notify}
        />
      )}
      {showSessionEditor && (
        <SessionEditorModal
          clientId={clientId ?? undefined}
          clientName={client}
          goal={goal}
          days={
            importedSessions?.length ??
            clientDetail?.programme?.sessions.length ??
            days
          }
          preferredDays={preferredDays}
          sessionDurationMinutes={
            importApproval?.sessionDurationMinutes ??
            clientDetail?.programme?.sessions[0]?.durationMinutes ??
            clientDetail?.client.sessionDurationMinutes ??
            45
          }
          week={
            importedSessions?.[0]?.exercises ??
            clientDetail?.programme?.sessions[0]?.exercises ??
            []
          }
          savedSessions={importedSessions ?? clientDetail?.programme?.sessions}
          importApproval={importApproval}
          onClose={() => {
            setShowSessionEditor(false);
            setImportedSessions(null);
            setImportApproval(null);
          }}
          onSaved={() => {
            refreshOverview();
            setClientDetail(null);
            setDetailRefresh((current) => current + 1);
          }}
          notify={notify}
        />
      )}
      {showOnboarding && (
        <ClientOnboarding
          onClose={() => setShowOnboarding(false)}
          onCreated={(name, riskCount, createdClientId, guideNext) => {
            refreshOverview();
            setClientId(createdClientId);
              setClient(name);
              setScreening(riskCount > 0);
              setActiveWorkspaceSection("overview");
              setGuidedOnboarding(guideNext);
            setShowOnboarding(false);
            setShowClient(true);
            notify(
              riskCount
                ? `Client created with ${riskCount} screening flag${riskCount === 1 ? "" : "s"}`
                : "Client created and ready to programme",
            );
          }}
        />
      )}
      {showSettings && (
        <DesignerSettings
          role={accountRole}
          onClose={() => setShowSettings(false)}
          onOpenTeam={() => {
            setShowSettings(false);
            setShowTeam(true);
          }}
          onSaved={(settings) => {
            setQualitySettings(settings);
            notify("Quality settings saved");
          }}
        />
      )}
      {showTeam && <TeamAccess onClose={() => setShowTeam(false)} />}
      {showHelp && <DesignerHelp onClose={() => setShowHelp(false)} />}
      <button
        className="mobile-menu-launcher"
        onClick={() => setMobileMenuOpen(true)}
        aria-label="Open navigation"
      >
        ☰
      </button>
      {mobileMenuOpen && (
        <MobileNav
          onClose={() => setMobileMenuOpen(false)}
          onProgrammeLibrary={() => {
            setMobileMenuOpen(false);
            setShowProgrammeLibrary(true);
            setActiveNav("Programme library");
          }}
          onLibrary={() => {
            setMobileMenuOpen(false);
            setShowLibrary(true);
            setActiveNav("Exercise library");
          }}
          onClients={() => {
            setMobileMenuOpen(false);
            setShowClients(true);
            setActiveNav("Clients");
          }}
          onProgrammes={() => {
            setMobileMenuOpen(false);
            setShowProgrammes(true);
            setActiveNav("Programmes");
          }}
          onSettings={() => {
            setMobileMenuOpen(false);
            setShowSettings(true);
          }}
          onOverview={() => {
            setMobileMenuOpen(false);
            setShowClients(false);
            setShowLibrary(false);
            setShowProgrammes(false);
            setShowProgrammeLibrary(false);
            setActiveNav("Overview");
          }}
        />
      )}
      {toast && <div className="toast">✓ {toast}</div>}
    </main>
  );
}

function Stat({
  label,
  value,
  detail,
  tone,
  icon,
}: {
  label: string;
  value: string;
  detail: string;
  tone: string;
  icon: SemanticIconName;
}) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${tone}`}>
        <Icon name={icon} />
      </div>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <small
          className={tone === "green" || tone === "blue" ? "good-text" : ""}
        >
          {detail}
        </small>
      </div>
    </div>
  );
}
function FirstClientGuide({
  onNewClient,
  onLibrary,
  onProgrammeLibrary,
}: {
  onNewClient: () => void;
  onLibrary: () => void;
  onProgrammeLibrary: () => void;
}) {
  return (
    <section className="first-client-guide">
      <div className="first-client-guide-copy">
        <p className="eyebrow">START HERE</p>
        <h2>Build your first client workflow</h2>
        <p>
          Capture the client context first, then let the programme checks show
          what still needs your professional review.
        </p>
      </div>
      <div className="first-client-guide-steps">
        <button onClick={onNewClient}>
          <span>01</span>
          <strong>Create a client</strong>
          <small>Goals, schedule, location and initial screening</small>
          <b>Start →</b>
        </button>
        <button onClick={onLibrary}>
          <span>02</span>
          <strong>Explore the exercise library</strong>
          <small>Check patterns, equipment and coaching context</small>
          <b>Browse →</b>
        </button>
        <button onClick={onProgrammeLibrary}>
          <span>03</span>
          <strong>Build and review a draft</strong>
          <small>Choose a starter template in the Programme Library</small>
          <b>Explore templates →</b>
        </button>
      </div>
    </section>
  );
}
function DashboardClientRoster({
  clients,
  loading,
  view,
  onViewChange,
  onOpen,
}: {
  clients: DashboardClient[];
  loading: boolean;
  view: "all" | "needs_attention" | "no_activity" | "drafts" | "no_programme";
  onViewChange: (
    view: "all" | "needs_attention" | "no_activity" | "drafts" | "no_programme",
  ) => void;
  onOpen: (id: string, name: string) => void;
}) {
  const [status, setStatus] = useState("active");
  const [query, setQuery] = useState("");
  const [nowMs] = useState(() => Date.now());
  const cutoff = nowMs - 1000 * 60 * 60 * 24 * 14;
  const visible = clients.filter((client) => {
    const name = `${client.firstName} ${client.lastName}`.toLowerCase();
    const noActivity =
      !client.lastWorkout ||
      new Date(`${client.lastWorkout.date}T12:00:00`).getTime() < cutoff;
    const matchesView =
      view === "all" ||
      (view === "needs_attention" && client.needsAttention) ||
      (view === "no_activity" && noActivity) ||
      (view === "drafts" && client.programme?.status === "draft") ||
      (view === "no_programme" && !client.programme);
    return (
      matchesView &&
      (status === "all" || client.status === status) &&
      (!query.trim() || name.includes(query.trim().toLowerCase()))
    );
  });
  const label = (value: string) => value.replaceAll("_", " ");
  const attentionReason = (client: DashboardClient) => client.dataGaps.length
    ? `Missing ${client.dataGaps.join(" · ")}`
    : client.lastWorkout?.painReported
      ? "Pain reported in latest workout"
      : client.quality && client.quality.approvalReadiness !== "ready"
        ? `Quality ${label(client.quality.approvalReadiness)}`
        : client.programme?.status === "draft"
          ? "Draft programme awaiting review"
          : "Review client record";
  function selectView(nextView: typeof view) {
    onViewChange(nextView);
  }
  return (
    <section className="panel dashboard-roster">
      <div className="panel-heading dashboard-roster-heading">
        <div>
          <p className="eyebrow">CLIENT COMMAND CENTRE</p>
          <h2>Manage your roster</h2>
          <span className="panel-muted">
            {loading
              ? "Loading client signals…"
              : `${visible.length} of ${clients.length} client${clients.length === 1 ? "" : "s"} shown`}
          </span>
        </div>
        <button
          className="text-button"
          onClick={() => selectView("needs_attention")}
        >
          Needs attention →
        </button>
      </div>
      <div className="dashboard-roster-toolbar">
        <div
          className="dashboard-view-tabs"
          role="tablist"
          aria-label="Client views"
        >
          {(
            [
              ["all", "All"],
              ["needs_attention", "Needs attention"],
              ["no_activity", "No recent activity"],
              ["drafts", "Draft programmes"],
              ["no_programme", "No programme"],
            ] as const
          ).map(([value, text]) => (
            <button
              type="button"
              role="tab"
              aria-selected={view === value}
              className={view === value ? "active" : ""}
              key={value}
              onClick={() => selectView(value)}
            >
              {text}
              {value === "needs_attention" && (
                <em>
                  {clients.filter((client) => client.needsAttention).length}
                </em>
              )}
            </button>
          ))}
        </div>
        <div className="dashboard-roster-filters">
          <input
            aria-label="Filter client roster"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter clients…"
          />
          <select
            aria-label="Filter client status"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="active">Active clients</option>
            <option value="all">All statuses</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>
      {loading ? (
        <div className="dashboard-empty">
          Loading the client command centre…
        </div>
      ) : visible.length ? (
        <div className="dashboard-roster-table">
          <div className="dashboard-roster-header">
            <span>CLIENT</span>
            <span>PROGRAMME</span>
            <span>LAST WORKOUT</span>
            <span>ADHERENCE</span>
            <span>NEXT SESSION</span>
            <span>STATUS</span>
          </div>
          {visible.map((client) => (
            <button
              type="button"
              className={`dashboard-client-row ${clientColor(`${client.firstName} ${client.lastName}`, client.clientColour)}${client.needsAttention ? " needs-attention" : ""}`}
              key={client.id}
              onClick={() =>
                onOpen(client.id, `${client.firstName} ${client.lastName}`)
              }
            >
              <span className="dashboard-client-name">
                <span className="avatar">
                  {client.firstName.slice(0, 1)}
                  {client.lastName.slice(0, 1)}
                </span>
                <span>
                  <strong>
                    {client.firstName} {client.lastName}
                  </strong>
                  {client.needsAttention ? (
                    <small>{attentionReason(client)}</small>
                  ) : client.dataGaps.length ? (
                    <small>Missing {client.dataGaps.join(" · ")}</small>
                  ) : client.goal ? (
                    <small>{client.goal.goalType}</small>
                  ) : (
                    <small>Goal not recorded</small>
                  )}
                </span>
              </span>
              <span className="dashboard-client-programme">
                {client.programme ? (
                  <>
                    <strong>{client.programme.name}</strong>
                    <small>
                      {label(client.programme.status)} · Week{" "}
                      {client.programme.currentWeek}/
                      {client.programme.durationWeeks}
                    </small>
                    {client.quality && (
                      <small
                        className={
                          client.quality.approvalReadiness === "blocked"
                            ? "quality-client-status quality-client-status-blocked"
                            : "quality-client-status"
                        }
                      >
                        Quality {client.quality.score} ·{" "}
                        {label(client.quality.approvalReadiness)}
                      </small>
                    )}
                  </>
                ) : (
                  <small>No programme saved</small>
                )}
              </span>
              <span className="dashboard-client-last">
                {client.lastWorkout ? (
                  <>
                    <strong>
                      {new Date(
                        `${client.lastWorkout.date}T12:00:00`,
                      ).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                      })}
                    </strong>
                    <small>
                      {label(client.lastWorkout.status)}
                      {client.lastWorkout.painReported
                        ? " · pain reported"
                        : ""}
                    </small>
                  </>
                ) : (
                  <small>No workout logged</small>
                )}
              </span>
              <span className="dashboard-client-adherence">
                {client.adherence === null ? "—" : `${client.adherence}%`}
                <small>last 120 days</small>
              </span>
              <span className="dashboard-client-next">
                {client.nextSession ? (
                  <>
                    <strong>{client.nextSession.day.slice(0, 3)}</strong>
                    <small>{client.nextSession.name}</small>
                  </>
                ) : (
                  <small>No active session</small>
                )}
              </span>
              <span
                className={`dashboard-client-status ${client.needsAttention ? "attention" : "on-track"}`}
              >
                {client.needsAttention ? attentionReason(client) : "On track"}
                <b>→</b>
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="dashboard-empty">
          <strong>
            {clients.length === 0
              ? "No clients yet"
              : "No clients match this view."}
          </strong>
          <span>
            {clients.length === 0
              ? "Create your first client from the + New client button above."
              : "Try another view or clear the filters."}
          </span>
        </div>
      )}
    </section>
  );
}
function Attention({
  name,
  text,
  tag,
  tone,
  initials,
  onClick,
}: {
  name: string;
  text: string;
  tag: string;
  tone: string;
  initials: string;
  onClick: () => void;
}) {
  return (
    <button className={`attention-row ${clientColor(name)}`} onClick={onClick}>
      <div className={`avatar avatar-${tone}`}>{initials}</div>
      <div className="attention-copy">
        <strong>{name}</strong>
        <span>{text}</span>
      </div>
      <span className={`attention-tag ${tone}`}>{tag}</span>
      <span className="row-arrow">→</span>
    </button>
  );
}
function Schedule({
  time,
  name,
  type,
  status,
}: {
  time: string;
  name: string;
  type: string;
  status: string;
}) {
  return (
    <div className="schedule-row">
      <time>{time}</time>
      <div className={`schedule-card ${clientColor(name)}`}>
        <strong>{name}</strong>
        <span>{type}</span>
        <small>{status === "pending" ? "Pending result" : status === "today" ? "Today · not logged" : status === "upcoming" ? "Upcoming" : `Logged · ${status}`}</small>
      </div>
    </div>
  );
}

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

function ProgrammeList({
  programmes,
  clients,
  onClose,
  onOpen,
}: {
  programmes: OverviewData["programmes"];
  clients: OverviewData["clients"];
  onClose: () => void;
  onOpen: (id: string, name: string) => void;
}) {
  const [descending, setDescending] = useState(true);
  const [clientFilter, setClientFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const clientNames = new Map(
    clients.map((client) => [
      client.id,
      `${client.firstName} ${client.lastName}`,
    ]),
  );
  const clientOptions = clients
    .filter((client) =>
      programmes.some((programme) => programme.clientId === client.id),
    )
    .sort((a, b) =>
      `${a.firstName} ${a.lastName}`.localeCompare(
        `${b.firstName} ${b.lastName}`,
      ),
    );
  const statusOptions = [
    "draft",
    "reviewed",
    "assigned",
    "active",
    "paused",
    "completed",
    "archived",
  ];
  const filtered = programmes.filter(
    (programme) =>
      (clientFilter === "all" || programme.clientId === clientFilter) &&
      (statusFilter === "all" || programme.status === statusFilter),
  );
  const sorted = [...filtered].sort((a, b) =>
    descending ? b.version - a.version : a.version - b.version,
  );
  const filterDescription =
    clientFilter !== "all"
      ? ` for ${clientNames.get(clientFilter) ?? "this client"}`
      : "";
  return (
    <div className="client-list-view">
      <div className="page-heading">
        <div>
          <p className="eyebrow">PROGRAMME MANAGEMENT</p>
          <h1>Programmes</h1>
          <p className="subheading">
            Review drafts, phases and versions by client.
          </p>
        </div>
        <button className="secondary-button" onClick={onClose}>
          ← Dashboard
        </button>
      </div>
      <section className="panel client-list-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">SAVED PROGRAMMES</p>
            <h2>
              {filtered.length} programme{filtered.length === 1 ? "" : "s"}
              {statusFilter !== "all" ? ` · ${statusFilter}` : ""}
            </h2>
          </div>
          <div className="programme-list-controls">
            <label className="programme-filter">
              CLIENT
              <select
                aria-label="Filter programmes by client"
                value={clientFilter}
                onChange={(event) => setClientFilter(event.target.value)}
              >
                <option value="all">All clients</option>
                {clientOptions.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.firstName} {client.lastName}
                  </option>
                ))}
              </select>
            </label>
            <label className="programme-filter">
              STATUS
              <select
                aria-label="Filter programmes by status"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="all">All statuses</option>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
            <button
              className="text-button"
              onClick={() => setDescending((value) => !value)}
            >
              Sort: {descending ? "Newest" : "Oldest"} ▾
            </button>
          </div>
        </div>
        {sorted.length ? (
          <div className="client-table">
            {sorted.map((programme) => (
              <button
                key={programme.id}
                className={`client-table-row ${clientColor(clientNames.get(programme.clientId) ?? "Client", clients.find((client) => client.id === programme.clientId)?.clientColour)}`}
                onClick={() =>
                  onOpen(
                    programme.clientId,
                    clientNames.get(programme.clientId) ?? "Client",
                  )
                }
              >
                <span className="avatar avatar-mint">
                  {(clientNames.get(programme.clientId) ?? "C")
                    .split(" ")
                    .map((part) => part[0])
                    .join("")
                    .slice(0, 2)}
                </span>
                <span>
                  <strong>
                    {clientNames.get(programme.clientId) ?? "Unknown client"}
                  </strong>
                  <small>
                    {programme.name} · Version {programme.version} · Week{" "}
                    {programme.currentWeek} of {programme.durationWeeks}
                  </small>
                </span>
                <span className={`status-pill status-${programme.status}`}>
                  {programme.status}
                </span>
                <span className="row-arrow">→</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="empty-client-state">
            <div className="empty-icon">▦</div>
            <h3>
              {filtered.length === 0 &&
              (clientFilter !== "all" || statusFilter !== "all")
                ? "No matching programmes"
                : "No programmes saved yet"}
            </h3>
            <p>
              {filtered.length === 0 &&
              (clientFilter !== "all" || statusFilter !== "all")
                ? `Try another client or status${filterDescription}.`
                : "Save a draft from a client workspace to see it here."}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

function ClientList({
  onClose,
  onNew,
  onOpen,
}: {
  onClose: () => void;
  onNew: () => void;
  onOpen: (id: string, name: string) => void;
}) {
  const [items, setItems] = useState<OverviewData["clients"]>([]);
  const [descending, setDescending] = useState(true);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<
    OverviewData["clients"][number] | null
  >(null);
  const [error, setError] = useState("");
  useEffect(() => {
    fetch("/api/designer/overview", {
      credentials: "same-origin",
      cache: "no-store",
    })
      .then((response) => response.json() as Promise<OverviewData>)
      .then((data) => setItems(data.clients))
      .finally(() => setLoading(false));
  }, []);
  const sorted = [...items].sort((a, b) =>
    descending
      ? new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      : new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(),
  );
  async function deleteClient() {
    if (!pendingDelete) return;
    const item = pendingDelete;
    setDeleting(item.id);
    setError("");
    try {
      await deleteClientAction({
        clientId: item.id,
        confirmation: "DELETE CLIENT",
      });
      setItems((current) => current.filter((client) => client.id !== item.id));
      setPendingDelete(null);
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Client could not be deleted.",
      );
    } finally {
      setDeleting(null);
    }
  }
  return (
    <div className="client-list-view">
      <div className="page-heading">
        <div>
          <p className="eyebrow">CLIENT MANAGEMENT</p>
          <h1>Clients</h1>
          <p className="subheading">
            Your clients, screening status and programme access.
          </p>
        </div>
        <div className="page-heading-actions">
          <button className="secondary-button" onClick={onClose}>
            ← Dashboard
          </button>
          <button className="primary-button" onClick={onNew}>
            + New client
          </button>
        </div>
      </div>
      <section className="panel client-list-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">YOUR CLIENTS</p>
            <h2>{items.length} active profiles</h2>
          </div>
          <button
            className="text-button"
            onClick={() => setDescending((value) => !value)}
          >
            Sort: {descending ? "Recently updated" : "Oldest updated"} ▾
          </button>
        </div>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        {loading ? (
          <p className="library-empty">Loading your clients…</p>
        ) : items.length === 0 ? (
          <div className="empty-client-state">
            <div className="empty-icon">♧</div>
            <h3>No clients yet</h3>
            <p>
              Create the first profile to capture screening, goals, preferences
              and equipment.
            </p>
            <button className="primary-button" onClick={onNew}>
              Create a client →
            </button>
          </div>
        ) : (
          <div className="client-table">
            {sorted.map((item) => (
              <ClientListRow
                key={item.id}
                item={item}
                deleting={deleting === item.id}
                onOpen={onOpen}
                onDelete={() => setPendingDelete(item)}
              />
            ))}
          </div>
        )}
      </section>
      {pendingDelete && (
        <DeleteClientDialog
          client={pendingDelete}
          deleting={deleting === pendingDelete.id}
          onClose={() => setPendingDelete(null)}
          onConfirm={deleteClient}
        />
      )}
    </div>
  );
}

function ClientListRow({
  item,
  deleting,
  onOpen,
  onDelete,
}: {
  item: OverviewData["clients"][number];
  deleting: boolean;
  onOpen: (id: string, name: string) => void;
  onDelete: (item: OverviewData["clients"][number]) => void;
}) {
  return (
    <div className={`client-table-row ${clientColor(`${item.firstName} ${item.lastName}`, item.clientColour)}`}>
      <button
        className="client-row-open"
        onClick={() => onOpen(item.id, `${item.firstName} ${item.lastName}`)}
      >
        <span className="avatar">
          {item.firstName.slice(0, 1)}
          {item.lastName.slice(0, 1)}
        </span>
        <span>
          <strong>
            {item.firstName} {item.lastName}
          </strong>
          <small>
            Updated {new Date(item.updatedAt).toLocaleDateString("en-GB")}
          </small>
        </span>
        <span className="status-pill status-active">Active</span>
        <span className="row-arrow">→</span>
      </button>
      <button
        className="client-row-delete"
        onClick={() => onDelete(item)}
        disabled={deleting}
      >
        {deleting ? "Deleting…" : "Delete"}
      </button>
    </div>
  );
}

function DeleteClientDialog({
  client,
  deleting,
  onClose,
  onConfirm,
}: {
  client: OverviewData["clients"][number];
  deleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const [confirmation, setConfirmation] = useState("");
  return (
    <div className="modal-backdrop">
      <section
        className="delete-client-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-client-heading"
      >
        <header>
          <div>
            <p className="eyebrow">PERMANENT DATA DELETION</p>
            <h2 id="delete-client-heading">
              Delete {client.firstName} {client.lastName}?
            </h2>
            <p>
              This permanently removes the client profile, assessment,
              preferences, programmes, workout history and related records. This
              cannot be undone.
            </p>
          </div>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </header>
        <label>
          TYPE DELETE CLIENT TO CONFIRM
          <input
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            autoComplete="off"
          />
        </label>
        <footer>
          <button className="secondary-button" onClick={onClose}>
            Cancel
          </button>
          <button
            className="delete-confirm-button"
            onClick={onConfirm}
            disabled={deleting || confirmation !== "DELETE CLIENT"}
          >
            {deleting ? "Deleting…" : "Delete permanently"}
          </button>
        </footer>
      </section>
    </div>
  );
}

function ClientWorkspace({
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
  const selectedSession =
    programme?.sessions.find((session) => session.id === selectedSessionId) ??
    programme?.sessions[0];
  const selectedExercises = selectedSession?.exercises ?? week;
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
                <section className="warning-card">
                  <div className="warning-symbol">!</div>
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
                  <button onClick={() => setShowScreeningReview(true)}>
                    {screening ? "Review screening" : "View assessment"} →
                  </button>
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
                        <h3>{selectedSession?.name ?? "Programme sessions"}</h3>
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
                          ? `${qualityReadiness} · ${detail.quality.counts.significant} significant · ${detail.quality.counts.advisory} advisories`
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
                    onClick={saveDraft}
                    disabled={saving || !selectedExercises.length}
                  >
                    {saving ? "Saving draft…" : "Save draft & review →"}
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

function WorkspaceSupportPortal({
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
          <p className="screening-note">
            This information is carried into the review prompt. Resolve
            screening or clearance decisions from the assessment workflow before
            assigning where required.
          </p>
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
          <ClientProgressLauncher clientId={clientId} />
          <ClientPerformanceLauncher clientId={clientId} notify={notify} />
          <ClientPreferencesLauncher
            clientId={clientId}
            notify={notify}
            open={preferencesOpen}
            onOpenChange={setPreferencesOpen}
          />
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

function ProgrammeQualityCardV2({
  programme,
  goal,
  trainingDays,
  screening,
  settings,
}: {
  programme: NonNullable<ClientDetail["programme"]>;
  goal: string;
  trainingDays: number;
  screening: boolean;
  settings: QualitySettings;
}) {
  const review = buildQualityWarnings({
    sessions: programme.sessions,
    trainingDays,
    screening,
    settings,
  });
  const [collapsed, setCollapsed] = useState(false);
  const [showOverride, setShowOverride] = useState(false);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  async function recordOverride() {
    if (!reason.trim()) return;
    setSaving(true);
    try {
      await recordProgrammeOverrideAction({
        programmeId: programme.id,
        warningCodes: review.warnings.map((_, index) => `quality-${index + 1}`),
        reason,
      });
      setSaved(true);
      setShowOverride(false);
    } finally {
      setSaving(false);
    }
  }
  return (
    <section
      className={`quality-summary${collapsed ? " is-collapsed" : ""}`}
      aria-label="Live programme quality summary"
    >
      <div className="quality-summary-heading">
        <div>
          <p className="eyebrow">LIVE QUALITY CHECK</p>
          <strong>Advisory score · {review.score}</strong>
        </div>
        <button
          className="quality-collapse-button"
          onClick={() => setCollapsed(!collapsed)}
          aria-expanded={!collapsed}
        >
          {collapsed ? "Show" : "Hide"}
        </button>
      </div>
      {!collapsed && (
        <>
          <p className="quality-summary-meta">
            {review.totalSets} total sets · {programme.sessions.length} sessions
            · {goal}
          </p>
          {review.warnings.length ? (
            <>
              <ul>
                {review.warnings.slice(0, 5).map((warning) => (
                  <li key={warning}>! {warning}</li>
                ))}
              </ul>
              <button
                className="quality-override-button"
                onClick={() => setShowOverride(!showOverride)}
              >
                {saved ? "Override recorded" : "Record PT override"}
              </button>
              {showOverride && (
                <div className="quality-override-form">
                  <label>
                    REASON
                    <textarea
                      value={reason}
                      onChange={(event) => setReason(event.target.value)}
                      placeholder="Document the professional reason for proceeding…"
                    />
                  </label>
                  <button
                    onClick={recordOverride}
                    disabled={saving || reason.trim().length < 3}
                  >
                    {saving ? "Recording…" : "Save override reason"}
                  </button>
                </div>
              )}
            </>
          ) : (
            <p className="quality-summary-good">
              No enabled rule-based concerns detected from the saved
              prescription.
            </p>
          )}
          <small>
            Advisory decision support for PT review, not an objective measure of
            programme quality. Settings can be customised for your practice.
          </small>
        </>
      )}
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
  const [screeningAnswers, setScreeningAnswers] =
    useState<Record<string, boolean>>(initialScreening);
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
function ProgrammeQualityCard({
  programme,
  goal,
  trainingDays,
  screening,
}: {
  programme: NonNullable<ClientDetail["programme"]>;
  goal: string;
  trainingDays: number;
  screening: boolean;
}) {
  const sessions = programme.sessions;
  const allExercises = sessions.flatMap((session) => session.exercises);
  const totalSets = allExercises.reduce(
    (sum, exercise) =>
      sum + Number(exercise.prescription.match(/^\d+/)?.[0] ?? 0),
    0,
  );
  const presses = allExercises.filter((exercise) =>
    /push|press/i.test(exercise.pattern),
  ).length;
  const pulls = allExercises.filter((exercise) =>
    /pull|row/i.test(exercise.pattern),
  ).length;
  const missingProgression = allExercises.filter(
    (exercise) => !exercise.progressionRule,
  ).length;
  const warnings = [
    screening
      ? "Screening flag present: review referral or clearance requirements before assigning this draft."
      : "",
    sessions.length < trainingDays
      ? `Only ${sessions.length} session${sessions.length === 1 ? "" : "s"} saved for the selected ${trainingDays}-day target.`
      : "",
    presses > pulls + 2
      ? "Pressing volume is high relative to pulling volume."
      : "",
    totalSets > sessions.length * 28
      ? "Total prescribed sets may create a high recovery demand."
      : "",
    missingProgression
      ? `${missingProgression} exercise${missingProgression === 1 ? " lacks" : "s lack"} a documented progression rule.`
      : "",
    sessions.some((session) => {
      const sets = session.exercises.reduce(
        (sum, exercise) =>
          sum + Number(exercise.prescription.match(/^\d+/)?.[0] ?? 0),
        0,
      );
      return sets * 2 + 5 > session.durationMinutes;
    })
      ? "At least one session may run over its saved duration at the current prescription."
      : "",
  ].filter(Boolean);
  const [collapsed, setCollapsed] = useState(true);
  const [showOverride, setShowOverride] = useState(false);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  async function recordOverride() {
    if (!reason.trim()) return;
    setSaving(true);
    try {
      await recordProgrammeOverrideAction({
        programmeId: programme.id,
        warningCodes: [screening ? "screening-review" : "quality-review"],
        reason,
      });
      setSaved(true);
      setShowOverride(false);
    } finally {
      setSaving(false);
    }
  }
  const score = Math.max(0, 100 - warnings.length * 8);
  return (
    <section
      className={`quality-summary${collapsed ? " is-collapsed" : ""}`}
      aria-label="Live programme quality summary"
    >
      <div className="quality-summary-heading">
        <div>
          <p className="eyebrow">LIVE QUALITY CHECK</p>
          <strong>Advisory score · {score}</strong>
        </div>
        <button
          className="quality-collapse-button"
          onClick={() => setCollapsed(!collapsed)}
          aria-expanded={!collapsed}
        >
          {collapsed ? "Show" : "Hide"}
        </button>
      </div>
      {!collapsed && (
        <>
          <p className="quality-summary-meta">
            {totalSets} total sets · {sessions.length} sessions · {goal}
          </p>
          {warnings.length ? (
            <>
              <ul>
                {warnings.slice(0, 3).map((warning) => (
                  <li key={warning}>! {warning}</li>
                ))}
              </ul>
              <button
                className="quality-override-button"
                onClick={() => setShowOverride(!showOverride)}
              >
                {saved ? "Override recorded" : "Record PT override"}
              </button>
              {showOverride && (
                <div className="quality-override-form">
                  <label>
                    REASON
                    <textarea
                      value={reason}
                      onChange={(event) => setReason(event.target.value)}
                      placeholder="Document the professional reason for proceeding…"
                    />
                  </label>
                  <button
                    onClick={recordOverride}
                    disabled={saving || reason.trim().length < 3}
                  >
                    {saving ? "Recording…" : "Save override reason"}
                  </button>
                </div>
              )}
            </>
          ) : (
            <p className="quality-summary-good">
              No rule-based concerns detected from the saved prescription.
            </p>
          )}
          <small>
            This is a decision-support signal, not an objective
            programme-quality measure. A quality override does not resolve
            screening; record that decision from the client assessment panel. PT
            review remains required.
          </small>
        </>
      )}
    </section>
  );
}
function ProgrammeHistoryPanel({
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
  if (!history.length && !events.length) return null;
  return (
    <section className="programme-history-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">AUDIT TRAIL</p>
          <h2>Programme history</h2>
        </div>
        <span>
          {events.length} event{events.length === 1 ? "" : "s"}
        </span>
      </div>
      {history.map((item) => (
        <div className="history-version" key={item.id}>
          <strong>Version {item.version}</strong>
          <span>
            {item.name} · {item.status}
          </span>
          <small>{new Date(item.updatedAt).toLocaleDateString("en-GB")}</small>
        </div>
      ))}
    </section>
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

function ProgrammeCalendar({
  schedule,
  inline = false,
  remainingOnly = false,
  onClose,
  onOpen,
}: {
  schedule: OverviewData["schedule"];
  inline?: boolean;
  remainingOnly?: boolean;
  onClose: () => void;
  onOpen: (id: string, name: string) => void;
}) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [loadedWeekSchedule, setLoadedWeekSchedule] = useState<OverviewData["schedule"] | null>(null);
  useEffect(() => {
    if (weekOffset === 0) return;
    const controller = new AbortController();
    fetch(`/api/designer/overview?weekOffset=${weekOffset}`, { credentials: "same-origin", cache: "no-store", signal: controller.signal })
      .then((response) => response.ok ? response.json() as Promise<OverviewData> : Promise.reject(new Error("Calendar could not be loaded")))
      .then((data) => setLoadedWeekSchedule(data.schedule))
      .catch(() => undefined);
    return () => controller.abort();
  }, [weekOffset]);
  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];
  const todayName = new Intl.DateTimeFormat("en-GB", { weekday: "long" }).format(new Date());
  const today = new Date().toISOString().slice(0, 10);
  const weekSchedule = weekOffset === 0 ? schedule : loadedWeekSchedule ?? [];
  const visibleSchedule = remainingOnly
    ? weekSchedule.filter((item) => item.date >= today || item.status === "completed" || item.status === "partial")
    : weekSchedule;
  return (
    <div className={inline ? "calendar-inline" : "calendar-backdrop"}>
      <section
        className={`calendar-panel${inline ? " calendar-panel-inline" : ""}`}
        role={inline ? undefined : "dialog"}
        aria-modal={inline ? undefined : "true"}
        aria-labelledby="calendar-heading"
      >
        <header>
          <div>
            <p className="eyebrow">PT CALENDAR</p>
            <h2 id="calendar-heading">{remainingOnly ? "Remaining this week" : "This week's sessions"}</h2>
            <p>
              Owner-scoped programme sessions from your saved client plans.
              Select a session to open that client&apos;s programme.
            </p>
          </div>
          <div className="calendar-week-controls">
            <button type="button" className="secondary-button" onClick={() => setWeekOffset((value) => value - 1)}>← Previous week</button>
            <strong>{weekOffset === 0 ? "This week" : weekOffset > 0 ? `Week +${weekOffset}` : `Week ${weekOffset}`}</strong>
            <button type="button" className="secondary-button" onClick={() => setWeekOffset((value) => value + 1)}>Next week →</button>
          </div>
          {!inline && <button className="close-button" onClick={onClose}>×</button>}
        </header>
        <div className="calendar-grid">
          {days.map((day) => (
            <div className={`calendar-day${day === todayName ? " is-today" : ""}`} key={day}>
              <p>{day}{day === todayName && <strong>Today</strong>}</p>
              {visibleSchedule
                .filter((item) =>
                  item.day
                    .toLowerCase()
                    .startsWith(day.slice(0, 3).toLowerCase()),
                )
                .map((item) => (
                  <button
                    type="button"
                    className={`calendar-session ${clientColor(item.clientName, item.clientColour)}`}
                    key={item.id}
                    onClick={() => onOpen(item.clientId, item.clientName)}
                  >
                    <span>{item.clientName}</span>
                    <strong>{item.name}</strong>
                    <small>
                      {item.durationMinutes} min · {item.sessionType} · {item.scheduledTime ? `${item.scheduledTime} · ` : ""}{item.managementMode === "self_managed" ? "Self-managed" : "PT-managed"} · {new Date(`${item.date}T12:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    </small>
                    <em>{item.status === "completed" || item.status === "partial" ? `Logged · ${item.status}` : item.status === "pending" ? "Pending result" : item.status === "today" ? "Today · not logged" : "Upcoming"}</em>
                  </button>
                ))}
              {!schedule.some((item) =>
                item.day
                  .toLowerCase()
                  .startsWith(day.slice(0, 3).toLowerCase()),
              ) && <small className="calendar-empty">No session</small>}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function ClientPortalPreview({
  clientName,
  programme,
  onClose,
}: {
  clientName: string;
  programme: NonNullable<ClientDetail["programme"]>;
  onClose: () => void;
}) {
  const [selectedDay, setSelectedDay] = useState(
    programme.sessions[0]?.dayOfWeek ?? 1,
  );
  const selectedSession =
    programme.sessions.find((session) => session.dayOfWeek === selectedDay) ??
    programme.sessions[0];
  const dayName = (day: number) =>
    [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ][day % 7];
  return (
    <div className="client-preview-backdrop">
      <section
        className="client-preview-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="client-preview-heading"
      >
        <header className="client-preview-header">
          <div>
            <p className="eyebrow">CLIENT VIEW PREVIEW</p>
            <h2 id="client-preview-heading">{clientName}</h2>
            <p>
              {programme.name} · Week {programme.currentWeek} of{" "}
              {programme.durationWeeks}
            </p>
          </div>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </header>
        <div className="client-preview-notice">
          <span>PREVIEW ONLY</span>
          <p>
            This is the simplified view a client will receive. Assignment and
            client login are not connected yet.
          </p>
        </div>
        <div className="client-preview-summary">
          <div>
            <span>FOCUS</span>
            <strong>{programme.goalSummary}</strong>
          </div>
          <div>
            <span>STATUS</span>
            <strong>{programme.status}</strong>
          </div>
          <div>
            <span>THIS WEEK</span>
            <strong>{programme.sessions.length} sessions</strong>
          </div>
        </div>
        <div className="client-calendar">
          <p className="eyebrow">WEEK {programme.currentWeek} PLAN</p>
          <div className="client-calendar-days">
            {programme.sessions.map((session) => (
              <button
                key={session.id}
                className={selectedSession?.id === session.id ? "selected" : ""}
                onClick={() => setSelectedDay(session.dayOfWeek)}
              >
                <span>{dayName(session.dayOfWeek).slice(0, 3)}</span>
                <strong>{session.name}</strong>
                <small>{session.durationMinutes} min</small>
              </button>
            ))}
          </div>
        </div>
        {selectedSession ? (
          <article className="client-session-card">
            <header>
              <div>
                <p className="eyebrow">TODAY&apos;S WORKOUT</p>
                <h3>{selectedSession.name}</h3>
                <span>
                  {dayName(selectedSession.dayOfWeek)} ·{" "}
                  {selectedSession.durationMinutes} minutes
                </span>
              </div>
              <span className="client-start-button muted">
                Workout logging comes next
              </span>
            </header>
            <div className="client-exercise-list">
              {selectedSession.exercises.map((exercise, index) => (
                <div
                  className="client-exercise-row"
                  key={`${exercise.name}-${index}`}
                >
                  <span className="client-exercise-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <strong>{exercise.name}</strong>
                    <small>
                      {exercise.target}
                      {exercise.method ? ` · ${exercise.method}` : ""}
                    </small>
                  </div>
                  <b>{exercise.prescription}</b>
                  <span>
                    {exercise.restSeconds
                      ? `${exercise.restSeconds}s rest`
                      : "As coached"}
                  </span>
                </div>
              ))}
            </div>
            <footer>
              <span>
                Use the target effort shown by your trainer. Stop and tell your
                trainer about pain or unusual symptoms.
              </span>
              <span className="client-secondary-button muted">
                Exercise notes appear after assignment
              </span>
            </footer>
          </article>
        ) : (
          <div className="dashboard-empty">
            No sessions are saved for this programme week yet.
          </div>
        )}
      </section>
    </div>
  );
}

function ClientOnboarding({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (
    name: string,
    riskCount: number,
    clientId: string,
    guideNext: boolean,
  ) => void;
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [goalType, setGoalType] = useState("General fitness");
  const [trainingDays, setTrainingDays] = useState(3);
  const [preferredDays, setPreferredDays] = useState<number[]>([1, 3, 5]);
  const [sessionDurationMinutes, setSessionDurationMinutes] = useState(45);
  const [locationName, setLocationName] = useState("Commercial gym");
  const [locationType, setLocationType] = useState("Full gym");
  const [equipment, setEquipment] = useState([
    "Dumbbells",
    "Machines",
    "Cable",
  ]);
  const [screening, setScreening] = useState({
    chestPain: false,
    cardiovascularHistory: false,
    dizzinessOrFainting: false,
    unusualBreathlessness: false,
    diagnosedDisease: false,
    medicalIssue: false,
    medicationAffectingExercise: false,
    recentSurgery: false,
    injuryOrMusculoskeletalLimitation: false,
    pregnancyOrPostpartum: false,
    otherConcern: false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [guideNext, setGuideNext] = useState(true);
  const riskQuestions: Array<[keyof typeof screening, string]> = [
    ["chestPain", "Chest pain or discomfort during activity?"],
    [
      "cardiovascularHistory",
      "Known cardiovascular disease, history or symptoms?",
    ],
    [
      "dizzinessOrFainting",
      "Dizziness, fainting or unexplained light-headedness?",
    ],
    [
      "unusualBreathlessness",
      "Unusual shortness of breath at rest or with ordinary activity?",
    ],
    ["diagnosedDisease", "Known metabolic, cardiovascular or renal disease?"],
    ["medicalIssue", "Current medical issue needing consideration?"],
    [
      "medicationAffectingExercise",
      "Medication that may affect exercise response?",
    ],
    ["recentSurgery", "Recent surgery or procedure?"],
    [
      "injuryOrMusculoskeletalLimitation",
      "Current injury, pain or musculoskeletal limitation?",
    ],
    [
      "pregnancyOrPostpartum",
      "Pregnant, recently postpartum or pregnancy-related considerations?",
    ],
    ["otherConcern", "Any other health concern requiring professional review?"],
  ];
  function toggleEquipment(item: string) {
    setEquipment((current) =>
      current.includes(item)
        ? current.filter((value) => value !== item)
        : [...current, item],
    );
  }
  function togglePreferredDay(day: number) {
    setPreferredDays((current) => {
      const next = current.includes(day)
        ? current.filter((value) => value !== day)
        : [...current, day].sort((a, b) => a - b);
      setTrainingDays(next.length);
      return next.length ? next : current;
    });
  }
  function setTrainingDayCount(count: number) {
    setTrainingDays(count);
    setPreferredDays((current) =>
      current.length >= count
        ? current.slice(0, count)
        : [
            ...current,
            ...WEEKDAYS.map((day) => day.value).filter(
              (day) => !current.includes(day),
            ),
          ].slice(0, count),
    );
  }
  async function submit() {
    setSaving(true);
    setError("");
    try {
      const result = await createClientAction({
        firstName,
        lastName,
        goalType,
        trainingDays,
        preferredDays,
        sessionDurationMinutes,
        locationName,
        locationType,
        equipment,
        screening,
      });
      onCreated(
        `${firstName.trim()} ${lastName.trim()}`,
        result.riskFlags.length,
        result.clientId,
        guideNext,
      );
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Client could not be created",
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <div className="workspace-overlay">
      <div className="onboarding-drawer">
        <header className="workspace-header">
          <div>
            <p className="eyebrow">NEW CLIENT</p>
            <h1>Start a client profile</h1>
            <p className="panel-muted">
              Capture the starting context now, then optionally follow the
              guided path through the rest of onboarding.
            </p>
          </div>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </header>
        <div className="onboarding-body">
          <section className="onboarding-section">
            <div className="section-title">
              <span>01</span>
              <div>
                <h2>Client details</h2>
                <p>Personal information and the first programming variables.</p>
              </div>
            </div>
            <div className="onboarding-fields">
              <label>
                FIRST NAME
                <input
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  placeholder="Maya"
                />
              </label>
              <label>
                LAST NAME
                <input
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  placeholder="Thompson"
                />
              </label>
              <label>
                PRIMARY GOAL
                <select
                  value={goalType}
                  onChange={(event) => setGoalType(event.target.value)}
                >
                  <option>General fitness</option>
                  <option>Fat loss + muscle retention</option>
                  <option>General strength</option>
                  <option>Hypertrophy</option>
                  <option>Cardiovascular fitness</option>
                  <option>Movement quality</option>
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
                </select>
              </label>
            </div>
            <label className="wide-field">
              TRAINING DAYS PER WEEK
              <div className="training-frequency-picker">
                {Array.from({ length: 7 }, (_, index) => index + 1).map(
                  (day) => (
                    <button
                      type="button"
                      key={day}
                      className={trainingDays === day ? "selected" : ""}
                      onClick={() => setTrainingDayCount(day)}
                    >
                      {day}
                    </button>
                  ),
                )}
              </div>
            </label>
            <label className="wide-field">
              PREFERRED WEEKDAYS
              <div className="weekday-picker">
                {WEEKDAYS.map((day) => (
                  <button
                    type="button"
                    key={day.value}
                    className={
                      preferredDays.includes(day.value) ? "selected" : ""
                    }
                    onClick={() => togglePreferredDay(day.value)}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
              <small className="panel-muted">
                Selected:{" "}
                {preferredDays
                  .map(
                    (day) =>
                      WEEKDAYS.find((option) => option.value === day)?.label,
                  )
                  .join(", ")}
              </small>
            </label>
          </section>
          <section className="onboarding-section">
            <div className="section-title">
              <span>02</span>
              <div>
                <h2>Location & equipment</h2>
                <p>
                  Exercises will be filtered against this location unless you
                  override it.
                </p>
              </div>
            </div>
            <div className="onboarding-fields">
              <label>
                Location name
                <input
                  value={locationName}
                  onChange={(event) => setLocationName(event.target.value)}
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
              Select only equipment confirmed at this location. Unchecked items
              stay unverified for programme quality checks.
            </p>
            <div className="equipment-picker">
              {[
                "Dumbbells",
                "Machines",
                "Cable",
                "Barbell",
                "Bands",
                "Bike",
                "Kettlebell",
              ].map((item) => (
                <button
                  type="button"
                  key={item}
                  className={equipment.includes(item) ? "chosen" : ""}
                  onClick={() => toggleEquipment(item)}
                >
                  {equipment.includes(item) ? "✓ " : "+ "}
                  {item}
                </button>
              ))}
            </div>
          </section>
          <section className="onboarding-section screening-section">
            <div className="section-title">
              <span>03</span>
              <div>
                <h2>Initial screening</h2>
                <p>
                  These flags do not diagnose. They help the PT decide whether
                  additional screening, referral or clearance is appropriate.
                </p>
              </div>
            </div>
            <div className="screening-grid">
              {riskQuestions.map(([key, label]) => (
                <label
                  key={key}
                  className={
                    screening[key]
                      ? "screening-choice flagged"
                      : "screening-choice"
                  }
                >
                  <input
                    type="checkbox"
                    checked={screening[key]}
                    onChange={(event) =>
                      setScreening({
                        ...screening,
                        [key]: event.target.checked,
                      })
                    }
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
            <p className="screening-note">
              Any positive response will be recorded on the assessment and kept
              visible to the PT before programme finalisation.
            </p>
          </section>
          <label className="onboarding-guide-choice">
            <input
              type="checkbox"
              checked={guideNext}
              onChange={(event) => setGuideNext(event.target.checked)}
            />
            <span>
              <strong>Guide me through the remaining onboarding</strong>
              <small>
                After creating the profile, step through assessment,
                preferences, location/equipment, programming and first workout
                logging. You can skip any stage.
              </small>
            </span>
          </label>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <footer className="onboarding-footer">
            <button className="secondary-button" onClick={onClose}>
              Cancel
            </button>
            <button
              className="primary-button"
              onClick={submit}
              disabled={saving || !firstName.trim() || !lastName.trim()}
            >
              {saving ? "Creating profile…" : "Create client profile →"}
            </button>
          </footer>
        </div>
      </div>
    </div>
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
      </section>
    </div>
  );
}

function WorkoutLogModal({
  clientName,
  onClose,
  onSaved,
}: {
  clientName: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [status, setStatus] = useState<
    "completed" | "partial" | "missed" | "skipped"
  >("completed");
  const [sessionRpe, setSessionRpe] = useState(7);
  const [energy, setEnergy] = useState(3);
  const [painReported, setPainReported] = useState(false);
  const [notes, setNotes] = useState("");
  const [sets, setSets] = useState([
    {
      reps: 10,
      loadKg: 0,
      rpe: 7,
      rir: 2,
      techniqueAcceptable: true,
      painReported: false,
    },
    {
      reps: 10,
      loadKg: 0,
      rpe: 7,
      rir: 2,
      techniqueAcceptable: true,
      painReported: false,
    },
    {
      reps: 10,
      loadKg: 0,
      rpe: 7,
      rir: 2,
      techniqueAcceptable: true,
      painReported: false,
    },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  async function submit() {
    setSaving(true);
    setError("");
    try {
      onSaved();
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
        className="log-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="log-heading"
      >
        <header>
          <div>
            <p className="eyebrow">SESSION RESULT</p>
            <h2 id="log-heading">Log {clientName}&apos;s workout</h2>
            <p>Capture what happened, not just what was prescribed.</p>
          </div>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </header>
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
            <span>Reps / load / RPE</span>
          </div>
          {sets.map((set, index) => (
            <div className="set-log-row" key={index}>
              <span>Set {index + 1}</span>
              <input
                aria-label={`Set ${index + 1} reps`}
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
                aria-label={`Set ${index + 1} load`}
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
                aria-label={`Set ${index + 1} RPE`}
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
            </div>
          ))}
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
          <button className="primary-button" onClick={submit} disabled={saving}>
            {saving ? "Saving result…" : "Save workout result →"}
          </button>
        </footer>
      </section>
    </div>
  );
}

void WorkoutLogModal;
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

function Library({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<Exercise[]>(exercises);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch(`/api/designer/exercises?q=${encodeURIComponent(query)}`, {
      credentials: "same-origin",
      cache: "no-store",
    })
      .then((response) =>
        response.ok
          ? (response.json() as Promise<{
              exercises: Array<{
                name: string;
                pattern: string;
                target: unknown;
                equipment: unknown;
              }>;
            }>)
          : Promise.reject(new Error("Exercise library unavailable")),
      )
      .then((data) =>
        setItems(
          data.exercises.map((item) => ({
            name: item.name,
            pattern: item.pattern,
            prescription: "",
            target: Array.isArray(item.target)
              ? item.target.join(" · ")
              : String(item.target ?? ""),
            equipment: Array.isArray(item.equipment)
              ? item.equipment.join(" · ")
              : String(item.equipment ?? ""),
          })),
        ),
      )
      .catch(() =>
        setItems(
          exercises.filter((e) =>
            `${e.name} ${e.pattern} ${e.target}`
              .toLowerCase()
              .includes(query.toLowerCase()),
          ),
        ),
      )
      .finally(() => setLoading(false));
  }, [query]);
  const filtered = items.filter((e) =>
    `${e.name} ${e.pattern} ${e.target}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <div className="library-view">
      <div className="page-heading">
        <div>
          <p className="eyebrow">MOVEMENT DATABASE</p>
          <h1>Exercise library</h1>
          <p className="subheading">
            A structured, searchable catalogue built for practical programming
            decisions.
          </p>
        </div>
        <button className="primary-button" onClick={() => onClose()}>
          ← Dashboard
        </button>
      </div>
      <div className="library-toolbar">
        <div className="library-search">
          ⌕
          <input
            value={query}
            onChange={(e) => {
              setLoading(true);
              setQuery(e.target.value);
            }}
            placeholder="Search exercises, patterns or muscles..."
          />
        </div>
        <button className="secondary-button">Filter ▾</button>
        <button className="secondary-button">+ Add exercise</button>
      </div>
      {loading ? (
        <p className="library-empty">
          Loading the structured exercise catalogue…
        </p>
      ) : (
        <div className="library-grid">
          {filtered.map((exercise) => (
            <article className="library-card" key={exercise.name}>
              <div className="exercise-illustration">
                {exercise.pattern === "Conditioning" ? "◒" : "◉"}
              </div>
              <div>
                <span className="library-tag">{exercise.pattern}</span>
                <h3>{exercise.name}</h3>
                <p>
                  {exercise.target} · {exercise.equipment}
                </p>
                <button className="text-button">View details →</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
