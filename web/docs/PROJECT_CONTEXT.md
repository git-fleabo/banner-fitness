# Banner Fitness project context

Last updated: 12 August 2026

## Product and deployment

Banner Fitness is the owner-scoped PT workspace in this Next.js application. The current deployed preview is [pt-learning-lab.pt-learning-lab.workers.dev/designer](https://pt-learning-lab.pt-learning-lab.workers.dev/designer). Cloudflare deployment and signed-in visual smoke testing remain separate verification steps; a passing local build does not prove the authenticated production workflow.

The application uses Next.js App Router, Neon Postgres through Drizzle, Neon Auth account access, and OpenNext Cloudflare deployment. The user-facing workspace is under `src/app/designer`; the learning-lab prototype remains separate and draft-only.

## Current PT workspace architecture

- `pt_clients` stores the owner-scoped client profile and practical context such as experience, activity, sleep, stress, session duration and preferred days.
- `pt_assessments`, `pt_goals`, `pt_preferences`, `pt_locations` and `pt_client_performance_records` store screening, goals, preferences, training location/equipment and optional performance baselines such as 1RM/e1RM and rep-max observations.
- `pt_programmes`, `pt_programme_weeks`, `pt_sessions` and `pt_exercise_prescriptions` store client-specific programme versions. Saving a new version preserves historical records and refreshes the contextual quality review.
- `pt_programme_templates` stores reusable owner-scoped programme starting points. It is deliberately distinct from client-specific versions.
- `pt_exercises` stores structured global and owner-custom exercises. The API merges global exercises with the signed-in owner's custom entries.
- `src/lib/pt-quality.ts` and `src/lib/pt-quality-server.ts` provide the contextual, dynamic, auditable quality review. Screening contradictions, completeness, schedule, equipment, client context, movement balance and evidence-aware optimisation are separate from syntactic prescription validation.
- `src/lib/pt-prompt.ts`, `/api/designer/prompt-bundle` and `skills/banner-fitness-pt-prompt/SKILL.md` define the AI handoff. The prompt explicitly asks for a complete draft when no programme exists and keeps final application/approval with the PT.

## Programme Library status

The dedicated Programme Library is available from the designer navigation. It currently supports:

- owner-scoped seeded catalogue content;
- search by name, goal or description;
- goal filtering;
- filters for frequency, equipment, experience level and framework type;
- quick views for beginner/minimal equipment, strength/barbell, hypertrophy and sport-support use cases;
- session/exercise count and duration metadata;
- session-level preview;
- duplicate as a separate owner template;
- editor-backed changes to all sessions and prescriptions.
- apply-to-client: choose a client, open the sessions in the client-specific editor, adapt them and save a new draft that runs contextual quality checks.

The current seeded catalogue contains 30 templates:

1. Foundational strength · 2 day
2. Full-body strength · 3 day
3. Upper / lower hypertrophy · 4 day
4. Home dumbbell · 3 day
5. Minimal equipment · 2 day
6. Suspension and rings · 3 day
7. Kettlebell strength and conditioning · 3 day
8. Power foundation · 2 day
9. Climbing support strength · 2 day
10. General fitness circuit · 3 day

The additional 20 templates cover 5×5/linear/tiered/intermediate strength adaptations, beginner express and machine/dumbbell options, full-body and push/pull/legs hypertrophy, upper/lower emphasis, barbell minimalist, bodyweight, travel bands, suspension/rings, concurrent conditioning, running support and field-sport power. Sources and adaptation boundaries are recorded in `docs/PROGRAMME_LIBRARY_SOURCES.md`.

The seed definition is shared in `src/lib/programme-library.ts`; `scripts/seed-programme-library.ts` applies it idempotently to each active owner. It does not overwrite an existing template's sessions or description with the same name, but it backfills the catalogue metadata used by filters. Applying a template maps to recorded preferred days when the session frequency matches; mismatched frequency uses a complete weekday fallback so the PT can review the schedule explicitly.

## Exercise catalogue status

Migrations `drizzle/0016_expand_exercise_catalogue_again.sql`, `0017_add_exercise_catalogue_complement.sql` and `0018_complete_exercise_catalogue_double.sql` add 87 structured exercises across lower body, upper body, kettlebell, power, conditioning, core, TRX and rings. After migration, the live database reported 170 exercises: 168 global catalogue records plus two existing owner-scoped records, effectively doubling the earlier 84-record global catalogue. The migrations use `ON CONFLICT (slug) DO NOTHING` and are safe to re-run through the Drizzle migration ledger.

The exercise library remains metadata-first: movement pattern, muscles, equipment, difficulty, complexity, suitability, tags, alternatives, coaching cues, common errors and caution tags are available to the editor, substitutions and quality checks. Equipment labels must remain exact; a barbell does not imply a trap bar, and rings do not imply TRX.

## Database and seed commands

```bash
pnpm db:check
pnpm db:migrate
pnpm db:seed-programme-library
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm deploy
```

The current database migration ledger includes `0016_expand_exercise_catalogue_again`, `0017_add_exercise_catalogue_complement`, `0018_complete_exercise_catalogue_double` and `0019_programme_template_metadata`. The programme template table now stores explicit experience and framework metadata alongside the reusable sessions; frequency and equipment remain derived from the sessions.

## Verification and handoff boundaries

The current implementation has passed local TypeScript, ESLint (with the repository's existing image optimisation warnings), Vitest and Next production build checks. Live Neon migration and programme-library seeding have been run and verified read-only by count and template name. The current release should still be smoke-tested at the public Cloudflare URL after each deploy; the latest pass covers authenticated navigation to Programme Library, seeded cards, the client chooser and the live desktop logo-centre measurement. The responsive sidebar rule is covered in CSS, but a separate signed-in narrow-viewport visual check is still worthwhile. Duplicate/edit/save-to-client mutations remain separate signed-in smoke-test actions unless explicitly exercised.

Case-study clients remain test fixtures only. Do not present them as onboarding examples for real PTs. Keep professional-scope language: Banner Fitness supports qualified-PT decision-making; it does not diagnose, prescribe medical treatment or bypass PAR-Q, referral or clearance processes.

## Immediate next steps

1. Add archive/status and richer filters (frequency, duration, equipment) once the initial library workflow has been smoke-tested.
2. Exercise duplicate, edit and save-to-client mutations in a disposable signed-in test account, then record the result here.
3. Keep `skills/banner-fitness-pt-prompt/SKILL.md` and its public mirror updated whenever the prompt bundle, programme fields, quality rules, evidence version or library workflow changes.
