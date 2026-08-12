export const programmePromptBrand = "Banner Fitness";
export const programmePromptTitle = "Banner Fitness - Programme design review bundle";
export const programmePromptFilename = "banner-fitness-pt-review";

export function buildProgrammeTask(hasProgramme: boolean) {
  if (hasProgramme) return "Review the current programme against the client context. Identify important uncertainties, mismatches and practical options for the qualified PT to consider.";
  return "No saved programme exists for this client. Help the qualified PT draft a suitable programme from the supplied client context, goals, screening boundaries, preferences, equipment, performance baselines and recovery information. Propose a structure, exercise options, sets, reps, effort, rest, progression gates and review questions, while clearly identifying missing information and keeping final decisions with the PT.";
}

export const promptEvidenceInstruction = "Use the 2026 ACSM resistance-training evidence contextually. Do not enforce rigid rep brackets, treat momentary failure as necessary, or require a 1RM test; use performance baselines only when available and appropriate.";

export const programmeImportInstruction = `If you propose a programme for Banner Fitness to import, return one JSON object in a fenced json block using this contract. Use exact exercise names from the supplied library where possible; do not claim that anything has been saved or approved. Every session must include dayOfWeek, name and an exercises array. Every exercise must include name, pattern, sets, repsMin, repsMax and intensityValue, with restSeconds, tempo, progressionRule, target and equipment where known.

{
  "format": "banner-fitness-programme-draft",
  "schemaVersion": "1",
  "source": { "tool": "your AI tool", "generatedAt": "ISO date" },
  "programme": {
    "goalSummary": "short goal",
    "sessionDurationMinutes": 45,
    "methodology": "brief method",
    "rationale": "PT-oriented rationale",
    "sessions": [{
      "dayOfWeek": 1,
      "name": "Full body strength",
      "exercises": [{
        "name": "Exact exercise name",
        "pattern": "Knee dominant",
        "target": "Quads · glutes",
        "equipment": "Barbell",
        "sets": 3,
        "repsMin": 6,
        "repsMax": 10,
        "intensityValue": "2 RIR",
        "restSeconds": 120,
        "tempo": "",
        "progressionRule": "Progress when technique and target effort are maintained"
      }]
    }]
  }
}

The PT must validate the draft, review the session-by-session changes and save it as a new Banner Fitness version themselves. If no programme exists, return a complete multi-session draft rather than only recommendations.`;
