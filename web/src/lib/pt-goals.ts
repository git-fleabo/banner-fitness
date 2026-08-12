export const PT_GOALS = [
  "General fitness",
  "Fat loss + muscle retention",
  "General strength",
  "Hypertrophy",
  "Cardiovascular fitness",
  "Movement quality",
] as const;

export type PtGoal = (typeof PT_GOALS)[number];

const LEGACY_GOAL_ALIASES: Record<string, PtGoal> = {
  "strength and movement confidence": "Movement quality",
  "strength and conditioning": "Cardiovascular fitness",
  power: "Movement quality",
  "strength support for climbing": "General strength",
  "strength support for running": "Cardiovascular fitness",
  "fat loss and tone": "Fat loss + muscle retention",
  "fat loss": "Fat loss + muscle retention",
};

export function normalizePtGoal(value: string): string {
  const trimmed = value.trim();
  return LEGACY_GOAL_ALIASES[trimmed.toLowerCase()] ?? trimmed;
}

export function isPtGoal(value: string): value is PtGoal {
  return (PT_GOALS as readonly string[]).includes(value);
}
