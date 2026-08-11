export function buildProgrammeTask(hasProgramme: boolean) {
  if (hasProgramme) return "Review the current programme against the client context. Identify important uncertainties, mismatches and practical options for the qualified PT to consider.";
  return "No saved programme exists for this client. Help the qualified PT draft a suitable programme from the supplied client context, goals, screening boundaries, preferences, equipment, performance baselines and recovery information. Propose a structure, exercise options, sets, reps, effort, rest, progression gates and review questions, while clearly identifying missing information and keeping final decisions with the PT.";
}

export const promptEvidenceInstruction = "Use the 2026 ACSM resistance-training evidence contextually. Do not enforce rigid rep brackets, treat momentary failure as necessary, or require a 1RM test; use performance baselines only when available and appropriate.";
