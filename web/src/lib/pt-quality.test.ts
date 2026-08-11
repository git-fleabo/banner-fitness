import { describe, expect, it } from "vitest";

import { evaluateProgrammeQuality, QUALITY_EVIDENCE, QUALITY_RULESET, type QualityContext } from "./pt-quality";

const exercise = (name: string, pattern: string, overrides: Partial<QualityContext["programme"]["sessions"][number]["exercises"][number]> = {}) => ({ name, pattern, sets: 3, repsMin: 8, repsMax: 12, intensityType: "rir", intensityValue: "2 RIR", restSeconds: 90, progressionRule: "Add a small load when the top of the range is repeatable with acceptable technique.", primaryMuscles: ["chest"], equipment: ["Dumbbells"], ...overrides });

const baseContext = (overrides: Partial<QualityContext> = {}): QualityContext => ({
  client: { preferredDays: [1, 3, 5], trainingExperience: "intermediate", dailyActivity: "Desk work", sessionDurationMinutes: 60 },
  assessment: { responses: {}, riskFlags: [], clearanceRequired: false, reviewDate: "2026-08-01", ptNotes: "[SCREENING REVIEW RECORDED] PT screening review completed." },
  goal: { goalType: "General strength", target: "Increase major-lift performance", metric: "repeatable load" },
  location: { name: "Full gym", locationType: "Full gym", equipment: ["Dumbbells", "Cable", "Barbell"] },
  preferences: { dislikedExercises: [] },
  performanceRecords: [{ exerciseId: "squat-1", metricType: "estimated_one_rm", value: "100", performanceDate: "2026-08-01", techniqueAcceptable: true, painReported: false }],
  programme: { goalSummary: "General strength", durationWeeks: 1, trainingDays: 3, sessions: [
    { weekNumber: 1, dayOfWeek: 1, name: "Day 1", sessionType: "strength", durationMinutes: 60, exercises: [exercise("DB Bench Press", "Horizontal push"), exercise("Goblet Squat", "Squat", { primaryMuscles: ["quads", "glutes"], equipment: ["Dumbbells"] })] },
    { weekNumber: 1, dayOfWeek: 3, name: "Day 2", sessionType: "strength", durationMinutes: 60, exercises: [exercise("Seated Cable Row", "Horizontal pull", { primaryMuscles: ["back"], equipment: ["Cable"] })] },
    { weekNumber: 1, dayOfWeek: 5, name: "Day 3", sessionType: "strength", durationMinutes: 60, exercises: [exercise("DB Romanian Deadlift", "Hinge", { primaryMuscles: ["hamstrings"], equipment: ["Dumbbells"] })] },
  ] },
  recentResults: [],
  ...overrides,
});

describe("contextual programme quality engine", () => {
  it("regresses the Guy Jenkins scenario away from score 100", () => {
    const sessions = Array.from({ length: 24 }, (_, index) => ({ weekNumber: Math.floor(index / 3) + 1, dayOfWeek: [1, 3, 5][index % 3], name: `Day ${[1, 3, 5][index % 3]}`, sessionType: "strength", durationMinutes: 60, exercises: index % 3 === 0 ? [exercise("Barbell Bench Press", "Horizontal push", { primaryMuscles: ["chest"], equipment: ["Barbell"], cautionTags: ["shoulder-pain"] }), exercise("Trap-Bar Deadlift", "Hinge", { primaryMuscles: ["glutes"], equipment: ["Trap bar"] }), exercise("Dumbbell Shoulder Press", "Vertical push", { primaryMuscles: ["shoulders"], equipment: ["Dumbbells"], cautionTags: ["shoulder-pain"] })] : [] }));
    const review = evaluateProgrammeQuality({
      client: { preferredDays: [1, 2, 5], trainingExperience: null, dailyActivity: "Climbing", sessionDurationMinutes: 60 },
      assessment: { responses: { injuryOrMusculoskeletalLimitation: false }, riskFlags: [], clearanceRequired: false, ptNotes: "All cleared for training", injuryNotes: "Shoulder pain" },
      goal: { goalType: "General strength" }, location: { name: "Commercial gym", locationType: "Full gym", equipment: ["Barbell", "Dumbbells"] },
      programme: { goalSummary: "General strength", durationWeeks: 8, trainingDays: 3, sessions }, recentResults: [],
    });
    expect(review.score).toBeLessThan(100);
    expect(review.findings.map((item) => item.ruleId)).toEqual(expect.arrayContaining(["screening-contradiction", "programme-completeness", "schedule-alignment", "equipment-compatibility", "exercise-pain-context", "activity-recovery-context", "movement-balance", "missing-training-experience"]));
    expect(review.findings.find((item) => item.ruleId === "programme-completeness")?.message).toContain("16 of 24");
    expect(review.findings.find((item) => item.ruleId === "equipment-compatibility")?.message).toContain("Trap bar");
    expect(review.findings.find((item) => item.ruleId === "exercise-pain-context")?.message).toContain("Dumbbell Shoulder Press");
  });

  it("does not reject 8–12 reps or 2 RIR for general strength", () => {
    const review = evaluateProgrammeQuality(baseContext());
    expect(review.findings.some((item) => /rep range|failure|RIR/i.test(item.message))).toBe(false);
    expect(review.findings.some((item) => item.ruleId === "goal-strength-optimisation")).toBe(true);
    expect(review.findings.find((item) => item.ruleId === "goal-strength-optimisation")?.severity).toBe("info");
  });

  it("separates screening review from exercise-specific pain context", () => {
    const unresolved = evaluateProgrammeQuality(baseContext({ assessment: { responses: { injuryOrMusculoskeletalLimitation: true }, riskFlags: [{ code: "musculoskeletal-review", action: "scope" }], clearanceRequired: false, ptNotes: null, injuryNotes: "Shoulder pain" } }));
    expect(unresolved.findings.some((item) => item.ruleId === "screening-review")).toBe(true);
    const reviewed = evaluateProgrammeQuality(baseContext({ assessment: { responses: { injuryOrMusculoskeletalLimitation: true }, riskFlags: [{ code: "musculoskeletal-review", action: "scope" }], clearanceRequired: false, reviewDate: "2026-08-02", ptNotes: "[SCREENING REVIEW RECORDED] Shoulder assessed; proceed within scope.", injuryNotes: "Shoulder pain" }, programme: { ...baseContext().programme, sessions: [{ ...baseContext().programme.sessions[0], exercises: [exercise("Dumbbell Shoulder Press", "Vertical push", { primaryMuscles: ["shoulders"], equipment: ["Dumbbells"], cautionTags: ["shoulder-pain"] })] }] } }));
    expect(reviewed.findings.some((item) => item.ruleId === "screening-review")).toBe(false);
    expect(reviewed.findings.some((item) => item.ruleId === "exercise-pain-context")).toBe(true);
  });

  it("changes the affected findings when source data changes", () => {
    const incomplete = evaluateProgrammeQuality(baseContext({ programme: { ...baseContext().programme, sessions: [{ ...baseContext().programme.sessions[0], exercises: [] }] } }));
    const complete = evaluateProgrammeQuality(baseContext());
    expect(incomplete.findings.some((item) => item.ruleId === "programme-completeness")).toBe(true);
    expect(complete.findings.some((item) => item.ruleId === "programme-completeness")).toBe(false);
    expect(incomplete.sourceFingerprint).not.toBe(complete.sourceFingerprint);
  });

  it("records evidence and ruleset provenance", () => {
    const review = evaluateProgrammeQuality(baseContext());
    expect(review.rulesetVersion).toBe(QUALITY_RULESET.version);
    expect(review.evidence).toEqual(QUALITY_EVIDENCE);
    expect(review.findings.find((item) => item.ruleId === "goal-strength-optimisation")?.evidence).toEqual(QUALITY_EVIDENCE);
  });

  it("treats a performance baseline as useful context, not a mandatory maximal test", () => {
    const missing = evaluateProgrammeQuality(baseContext({ performanceRecords: [] }));
    const recorded = evaluateProgrammeQuality(baseContext());
    expect(missing.findings.find((item) => item.ruleId === "missing-performance-baseline")?.severity).toBe("info");
    expect(recorded.findings.some((item) => item.ruleId === "missing-performance-baseline")).toBe(false);
    expect(missing.sourceFingerprint).not.toBe(recorded.sourceFingerprint);
  });
});
