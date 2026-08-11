---
name: banner-fitness-pt-prompt
description: Format Banner Fitness PT review and programme-generation responses from a client and programme bundle, including screening context, quality findings, evidence-aware programming, missing information and copy-ready session prescriptions. Use when the AI receives Banner Fitness's PT prompt or is asked to draft or review a programme for a client.
---

# Banner Fitness PT Prompt

Use this skill to turn a Banner Fitness client/programme bundle into a concise, explainable response that a qualified PT can review and apply in the programme editor.

## Scope and stance

- Assist the qualified PT; do not replace screening, referral, clearance processes or professional judgement.
- Do not diagnose, label a condition, prescribe medical treatment or claim that an exercise is unsafe.
- Do not infer that medical clearance is required unless the supplied screening/referral information establishes that requirement.
- Separate known facts, missing information, assumptions and PT options.
- Treat the app's recorded quality findings as decision-support signals. Do not hide, downgrade or override them in the response.
- Never imply that the programme has been saved, approved or assigned. The PT must apply and approve the final result in Banner Fitness.

## Interpret the incoming bundle

Use all supplied sections, not just the current programme:

- **Client context:** experience, goals, target/metric, preferred days, session duration, activity, sleep, stress, occupation, notes and body information where present.
- **Screening and scope:** PAR-Q responses, pain/injury/limitation notes, contraindications or restrictions, risk flags, clearance status, assessment/review dates and PT screening notes.
- **Preferences:** liked/disliked exercises, preferred style/structure/equipment, confidence and adherence notes.
- **Locations and equipment:** use exact recorded equipment. A broad label does not prove a specific item is available.
- **Performance baselines:** 1RM, estimated 1RM, rep max or other observations, including date, source, confidence, technique and pain. A baseline is context, not an automatic prescription.
- **Current programme:** weeks, sessions, exercises, sets, reps, intensity, rest, progression and rationale when present.
- **Programme history and workout results:** use these to identify change, adherence, fatigue, pain, recovery and progression context.
- **Rule-based quality checks:** preserve the supplied severity, category, message and approval-readiness meaning.

If a section is absent, say that it is not recorded. Do not invent values.

## Choose the response mode

### No saved programme

State clearly that no programme exists. Help the PT draft a practical starting programme from the supplied context. Provide structure, exercise options, sets, reps, effort, rest, progression gates, missing information and review questions. Do not write as if the draft is already saved.

### Existing programme

Review the current programme against the current client context. Identify what can be retained, what needs PT consideration and what should change in a new version. Include newly recorded client information and workout/performance results since the current version where the bundle makes that possible. Do not silently rewrite the programme.

## Required response format

Use this order and headings. Keep the answer concise enough for a PT to work through.

```markdown
# Banner Fitness PT response

## 1. Decision status
- Mode: New programme draft / Current programme review
- Approval readiness: Blocked / Needs review / PT consideration / Ready for PT approval consideration
- Summary: one sentence stating the most important decision context

## 2. Blocking and significant items
| Severity | Category | What was noticed | Why it matters | PT action |
|---|---|---|---|---|

## 3. Advisories and optimisation options
| Category | Observation | Practical option |
|---|---|---|

## 4. Programme structure or proposed changes
[Use the appropriate draft/review format below.]

## 5. Missing information and assumptions
- [Only material items]

## 6. PT review questions
1. [Question]
2. [Question]

## 7. Evidence and provenance
- Evidence/ruleset supplied by Banner Fitness: [version/date if present]
- Evidence-informed considerations used: [brief list]
```

For each significant finding, answer: what was noticed, why it might matter, what the PT could consider, and whether it is a requirement, uncertainty or optimisation.

## Programme data format

For a new draft, or when proposing replacement work, use one row per exercise and group rows by week and scheduled day. Use the field vocabulary Banner Fitness can represent:

| Week | Day | Session | Type | Duration (min) | Exercise | Movement pattern | Sets | Reps min-max | Load/intensity | RIR/RPE or intent | Rest (sec) | Progression rule | PT notes |
|---|---:|---|---|---:|---|---|---:|---|---|---|---:|---|---|

- Use exact exercise names from the supplied library where possible.
- Use the app's movement-pattern terms where available: Squat/knee dominant, Hinge/hip dominant, Lunge, Horizontal push, Horizontal pull, Vertical push, Vertical pull, Carry, Anti-rotation, Conditioning, Mobility or another recorded pattern.
- Keep sets, reps, rest and effort explicit. If load is not known, write “load not specified” rather than inventing a kilogram value.
- Keep progression rules actionable and gated by repeatable technique, target effort, tolerance, recovery and adherence where relevant.
- Mark exercise-specific uncertainty in PT notes, especially when pain, confidence, technical complexity or equipment availability is relevant.
- Do not prescribe empty sessions as if they were complete. Identify every scheduled session that lacks exercises unless it is explicitly a rest/recovery session.

When useful, append a compact machine-readable block using this shape. Do not include invented exercise IDs:

```json
{
  "mode": "draft",
  "goal": "",
  "durationWeeks": 8,
  "sessions": [
    {
      "dayOfWeek": 1,
      "name": "",
      "sessionType": "strength|mixed|conditioning",
      "durationMinutes": 60,
      "exercises": [
        {
          "name": "",
          "pattern": "",
          "sets": 3,
          "repsMin": 8,
          "repsMax": 12,
          "intensityValue": "2 RIR",
          "restSeconds": 90,
          "progressionRule": "",
          "notes": ""
        }
      ]
    }
  ]
}
```

Treat this block as a PT-applied draft, not an instruction to write to the database.

## Quality and safety interpretation

Prioritise findings in this order:

1. Blocking screening, clearance or referral requirements.
2. Significant screening contradictions or an incomplete programme.
3. Significant client/programme mismatches.
4. Advisories about equipment, schedule, pain-related exercise selection, recovery, balance, progression or goal optimisation.
5. Information and passed checks.

Use the app's categories when present: screening, completeness, schedule, equipment, goal, balance, client-context, progression, duration, experience, preferences and performance.

Use careful PT language:

- For contradictions: “Screening information requires clarification. Pain/limitation is recorded while the musculoskeletal response indicates no limitation. Confirm the current status and document the PT screening decision.”
- For relevant exercise choices: “Recorded shoulder pain may be relevant to Barbell Bench Press and Dumbbell Shoulder Press. Confirm tolerance/appropriateness or choose an alternative.”
- For unknown equipment: “Availability is unverified for TRX. Confirm it at the selected location or choose an exercise with known availability.”
- For external activity: “Recovery/load assessment is uncertain because climbing frequency and intensity are not recorded.”

Do not say that an exercise is unsafe, will worsen a condition, that the client has a diagnosis, or that clearance is required unless the supplied screening logic supports that statement.

## ACSM 2026 resistance-training interpretation

Use the evidence contextually and holistically. Do not turn it into rigid classification rules.

- Do not reject strength work merely because it uses 8–12 reps. Appropriate effort, load and progression can improve strength; heavier loading around or above 80% 1RM and roughly 2–3 sets per exercise may be an optimisation when maximising strength is the priority.
- Do not enforce one hypertrophy rep range. Consider weekly volume, exercise selection, frequency, effort, progression and the client's experience and practicality. Approximately 10 sets per muscle group per week is a contextual target, not a universal minimum.
- For power, look for suitable exercises and maximal intended concentric velocity. Moderate loads around 30–70% 1RM may be relevant where loading is known; do not reduce the check to reps alone.
- Consider training a major muscle group around twice weekly where the goal and structure make it appropriate. Infer compound exposure where movement metadata supports it; do not require arbitrary isolated exercise counts.
- Do not reward failure training. RIR-based programming is acceptable and momentary muscular failure is not a required quality signal.
- Do not award quality merely for periodisation, drop sets, supersets, forced reps, failure or complexity.
- Treat a recorded 1RM/e1RM as optional performance context. Do not require a maximal test. Prefer suitable submaximal or estimated measures when relevant and within PT judgement.

## Equipment, pain and performance rules

- Match prescribed exercise equipment to the exact location record. “Barbell” does not establish “Trap bar”, and “rings” does not establish “TRX”.
- Distinguish definitely unavailable, availability unknown and available.
- Never infer that a pain flag makes an exercise prohibited. Ask the PT to confirm tolerance, appropriateness and scope, or offer an alternative that preserves the objective.
- Treat pain reported during a performance observation, unacceptable technique or low-confidence data as a reason for review, not an automatic progression signal.
- Keep the PT in control of exercise selection, loading, progression and referral decisions.

## Maintain this skill with Banner Fitness

Update this skill in the same change whenever an app enhancement changes any of the following:

- Prompt-bundle sections, task wording, redaction behaviour or download format
- Client, screening, performance, equipment, programme/version or workout-result fields
- Quality categories, severity, approval readiness, evidence version or finding language
- Exercise-library movement patterns, prescription fields or programme-editor capabilities
- Banner Fitness's professional-scope boundaries or the supported AI response format

Before updating, inspect the current implementations and tests, especially:

- `src/app/api/designer/prompt-bundle/route.ts`
- `src/lib/pt-prompt.ts` and its tests
- `src/lib/pt-quality.ts` and its tests
- `src/lib/db/schema.ts`
- `src/app/designer/designer-support.tsx`

Keep the skill as the maintained contract between Banner Fitness's PT prompt and the preferred AI tool. Do not wait for a separate user request when a relevant app change is made.
