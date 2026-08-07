import { prototypeContentSeedSchema, type PrototypeContentSeed } from "./contracts";

type SourceKey = "module-1" | "module-2" | "learning-plan";

const choice = (id: string, label: string) => ({ id, label });

function question(
  stableKey: string,
  prompt: string,
  choices: Array<ReturnType<typeof choice>>,
  correct: string | string[],
  feedback: { correct: string; incorrect: string; misconceptionCode?: string; nextAction?: "retry" | "inspect_visual" | "open_glossary" | "add_revision" },
  sourceKey: SourceKey,
  variationOf?: string,
) {
  return {
    stableKey,
    prompt,
    response: { kind: "single_choice" as const, choices, ...(variationOf ? { variationOf } : {}) },
    scoring: { correct: Array.isArray(correct) ? correct : [correct], caseSensitive: false },
    feedback: { ...feedback, nextAction: feedback.nextAction ?? "retry" as const },
    sourceKey,
  };
}

function object(
  stableKey: string,
  type: "hook" | "explain" | "explore" | "apply" | "check" | "close" | "structured_text",
  title: string,
  body: string,
  sourceKey: SourceKey,
  options: {
    supportingOutcomes?: string[];
    interaction?: { name: string; instructions: string; keyboardAlternative: string; structuredText: string };
    misconceptionCodes?: string[];
    outsideMasteryPromise?: boolean;
    questions?: ReturnType<typeof question>[];
  } = {},
) {
  return {
    stableKey,
    type,
    title,
    content: {
      kind: type === "structured_text" ? "reference" as const : type,
      body,
      supportingOutcomes: options.supportingOutcomes,
      interaction: options.interaction,
      misconceptionCodes: options.misconceptionCodes,
      outsideMasteryPromise: options.outsideMasteryPromise,
    },
    structuredText: options.interaction?.structuredText ?? body,
    sourceKey,
    questions: options.questions ?? [],
  };
}

const anatomicalPositionQuestions = [
  question("anatomical-position-check-viewpoint", "A client faces you. Which left side should your description use?", [choice("subject", "The client's left"), choice("viewer", "Your left as the viewer")], "subject", { correct: "Anatomical descriptions use the subject's viewpoint.", incorrect: "Use the person being described, even when they face you.", misconceptionCode: "VIEWER_LEFT_RIGHT", nextAction: "inspect_visual" }, "module-1"),
  question("anatomical-position-check-proximal", "Which statement is accurate?", [choice("elbow", "The elbow is proximal to the wrist"), choice("wrist", "The wrist is proximal to the elbow")], "elbow", { correct: "The elbow is nearer the limb's attachment to the trunk.", incorrect: "Proximal compares distance from a limb's attachment, not height.", misconceptionCode: "PROXIMAL_MEANS_HIGHER", nextAction: "open_glossary" }, "module-1"),
  question("anatomical-position-check-term", "Which option describes a position rather than a movement?", [choice("medial", "The knee is medial to the hand"), choice("flexion", "The knee moves into flexion")], "medial", { correct: "Medial compares locations relative to the midline.", incorrect: "Flexion is a joint action; medial is a positional relationship." }, "module-1"),
  question("anatomical-position-check-anterior", "Which statement uses anterior and posterior as body relationships?", [choice("anterior", "The sternum is anterior to the spine"), choice("direction", "The person moves anterior during the squat")], "anterior", { correct: "The sternum is toward the front of the body relative to the spine.", incorrect: "Anterior and posterior describe the relative location of structures, not the direction the whole person travels.", misconceptionCode: "ANTERIOR_MEANS_TRAVELLING_FORWARD", nextAction: "open_glossary" }, "module-1"),
  question("anatomical-position-check-depth", "Which statement is accurate?", [choice("skin", "The skin is superficial to the muscle beneath it"), choice("hidden", "A deep structure is simply one that cannot be seen in a picture")], "skin", { correct: "Superficial means closer to the body's surface; deep means farther from it.", incorrect: "Superficial and deep describe a relationship to the body surface, not whether an illustration makes something visible.", misconceptionCode: "SUPERFICIAL_MEANS_VISIBLE", nextAction: "open_glossary" }, "module-1"),
];

const planeQuestions = [
  question("planes-check-sagittal-axis", "Which axis pairs with the sagittal plane?", [choice("ml", "Medio-lateral axis"), choice("ap", "Anterior-posterior axis"), choice("long", "Longitudinal axis")], "ml", { correct: "Sagittal-plane movement occurs around a medio-lateral axis.", incorrect: "A plane and its axis are perpendicular, not interchangeable.", misconceptionCode: "PLANE_EQUALS_AXIS", nextAction: "inspect_visual" }, "module-1"),
  question("planes-check-division", "Which plane divides the body into anterior and posterior portions?", [choice("frontal", "Frontal"), choice("sagittal", "Sagittal"), choice("transverse", "Transverse")], "frontal", { correct: "The frontal plane divides front from back.", incorrect: "Picture the sheet passing left to right through the body." }, "module-1"),
  question("planes-check-axis-definition", "A learner says: 'The axis is the direction the body part travels.' What needs correcting?", [choice("rotation", "The axis is the line around which movement rotates"), choice("same", "Nothing; plane and axis mean the same thing")], "rotation", { correct: "The axis is the line of rotation; the movement occurs through a plane.", incorrect: "Keep the plane and the perpendicular axis as two distinct ideas.", misconceptionCode: "PLANE_EQUALS_AXIS" }, "module-1"),
  question("planes-check-sagittal-forward", "Which statement describes the sagittal plane accurately?", [choice("division", "It divides the body into left and right portions"), choice("forward", "It means the body must travel forwards")], "division", { correct: "Sagittal names a body division and movement plane; it does not mean that every movement travels forwards.", incorrect: "Sagittal is not a synonym for forward travel. Use the plane's body division as the clue.", misconceptionCode: "SAGITTAL_MEANS_FORWARD", nextAction: "open_glossary" }, "module-1"),
  question("planes-check-predominant", "A squat is predominantly sagittal. What does predominantly allow you to say?", [choice("shorthand", "The main pattern is sagittal, while smaller components may occur in other planes"), choice("absolute", "Every part of the movement is only sagittal")], "shorthand", { correct: "Predominant identifies the main pattern without claiming that a real movement is perfectly restricted to one plane.", incorrect: "Exercise analysis uses a useful main-pattern label; it should not turn a real movement into an absolute single-plane claim.", misconceptionCode: "EXERCISE_BELONGS_ABSOLUTELY_TO_ONE_PLANE", nextAction: "inspect_visual" }, "learning-plan"),
];

const jointQuestions = [
  question("joint-actions-check-knee-descent", "During the squat descent, what happens at the knee?", [choice("flexion", "Knee flexion"), choice("extension", "Knee extension"), choice("muscle", "Quadriceps contraction")], "flexion", { correct: "The knee angle decreases, so the joint moves into flexion.", incorrect: "Name the joint action, not a muscle or contraction type.", misconceptionCode: "JOINT_ACTION_EQUALS_MUSCLE", nextAction: "inspect_visual" }, "module-2"),
  question("joint-actions-check-order", "Which frame order shows a squat descent?", [choice("standing-bottom", "Standing, mid-descent, bottom"), choice("bottom-standing", "Bottom, mid-ascent, standing")], "standing-bottom", { correct: "The joint angles reduce as the person lowers.", incorrect: "First establish the phase before naming the action." }, "module-2"),
  question("joint-actions-check-ankle-return", "How should the ankle be described during the squat return?", [choice("neutral", "It moves from dorsiflexion back towards neutral"), choice("same", "It stays in dorsiflexion without change"), choice("all-extension", "It extends because every joint extends on ascent")], "neutral", { correct: "This wording describes the observed change without implying a calf raise.", incorrect: "Different joints need joint-specific descriptions.", misconceptionCode: "PHASE_DETERMINES_ALL_JOINTS", nextAction: "inspect_visual" }, "module-2"),
];

const recognisingQuestions = [
  question("recognising-check-lateral-raise", "During the lifting phase of a lateral raise, what is the principal shoulder action?", [choice("abduction", "Abduction"), choice("adduction", "Adduction"), choice("flexion", "Flexion")], "abduction", { correct: "The arm moves away from the body's midline.", incorrect: "Use the midline as the reference for abduction and adduction.", misconceptionCode: "MIDLINE_IGNORED" }, "module-2"),
  question("recognising-check-curl-plane", "An elbow curl is predominantly in which plane?", [choice("sagittal", "Sagittal"), choice("frontal", "Frontal"), choice("transverse", "Transverse")], "sagittal", { correct: "Elbow flexion and extension occur predominantly through the sagittal plane.", incorrect: "Analyse the highlighted joint action rather than relying on the exercise name.", misconceptionCode: "EXERCISE_NAME_DETERMINES_ACTION" }, "module-1"),
  question("recognising-check-evidence", "Which explanation is most precise?", [choice("precise", "During the descent, the hip moves into flexion as its angle decreases"), choice("updown", "The hip bends because the person goes down"), choice("name", "It is a squat, so it is flexion")], "precise", { correct: "It names the phase, joint, action and visible clue.", incorrect: "Up/down language alone does not establish a joint action.", misconceptionCode: "UP_ALWAYS_EXTENSION", nextAction: "add_revision" }, "learning-plan"),
];

const mixedQuestions = [
  question("mixed-check-viewpoint", "In a front-facing image, which side is the subject's left?", [choice("subject", "The side labelled as the subject's left"), choice("viewer", "The viewer's left")], "subject", { correct: "The subject keeps their own left and right.", incorrect: "Re-anchor the description to the subject.", misconceptionCode: "VIEWER_LEFT_RIGHT" }, "module-1"),
  question("mixed-check-direction", "The knee is ____ to the ankle.", [choice("proximal", "Proximal"), choice("distal", "Distal")], "proximal", { correct: "The knee is nearer the lower limb's attachment to the trunk.", incorrect: "Compare distance from the limb's attachment.", misconceptionCode: "PROXIMAL_MEANS_HIGHER" }, "module-1"),
  question("mixed-check-squat-plane", "What is the squat's predominant plane?", [choice("sagittal", "Sagittal"), choice("frontal", "Frontal"), choice("transverse", "Transverse")], "sagittal", { correct: "The principal hip and knee flexion-extension pattern is sagittal.", incorrect: "Predominant does not mean the movement is absolutely confined to one plane." }, "module-1"),
  question("mixed-check-squat-axis", "Which axis pairs with that predominant plane?", [choice("ml", "Medio-lateral"), choice("ap", "Anterior-posterior"), choice("long", "Longitudinal")], "ml", { correct: "Sagittal pairs with the medio-lateral axis.", incorrect: "The axis runs perpendicular to the plane.", misconceptionCode: "PLANE_EQUALS_AXIS" }, "module-1"),
  question("mixed-check-hip-knee", "During descent, which pair is accurate?", [choice("flexion", "Hip flexion and knee flexion"), choice("extension", "Hip extension and knee extension"), choice("mixed", "Hip flexion and knee extension")], "flexion", { correct: "Both hip and knee angles decrease during this phase.", incorrect: "Name each joint and inspect its angle change.", misconceptionCode: "PHASE_DETERMINES_ALL_JOINTS" }, "module-2"),
  question("mixed-check-repair", "Which revision makes 'the leg bends down' precise?", [choice("precise", "During descent, the knee moves into flexion as its angle decreases"), choice("long", "The quadriceps works while the whole body goes lower")], "precise", { correct: "The revision identifies phase, joint, action and evidence.", incorrect: "A muscle name does not replace the requested joint action.", misconceptionCode: "JOINT_ACTION_EQUALS_MUSCLE", nextAction: "add_revision" }, "learning-plan"),
  question("mixed-variation-viewpoint-back", "From a back view, which marker remains on the subject's left?", [choice("subject", "The subject-left marker"), choice("screen", "Whichever marker appears on screen-left")], "subject", { correct: "Changing viewpoint does not change the subject's left.", incorrect: "Use anatomical viewpoint, not screen position.", misconceptionCode: "VIEWER_LEFT_RIGHT" }, "module-1", "mixed-check-viewpoint"),
  question("mixed-variation-direction-elbow", "The wrist is ____ to the elbow.", [choice("distal", "Distal"), choice("proximal", "Proximal")], "distal", { correct: "The wrist is farther from the upper limb's attachment.", incorrect: "Proximal and distal compare distance along a limb.", misconceptionCode: "PROXIMAL_MEANS_HIGHER" }, "module-1", "mixed-check-direction"),
  question("mixed-variation-frontal", "What is the predominant plane of a lateral raise?", [choice("frontal", "Frontal"), choice("sagittal", "Sagittal"), choice("transverse", "Transverse")], "frontal", { correct: "Shoulder abduction is predominantly frontal-plane movement.", incorrect: "Use the movement relative to the midline, not the exercise name.", misconceptionCode: "MIDLINE_IGNORED" }, "module-1", "mixed-check-squat-plane"),
  question("mixed-variation-transverse", "What is the predominant plane of controlled standing torso rotation?", [choice("transverse", "Transverse"), choice("sagittal", "Sagittal"), choice("frontal", "Frontal")], "transverse", { correct: "Axial rotation is predominantly transverse-plane movement.", incorrect: "Focus on the rotating region and direction." }, "module-1", "mixed-check-squat-plane"),
  question("mixed-variation-knee-ascent", "During squat ascent, what happens at the knee?", [choice("extension", "Extension"), choice("flexion", "Flexion"), choice("up", "Upward movement")], "extension", { correct: "The knee angle increases as the person returns to standing.", incorrect: "Use the joint angle, not the body's overall direction.", misconceptionCode: "UP_ALWAYS_EXTENSION" }, "module-2", "mixed-check-hip-knee"),
  question("mixed-variation-curl-repair", "Which sentence precisely describes the lowering phase of an elbow curl?", [choice("precise", "During lowering, the elbow moves into extension as its angle increases"), choice("name", "The curl goes down, so the arm relaxes")], "precise", { correct: "It identifies the phase, joint, action and visible change.", incorrect: "Exercise name and direction are not sufficient evidence.", misconceptionCode: "EXERCISE_NAME_DETERMINES_ACTION" }, "learning-plan", "mixed-check-repair"),
];

export const prototypeContentSeed: PrototypeContentSeed = prototypeContentSeedSchema.parse({
  packageVersion: 1,
  status: "draft",
  topic: {
    slug: "anatomy-and-movement",
    title: "Anatomy and movement",
    description: "A five-lesson Human Movement Studio prototype using the squat as a recurring anchor.",
    recommendedOrder: 1,
    origymModule: "Module 1",
    mappingStatus: "provisional",
  },
  misconceptions: [
    { code: "VIEWER_LEFT_RIGHT", label: "Viewer left replaces subject left", explanation: "Anatomical left and right belong to the subject, regardless of viewing position." },
    { code: "PROXIMAL_MEANS_HIGHER", label: "Proximal means higher", explanation: "Proximal and distal compare distance from a limb's attachment, not vertical height." },
    { code: "PLANE_EQUALS_AXIS", label: "Plane and axis are interchangeable", explanation: "Movement occurs through a plane and rotates around a perpendicular axis." },
    { code: "PHASE_DETERMINES_ALL_JOINTS", label: "One phase gives every joint the same action", explanation: "Each joint must be observed and named within the phase." },
    { code: "JOINT_ACTION_EQUALS_MUSCLE", label: "Joint action and muscle action are interchangeable", explanation: "A joint action describes the visible change; muscle action is a separate analysis." },
    { code: "MIDLINE_IGNORED", label: "Abduction or adduction without a midline", explanation: "These terms only make sense relative to the body's midline." },
    { code: "EXERCISE_NAME_DETERMINES_ACTION", label: "Exercise name determines joint action", explanation: "The same exercise contains different actions by joint and phase." },
    { code: "ANTERIOR_MEANS_TRAVELLING_FORWARD", label: "Anterior means travelling forward", explanation: "Anterior describes a structure being toward the front relative to another structure; it does not mean the person is moving forward." },
    { code: "SUPERFICIAL_MEANS_VISIBLE", label: "Superficial means visible", explanation: "Superficial and deep describe distance from the body surface, not whether an illustration makes a structure visible." },
    { code: "SAGITTAL_MEANS_FORWARD", label: "Sagittal means forward", explanation: "Sagittal describes a plane dividing the body into left and right portions; it is not a synonym for travelling forwards." },
    { code: "EXERCISE_BELONGS_ABSOLUTELY_TO_ONE_PLANE", label: "An exercise belongs absolutely to one plane", explanation: "Predominant plane is a useful main-pattern label; real movement may include smaller components in other planes." },
  ],
  glossary: [
    ["anatomical-position", "Anatomical position", "The agreed reference posture used to describe the body's structures."],
    ["midline", "Midline", "An imagined central line dividing the body into left and right sides."],
    ["anterior", "Anterior", "Toward the front of the body."], ["posterior", "Posterior", "Toward the back of the body."],
    ["medial", "Medial", "Closer to the body's midline."], ["lateral", "Lateral", "Farther from the body's midline."],
    ["superior", "Superior", "Above another structure in anatomical position."], ["inferior", "Inferior", "Below another structure in anatomical position."],
    ["proximal", "Proximal", "Closer to a limb's attachment to the trunk."], ["distal", "Distal", "Farther from a limb's attachment to the trunk."],
    ["superficial", "Superficial", "Closer to the surface of the body."], ["deep", "Deep", "Farther from the surface of the body."],
    ["plane-of-motion", "Plane of motion", "An imagined flat surface through which movement is described."], ["axis", "Axis", "An imagined line around which movement rotates."],
    ["sagittal-plane", "Sagittal plane", "A plane dividing the body into left and right portions."], ["frontal-plane", "Frontal plane", "A plane dividing the body into anterior and posterior portions."],
    ["transverse-plane", "Transverse plane", "A plane dividing the body into upper and lower portions."], ["medio-lateral-axis", "Medio-lateral axis", "An axis running side to side, paired with sagittal-plane movement."],
    ["anterior-posterior-axis", "Anterior-posterior axis", "An axis running front to back, paired with frontal-plane movement."], ["longitudinal-axis", "Longitudinal axis", "An axis running vertically, paired with transverse-plane movement."],
    ["joint-action", "Joint action", "A named change in the relationship between bones at a joint."], ["flexion", "Flexion", "A joint action that usually decreases the angle at a joint."],
    ["extension", "Extension", "A joint action that usually increases the angle at a joint."], ["abduction", "Abduction", "Movement away from the body's midline."],
    ["adduction", "Adduction", "Movement toward the body's midline."],
  ].map(([slug, term, definition]) => ({ slug, term, definition, sourceKey: slug === "joint-action" || ["flexion", "extension", "abduction", "adduction"].includes(slug) ? "module-2" : "module-1" })),
  lessons: [
    {
      order: 1, slug: "anatomical-position", title: "Anatomical position and directional terms", outcome: "Use anatomical position as a shared reference and accurately compare two body structures.", durationMinutes: 8, mapping: "Module 1 · Anatomy and movement", mappingStatus: "confirmed", status: "draft", sourceKey: "module-1",
      objects: [
        object("anatomical-position-hook", "hook", "Whose left side?", "A coach faces a client and points to the client's left shoulder. Before using any directional term, decide whose viewpoint controls the description. This unscored prediction becomes the anchor for the lesson.", "learning-plan"),
        object("anatomical-position-explain", "explain", "A shared reference", "Anatomical position is the agreed reference posture used to describe the body: standing upright, facing forward, arms by the sides and palms facing forward. It is a reference, not a demand that every exercise begins or ends in this exact posture. Directional terms compare one named structure with another, so the explanation must make both landmarks clear. A body can change pose while the subject-relative relationships still have meaning.", "module-1", { supportingOutcomes: ["Recognise the essential features of anatomical position.", "Explain why left and right belong to the subject.", "Apply proximal/distal, medial/lateral, anterior/posterior, superior/inferior and superficial/deep.", "Distinguish a positional term from a movement description."] }),
        object("anatomical-position-explore", "explore", "Reference-position lab", "Toggle front and back views, identify the defining features of anatomical position and then check whether your left/right description follows the subject rather than the screen. The activity is a prediction and explanation exercise; it does not create scored practice evidence.", "learning-plan", { interaction: { name: "Reference-position lab", instructions: "Toggle the original figure between front and back views. Select the four defining features of anatomical position, then decide whether left/right belongs to the subject or the viewer.", keyboardAlternative: "Use Tab to reach the view, feature and viewpoint buttons. Each button exposes its selected state with aria-pressed, and every feedback message is announced.", structuredText: "The subject stands upright, faces forward, keeps the arms by the sides and presents the palms forward. An elbow bend is not a defining feature. The screen may reverse what you see when the view changes, but the subject's left remains the subject's left." }, misconceptionCodes: ["VIEWER_LEFT_RIGHT"] }),
        object("anatomical-position-apply", "apply", "Complete the comparison", "Apply the reference to five named pairs: limb attachment, midline, body surface and front/back relationships. After each answer, inspect the clue before moving on. The final transfer explains why the same relationships remain useful when the standing figure changes into the starting squat stance.", "learning-plan", { interaction: { name: "Directional comparison builder", instructions: "Choose the term that accurately completes each relationship. Work through all five pairs and read the explanation for the reference line used.", keyboardAlternative: "Choose from labelled native buttons; no dragging or colour-only cue is required. The current prompt and progress count remain visible to keyboard and screen-reader users.", structuredText: "The builder compares elbow/wrist, sternum/shoulder, skin/muscle, spine/sternum and heart/skin. Proximal and distal use limb attachment; medial and lateral use the midline; anterior and posterior use front/back; superficial and deep use the body surface." } }),
        object("anatomical-position-check", "check", "Check your reference", "Retrieve the subject-relative viewpoint, positional relationships and the boundary between describing a location and describing a movement. Feedback names the relevant reference line and targets viewer-left, proximal/higher, anterior/travelling-forward and superficial/visible shortcuts.", "learning-plan", { questions: anatomicalPositionQuestions, misconceptionCodes: ["VIEWER_LEFT_RIGHT", "PROXIMAL_MEANS_HIGHER", "ANTERIOR_MEANS_TRAVELLING_FORWARD", "SUPERFICIAL_MEANS_VISIBLE"] }),
        object("anatomical-position-close", "close", "Describe before you move", "You can now establish the reference position, name whose body you are describing and compare landmarks with a specific directional relationship. Before analysing an exercise, name the subject, the phase and the structures you are comparing; do not replace location language with a vague up/down description.", "learning-plan"),
      ],
    },
    {
      order: 2, slug: "planes-and-axes", title: "Planes and axes", outcome: "Match each anatomical plane to its axis and identify the predominant plane of a simple movement.", durationMinutes: 8, mapping: "Module 1 · Anatomy and movement", mappingStatus: "confirmed", status: "draft", sourceKey: "module-1",
      objects: [
        object("planes-hook", "hook", "Place the plane", "A client performs a bodyweight squat. Before naming an axis or joint action, predict which plane best represents the principal hip and knee movement. This prediction is unscored: it gives you a reason to inspect the plane rather than memorise a pairing.", "learning-plan"),
        object("planes-explain", "explain", "Plane through, axis around", "A plane is an imagined flat surface through which a movement is described. An axis is an imagined line around which the movement rotates. They are different ideas and are paired because the axis is perpendicular to the plane: sagittal with medio-lateral, frontal with anterior-posterior and transverse with longitudinal. The plane names a body division as well as a movement description. The word predominantly identifies the main pattern being discussed; it does not claim that a real exercise is perfectly restricted to one plane.", "module-1", { supportingOutcomes: ["Describe how each plane divides the body.", "Pair sagittal with the medio-lateral axis, frontal with the anterior-posterior axis and transverse with the longitudinal axis.", "Distinguish the plane through which movement occurs from the axis around which it occurs.", "Identify the squat as predominantly sagittal without treating sagittal as a synonym for forward."] }),
        object("planes-explore", "explore", "Plane-and-axis explorer", "Inspect one plane at a time on an original neutral figure. Each state shows the body division, the perpendicular axis and one movement example, so the pairing is explained rather than presented as a disconnected table.", "learning-plan", { interaction: { name: "Plane-and-axis explorer", instructions: "Select sagittal, frontal or transverse to update the figure, body division, perpendicular axis and representative movement. Then choose the axis that pairs with the selected plane and read the feedback.", keyboardAlternative: "Use Tab and Enter to operate the plane and axis buttons. Each selected state is exposed with aria-pressed, and the live relationship is announced in text.", structuredText: "Sagittal divides the body into left and right portions and pairs with the medio-lateral axis; a squat is predominantly sagittal. Frontal divides the body into anterior and posterior portions and pairs with the anterior-posterior axis; a lateral raise is predominantly frontal. Transverse divides the body into upper and lower portions and pairs with the longitudinal axis; standing torso rotation is predominantly transverse." }, misconceptionCodes: ["PLANE_EQUALS_AXIS", "SAGITTAL_MEANS_FORWARD"] }),
        object("planes-apply", "apply", "Predominant plane sorter", "Classify three movement cards: bodyweight squat, lateral raise and standing torso rotation. Use the movement clue rather than the exercise name alone, then read why the answer is described as predominant. The final state reminds you that smaller components in other planes can still exist.", "learning-plan", { interaction: { name: "Predominant plane sorter", instructions: "Choose the best predominant plane for each movement, check the clue, retry a mismatch and continue through all three cards.", keyboardAlternative: "Use labelled native buttons as the complete alternative to drag-and-drop. The current card number and movement name remain visible to keyboard and screen-reader users.", structuredText: "Bodyweight squat: predominantly sagittal because the principal hip and knee pattern is flexion-extension. Lateral raise: predominantly frontal because the arms move away from the midline. Standing torso rotation: predominantly transverse because the trunk rotates around a vertical axis. Predominant does not mean only." }, misconceptionCodes: ["EXERCISE_BELONGS_ABSOLUTELY_TO_ONE_PLANE"] }),
        object("planes-check", "check", "Check the relationships", "Retrieve plane, axis and body-division relationships, then distinguish sagittal from forward travel and predominant from absolute single-plane language. Feedback names the perpendicular pairing or the evidence for the main movement pattern.", "learning-plan", { questions: planeQuestions, misconceptionCodes: ["PLANE_EQUALS_AXIS", "SAGITTAL_MEANS_FORWARD", "EXERCISE_BELONGS_ABSOLUTELY_TO_ONE_PLANE"] }),
        object("planes-close", "close", "Use predominantly", "You can now describe a plane as a body division, pair it with its perpendicular axis and apply the relationship to a movement. When analysing an exercise, state the main pattern as predominant and keep the distinction between plane through and axis around visible.", "learning-plan"),
      ],
    },
    {
      order: 3, slug: "joint-actions", title: "Joint actions", outcome: "Describe the principal hip, knee and ankle actions visible through a squat.", durationMinutes: 9, mapping: "Module 1 · Mapping needs confirmation; terminology cross-checked in Module 2", mappingStatus: "needs_confirmation", status: "draft", sourceKey: "module-2",
      objects: [
        object("joint-actions-hook", "hook", "Where does the angle decrease?", "Compare standing and bottom squat positions at one highlighted joint.", "learning-plan"),
        object("joint-actions-explain", "explain", "Name joint, phase and action", "Joint action is inferred from the angle change at a named joint during a named phase.", "module-2", { supportingOutcomes: ["Infer flexion or extension from angle change.", "Identify hip and knee actions by phase.", "Describe ankle dorsiflexion and return toward neutral.", "Name joint and phase in every answer."] }),
        object("joint-actions-explore", "explore", "Squat joint-action sequence", "Compare standing, lower and return states with one selected joint emphasised.", "learning-plan", { interaction: { name: "Squat joint-action sequence", instructions: "Choose a stage and a joint, then identify the visible action.", keyboardAlternative: "Use explicit Previous, Next and stage buttons; a scrubber is never required.", structuredText: "Descent: hip and knee flexion, ankle dorsiflexion. Return: hip and knee extension, ankle moves from dorsiflexion toward neutral." }, misconceptionCodes: ["PHASE_DETERMINES_ALL_JOINTS", "JOINT_ACTION_EQUALS_MUSCLE"] }),
        object("joint-actions-apply", "apply", "Build the phase description", "Assemble phase, joint and action into a precise sentence.", "learning-plan", { interaction: { name: "Phase description builder", instructions: "Choose one value for phase, joint and action.", keyboardAlternative: "Each part is a labelled native selection control.", structuredText: "Model: During the descent, the knee moves into flexion." } }),
        object("joint-actions-check", "check", "Check the squat sequence", "Retrieve joint-specific actions and distinguish them from muscle action.", "learning-plan", { questions: jointQuestions, misconceptionCodes: ["PHASE_DETERMINES_ALL_JOINTS", "JOINT_ACTION_EQUALS_MUSCLE"] }),
        object("joint-actions-close", "close", "Keep the evidence visible", "You can describe what changes without drifting into muscle action or technique judgement.", "learning-plan"),
        object("joint-actions-reference", "structured_text", "Deeper reference: complete joint-action vocabulary", "Optional reference covering rotation, circumduction, pronation, supination, inversion, eversion, plantarflexion, dorsiflexion and shoulder-girdle movements. These terms are outside the five-lesson mastery promise.", "module-2", { outsideMasteryPromise: true }),
      ],
    },
    {
      order: 4, slug: "recognising-actions", title: "Recognising actions in exercise", outcome: "Identify predominant joint actions and planes in a small set of common exercises.", durationMinutes: 9, mapping: "Module 1 · Anatomy and movement", mappingStatus: "confirmed", status: "draft", sourceKey: "learning-plan",
      objects: [
        object("recognising-hook", "hook", "What do these movements share?", "Compare two different exercises at one highlighted joint.", "learning-plan"),
        object("recognising-explain", "explain", "Five-step observation method", "Set viewpoint, choose joint, identify phase, observe angle or direction, then name action and predominant plane.", "learning-plan", { supportingOutcomes: ["Use the five-step method.", "Recognise core actions in clear examples.", "Identify predominant plane.", "Explain one answer with evidence."] }),
        object("recognising-explore", "explore", "Movement detective", "Analyse squat, elbow curl, lateral raise and standing torso-rotation cards with progressively fewer prompts.", "learning-plan", { interaction: { name: "Movement detective", instructions: "For each card, identify joint or region, phase, action and predominant plane.", keyboardAlternative: "Move between cards and answer with labelled buttons.", structuredText: "Each card provides starting and ending positions plus a written description of the highlighted landmark." }, misconceptionCodes: ["EXERCISE_NAME_DETERMINES_ACTION", "MIDLINE_IGNORED"] }),
        object("recognising-apply", "apply", "Diagnose the explanation", "Choose the explanation that names a phase, joint, action and observable clue.", "learning-plan", { interaction: { name: "Explanation diagnosis", instructions: "Select the most precise explanation, then identify what weaker answers omit.", keyboardAlternative: "Use native radio-style buttons and a Submit button.", structuredText: "Precise explanations name the phase, joint and action, and connect them to a visible change." } }),
        object("recognising-check", "check", "Check your method", "Apply the observation method to transfer examples.", "learning-plan", { questions: recognisingQuestions, misconceptionCodes: ["EXERCISE_NAME_DETERMINES_ACTION", "MIDLINE_IGNORED"] }),
        object("recognising-close", "close", "Evidence before labels", "You can analyse a movement without guessing from its name or overall direction.", "learning-plan"),
      ],
    },
    {
      order: 5, slug: "mixed-movement-challenge", title: "Mixed movement challenge", outcome: "Apply the full five-step observation method to unfamiliar movement examples.", durationMinutes: 10, mapping: "Module 1 · Anatomy and movement", mappingStatus: "confirmed", status: "draft", sourceKey: "learning-plan",
      objects: [
        object("mixed-hook", "hook", "The movement case", "Describe the change from standing to the bottom of a squat precisely enough for another trainer to follow.", "learning-plan"),
        object("mixed-explain", "explain", "Retrieve, transfer, explain", "The case mixes concepts rather than repeating lesson order, and one result never proves durable security.", "learning-plan", { supportingOutcomes: ["Retrieve concepts out of sequence.", "Transfer to fresh examples.", "Explain at least one answer.", "Choose what to revisit next."] }),
        object("mixed-explore", "explore", "Six-step movement case", "Work through viewpoint, directional language, plane, axis, joint action and explanation repair.", "learning-plan", { interaction: { name: "Mixed movement case", instructions: "Complete one varied task per screen and read the immediate explanation.", keyboardAlternative: "Every task uses native controls; no timed or drag-only response is used.", structuredText: "The six tasks cover viewpoint, comparison, predominant plane, matching axis, phase-specific joint actions and precise explanation." }, misconceptionCodes: ["VIEWER_LEFT_RIGHT", "PLANE_EQUALS_AXIS", "JOINT_ACTION_EQUALS_MUSCLE"] }),
        object("mixed-apply", "apply", "Transfer examples", "Use a second squat viewpoint plus frontal- and transverse-plane examples to avoid artwork recognition.", "learning-plan", { interaction: { name: "Transfer set", instructions: "Apply the same observation sequence to fresh images.", keyboardAlternative: "Open the written movement sequence before choosing an answer.", structuredText: "Variants change viewpoint, body proportions and movement while preserving the assessed concept." } }),
        object("mixed-check", "check", "Mixed challenge", "Complete six core questions and six variations; feedback is grouped by outcome rather than percentage alone.", "learning-plan", { questions: mixedQuestions, misconceptionCodes: ["VIEWER_LEFT_RIGHT", "PROXIMAL_MEANS_HIGHER", "PLANE_EQUALS_AXIS", "PHASE_DETERMINES_ALL_JOINTS", "JOINT_ACTION_EQUALS_MUSCLE", "MIDLINE_IGNORED", "EXERCISE_NAME_DETERMINES_ACTION"] }),
        object("mixed-close", "close", "Choose the next useful review", "Accept the suggested revision, choose another lesson or continue. This attempt contributes evidence but cannot create Secure by itself.", "learning-plan"),
      ],
    },
  ],
});
