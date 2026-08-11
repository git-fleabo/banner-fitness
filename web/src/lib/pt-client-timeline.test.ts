import { describe, expect, it } from "vitest";

import { buildClientTimeline } from "./pt-client-timeline";

const date = (value: string) => ({ createdAt: value, updatedAt: value });

describe("client timeline", () => {
  it("combines client context, programming and progress records in newest-first order", () => {
    const timeline = buildClientTimeline({
      client: { firstName: "Guy", lastName: "Jenkins", ...date("2026-01-01T09:00:00.000Z") },
      assessments: [{ id: "assessment-1", assessmentDate: "2026-01-02", reviewDate: null, clearanceRequired: false, riskFlags: [], ptNotes: null, ...date("2026-01-02T09:00:00.000Z") }],
      goals: [{ id: "goal-1", goalType: "General strength", priority: "primary", target: "Get stronger", metric: "estimated 1RM", ...date("2026-01-03T09:00:00.000Z") }],
      locations: [{ id: "location-1", name: "Full gym", locationType: "Full gym", ...date("2026-01-04T09:00:00.000Z") }],
      preferences: [{ id: "preferences-1", preferredStyle: "Full body", preferredStructure: "Straight sets", ...date("2026-01-05T09:00:00.000Z") }],
      programmes: [{ id: "programme-1", name: "Strength foundation", goalSummary: "General strength", status: "draft", version: 1, ...date("2026-01-06T09:00:00.000Z") }],
      programmeEvents: [{ id: "event-1", programmeId: "programme-1", programmeName: "Strength foundation", action: "draft_saved", details: {}, createdAt: "2026-01-07T09:00:00.000Z" }],
      workouts: [{ id: "workout-1", scheduledDate: "2026-01-08", sessionName: "Full body", status: "completed", sessionRpe: 7, energy: 4, painReported: false, notes: null, ...date("2026-01-08T09:00:00.000Z") }],
      performance: [{ id: "performance-1", exerciseName: "Bench Press", metricType: "estimated_one_rm", value: 80, unit: "kg", performanceDate: "2026-01-09", source: "tested", ...date("2026-01-09T09:00:00.000Z") }],
    });

    expect(timeline[0].kind).toBe("performance");
    expect(timeline.map((item) => item.kind)).toEqual(expect.arrayContaining(["profile", "assessment", "goal", "location", "preferences", "programme", "event", "workout", "performance"]));
    expect(timeline.find((item) => item.kind === "goal")?.detail).toContain("estimated 1RM");
  });

  it("makes screening concerns and workout pain visible without diagnosing", () => {
    const timeline = buildClientTimeline({
      client: { firstName: "A", lastName: "B", ...date("2026-01-01T09:00:00.000Z") },
      assessments: [{ id: "assessment-1", assessmentDate: "2026-01-02", reviewDate: null, clearanceRequired: false, riskFlags: [{ code: "review" }], ptNotes: "Review recorded", ...date("2026-01-02T09:00:00.000Z") }],
      goals: [], locations: [], preferences: [], programmes: [], programmeEvents: [],
      workouts: [{ id: "workout-1", scheduledDate: "2026-01-03", sessionName: "Upper body", status: "partial", sessionRpe: 8, energy: 2, painReported: true, notes: "Stopped after discomfort", ...date("2026-01-03T09:00:00.000Z") }],
      performance: [],
    });

    expect(timeline.find((item) => item.kind === "assessment")?.tone).toBe("orange");
    expect(timeline.find((item) => item.kind === "workout")?.detail).toContain("pain reported");
  });
});
