export type TimelineDate = string | Date;

export type ClientTimelineItem = {
  id: string;
  kind: "profile" | "assessment" | "goal" | "location" | "preferences" | "programme" | "event" | "workout" | "performance";
  date: string;
  title: string;
  detail: string;
  tone: "teal" | "orange" | "blue" | "purple" | "sand" | "green";
};

type TimelineSource = {
  client: { firstName: string; lastName: string; createdAt: TimelineDate; updatedAt: TimelineDate };
  assessments: Array<{ id: string; assessmentDate: string; reviewDate: string | null; clearanceRequired: boolean; riskFlags: unknown; ptNotes: string | null; createdAt: TimelineDate; updatedAt: TimelineDate }>;
  goals: Array<{ id: string; goalType: string; priority: string; target: string | null; metric: string | null; createdAt: TimelineDate; updatedAt: TimelineDate }>;
  locations: Array<{ id: string; name: string; locationType: string; createdAt: TimelineDate; updatedAt: TimelineDate }>;
  preferences: Array<{ id: string; preferredStyle: string | null; preferredStructure: string | null; createdAt: TimelineDate; updatedAt: TimelineDate }>;
  programmes: Array<{ id: string; name: string; goalSummary: string; status: string; version: number; createdAt: TimelineDate; updatedAt: TimelineDate }>;
  programmeEvents: Array<{ id: string; programmeId: string; programmeName: string; action: string; details: unknown; createdAt: TimelineDate }>;
  workouts: Array<{ id: string; scheduledDate: string; sessionName: string | null; status: string; sessionRpe: number | null; energy: number | null; painReported: boolean; notes: string | null; createdAt: TimelineDate; updatedAt: TimelineDate }>;
  performance: Array<{ id: string; exerciseName: string | null; metricType: string; value: string | number; unit: string; performanceDate: string; source: string; createdAt: TimelineDate; updatedAt: TimelineDate }>;
};

function asIso(value: TimelineDate) {
  return value instanceof Date ? value.toISOString() : value;
}

function titleCase(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function detailText(parts: Array<string | null | undefined>) {
  return parts.filter((part): part is string => Boolean(part && part.trim())).join(" · ");
}

function riskCount(value: unknown) {
  return Array.isArray(value) ? value.length : 0;
}

function eventReason(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return "";
  const details = value as Record<string, unknown>;
  const reason = typeof details.reason === "string" ? details.reason : typeof details.contextSummary === "string" ? details.contextSummary : "";
  return reason.length > 140 ? `${reason.slice(0, 137)}…` : reason;
}

export function buildClientTimeline(source: TimelineSource): ClientTimelineItem[] {
  const items: ClientTimelineItem[] = [];
  const add = (item: ClientTimelineItem) => items.push(item);
  const clientName = `${source.client.firstName} ${source.client.lastName}`;

  add({ id: `profile-created-${source.client.firstName}-${source.client.lastName}`, kind: "profile", date: asIso(source.client.createdAt), title: "Client profile created", detail: `${clientName} added to the PT workspace`, tone: "teal" });
  if (asIso(source.client.updatedAt) !== asIso(source.client.createdAt)) add({ id: "profile-updated", kind: "profile", date: asIso(source.client.updatedAt), title: "Client profile updated", detail: "Core client details or private PT notes changed", tone: "teal" });

  source.assessments.forEach((assessment) => add({ id: `assessment-${assessment.id}`, kind: "assessment", date: asIso(assessment.updatedAt), title: assessment.reviewDate ? "Screening reviewed" : "Screening assessment recorded", detail: detailText([`${riskCount(assessment.riskFlags)} screening flag${riskCount(assessment.riskFlags) === 1 ? "" : "s"}`, assessment.clearanceRequired ? "clearance review marked required" : "no clearance requirement recorded", assessment.ptNotes ? "PT notes added" : null]), tone: assessment.clearanceRequired || riskCount(assessment.riskFlags) > 0 ? "orange" : "green" }));
  source.goals.forEach((goal) => add({ id: `goal-${goal.id}`, kind: "goal", date: asIso(goal.updatedAt), title: `${goal.priority === "primary" ? "Primary goal" : "Goal"} updated: ${goal.goalType}`, detail: detailText([goal.target, goal.metric]), tone: "blue" }));
  source.locations.forEach((location) => add({ id: `location-${location.id}`, kind: "location", date: asIso(location.updatedAt), title: "Training location updated", detail: detailText([location.name, location.locationType]), tone: "sand" }));
  source.preferences.forEach((preference) => add({ id: `preferences-${preference.id}`, kind: "preferences", date: asIso(preference.updatedAt), title: "Exercise preferences updated", detail: detailText([preference.preferredStyle, preference.preferredStructure]) || "Preferences and confidence notes reviewed", tone: "purple" }));
  source.programmes.forEach((programme) => add({ id: `programme-${programme.id}`, kind: "programme", date: asIso(programme.updatedAt), title: `Programme v${programme.version} saved`, detail: detailText([programme.name, titleCase(programme.status), programme.goalSummary]), tone: "blue" }));
  source.programmeEvents.forEach((event) => add({ id: `programme-event-${event.id}`, kind: "event", date: asIso(event.createdAt), title: `Programme ${event.action.replaceAll("_", " ")}`, detail: detailText([event.programmeName, eventReason(event.details)]), tone: "teal" }));
  source.workouts.forEach((workout) => add({ id: `workout-${workout.id}`, kind: "workout", date: asIso(workout.updatedAt), title: `Workout result: ${workout.sessionName || "Session"}`, detail: detailText([titleCase(workout.status), workout.sessionRpe ? `RPE ${workout.sessionRpe}` : null, workout.energy ? `Energy ${workout.energy}/5` : null, workout.painReported ? "pain reported" : null, workout.notes ? "notes added" : null]), tone: workout.painReported ? "orange" : "green" }));
  source.performance.forEach((record) => add({ id: `performance-${record.id}`, kind: "performance", date: asIso(record.updatedAt), title: `Performance baseline recorded: ${record.exerciseName || record.metricType}`, detail: detailText([`${record.value} ${record.unit}`, titleCase(record.source)]), tone: "purple" }));

  return items.sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime());
}
