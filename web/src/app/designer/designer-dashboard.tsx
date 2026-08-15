"use client";

import { useEffect, useState } from "react";
import { deleteClientAction } from "./actions";

type ClientSummary = { id: string; firstName: string; lastName: string; clientColour?: string | null; updatedAt: string };
type ProgrammeSummary = { id: string; clientId: string; name: string; status: string; currentWeek: number; durationWeeks: number; version: number };
type DashboardData = {
  clients: ClientSummary[];
  programmes: ProgrammeSummary[];
  schedule: Array<{
    id: string;
    clientId: string;
    clientName: string;
    day: string;
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

function clientColor(value: string, storedColour?: string | null) {
  const colours = ["emerald", "blue", "orange", "violet", "rose", "lime", "sky", "magenta", "ochre", "teal", "coral", "indigo"];
  const stored = colours.indexOf(storedColour ?? "");
  if (stored >= 0) return `client-color-${stored}`;
  let hash = 0;
  for (const character of value) hash = (hash * 31 + character.charCodeAt(0)) | 0;
  return `client-color-${Math.abs(hash) % colours.length}`;
}

export function ProgrammeList({
  programmes,
  clients,
  onClose,
  onOpen,
}: {
  programmes: DashboardData["programmes"];
  clients: DashboardData["clients"];
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

export function ClientList({
  onClose,
  onNew,
  onOpen,
}: {
  onClose: () => void;
  onNew: () => void;
  onOpen: (id: string, name: string) => void;
}) {
  const [items, setItems] = useState<DashboardData["clients"]>([]);
  const [descending, setDescending] = useState(true);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<
    DashboardData["clients"][number] | null
  >(null);
  const [error, setError] = useState("");
  useEffect(() => {
    fetch("/api/designer/overview", {
      credentials: "same-origin",
      cache: "no-store",
    })
      .then((response) => response.json() as Promise<DashboardData>)
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
  item: DashboardData["clients"][number];
  deleting: boolean;
  onOpen: (id: string, name: string) => void;
  onDelete: (item: DashboardData["clients"][number]) => void;
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
  client: DashboardData["clients"][number];
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

export function ProgrammeCalendar({
  schedule,
  inline = false,
  remainingOnly = false,
  onClose,
  onOpen,
}: {
  schedule: DashboardData["schedule"];
  inline?: boolean;
  remainingOnly?: boolean;
  onClose: () => void;
  onOpen: (id: string, name: string) => void;
}) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [loadedWeekSchedule, setLoadedWeekSchedule] = useState<DashboardData["schedule"] | null>(null);
  useEffect(() => {
    if (weekOffset === 0) return;
    const controller = new AbortController();
    fetch(`/api/designer/overview?weekOffset=${weekOffset}`, { credentials: "same-origin", cache: "no-store", signal: controller.signal })
      .then((response) => response.ok ? response.json() as Promise<DashboardData> : Promise.reject(new Error("Calendar could not be loaded")))
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
            <div className={`calendar-day${weekOffset === 0 && day === todayName ? " is-today" : ""}`} key={day}>
              <p>{day}{weekOffset === 0 && day === todayName && <strong>Today</strong>}</p>
              {visibleSchedule
                .filter((item) =>
                  item.day
                    .toLowerCase()
                    .startsWith(day.slice(0, 3).toLowerCase()),
                )
                .map((item) => (
                  <button
                    type="button"
                    className={`calendar-session ${clientColor(item.clientName, item.clientColour)}${item.date < today ? " is-past" : ""}`}
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
              {!weekSchedule.some((item) =>
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
