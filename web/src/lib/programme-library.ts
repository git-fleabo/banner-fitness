import type { EditorExercise, ProgrammeTemplateDefinition, SavedSession } from "./programme-editor";
import { normalizePtGoal } from "./pt-goals";

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
const coreProgrammeLibrarySeed: ProgrammeTemplateDefinition[] = [
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

const additionalProgrammeLibrarySeed: ProgrammeTemplateDefinition[] = [
  {
    id: "library-10k-runner-foundation-3-day",
    label: "10K runner foundation · 3 day",
    description: "A running-first 10K pathway with easy aerobic work, a controlled quality session and a longer run. The PT should set the starting volume from current running history and recovery.",
    goal: "Cardiovascular fitness",
    sessionDurationMinutes: 55,
    experienceLevel: "Beginner",
    frameworkType: "10K running progression",
    difficultyLevel: 1,
    sessions: [
      session("10K · Easy run", [exercise("Easy Run", "Locomotion", "Aerobic endurance", "Running", 25, 35, 1, "Conversational pace")]),
      session("10K · Quality", [exercise("Run-Walk Intervals", "Conditioning", "Aerobic capacity", "Running", 20, 30, 1, "Controlled repeatable effort")]),
      session("10K · Long run", [exercise("Long Easy Run", "Locomotion", "Aerobic endurance", "Running", 40, 60, 1, "Conversational pace")]),
    ],
  },
  {
    id: "library-10k-runner-progression-4-day",
    label: "10K runner progression · 4 day",
    description: "A progression-oriented 10K structure with easy running, threshold practice, a long run and optional low-impact cross-training. Adjust volume and intensity around the runner's current tolerance.",
    goal: "Cardiovascular fitness",
    sessionDurationMinutes: 60,
    experienceLevel: "Intermediate",
    frameworkType: "10K running progression",
    difficultyLevel: 2,
    sessions: [
      session("10K · Recovery", [exercise("Recovery Run", "Locomotion", "Aerobic endurance", "Running", 20, 35, 1, "Easy conversational pace")]),
      session("10K · Threshold", [exercise("Tempo Run", "Conditioning", "Threshold endurance", "Running", 20, 35, 1, "Comfortably hard, controlled")]),
      session("10K · Cross-train", [exercise("Bike Endurance", "Conditioning", "Aerobic endurance", "Bike", 30, 45, 1, "Steady sustainable pace")]),
      session("10K · Long run", [exercise("Long Easy Run", "Locomotion", "Aerobic endurance", "Running", 50, 75, 1, "Conversational pace")]),
    ],
  },
  {
    id: "library-half-marathon-foundation-4-day",
    label: "Half-marathon foundation · 4 day",
    description: "A half-marathon base-building pathway centred on consistent easy mileage, a measured quality session and a progressive long run. Keep progression conservative and review pain, fatigue and recovery.",
    goal: "Cardiovascular fitness",
    sessionDurationMinutes: 65,
    experienceLevel: "Intermediate",
    frameworkType: "Half-marathon running progression",
    difficultyLevel: 2,
    sessions: [
      session("Half-marathon · Easy", [exercise("Easy Run", "Locomotion", "Aerobic endurance", "Running", 30, 45, 1, "Conversational pace")]),
      session("Half-marathon · Quality", [exercise("Tempo Run", "Conditioning", "Threshold endurance", "Running", 25, 40, 1, "Comfortably hard, controlled")]),
      session("Half-marathon · Recovery", [exercise("Recovery Run", "Locomotion", "Aerobic endurance", "Running", 20, 35, 1, "Easy conversational pace")]),
      session("Half-marathon · Long run", [exercise("Long Easy Run", "Locomotion", "Aerobic endurance", "Running", 60, 100, 1, "Conversational pace")]),
    ],
  },
  {
    id: "library-5x5-strength-3-day",
    label: "5×5 novice strength · 3 day",
    description: "A PT-owned adaptation of the classic full-body 5×5 framework, with client-specific load and progression decisions still required.",
    goal: "General strength",
    sessionDurationMinutes: 60,
    sessions: [
      session("5×5 · A", [exercise("Barbell Back Squat", "Squat", "Quads · glutes", "Barbell, Rack", 5, 5, 5), exercise("Barbell Bench Press", "Horizontal push", "Chest · triceps", "Barbell, Rack", 5, 5, 5), exercise("Seated Cable Row", "Horizontal pull", "Back · biceps", "Cable", 5, 5, 5)]),
      session("5×5 · B", [exercise("Barbell Back Squat", "Squat", "Quads · glutes", "Barbell, Rack", 5, 5, 5), exercise("Dumbbell Shoulder Press", "Vertical push", "Shoulders · triceps", "Dumbbells", 5, 5, 5), exercise("Trap-Bar Deadlift", "Hinge", "Glutes · hamstrings", "Trap bar", 5, 5)]),
      session("5×5 · C", [exercise("Barbell Back Squat", "Squat", "Quads · glutes", "Barbell, Rack", 5, 5, 5), exercise("Barbell Bench Press", "Horizontal push", "Chest · triceps", "Barbell, Rack", 5, 5, 5), exercise("Chest-Supported Row", "Horizontal pull", "Back · biceps", "Dumbbells, Bench", 5, 5, 5)]),
    ],
  },
  {
    id: "library-main-lift-wave-4-day",
    label: "Main-lift strength wave · 4 day",
    description: "A PT-owned main-lift wave inspired by established 5/3/1-style organisation, without hard-coding a branded prescription or fixed percentages.",
    goal: "General strength",
    sessionDurationMinutes: 60,
    sessions: [
      session("Strength wave · Squat", [exercise("Barbell Back Squat", "Squat", "Quads · glutes", "Barbell, Rack", 3, 8, 3), exercise("Bulgarian Split Squat", "Lunge", "Quads · glutes", "Dumbbells", 8, 12, 3), exercise("Cable Pallof Press", "Anti-rotation", "Core", "Cable", 10, 15, 2)]),
      session("Strength wave · Bench", [exercise("Barbell Bench Press", "Horizontal push", "Chest · triceps", "Barbell, Rack", 3, 8, 3), exercise("Seated Cable Row", "Horizontal pull", "Back · biceps", "Cable", 8, 12, 3), exercise("Rope Triceps Pressdown", "Accessory", "Triceps", "Cable", 10, 15, 2)]),
      session("Strength wave · Hinge", [exercise("Trap-Bar Deadlift", "Hinge", "Glutes · hamstrings", "Trap bar", 3, 6, 3), exercise("Barbell Hip Thrust", "Hinge", "Glutes", "Barbell, Bench", 8, 12, 3), exercise("Lat Pulldown", "Vertical pull", "Lats · biceps", "Cable", 8, 12, 3)]),
      session("Strength wave · Press", [exercise("Dumbbell Shoulder Press", "Vertical push", "Shoulders · triceps", "Dumbbells", 3, 8, 3), exercise("Incline Dumbbell Press", "Horizontal push", "Upper chest · triceps", "Dumbbells, Bench", 8, 12, 3), exercise("Chest-Supported Row", "Horizontal pull", "Back · biceps", "Dumbbells, Bench", 8, 12, 3)]),
    ],
  },
  {
    id: "library-novice-linear-strength-3-day",
    label: "Novice linear strength · 3 day",
    description: "A simple novice structure built around frequent practice of squat, press, pull and hinge patterns with conservative progression.",
    goal: "General strength",
    sessionDurationMinutes: 55,
    sessions: [
      session("Linear strength · A", [exercise("Barbell Back Squat", "Squat", "Quads · glutes", "Barbell, Rack", 5, 8, 3), exercise("Barbell Bench Press", "Horizontal push", "Chest · triceps", "Barbell, Rack", 5, 8, 3), exercise("Barbell Hip Thrust", "Hinge", "Glutes", "Barbell, Bench", 8, 12, 2)]),
      session("Linear strength · B", [exercise("Barbell Back Squat", "Squat", "Quads · glutes", "Barbell, Rack", 5, 8, 3), exercise("Dumbbell Shoulder Press", "Vertical push", "Shoulders · triceps", "Dumbbells", 5, 8, 3), exercise("Trap-Bar Deadlift", "Hinge", "Glutes · hamstrings", "Trap bar", 5, 8)]),
      session("Linear strength · C", [exercise("Barbell Back Squat", "Squat", "Quads · glutes", "Barbell, Rack", 5, 8, 3), exercise("Barbell Bench Press", "Horizontal push", "Chest · triceps", "Barbell, Rack", 5, 8, 3), exercise("Lat Pulldown", "Vertical pull", "Lats · biceps", "Cable", 8, 12, 3)]),
    ],
  },
  {
    id: "library-intermediate-full-body-wave-3-day",
    label: "Intermediate full-body wave · 3 day",
    description: "An undulating full-body structure for a lifter moving beyond simple novice progression, with heavy, moderate and volume exposures.",
    goal: "General strength",
    sessionDurationMinutes: 65,
    sessions: [
      session("Wave · Heavy", [exercise("Barbell Back Squat", "Squat", "Quads · glutes", "Barbell, Rack", 3, 6, 4), exercise("Barbell Bench Press", "Horizontal push", "Chest · triceps", "Barbell, Rack", 3, 6, 4), exercise("Chest-Supported Row", "Horizontal pull", "Back · biceps", "Dumbbells, Bench", 6, 10, 3)]),
      session("Wave · Moderate", [exercise("Front Squat", "Squat", "Quads · trunk", "Barbell, Rack", 6, 10, 3), exercise("Incline Dumbbell Press", "Horizontal push", "Upper chest · triceps", "Dumbbells, Bench", 6, 10, 3), exercise("Trap-Bar Deadlift", "Hinge", "Glutes · hamstrings", "Trap bar", 5, 8, 3)]),
      session("Wave · Volume", [exercise("Leg Press", "Squat", "Quads · glutes", "Machines", 8, 12, 3), exercise("Dumbbell Shoulder Press", "Vertical push", "Shoulders · triceps", "Dumbbells", 8, 12, 3), exercise("Seated Cable Row", "Horizontal pull", "Back · biceps", "Cable", 8, 12, 3), exercise("Cable Curl", "Accessory", "Biceps", "Cable", 10, 15, 2)]),
    ],
  },
  {
    id: "library-tiered-strength-progression-3-day",
    label: "Tiered strength progression · 3 day",
    description: "A tiered main, supplemental and accessory structure inspired by flexible linear progression systems; PTs set the appropriate effort and progression rules.",
    goal: "General strength",
    sessionDurationMinutes: 60,
    sessions: [
      session("Tiered strength · A", [exercise("Barbell Back Squat", "Squat", "Quads · glutes", "Barbell, Rack", 3, 6, 4), exercise("Barbell Bench Press", "Horizontal push", "Chest · triceps", "Barbell, Rack", 6, 10, 3), exercise("Cable Lateral Raise", "Accessory", "Lateral delts", "Cable", 10, 15, 2)]),
      session("Tiered strength · B", [exercise("Trap-Bar Deadlift", "Hinge", "Glutes · hamstrings", "Trap bar", 3, 6, 4), exercise("Dumbbell Shoulder Press", "Vertical push", "Shoulders · triceps", "Dumbbells", 6, 10, 3), exercise("Lat Pulldown", "Vertical pull", "Lats · biceps", "Cable", 8, 12, 3)]),
      session("Tiered strength · C", [exercise("Barbell Bench Press", "Horizontal push", "Chest · triceps", "Barbell, Rack", 3, 6, 4), exercise("Front Squat", "Squat", "Quads · trunk", "Barbell, Rack", 6, 10, 3), exercise("Seated Cable Row", "Horizontal pull", "Back · biceps", "Cable", 8, 12, 3)]),
    ],
  },
  {
    id: "library-bridge-to-intermediate-3-day",
    label: "Bridge to intermediate strength · 3 day",
    description: "A structured transition from novice practice to intermediate-style training, with room for RPE/RIR, conditioning and exercise substitutions.",
    goal: "General strength",
    sessionDurationMinutes: 70,
    sessions: [
      session("Bridge · A", [exercise("Barbell Back Squat", "Squat", "Quads · glutes", "Barbell, Rack", 4, 8, 3), exercise("Barbell Bench Press", "Horizontal push", "Chest · triceps", "Barbell, Rack", 4, 8, 3), exercise("Cable Row", "Horizontal pull", "Back · biceps", "Cable", 8, 12, 3), exercise("Bike Intervals", "Conditioning", "Aerobic fitness", "Bike", 30, 60, 4, "Hard but repeatable")]),
      session("Bridge · B", [exercise("Trap-Bar Deadlift", "Hinge", "Glutes · hamstrings", "Trap bar", 4, 6, 3), exercise("Dumbbell Shoulder Press", "Vertical push", "Shoulders · triceps", "Dumbbells", 6, 10, 3), exercise("Split Squat", "Lunge", "Quads · glutes", "Dumbbells", 8, 12, 3)]),
      session("Bridge · C", [exercise("Front Squat", "Squat", "Quads · trunk", "Barbell, Rack", 6, 10, 3), exercise("Incline Dumbbell Press", "Horizontal push", "Upper chest · triceps", "Dumbbells, Bench", 6, 10, 3), exercise("Lat Pulldown", "Vertical pull", "Lats · biceps", "Cable", 8, 12, 3), exercise("Incline Treadmill Walk", "Conditioning", "Aerobic fitness", "Treadmill", 8, 15)]),
    ],
  },
  {
    id: "library-beginner-strength-conditioning-3-day",
    label: "Beginner strength and conditioning · 3 day",
    description: "A balanced beginner template combining resistance training and manageable conditioning without requiring maximal testing.",
    goal: "Strength and conditioning",
    sessionDurationMinutes: 55,
    sessions: [
      session("Beginner S&C · A", [exercise("Leg Press", "Squat", "Quads · glutes", "Machines", 8, 12, 3), exercise("Machine Chest Press", "Horizontal push", "Chest · triceps", "Machines", 8, 12, 3), exercise("Seated Cable Row", "Horizontal pull", "Back · biceps", "Cable", 8, 12, 3), exercise("Bike Intervals", "Conditioning", "Aerobic fitness", "Bike", 30, 60, 4, "Hard but repeatable")]),
      session("Beginner S&C · B", [exercise("Goblet Squat", "Squat", "Quads · glutes", "Dumbbells", 8, 12, 3), exercise("Lat Pulldown", "Vertical pull", "Lats · biceps", "Cable", 8, 12, 3), exercise("DB Romanian Deadlift", "Hinge", "Hamstrings · glutes", "Dumbbells", 8, 12, 3), exercise("Incline Treadmill Walk", "Conditioning", "Aerobic fitness", "Treadmill", 8, 15)]),
      session("Beginner S&C · C", [exercise("Split Squat", "Lunge", "Quads · glutes", "Dumbbells", 8, 12, 3), exercise("Push-Up", "Horizontal push", "Chest · triceps", "Bodyweight", 6, 15, 3), exercise("Cable Pull-Through", "Hinge", "Glutes · hamstrings", "Cable", 10, 15, 3), exercise("Medicine Ball Slam", "Ballistic hinge", "Whole-body power", "Medicine ball", 6, 10, 3, "Fast intent")]),
    ],
  },
  {
    id: "library-beginner-express-2-day",
    label: "Beginner express · 2 day",
    description: "A time-efficient full-body template for clients whose realistic commitment is two sessions per week.",
    goal: "General fitness",
    sessionDurationMinutes: 35,
    sessions: [
      session("Express · A", [exercise("Leg Press", "Squat", "Quads · glutes", "Machines", 8, 12, 3), exercise("Machine Chest Press", "Horizontal push", "Chest · triceps", "Machines", 8, 12, 3), exercise("Seated Cable Row", "Horizontal pull", "Back · biceps", "Cable", 8, 12, 3), exercise("Farmer Carry", "Carry", "Grip · trunk", "Dumbbells", 20, 40, 2)]),
      session("Express · B", [exercise("Goblet Squat", "Squat", "Quads · glutes", "Dumbbells", 8, 12, 3), exercise("Lat Pulldown", "Vertical pull", "Lats · biceps", "Cable", 8, 12, 3), exercise("DB Romanian Deadlift", "Hinge", "Hamstrings · glutes", "Dumbbells", 8, 12, 3), exercise("Push-Up", "Horizontal push", "Chest · triceps", "Bodyweight", 6, 15, 2)]),
    ],
  },
  {
    id: "library-machine-dumbbell-foundation-3-day",
    label: "Machine and dumbbell foundation · 3 day",
    description: "A commercial-gym starting point that keeps barbell requirements low while covering major patterns and muscle groups.",
    goal: "General strength",
    sessionDurationMinutes: 50,
    sessions: [
      session("Foundation gym · A", [exercise("Leg Press", "Squat", "Quads · glutes", "Machines", 8, 12, 3), exercise("Machine Chest Press", "Horizontal push", "Chest · triceps", "Machines", 8, 12, 3), exercise("Lat Pulldown", "Vertical pull", "Lats · biceps", "Cable", 8, 12, 3)]),
      session("Foundation gym · B", [exercise("Goblet Squat", "Squat", "Quads · glutes", "Dumbbells", 8, 12, 3), exercise("Dumbbell Shoulder Press", "Vertical push", "Shoulders · triceps", "Dumbbells", 8, 12, 3), exercise("Seated Cable Row", "Horizontal pull", "Back · biceps", "Cable", 8, 12, 3)]),
      session("Foundation gym · C", [exercise("DB Romanian Deadlift", "Hinge", "Hamstrings · glutes", "Dumbbells", 8, 12, 3), exercise("Incline Dumbbell Press", "Horizontal push", "Upper chest · triceps", "Dumbbells, Bench", 8, 12, 3), exercise("Split Squat", "Lunge", "Quads · glutes", "Dumbbells", 8, 12, 3)]),
    ],
  },
  {
    id: "library-full-body-hypertrophy-volume-3-day",
    label: "Full-body hypertrophy volume · 3 day",
    description: "A three-day volume-led template with repeated muscle exposure and moderate rep ranges rather than one rigid hypertrophy bracket.",
    goal: "Hypertrophy",
    sessionDurationMinutes: 65,
    sessions: [
      session("Volume · A", [exercise("Leg Press", "Squat", "Quads · glutes", "Machines", 8, 15, 4), exercise("Barbell Bench Press", "Horizontal push", "Chest · triceps", "Barbell, Rack", 6, 10, 4), exercise("Seated Cable Row", "Horizontal pull", "Back · biceps", "Cable", 8, 15, 4), exercise("Cable Lateral Raise", "Accessory", "Lateral delts", "Cable", 12, 20, 3)]),
      session("Volume · B", [exercise("Barbell Romanian Deadlift", "Hinge", "Hamstrings · glutes", "Barbell", 6, 10, 4), exercise("Incline Dumbbell Press", "Horizontal push", "Upper chest · triceps", "Dumbbells, Bench", 8, 15, 3), exercise("Lat Pulldown", "Vertical pull", "Lats · biceps", "Cable", 8, 15, 4), exercise("Cable Curl", "Accessory", "Biceps", "Cable", 10, 20, 3)]),
      session("Volume · C", [exercise("Hack Squat", "Squat", "Quads · glutes", "Machines", 8, 12, 4), exercise("Dumbbell Shoulder Press", "Vertical push", "Shoulders · triceps", "Dumbbells", 8, 12, 3), exercise("Chest-Supported Row", "Horizontal pull", "Back · biceps", "Dumbbells, Bench", 8, 15, 4), exercise("Rope Triceps Pressdown", "Accessory", "Triceps", "Cable", 10, 20, 3)]),
    ],
  },
  {
    id: "library-push-pull-legs-3-day",
    label: "Push / pull / legs · 3 day",
    description: "A practical three-day push, pull and legs split for clients who prefer clear session themes and weekly repetition.",
    goal: "Hypertrophy",
    sessionDurationMinutes: 60,
    sessions: [
      session("Push", [exercise("Barbell Bench Press", "Horizontal push", "Chest · triceps", "Barbell, Rack", 6, 10, 3), exercise("Dumbbell Shoulder Press", "Vertical push", "Shoulders · triceps", "Dumbbells", 8, 12, 3), exercise("Cable Lateral Raise", "Accessory", "Lateral delts", "Cable", 12, 20, 3), exercise("Rope Triceps Pressdown", "Accessory", "Triceps", "Cable", 10, 15, 3)]),
      session("Pull", [exercise("Lat Pulldown", "Vertical pull", "Lats · biceps", "Cable", 8, 12, 3), exercise("Seated Cable Row", "Horizontal pull", "Back · biceps", "Cable", 8, 12, 3), exercise("Chest-Supported Row", "Horizontal pull", "Back · biceps", "Dumbbells, Bench", 8, 12, 3), exercise("Cable Curl", "Accessory", "Biceps", "Cable", 10, 15, 3)]),
      session("Legs", [exercise("Barbell Back Squat", "Squat", "Quads · glutes", "Barbell, Rack", 6, 10, 3), exercise("Barbell Romanian Deadlift", "Hinge", "Hamstrings · glutes", "Barbell", 8, 12, 3), exercise("Bulgarian Split Squat", "Lunge", "Quads · glutes", "Dumbbells", 8, 12, 3), exercise("Standing Calf Raise", "Accessory", "Calves", "Machines", 10, 15, 3)]),
    ],
  },
  {
    id: "library-push-pull-legs-6-day",
    label: "Push / pull / legs · 6 day",
    description: "A higher-frequency split for experienced clients with sufficient recovery capacity and a clear need for more weekly exposure.",
    goal: "Hypertrophy",
    sessionDurationMinutes: 60,
    sessions: [
      session("Push · A", [exercise("Barbell Bench Press", "Horizontal push", "Chest · triceps", "Barbell, Rack", 6, 10, 3), exercise("Dumbbell Shoulder Press", "Vertical push", "Shoulders · triceps", "Dumbbells", 8, 12, 3), exercise("Cable Lateral Raise", "Accessory", "Lateral delts", "Cable", 12, 20, 3)]),
      session("Pull · A", [exercise("Lat Pulldown", "Vertical pull", "Lats · biceps", "Cable", 8, 12, 3), exercise("Seated Cable Row", "Horizontal pull", "Back · biceps", "Cable", 8, 12, 3), exercise("Cable Curl", "Accessory", "Biceps", "Cable", 10, 15, 3)]),
      session("Legs · A", [exercise("Barbell Back Squat", "Squat", "Quads · glutes", "Barbell, Rack", 6, 10, 3), exercise("Barbell Romanian Deadlift", "Hinge", "Hamstrings · glutes", "Barbell", 8, 12, 3), exercise("Standing Calf Raise", "Accessory", "Calves", "Machines", 10, 15, 3)]),
      session("Push · B", [exercise("Incline Dumbbell Press", "Horizontal push", "Upper chest · triceps", "Dumbbells, Bench", 8, 12, 3), exercise("Dumbbell Shoulder Press", "Vertical push", "Shoulders · triceps", "Dumbbells", 8, 12, 3), exercise("Rope Triceps Pressdown", "Accessory", "Triceps", "Cable", 10, 15, 3)]),
      session("Pull · B", [exercise("Chest-Supported Row", "Horizontal pull", "Back · biceps", "Dumbbells, Bench", 8, 12, 3), exercise("Lat Pulldown", "Vertical pull", "Lats · biceps", "Cable", 8, 12, 3), exercise("Cable Curl", "Accessory", "Biceps", "Cable", 10, 15, 3)]),
      session("Legs · B", [exercise("Hack Squat", "Squat", "Quads · glutes", "Machines", 8, 12, 3), exercise("Barbell Hip Thrust", "Hinge", "Glutes", "Barbell, Bench", 8, 12, 3), exercise("Bulgarian Split Squat", "Lunge", "Quads · glutes", "Dumbbells", 8, 12, 3)]),
    ],
  },
  {
    id: "library-upper-body-emphasis-3-day",
    label: "Upper-body emphasis · 3 day",
    description: "An upper-body priority template that retains lower-body exposure and can be adjusted around the client’s wider activity.",
    goal: "Hypertrophy",
    sessionDurationMinutes: 55,
    sessions: [
      session("Upper emphasis · A", [exercise("Barbell Bench Press", "Horizontal push", "Chest · triceps", "Barbell, Rack", 6, 10, 4), exercise("Lat Pulldown", "Vertical pull", "Lats · biceps", "Cable", 8, 12, 4), exercise("Dumbbell Shoulder Press", "Vertical push", "Shoulders · triceps", "Dumbbells", 8, 12, 3), exercise("Goblet Squat", "Squat", "Quads · glutes", "Dumbbells", 8, 12, 2)]),
      session("Lower maintenance", [exercise("Leg Press", "Squat", "Quads · glutes", "Machines", 8, 12, 3), exercise("DB Romanian Deadlift", "Hinge", "Hamstrings · glutes", "Dumbbells", 8, 12, 3), exercise("Split Squat", "Lunge", "Quads · glutes", "Dumbbells", 8, 12, 2), exercise("Cable Pallof Press", "Anti-rotation", "Core", "Cable", 10, 15, 2)]),
      session("Upper emphasis · B", [exercise("Incline Dumbbell Press", "Horizontal push", "Upper chest · triceps", "Dumbbells, Bench", 8, 12, 4), exercise("Seated Cable Row", "Horizontal pull", "Back · biceps", "Cable", 8, 12, 4), exercise("Cable Lateral Raise", "Accessory", "Lateral delts", "Cable", 12, 20, 3), exercise("Barbell Hip Thrust", "Hinge", "Glutes", "Barbell, Bench", 8, 12, 2)]),
    ],
  },
  {
    id: "library-barbell-minimalist-3-day",
    label: "Barbell minimalist · 3 day",
    description: "A small exercise menu for clients who prefer repeatable barbell practice and a short, focused session structure.",
    goal: "General strength",
    sessionDurationMinutes: 50,
    sessions: [
      session("Barbell minimalist · A", [exercise("Barbell Back Squat", "Squat", "Quads · glutes", "Barbell, Rack", 5, 8, 3), exercise("Barbell Bench Press", "Horizontal push", "Chest · triceps", "Barbell, Rack", 5, 8, 3), exercise("Barbell Romanian Deadlift", "Hinge", "Hamstrings · glutes", "Barbell", 6, 10, 2)]),
      session("Barbell minimalist · B", [exercise("Trap-Bar Deadlift", "Hinge", "Glutes · hamstrings", "Trap bar", 4, 6, 3), exercise("Dumbbell Shoulder Press", "Vertical push", "Shoulders · triceps", "Dumbbells", 6, 10, 3), exercise("Barbell Hip Thrust", "Hinge", "Glutes", "Barbell, Bench", 8, 12, 2)]),
      session("Barbell minimalist · C", [exercise("Front Squat", "Squat", "Quads · trunk", "Barbell, Rack", 5, 8, 3), exercise("Incline Dumbbell Press", "Horizontal push", "Upper chest · triceps", "Dumbbells, Bench", 6, 10, 3), exercise("Chest-Supported Row", "Horizontal pull", "Back · biceps", "Dumbbells, Bench", 8, 12, 3)]),
    ],
  },
  {
    id: "library-bodyweight-progression-3-day",
    label: "Bodyweight progression · 3 day",
    description: "A scalable bodyweight template using leverage, tempo and range-of-motion choices rather than requiring fixed external loads.",
    goal: "Strength and movement confidence",
    sessionDurationMinutes: 40,
    sessions: [
      session("Bodyweight · A", [exercise("Bodyweight Squat", "Squat", "Quads · glutes", "Bodyweight", 8, 15, 3), exercise("Push-Up", "Horizontal push", "Chest · triceps", "Bodyweight", 6, 15, 3), exercise("Ring Row", "Horizontal pull", "Back · biceps", "Gymnastic rings", 8, 15, 3), exercise("Dead Bug", "Anti-extension", "Core", "Bodyweight", 8, 12, 2)]),
      session("Bodyweight · B", [exercise("Reverse Lunge", "Lunge", "Quads · glutes", "Bodyweight", 8, 12, 3), exercise("Incline Push-Up", "Horizontal push", "Chest · triceps", "Bodyweight", 8, 15, 3), exercise("TRX Row", "Horizontal pull", "Back · biceps", "TRX", 8, 15, 3), exercise("Side Plank", "Anti-lateral flexion", "Obliques · trunk", "Bodyweight", 20, 40, 2)]),
      session("Bodyweight · C", [exercise("Step-Up", "Lunge", "Quads · glutes", "Bodyweight, Box", 8, 12, 3), exercise("Ring Push-Up", "Horizontal push", "Chest · triceps", "Gymnastic rings", 6, 12, 3), exercise("Ring Row", "Horizontal pull", "Back · biceps", "Gymnastic rings", 8, 15, 3), exercise("Copenhagen Plank", "Anti-lateral flexion", "Adductors · trunk", "Bodyweight", 15, 30, 2)]),
    ],
  },
  {
    id: "library-travel-bands-bodyweight-3-day",
    label: "Travel bands and bodyweight · 3 day",
    description: "A portable programme for limited or changing equipment, with explicit substitution and tolerance review points.",
    goal: "General fitness",
    sessionDurationMinutes: 35,
    sessions: [
      session("Travel · A", [exercise("Bodyweight Squat", "Squat", "Quads · glutes", "Bodyweight", 10, 20, 3), exercise("Band Chest Press", "Horizontal push", "Chest · triceps", "Resistance band", 10, 20, 3), exercise("Resistance Band Row", "Horizontal pull", "Back · biceps", "Resistance band", 10, 20, 3), exercise("Dead Bug", "Anti-extension", "Core", "Bodyweight", 8, 12, 2)]),
      session("Travel · B", [exercise("Reverse Lunge", "Lunge", "Quads · glutes", "Bodyweight", 8, 15, 3), exercise("Band Shoulder Press", "Vertical push", "Shoulders · triceps", "Resistance band", 8, 15, 3), exercise("Band Good Morning", "Hinge", "Hamstrings · glutes", "Resistance band", 10, 20, 3), exercise("Side Plank", "Anti-lateral flexion", "Obliques · trunk", "Bodyweight", 20, 40, 2)]),
      session("Travel · C", [exercise("Step-Up", "Lunge", "Quads · glutes", "Bodyweight, Box", 8, 15, 3), exercise("Incline Push-Up", "Horizontal push", "Chest · triceps", "Bodyweight", 8, 20, 3), exercise("Resistance Band Row", "Horizontal pull", "Back · biceps", "Resistance band", 10, 20, 3), exercise("Bike Intervals", "Conditioning", "Aerobic fitness", "Bike", 30, 60, 4, "Hard but repeatable")]),
    ],
  },
  {
    id: "library-suspension-rings-mixed-2-day",
    label: "Suspension and rings mixed · 2 day",
    description: "A two-day suspension/rings template that alternates upper, lower and trunk demands while preserving scalable options.",
    goal: "Strength and movement confidence",
    sessionDurationMinutes: 45,
    sessions: [
      session("Suspension mixed · A", [exercise("TRX Assisted Squat", "Squat", "Quads · glutes", "TRX", 8, 15, 3), exercise("TRX Chest Press", "Horizontal push", "Chest · triceps", "TRX", 8, 15, 3), exercise("TRX Row", "Horizontal pull", "Back · biceps", "TRX", 8, 15, 3), exercise("TRX Plank", "Anti-extension", "Core", "TRX", 20, 40, 2)]),
      session("Suspension mixed · B", [exercise("Ring Assisted Split Squat", "Lunge", "Quads · glutes", "Gymnastic rings", 8, 12, 3), exercise("Ring Push-Up", "Horizontal push", "Chest · triceps", "Gymnastic rings", 6, 15, 3), exercise("Ring Row", "Horizontal pull", "Back · biceps", "Gymnastic rings", 8, 15, 3), exercise("Ring Hamstring Curl", "Knee flexion", "Hamstrings", "Gymnastic rings", 8, 12, 3)]),
    ],
  },
  {
    id: "library-concurrent-strength-conditioning-4-day",
    label: "Concurrent strength and conditioning · 4 day",
    description: "A concurrent structure separating strength exposures from conditioning so the PT can manage total weekly load and recovery.",
    goal: "Strength and conditioning",
    sessionDurationMinutes: 55,
    sessions: [
      session("Concurrent · Strength A", [exercise("Barbell Back Squat", "Squat", "Quads · glutes", "Barbell, Rack", 5, 8, 3), exercise("Barbell Bench Press", "Horizontal push", "Chest · triceps", "Barbell, Rack", 5, 8, 3), exercise("Seated Cable Row", "Horizontal pull", "Back · biceps", "Cable", 8, 12, 3)]),
      session("Concurrent · Conditioning A", [exercise("Bike Intervals", "Conditioning", "Aerobic fitness", "Bike", 30, 60, 8, "Hard but repeatable"), exercise("Farmer Carry", "Carry", "Grip · trunk", "Dumbbells", 20, 40, 3), exercise("Dead Bug", "Anti-extension", "Core", "Bodyweight", 8, 12, 2)]),
      session("Concurrent · Strength B", [exercise("Trap-Bar Deadlift", "Hinge", "Glutes · hamstrings", "Trap bar", 4, 6, 3), exercise("Dumbbell Shoulder Press", "Vertical push", "Shoulders · triceps", "Dumbbells", 6, 10, 3), exercise("Lat Pulldown", "Vertical pull", "Lats · biceps", "Cable", 8, 12, 3)]),
      session("Concurrent · Conditioning B", [exercise("Incline Treadmill Walk", "Conditioning", "Aerobic fitness", "Treadmill", 8, 15, 1, "Sustainable pace"), exercise("Kettlebell Swing", "Ballistic hinge", "Glutes · hamstrings", "Kettlebell", 10, 20, 4, "Powerful intent"), exercise("Cable Pallof Press", "Anti-rotation", "Core", "Cable", 10, 15, 2)]),
    ],
  },
  {
    id: "library-running-support-strength-2-day",
    label: "Running support strength · 2 day",
    description: "A supplementary strength template for runners, with running volume and lower-limb tolerance kept visible for PT review.",
    goal: "Strength support for running",
    sessionDurationMinutes: 45,
    sessions: [
      session("Running support · A", [exercise("Split Squat", "Lunge", "Quads · glutes", "Dumbbells", 8, 12, 3), exercise("Barbell Hip Thrust", "Hinge", "Glutes", "Barbell, Bench", 8, 12, 3), exercise("Standing Calf Raise", "Accessory", "Calves", "Machines", 10, 15, 3), exercise("Cable Pallof Press", "Anti-rotation", "Core", "Cable", 10, 15, 2)]),
      session("Running support · B", [exercise("Step-Up", "Lunge", "Quads · glutes", "Dumbbells, Box", 8, 12, 3), exercise("Single-Leg Romanian Deadlift", "Hinge", "Hamstrings · glutes", "Dumbbells", 8, 12, 3), exercise("Goblet Squat", "Squat", "Quads · glutes", "Dumbbells", 8, 12, 3), exercise("Side Plank", "Anti-lateral flexion", "Obliques · trunk", "Bodyweight", 20, 40, 2)]),
    ],
  },
  {
    id: "library-field-sport-power-3-day",
    label: "Field-sport power support · 3 day",
    description: "A power-support template with moderate-volume strength, jumps and throws; readiness and sport schedule must guide final exercise choice.",
    goal: "Power",
    sessionDurationMinutes: 55,
    sessions: [
      session("Sport power · A", [exercise("Box Jump", "Plyometric", "Lower-body power", "Box", 3, 5, 3, "Maximal intended speed"), exercise("Barbell Back Squat", "Squat", "Quads · glutes", "Barbell, Rack", 4, 8, 3), exercise("Medicine Ball Chest Pass", "Ballistic push", "Upper-body power", "Medicine ball", 4, 6, 3, "Maximal intended speed")]),
      session("Sport power · B", [exercise("Medicine Ball Rotational Throw", "Ballistic rotation", "Rotational power", "Medicine ball", 4, 6, 3, "Maximal intended speed"), exercise("Trap-Bar Deadlift", "Hinge", "Glutes · hamstrings", "Trap bar", 4, 6, 3), exercise("Dumbbell Shoulder Press", "Vertical push", "Shoulders · triceps", "Dumbbells", 6, 10, 2)]),
      session("Sport power · C", [exercise("Broad Jump", "Plyometric", "Lower-body power", "Open space", 3, 5, 3, "Maximal intended speed"), exercise("Split Squat", "Lunge", "Quads · glutes", "Dumbbells", 8, 12, 3), exercise("Chest-Supported Row", "Horizontal pull", "Back · biceps", "Dumbbells, Bench", 8, 12, 3)]),
    ],
  },
  {
    id: "library-advanced-strength-4-day",
    label: "Advanced strength exposure · 4 day",
    description: "A four-day advanced strength structure with varied exposure across major lifts. Use only when technique, recovery, training age and current tolerance support the workload.",
    goal: "General strength",
    sessionDurationMinutes: 75,
    experienceLevel: "Experienced",
    frameworkType: "Advanced strength",
    difficultyLevel: 3,
    sessions: [
      session("Advanced strength · Squat", [exercise("Barbell Back Squat", "Squat", "Quads · glutes", "Barbell, Rack", 3, 5, 4), exercise("Bulgarian Split Squat", "Lunge", "Quads · glutes", "Dumbbells", 6, 10, 3), exercise("Cable Pallof Press", "Anti-rotation", "Core", "Cable", 10, 15, 2)]),
      session("Advanced strength · Bench", [exercise("Barbell Bench Press", "Horizontal push", "Chest · triceps", "Barbell, Rack", 3, 5, 4), exercise("Chest-Supported Row", "Horizontal pull", "Back · biceps", "Dumbbells, Bench", 6, 10, 4), exercise("Rope Triceps Pressdown", "Accessory", "Triceps", "Cable", 10, 15, 2)]),
      session("Advanced strength · Hinge", [exercise("Trap-Bar Deadlift", "Hinge", "Glutes · hamstrings", "Trap bar", 2, 5, 4), exercise("Barbell Hip Thrust", "Hinge", "Glutes", "Barbell, Bench", 6, 10, 3), exercise("Lat Pulldown", "Vertical pull", "Lats · biceps", "Cable", 8, 12, 3)]),
      session("Advanced strength · Press", [exercise("Dumbbell Shoulder Press", "Vertical push", "Shoulders · triceps", "Dumbbells", 4, 8, 4), exercise("Incline Dumbbell Press", "Horizontal push", "Upper chest · triceps", "Dumbbells, Bench", 6, 10, 3), exercise("Seated Cable Row", "Horizontal pull", "Back · biceps", "Cable", 8, 12, 3)]),
    ],
  },
  {
    id: "library-advanced-hypertrophy-5-day",
    label: "Advanced hypertrophy rotation · 5 day",
    description: "A higher-frequency hypertrophy rotation for experienced clients with established exercise tolerance and enough recovery capacity for five weekly exposures.",
    goal: "Hypertrophy",
    sessionDurationMinutes: 70,
    experienceLevel: "Experienced",
    frameworkType: "Advanced hypertrophy",
    difficultyLevel: 3,
    sessions: [
      session("Hypertrophy · Upper push", [exercise("Barbell Bench Press", "Horizontal push", "Chest · triceps", "Barbell, Rack", 6, 10, 4), exercise("Dumbbell Shoulder Press", "Vertical push", "Shoulders · triceps", "Dumbbells", 8, 12, 3), exercise("Cable Lateral Raise", "Accessory", "Lateral delts", "Cable", 12, 20, 3)]),
      session("Hypertrophy · Lower quad", [exercise("Hack Squat", "Squat", "Quads · glutes", "Machines", 8, 12, 4), exercise("Leg Press", "Squat", "Quads · glutes", "Machines", 10, 15, 3), exercise("Standing Calf Raise", "Accessory", "Calves", "Machines", 10, 15, 3)]),
      session("Hypertrophy · Upper pull", [exercise("Lat Pulldown", "Vertical pull", "Lats · biceps", "Cable", 8, 12, 4), exercise("Chest-Supported Row", "Horizontal pull", "Back · biceps", "Dumbbells, Bench", 8, 12, 4), exercise("Cable Curl", "Accessory", "Biceps", "Cable", 10, 15, 3)]),
      session("Hypertrophy · Lower posterior", [exercise("Barbell Romanian Deadlift", "Hinge", "Hamstrings · glutes", "Barbell", 6, 10, 4), exercise("Barbell Hip Thrust", "Hinge", "Glutes", "Barbell, Bench", 8, 12, 3), exercise("Bulgarian Split Squat", "Lunge", "Quads · glutes", "Dumbbells", 8, 12, 3)]),
      session("Hypertrophy · Full body", [exercise("Front Squat", "Squat", "Quads · trunk", "Barbell, Rack", 8, 12, 3), exercise("Incline Dumbbell Press", "Horizontal push", "Upper chest · triceps", "Dumbbells, Bench", 8, 12, 3), exercise("Seated Cable Row", "Horizontal pull", "Back · biceps", "Cable", 8, 12, 3)]),
    ],
  },
];

const catalogueMetadata: Record<string, { experienceLevel: string; frameworkType: string }> = {
  "library-fat-loss-foundation-2-day": { experienceLevel: "Beginner", frameworkType: "Full body" },
  "library-fat-loss-concurrent-3-day": { experienceLevel: "Varied", frameworkType: "Concurrent" },
  "library-fat-loss-home-3-day": { experienceLevel: "Beginner", frameworkType: "Equipment-specific" },
  "library-foundation-strength-2-day": { experienceLevel: "Beginner", frameworkType: "Full body" },
  "library-full-body-strength-3-day": { experienceLevel: "Varied", frameworkType: "Full body" },
  "library-upper-lower-hypertrophy-4-day": { experienceLevel: "Intermediate", frameworkType: "Hypertrophy split" },
  "library-home-dumbbell-3-day": { experienceLevel: "Beginner", frameworkType: "Equipment-specific" },
  "library-minimal-equipment-2-day": { experienceLevel: "Beginner", frameworkType: "Equipment-specific" },
  "library-suspension-rings-3-day": { experienceLevel: "Varied", frameworkType: "Equipment-specific" },
  "library-kettlebell-conditioning-3-day": { experienceLevel: "Varied", frameworkType: "Concurrent" },
  "library-power-foundation-2-day": { experienceLevel: "Varied", frameworkType: "Power" },
  "library-climbing-support-2-day": { experienceLevel: "Varied", frameworkType: "Supplementary strength" },
  "library-general-fitness-3-day": { experienceLevel: "Beginner", frameworkType: "Concurrent" },
  "library-5x5-strength-3-day": { experienceLevel: "Beginner", frameworkType: "5×5 / linear" },
  "library-main-lift-wave-4-day": { experienceLevel: "Intermediate", frameworkType: "Main-lift wave" },
  "library-novice-linear-strength-3-day": { experienceLevel: "Beginner", frameworkType: "5×5 / linear" },
  "library-intermediate-full-body-wave-3-day": { experienceLevel: "Intermediate", frameworkType: "Intermediate wave" },
  "library-tiered-strength-progression-3-day": { experienceLevel: "Intermediate", frameworkType: "Tiered progression" },
  "library-bridge-to-intermediate-3-day": { experienceLevel: "Intermediate", frameworkType: "Intermediate wave" },
  "library-beginner-strength-conditioning-3-day": { experienceLevel: "Beginner", frameworkType: "Concurrent" },
  "library-beginner-express-2-day": { experienceLevel: "Beginner", frameworkType: "Equipment-specific" },
  "library-machine-dumbbell-foundation-3-day": { experienceLevel: "Beginner", frameworkType: "Equipment-specific" },
  "library-full-body-hypertrophy-volume-3-day": { experienceLevel: "Intermediate", frameworkType: "Full body" },
  "library-push-pull-legs-3-day": { experienceLevel: "Intermediate", frameworkType: "Hypertrophy split" },
  "library-push-pull-legs-6-day": { experienceLevel: "Experienced", frameworkType: "Hypertrophy split" },
  "library-upper-body-emphasis-3-day": { experienceLevel: "Intermediate", frameworkType: "Hypertrophy split" },
  "library-barbell-minimalist-3-day": { experienceLevel: "Varied", frameworkType: "Equipment-specific" },
  "library-bodyweight-progression-3-day": { experienceLevel: "Beginner", frameworkType: "Equipment-specific" },
  "library-travel-bands-bodyweight-3-day": { experienceLevel: "Beginner", frameworkType: "Equipment-specific" },
  "library-suspension-rings-mixed-2-day": { experienceLevel: "Varied", frameworkType: "Equipment-specific" },
  "library-concurrent-strength-conditioning-4-day": { experienceLevel: "Intermediate", frameworkType: "Concurrent" },
  "library-running-support-strength-2-day": { experienceLevel: "Varied", frameworkType: "Sport support" },
  "library-field-sport-power-3-day": { experienceLevel: "Intermediate", frameworkType: "Sport support" },
  "library-advanced-strength-4-day": { experienceLevel: "Experienced", frameworkType: "Advanced strength" },
  "library-advanced-hypertrophy-5-day": { experienceLevel: "Experienced", frameworkType: "Advanced hypertrophy" },
};

const fatLossCoverageSeed: ProgrammeTemplateDefinition[] = [
  ["library-general-fitness-3-day", "library-fat-loss-foundation-2-day", "Fat loss foundation · 2 day"],
  ["library-beginner-strength-conditioning-3-day", "library-fat-loss-concurrent-3-day", "Fat loss and conditioning · 3 day"],
  ["library-travel-bands-bodyweight-3-day", "library-fat-loss-home-3-day", "Fat loss home training · 3 day"],
].flatMap(([sourceId, id, label]) => {
  const source = [...coreProgrammeLibrarySeed, ...additionalProgrammeLibrarySeed].find((template) => template.id === sourceId);
  return source ? [{ ...source, id, label, goal: "Fat loss + muscle retention", description: `${source.description} Adapt the volume, conditioning and weekly schedule to support a sustainable fat-loss phase.` }] : [];
});

const levelForExperience = (experienceLevel?: string): 1 | 2 | 3 => experienceLevel === "Experienced" || experienceLevel === "Advanced" ? 3 : experienceLevel === "Intermediate" ? 2 : 1;
export const programmeLibrarySeed: ProgrammeTemplateDefinition[] = [...coreProgrammeLibrarySeed, ...additionalProgrammeLibrarySeed, ...fatLossCoverageSeed].map((template) => {
  const metadata = catalogueMetadata[template.id];
  const experienceLevel = metadata?.experienceLevel ?? template.experienceLevel;
  return { ...template, goal: normalizePtGoal(template.goal), ...metadata, difficultyLevel: template.difficultyLevel ?? levelForExperience(experienceLevel), variantGroup: template.variantGroup ?? `${normalizePtGoal(template.goal)} · ${template.sessions.length}-day` };
});

export type ProgrammeLibraryFilters = { query?: string; goal?: string; frequency?: number | "all"; equipment?: string; experienceLevel?: string; frameworkType?: string; difficultyLevel?: 1 | 2 | 3 | "all" };

export function programmeTemplateUsesEquipment(template: Pick<ProgrammeTemplateDefinition, "sessions">, equipment: string) {
  return template.sessions.some((session) => session.exercises.some((exercise) => exercise.equipment.toLowerCase().includes(equipment.toLowerCase())));
}

export function filterProgrammeLibraryTemplates<T extends ProgrammeTemplateDefinition>(templates: T[], filters: ProgrammeLibraryFilters) {
  const query = filters.query?.trim().toLowerCase() ?? "";
  return templates.filter((template) => {
    const haystack = `${template.label} ${template.goal} ${template.description} ${template.experienceLevel ?? ""} ${template.frameworkType ?? ""}`.toLowerCase();
    return (!query || haystack.includes(query)) && (!filters.goal || filters.goal === "all" || normalizePtGoal(template.goal) === normalizePtGoal(filters.goal)) && (!filters.frequency || filters.frequency === "all" || template.sessions.length === filters.frequency) && (!filters.equipment || filters.equipment === "all" || programmeTemplateUsesEquipment(template, filters.equipment)) && (!filters.experienceLevel || filters.experienceLevel === "all" || template.experienceLevel === filters.experienceLevel) && (!filters.frameworkType || filters.frameworkType === "all" || template.frameworkType === filters.frameworkType) && (!filters.difficultyLevel || filters.difficultyLevel === "all" || template.difficultyLevel === filters.difficultyLevel);
  });
}

export function mapLibraryTemplateToClientSessions(template: ProgrammeTemplateDefinition, preferredDays: number[]): SavedSession[] {
  const days = preferredDays.length === template.sessions.length ? preferredDays : template.sessions.map((_, index) => index + 1);
  return template.sessions.map((session, index) => ({ dayOfWeek: days[index], name: session.name, exercises: session.exercises }));
}
