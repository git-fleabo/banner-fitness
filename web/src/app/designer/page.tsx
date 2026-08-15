"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { MobileNav, SessionEditorModal } from "./designer-support";
import { DesignerSettings } from "./designer-settings";
import { TeamAccess } from "./team-access";
import { ExerciseLibrary } from "./exercise-library";
import {
  ProgrammeLibrary,
  type ProgrammeLibraryTemplate,
} from "./programme-library";
import { DesignerHelp } from "./designer-help";
import { Icon, type SemanticIconName } from "./semantic-icon";
import { hasRecordedScreeningReview } from "@/lib/pt-programming";
import { defaultQualitySettings, type QualityReview, type QualitySettings } from "@/lib/pt-quality";
import type { ClientTimelineItem } from "@/lib/pt-client-timeline";
import { mapLibraryTemplateToClientSessions } from "@/lib/programme-library";
import type { AiProgrammeImportApproval } from "@/lib/pt-ai-import";
import type { SavedSession } from "@/lib/programme-editor";
import {
  ClientWorkspaceRoute,
  DesignerDashboardRoute,
  OnboardingRoute,
} from "./designer-route-sections";
import { ClientList, ProgrammeCalendar, ProgrammeList } from "./designer-dashboard";
import { ClientOnboarding } from "./designer-onboarding";
import {
  ClientWorkspace as ClientWorkspaceRouteComponent,
  WorkspaceSupportPortal as WorkspaceSupportPortalRouteComponent,
} from "./designer-client-workspace";

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
          router.replace("/auth/sign-in?access=designer");
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
          <img src="/banner-fitness-logo.jpg" alt="Banner Fitness" />
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

      <DesignerDashboardRoute>
      <section className="designer-content">
        <header className="designer-header">
          <div className="mobile-brand">
            <img src="/banner-fitness-logo.jpg" alt="Banner Fitness" />
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
      </DesignerDashboardRoute>
      {showClient && (
        <ClientWorkspaceRoute>
          <ClientWorkspaceRouteComponent
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
        </ClientWorkspaceRoute>
      )}
      {showClient && clientId && (
        <ClientWorkspaceRoute>
          <WorkspaceSupportPortalRouteComponent
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
        </ClientWorkspaceRoute>
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
        <OnboardingRoute>
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
        </OnboardingRoute>
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
                  {clients.filter(
                    (client) =>
                      client.status === "active" && client.needsAttention,
                  ).length}
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
