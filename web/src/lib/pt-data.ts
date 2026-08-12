export type AssessmentNotes = { injuryNotes: string | null; contraindicationNotes: string | null };

export function readAssessmentNotes(responses: unknown): AssessmentNotes {
  if (!responses || typeof responses !== "object" || Array.isArray(responses)) return { injuryNotes: null, contraindicationNotes: null };
  const values = responses as Record<string, unknown>;
  const text = (value: unknown) => typeof value === "string" && value.trim() ? value.trim() : null;
  return { injuryNotes: text(values.injuryNotes), contraindicationNotes: text(values.contraindicationNotes) };
}

export function parsePrescriptionSetCount(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const match = value.match(/(?:^|\s)(\d+)\s*(?:×|x|sets?\b)/i) ?? value.match(/^(\d+)\s*(?:-|–|to)\s*\d+/i);
  return match ? Number(match[1]) : null;
}
