export type RevisionAidProfile = {
  slug: string;
  label: string;
  shortDescription: string;
  memoryCue: string;
  commonTraps: string[];
  aidTypes: string[];
};

const profiles: RevisionAidProfile[] = [
  {
    slug: "anatomical-position",
    label: "Reference and comparison",
    shortDescription: "Anchor viewpoint and compare structures without relying on screen position.",
    memoryCue: "Name the person first; then name the relationship.",
    commonTraps: ["Viewer left replacing subject left", "Proximal meaning higher", "A position being mistaken for a movement"],
    aidTypes: ["Quick explainer", "Visual comparison", "Self-test"],
  },
  {
    slug: "planes-and-axes",
    label: "Movement map",
    shortDescription: "Separate the surface a movement travels through from the line it rotates around.",
    memoryCue: "Plane through; axis around. They meet at a right angle.",
    commonTraps: ["Calling the axis the direction of travel", "Treating plane and axis as interchangeable", "Assuming an exercise belongs to one plane absolutely"],
    aidTypes: ["Quick explainer", "Memory cue", "Movement sorter", "Self-test"],
  },
  {
    slug: "joint-actions",
    label: "Joint-action evidence",
    shortDescription: "Use phase, joint and angle change to describe what is happening in a squat.",
    memoryCue: "Phase tells you when; joint action tells you what changes.",
    commonTraps: ["Lowering meaning flexion at every joint", "A muscle name replacing a joint action", "Whole-body direction replacing angle evidence"],
    aidTypes: ["Angle comparison", "Worked example", "Self-test"],
  },
  {
    slug: "recognising-actions",
    label: "Exercise recognition",
    shortDescription: "Analyse unfamiliar exercises from observable clues instead of exercise-name memory.",
    memoryCue: "Focus, phase, change, label, evidence.",
    commonTraps: ["Exercise name determining the action", "Up always meaning extension", "One still image proving movement direction"],
    aidTypes: ["Observation method", "Movement cards", "Explanation repair"],
  },
  {
    slug: "mixed-movement-challenge",
    label: "Transfer practice",
    shortDescription: "Retrieve the method in a changed viewpoint, order or movement example.",
    memoryCue: "Keep the decisions separate: viewpoint, relationship, plane, axis, phase, action.",
    commonTraps: ["Memorising the exercise instead of the clue", "Blending plane, axis and joint action", "Treating one successful attempt as secure"],
    aidTypes: ["Mixed retrieval", "Transfer examples", "Outcome review"],
  },
];

const fallback: RevisionAidProfile = {
  slug: "fallback",
  label: "Revision aid",
  shortDescription: "A short explanation, a useful memory cue and a chance to retrieve the idea.",
  memoryCue: "Explain it simply, then check whether you can retrieve it later.",
  commonTraps: ["Remembering a label without the evidence", "Confusing a position with a change", "Treating one correct answer as permanent security"],
  aidTypes: ["Quick explainer", "Worked example", "Self-test"],
};

export function revisionAidFor(slug: string) {
  return profiles.find((profile) => profile.slug === slug) ?? { ...fallback, slug };
}

export { profiles as revisionAidProfiles };
