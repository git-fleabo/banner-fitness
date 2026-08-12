import type { EditorExercise, ProgrammeTemplateDefinition, SavedSession } from "./programme-editor";

const exercise = (
  name: string,
  pattern: string,
  target: string,
  equipment: string,
  repsMin = 8,
  repsMax = 12,
  sets = 3,
  intensityValue = "2 RIR",
): EditorExercise => ({
  name,
  pattern,
  target,
  equipment,
  sets,
  repsMin,
  repsMax,
  prescription: `${sets} × ${repsMin}–${repsMax}`,
  intensityValue,
  restSeconds: pattern === "Conditioning" ? 60 : 90,
  tempo: "",
  progressionRule: "Add a small progression only when the target effort, technique, tolerance and recovery remain acceptable.",
});

const session = (name: string, exercises: EditorExercise[]) => ({ name, exercises });

/**
 * Owner-seeded catalogue content. These are deliberately practical starting
 * points, not prescriptions for every client. The client-specific editor and
 * quality review must still be used before a programme is assigned.
 */
export const programmeLibrarySeed: ProgrammeTemplateDefinition[] = [
  {
    id: "library-foundation-strength-2-day",
    label: "Foundational strength · 2 day",
    description: "Two balanced full-body sessions for a practical strength foundation.",
    goal: "General strength",
    sessionDurationMinutes: 55,
    sessions: [
      session("Foundation · A", [exercise("Goblet Squat", "Squat", "Quads · glutes", "Dumbbells", 6, 10), exercise("DB Bench Press", "Horizontal push", "Chest · triceps", "Dumbbells", 6, 10), exercise("Seated Cable Row", "Horizontal pull", "Back · biceps", "Cable", 8, 12), exercise("DB Romanian Deadlift", "Hinge", "Hamstrings · glutes", "Dumbbells", 8, 12, 2)]),
      session("Foundation · B", [exercise("Split Squat", "Lunge", "Quads · glutes", "Dumbbells", 8, 12), exercise("Lat Pulldown", "Vertical pull", "Lats · biceps", "Cable", 8, 12), exercise("Barbell Hip Thrust", "Hinge", "Glutes", "Barbell", 8, 12), exercise("Farmer Carry", "Carry", "Grip · trunk", "Dumbbells", 20, 40, 2)]),
    ],
  },
  {
    id: "library-full-body-strength-3-day",
    label: "Full-body strength · 3 day",
    description: "Repeatable full-body sessions with varied squat, hinge, push and pull exposure.",
    goal: "General strength",
    sessionDurationMinutes: 60,
    sessions: [
      session("Strength · A", [exercise("Barbell Back Squat", "Squat", "Quads · glutes", "Barbell, Rack", 5, 8), exercise("Barbell Bench Press", "Horizontal push", "Chest · triceps", "Barbell, Rack", 5, 8), exercise("Chest-Supported Row", "Horizontal pull", "Back · biceps", "Dumbbells, Bench", 8, 12)]),
      session("Strength · B", [exercise("Trap-Bar Deadlift", "Hinge", "Glutes · hamstrings", "Trap bar", 4, 6), exercise("Dumbbell Shoulder Press", "Vertical push", "Shoulders · triceps", "Dumbbells", 6, 10), exercise("Neutral-Grip Pull-Up", "Vertical pull", "Lats · biceps", "Pull-up bar", 5, 10)]),
      session("Strength · C", [exercise("Front Squat", "Squat", "Quads · trunk", "Barbell, Rack", 6, 10), exercise("Incline Dumbbell Press", "Horizontal push", "Upper chest · triceps", "Dumbbells, Bench", 8, 12), exercise("Cable Pull-Through", "Hinge", "Glutes · hamstrings", "Cable", 10, 15)]),
    ],
  },
  {
    id: "library-upper-lower-hypertrophy-4-day",
    label: "Upper / lower hypertrophy · 4 day",
    description: "A four-day split with moderate volume and room for individual exercise swaps.",
    goal: "Hypertrophy",
    sessionDurationMinutes: 60,
    sessions: [
      session("Upper · A", [exercise("Barbell Bench Press", "Horizontal push", "Chest · triceps", "Barbell, Rack", 6, 10), exercise("Lat Pulldown", "Vertical pull", "Lats · biceps", "Cable", 8, 12), exercise("Seated Cable Row", "Horizontal pull", "Back · biceps", "Cable", 8, 12), exercise("Dumbbell Lateral Raise", "Accessory", "Lateral delts", "Dumbbells", 12, 20, 2)]),
      session("Lower · A", [exercise("Leg Press", "Squat", "Quads · glutes", "Machines", 8, 15), exercise("Barbell Romanian Deadlift", "Hinge", "Hamstrings · glutes", "Barbell", 8, 12), exercise("Seated Leg Curl", "Knee flexion", "Hamstrings", "Machines", 10, 15), exercise("Standing Calf Raise", "Accessory", "Calves", "Machines", 10, 15, 2)]),
      session("Upper · B", [exercise("Incline Dumbbell Press", "Horizontal push", "Upper chest · triceps", "Dumbbells, Bench", 8, 12), exercise("Chest-Supported Row", "Horizontal pull", "Back · biceps", "Dumbbells, Bench", 8, 12), exercise("Dumbbell Shoulder Press", "Vertical push", "Shoulders · triceps", "Dumbbells", 8, 12), exercise("Cable Curl", "Accessory", "Biceps", "Cable", 10, 15, 2)]),
      session("Lower · B", [exercise("Hack Squat", "Squat", "Quads · glutes", "Machines", 8, 12), exercise("Barbell Hip Thrust", "Hinge", "Glutes", "Barbell, Bench", 8, 12), exercise("Bulgarian Split Squat", "Lunge", "Quads · glutes", "Dumbbells", 8, 12), exercise("Rope Triceps Pressdown", "Accessory", "Triceps", "Cable", 10, 15, 2)]),
    ],
  },
  {
    id: "library-home-dumbbell-3-day",
    label: "Home dumbbell · 3 day",
    description: "A home-friendly programme using dumbbells, bands and bodyweight.",
    goal: "General fitness",
    sessionDurationMinutes: 45,
    sessions: [
      session("Home · A", [exercise("Goblet Squat", "Squat", "Quads · glutes", "Dumbbells", 8, 15), exercise("DB Floor Press", "Horizontal push", "Chest · triceps", "Dumbbells", 8, 15), exercise("One-Arm Dumbbell Row", "Horizontal pull", "Back · biceps", "Dumbbell", 8, 15), exercise("Dead Bug", "Anti-extension", "Core", "Bodyweight", 8, 12, 2)]),
      session("Home · B", [exercise("Reverse Lunge", "Lunge", "Quads · glutes", "Dumbbells", 8, 12), exercise("Push-Up", "Horizontal push", "Chest · triceps", "Bodyweight", 6, 15), exercise("Single-Leg Romanian Deadlift", "Hinge", "Hamstrings · glutes", "Dumbbells", 8, 12), exercise("Half-Kneeling Pallof Press", "Anti-rotation", "Core", "Resistance band", 10, 15, 2)]),
      session("Home · C", [exercise("Step-Up", "Lunge", "Quads · glutes", "Dumbbells, Box", 8, 12), exercise("Half-Kneeling Cable Press", "Horizontal push", "Chest · trunk", "Resistance band", 8, 12), exercise("Suitcase Carry", "Anti-lateral flexion", "Trunk · grip", "Dumbbell", 20, 40, 2)]),
    ],
  },
  {
    id: "library-minimal-equipment-2-day",
    label: "Minimal equipment · 2 day",
    description: "A flexible two-day option for a small space with limited equipment certainty.",
    goal: "General fitness",
    sessionDurationMinutes: 40,
    sessions: [
      session("Minimal · A", [exercise("Bodyweight Squat", "Squat", "Quads · glutes", "Bodyweight", 8, 15), exercise("Incline Push-Up", "Horizontal push", "Chest · triceps", "Bodyweight", 8, 15), exercise("Resistance Band Row", "Horizontal pull", "Back · biceps", "Resistance band", 10, 15), exercise("Side Plank", "Anti-lateral flexion", "Obliques · trunk", "Bodyweight", 20, 40, 2)]),
      session("Minimal · B", [exercise("Supported Reverse Lunge", "Lunge", "Quads · glutes", "Bodyweight", 8, 12), exercise("Band Chest Press", "Horizontal push", "Chest · triceps", "Resistance band", 10, 15), exercise("Kettlebell Deadlift", "Hinge", "Hamstrings · glutes", "Kettlebell", 10, 15), exercise("Front Rack Carry", "Carry", "Trunk · grip", "Kettlebells", 20, 40, 2)]),
    ],
  },
  {
    id: "library-suspension-rings-3-day",
    label: "Suspension and rings · 3 day",
    description: "TRX and rings sessions with scalable bodyweight loading and trunk control.",
    goal: "Strength and movement confidence",
    sessionDurationMinutes: 45,
    sessions: [
      session("Suspension · A", [exercise("TRX Assisted Squat", "Squat", "Quads · glutes", "TRX", 8, 15), exercise("TRX Chest Press", "Horizontal push", "Chest · triceps", "TRX", 8, 15), exercise("TRX Row", "Horizontal pull", "Back · biceps", "TRX", 8, 15), exercise("TRX Plank", "Anti-extension", "Core", "TRX", 20, 40, 2)]),
      session("Rings · B", [exercise("Ring Assisted Split Squat", "Lunge", "Quads · glutes", "Gymnastic rings", 8, 12), exercise("Ring Push-Up", "Horizontal push", "Chest · triceps", "Gymnastic rings", 6, 15), exercise("Ring Row", "Horizontal pull", "Back · biceps", "Gymnastic rings", 8, 15), exercise("Ring Hamstring Curl", "Knee flexion", "Hamstrings", "Gymnastic rings", 8, 12, 2)]),
      session("Suspension · C", [exercise("TRX Split Squat", "Lunge", "Quads · glutes", "TRX", 6, 10), exercise("TRX Y-Raise", "Vertical pull", "Upper back · shoulders", "TRX", 10, 15, 2), exercise("TRX Fallout", "Anti-extension", "Core", "TRX", 8, 12, 2)]),
    ],
  },
  {
    id: "library-kettlebell-conditioning-3-day",
    label: "Kettlebell strength and conditioning · 3 day",
    description: "Simple kettlebell sessions combining strength patterns and scalable conditioning.",
    goal: "Strength and conditioning",
    sessionDurationMinutes: 45,
    sessions: [
      session("Kettlebell · A", [exercise("Kettlebell Goblet Squat", "Squat", "Quads · glutes", "Kettlebell", 8, 12), exercise("Kettlebell Floor Press", "Horizontal push", "Chest · triceps", "Kettlebell", 8, 12), exercise("Kettlebell Row", "Horizontal pull", "Back · biceps", "Kettlebell", 8, 12), exercise("Kettlebell Swing", "Ballistic hinge", "Glutes · hamstrings", "Kettlebell", 10, 20, 3, "Powerful intent")]),
      session("Kettlebell · B", [exercise("Kettlebell Reverse Lunge", "Lunge", "Quads · glutes", "Kettlebell", 8, 12), exercise("Half-Kneeling Kettlebell Press", "Vertical push", "Shoulders · trunk", "Kettlebell", 6, 10), exercise("Kettlebell Deadlift", "Hinge", "Glutes · hamstrings", "Kettlebell", 8, 12), exercise("Front Rack Carry", "Carry", "Trunk · grip", "Kettlebells", 20, 40, 2)]),
      session("Kettlebell · C", [exercise("Kettlebell Clean", "Hinge", "Glutes · shoulders", "Kettlebell", 5, 8), exercise("Kettlebell Push Press", "Vertical push", "Shoulders · triceps", "Kettlebell", 6, 10), exercise("Kettlebell Goblet Squat", "Squat", "Quads · trunk", "Kettlebell", 6, 10), exercise("Bike Intervals", "Conditioning", "Aerobic fitness", "Bike", 30, 60, 6, "Hard but repeatable")]),
    ],
  },
  {
    id: "library-power-foundation-2-day",
    label: "Power foundation · 2 day",
    description: "Low-volume power exposures paired with strength work and clear quality gates.",
    goal: "Power",
    sessionDurationMinutes: 50,
    sessions: [
      session("Power · A", [exercise("Box Jump", "Plyometric", "Lower-body power", "Box", 3, 5, 3, "Maximal intended speed"), exercise("Trap-Bar Deadlift", "Hinge", "Glutes · hamstrings", "Trap bar", 4, 6), exercise("Medicine Ball Chest Pass", "Ballistic push", "Upper-body power", "Medicine ball", 4, 6, 3, "Maximal intended speed"), exercise("Split Squat", "Lunge", "Quads · glutes", "Dumbbells", 8, 10, 2)]),
      session("Power · B", [exercise("Medicine Ball Rotational Throw", "Ballistic rotation", "Rotational power", "Medicine ball", 4, 6, 3, "Maximal intended speed"), exercise("Push Press", "Vertical push", "Shoulders · legs", "Barbell", 4, 6), exercise("Broad Jump", "Plyometric", "Lower-body power", "Open space", 3, 5, 3, "Maximal intended speed"), exercise("Chest-Supported Row", "Horizontal pull", "Back · biceps", "Dumbbells, Bench", 8, 12, 2)]),
    ],
  },
  {
    id: "library-climbing-support-2-day",
    label: "Climbing support strength · 2 day",
    description: "A supplementary strength template that leaves climbing volume and recovery for PT review.",
    goal: "Strength support for climbing",
    sessionDurationMinutes: 45,
    sessions: [
      session("Climbing support · A", [exercise("Split Squat", "Lunge", "Quads · glutes", "Dumbbells", 8, 12), exercise("DB Bench Press", "Horizontal push", "Chest · triceps", "Dumbbells", 8, 12), exercise("Barbell Hip Thrust", "Hinge", "Glutes", "Barbell", 8, 12), exercise("Cable Pallof Press", "Anti-rotation", "Core", "Cable", 10, 15, 2)]),
      session("Climbing support · B", [exercise("Step-Up", "Lunge", "Quads · glutes", "Dumbbells, Box", 8, 12), exercise("Half-Kneeling Cable Press", "Horizontal push", "Chest · trunk", "Cable", 8, 12), exercise("Single-Leg Romanian Deadlift", "Hinge", "Hamstrings · glutes", "Dumbbells", 8, 12), exercise("Copenhagen Plank", "Anti-lateral flexion", "Adductors · trunk", "Bodyweight", 15, 30, 2)]),
    ],
  },
  {
    id: "library-general-fitness-3-day",
    label: "General fitness circuit · 3 day",
    description: "A varied three-day structure for general fitness, adherence and manageable session density.",
    goal: "General fitness",
    sessionDurationMinutes: 45,
    sessions: [
      session("General fitness · A", [exercise("Leg Press", "Squat", "Quads · glutes", "Machines", 10, 15), exercise("Machine Chest Press", "Horizontal push", "Chest · triceps", "Machines", 10, 15), exercise("Seated Cable Row", "Horizontal pull", "Back · biceps", "Cable", 10, 15), exercise("Bike Intervals", "Conditioning", "Aerobic fitness", "Bike", 30, 60, 6, "Hard but repeatable")]),
      session("General fitness · B", [exercise("Goblet Squat", "Squat", "Quads · glutes", "Dumbbells", 10, 15), exercise("Lat Pulldown", "Vertical pull", "Lats · biceps", "Cable", 10, 15), exercise("Barbell Hip Thrust", "Hinge", "Glutes", "Barbell", 10, 15), exercise("Medicine Ball Slam", "Ballistic hinge", "Whole-body power", "Medicine ball", 6, 10, 3, "Fast intent")]),
      session("General fitness · C", [exercise("Reverse Lunge", "Lunge", "Quads · glutes", "Dumbbells", 8, 12), exercise("Push-Up", "Horizontal push", "Chest · triceps", "Bodyweight", 8, 15), exercise("Resistance Band Row", "Horizontal pull", "Back · biceps", "Resistance band", 10, 15), exercise("Incline Treadmill Walk", "Conditioning", "Aerobic fitness", "Treadmill", 8, 15, 1, "Sustainable pace")]),
    ],
  },
];

export function mapLibraryTemplateToClientSessions(template: ProgrammeTemplateDefinition, preferredDays: number[]): SavedSession[] {
  const days = preferredDays.length === template.sessions.length ? preferredDays : template.sessions.map((_, index) => index + 1);
  return template.sessions.map((session, index) => ({ dayOfWeek: days[index], name: session.name, exercises: session.exercises }));
}
