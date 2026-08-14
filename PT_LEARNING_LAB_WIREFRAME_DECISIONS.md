# PT Learning Lab — Prototype Wireframe Decisions

> Historical document: the PT Learning Lab direction was superseded by the current Banner Fitness PT workspace.

Status: approved as a complete low-fidelity set; ready for Phase 1 implementation

Date: 5 August 2026
Depends on: `PT_LEARNING_LAB_PROTOTYPE_LEARNING_PLAN.md`

## 1. Wireframe scope

The first wireframe pass covers the two most demanding responsive interactions in the anatomy-and-movement prototype:

1. Lesson 2 — plane-and-axis explorer.
2. Lesson 3 — squat joint-action sequence.

Each is represented at laptop and mobile sizes within the shared lesson rhythm. This pass tests structure, hierarchy and interaction states. It is not final visual design, final anatomy artwork or production code.

## 2. Shared lesson-shell decisions

### Laptop

- Keep a shallow deep-teal product header with product name, module context and lesson position.
- Use a narrow lesson map on the left for Hook, Explain, Explore, Apply and Check.
- Place the current outcome directly above the interaction.
- Keep lesson progress separate from demonstrated learning security.
- Use one dominant interaction card rather than several competing panels.
- Put the visual on the left and choices plus feedback on the right while space permits.
- Keep structured text available as a persistent secondary action.
- Keep the next learning action at the lower right of the interaction.

### Mobile

- Remove the persistent lesson rail and show a compact step/progress treatment instead.
- Stack the visual, controls, feedback and actions in that order.
- Use one interaction task per screen rather than reproducing the laptop columns.
- Make every option a full-width or easily reached native button.
- Preserve the outcome above the interaction so the learner knows what the activity is teaching.
- Keep structured text and Continue equally reachable at the end of the card.

## 3. Lesson 2 — planes and axes

### Primary state

The explorer presents one original neutral figure with only one plane emphasised at a time. The axis appears as a distinct line, and the caption names the selected plane-axis pair.

### Interaction sequence

1. The learner makes an unscored prediction from the squat hook.
2. The explorer opens with sagittal selected.
3. Selecting sagittal, frontal or transverse updates the plane, axis and concise explanation together.
4. The learner can open the equivalent structured-text relationship.
5. Continue moves to application, where movements are sorted by predominant plane.

### Decisions

- Do not show all three plane overlays at full emphasis simultaneously.
- Treat the plane and axis as visually different objects.
- Use the qualification vocabulary `medio-lateral`, `anterior-posterior` and `longitudinal` in the main label.
- Use “predominant plane” consistently for exercise classification.
- Keep the first prediction unscored so the hook invites thinking without creating premature progress evidence.

## 4. Lesson 3 — joint actions in a squat

### Primary state

The sequence offers standing, lower and return states. Hip, knee and ankle can be selected independently. Only the selected stage and joint receive full visual emphasis.

### Interaction sequence

1. Start from standing as the comparison position.
2. Move to the lowering state and select a joint.
3. Reveal the phase-specific joint action and the observable clue.
4. Move to return and compare the action at the same joint.
5. Continue to the sentence builder: `phase + joint + action`.

### Decisions

- Use explicit stage controls alongside any future scrubber; the lesson must not depend on dragging.
- Keep the whole sequence visible on laptop to support comparison.
- Show one current stage on mobile to preserve legibility.
- Name the phase and joint in every feedback sentence.
- Describe the ankle during ascent as moving from dorsiflexion back towards neutral in the main lesson.
- Keep muscle actions, contraction types and technique judgement outside this interaction.

## 5. Feedback and state decisions

The wireframes establish space for:

- unscored prediction;
- selected but not submitted;
- concise correct explanation;
- misconception-specific explanation;
- structured-text alternative;
- retry without losing lesson progress;
- continue to application.

The final wireframe set includes explicit examples of partly correct and named-misconception feedback. A single successful interaction must not display **Secure**.

## 6. Accessibility decisions

- All selectors are native buttons with visible selected states and exposed pressed state.
- Plane, stage and joint selection must work by keyboard.
- Dragging or scrubbing is optional enhancement only.
- Feedback uses an announced live region.
- Colour is reinforced by labels, opacity, line form and selection state.
- Every diagram requires a structured-text equivalent.
- Mobile controls must retain adequate touch targets.
- The eventual illustration must remain readable at approximately 320 px content width.

## 7. Visual-direction use

The wireframes lightly apply the approved Human Movement Studio direction only to test hierarchy:

- warm sand/cream learning surfaces;
- deep teal structure and actions;
- clay movement emphasis;
- sage feedback state;
- softly rounded but restrained containers.

Typography, illustration detail, spacing tokens and final component polish will
be resolved inside the approved Human Movement Studio direction during Phase 1;
they may not alter the accepted hierarchy or interaction-state contract.

## 8. Content and provenance boundaries

- The figures are schematic placeholders, not anatomy assets.
- No OriGym diagram or protected interaction has been reproduced.
- Course terminology is used for mapping, while learner-facing explanations remain original.
- The unresolved portal mapping for joint actions remains visible in content planning and must be confirmed before publication.

## 9. Owner-review outcome

The owner responded "Looks good" to the first responsive pass. The five review
questions are therefore settled as follows:

1. Retain the laptop lesson rail.
2. Retain the outcome immediately above the interaction.
3. Retain one dominant visual with adjacent controls and feedback on laptop.
4. Keep the visual above choices on mobile for the prototype interactions.
5. Retain the persistent structured-text action.

## 10. Acceptance status

The approved low-fidelity set covers:

- laptop and mobile lesson shells;
- the shared Explore state;
- plane selection and plane-axis feedback;
- squat stage and joint selection;
- structured-text access placement;
- responsive stacking and touch-oriented controls.
- partly correct feedback that preserves the correct part;
- named plane-axis and phase/action misconceptions;
- glossary and sources/mapping overlays that preserve lesson position;
- resumed-lesson state with evidence-recording clarity;
- lesson close with optional confidence and an explainable revision reason; and
- mixed-challenge summary that separates coverage, practice and security.

The joint-action discrepancy is represented as dual metadata: provisional
Module 1 curriculum mapping and a Module 2 PDF source location. Current portal
placement remains a publication check rather than an implementation blocker.

## 11. Next step

Begin Phase 1 implementation using the scope, schema boundary and build order in
`PT_LEARNING_LAB_BUILD_READINESS.md`. Preserve these interaction states as
acceptance fixtures rather than redesigning the learning loop during scaffolding.
