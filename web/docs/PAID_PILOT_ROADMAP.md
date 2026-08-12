# Banner Fitness paid pilot roadmap

## Product position

Banner Fitness should be sold first as an evidence-aware programme design and quality-control workspace for newly qualified PTs. It should help a PT capture the right client context, notice omissions and contradictions, build an explainable programme and retain an auditable review trail.

It should not initially compete with broad coaching platforms on payments, nutrition, video calls or white-label client apps. Those are later expansion areas, not the reason to join the pilot.

## Suggested offer

- Founding pilot: £7.99/month or £79/year for the first 10–20 PTs.
- Solo launch: £9.99/month or £99/year, with a practical active-client limit such as 10.
- Higher tier later: £19.99/month or £199/year only after client access, check-ins, messaging and reminders are available.
- Free entry: one sample client or one active client so a PT can experience the workflow before paying.

These are starting hypotheses. The pilot should measure willingness to pay, not assume that a low price creates demand.

## P0 — required before charging broadly

1. Self-serve PT onboarding or a reliable invitation/provisioning flow.
2. A guided first-client path with sample data, starter templates and clear next actions.
3. Functional workspace search; no visual-only search field or unexplained menu dots.
4. A dynamic dashboard date and an action queue for unresolved screening, overdue reviews and programmes awaiting approval.
5. A client timeline covering assessment, notes, programme versions, quality reviews, performance baselines and workout results.
6. Privacy, retention, export/delete, access-control, backup and incident-response documentation suitable for handling client health information.
7. A short in-app explanation of what Banner Fitness does and does not decide for the PT.
8. A multi-client command centre with search, status views, review queues, no-recent-activity views, programme state and missing-context signals.
9. Exact equipment confirmation language: confirmed available, not confirmed and unknown must remain distinct in the PT workflow.

### P0 readiness audit — 11 August 2026

This is a repository and deployed-application capability audit. It does not claim a signed-in visual smoke test of every PT workflow.

| P0 item | Status | Evidence / remaining work |
| --- | --- | --- |
| PT onboarding or invitation/provisioning | Partial | Invited profiles can activate on first sign-in and owner-scoped access is enforced. There is no self-serve PT invitation/provisioning screen yet. |
| Guided first-client path | Partial | The zero-client guide, starter programme templates and three-step client onboarding exist. Neutral sample data is still needed; the current case-study seed is explicitly test data. |
| Functional workspace search | Ready for smoke test | Header search resolves client/programme names; the client roster and programme list also have working filters. |
| Dashboard date and action queue | Implemented — smoke test needed | The date is dynamic and the queue now includes missing screening, overdue reviews, draft programmes and non-ready programme quality results. |
| Client timeline | Implemented — smoke test needed | Assessment, profile, goals, locations, preferences, programme versions/events, quality-review snapshots, performance baselines and workouts are present. |
| Privacy, retention, export/delete, access control, backup and incident response | Implemented in product; operator sign-off outstanding | Owner-scoped JSON client export, confirmed destructive deletion, access-control notes and an operating governance document are present. Retention choice, Neon backup/restore confirmation, incident contacts and separate-account tests still require operator sign-off. |
| Explanation of Banner Fitness’s scope | Ready for smoke test | Onboarding, screening and quality-review language explains that the app supports qualified-PT decisions and does not diagnose or replace clearance/referral processes. |
| Multi-client command centre | Ready for smoke test | Roster search, client/status filters, needs-attention, no-recent-activity, draft/no-programme views, next-session data and missing-context signals are implemented. |
| Equipment confirmation language | Implemented — smoke test needed | The UI distinguishes “Confirmed available here”, “Not confirmed at this location” and “Unknown — no location has been saved yet”; the quality engine continues to distinguish available, unknown and unavailable. |

#### P0 completion checklist

- [ ] Add reliable PT invitation/provisioning or self-serve onboarding.
- [ ] Add a neutral sample client/workflow for first-use guidance; keep case-study fixtures test-only.
- [x] Add quality readiness, incomplete-programme and equipment findings to the dashboard action queue.
- [x] Add explicit quality-review entries to the client timeline.
- [x] Define and publish PT-client privacy, retention, export/delete, access-control, backup and incident-response procedures.
- [x] Expose confirmed, not confirmed and unknown equipment states distinctly in the PT workflow.
- [ ] Run signed-in desktop and mobile smoke tests for search, command-centre filters, onboarding, timeline, quality review and destructive-data controls.

## P1 — the paid-pilot value loop

1. Programme templates for beginner full-body, home gym, minimal equipment, general strength, hypertrophy and conditioning, including persistent PT-created templates that can be named, reused and removed safely. **Programme Library implemented with a seeded catalogue, search/filter, preview, duplicate, full session editing and apply-to-client draft flow.**
   - The library is separate from client-specific programme versions. Applying a template now selects a client, opens the editable sessions against that client context and saves a new client-specific draft that triggers the normal contextual quality review.
2. A polished programme-builder loop: copy/duplicate sessions and blocks, map sessions to preferred days, edit prescriptions in place, and preview the resulting week before saving a new version. **Implemented — ready for signed-in smoke test.** The editor now copies a session across scheduled days, applies the change across the saved block when a new version is created, and shows an explicit week review before persistence; historical versions remain separate.
3. AI response import with schema validation, a diff preview and explicit PT approval before any data is saved. If no programme exists, the prompt should request a complete draft rather than assuming an existing programme.
4. Reassessment and check-in forms for readiness, pain, recovery, adherence, enjoyment and confidence, with changes surfaced in the client timeline and quality review.
5. Client-facing programme view with workout logging, simple check-in response and clear next-session context.
6. Printable/exportable client summary, programme rationale, quality report and version history.
7. Exercise media, cues, substitutions and alternatives that are scoped to the available equipment and client context.
8. Baseline and progression capture for useful measures such as tested or estimated 1RM, rep-max performance, technique confidence and pain-free tolerance, without making testing mandatory for every client.

### Catalogue update — 12 August 2026

- Added 30 reusable programme-library templates covering full-body and intermediate strength, established-framework adaptations, upper/lower and push/pull/legs hypertrophy, home/travel/minimal equipment, suspension/rings, kettlebell, power, concurrent conditioning, running support, climbing support and general fitness contexts. Source links and adaptation boundaries are recorded in `docs/PROGRAMME_LIBRARY_SOURCES.md`.
- Added the dedicated Programme Library surface with goal/search filters, previews, duplication and editor-backed session changes. The existing client-specific Programmes view remains the version-management surface.
- Applied `drizzle/0016_expand_exercise_catalogue_again.sql`, `0017_add_exercise_catalogue_complement.sql` and `0018_complete_exercise_catalogue_double.sql` to the live Neon database. The structured catalogue now reports 170 exercises, including 168 global exercises and the existing owner-scoped custom entries.
- The seed is idempotent and owner-scoped: `pnpm db:seed-programme-library` adds missing library templates for each active owner without overwriting PT-created or previously edited templates.
- The maintained AI contract now explicitly explains how to treat a reusable template as an editable starting point rather than an approved client programme.
- Applying a library template now opens the client-specific editor and maps sessions to the client's preferred days when the frequency matches; a different frequency uses a complete weekday fallback for PT review.
- The narrow desktop sidebar now centres the Banner Fitness logo within its actual box, and the unused workspace collapse glyph has been removed rather than presenting a non-functional control.

## P2 — expansion after evidence of demand

- Client messaging and reminders.
- Calendar, bookings, packages and payments.
- Wearable integrations and richer progress dashboards.
- Team accounts, referral workflows and branded client experiences.
- Evidence update notifications and a maintained ruleset changelog.

## Product recommendations from the commercial-app review

The paid product should stay focused on the complete PT workflow rather than attempting to reproduce every coaching-platform feature:

1. Prioritise the loop of client context → programme builder → quality review → PT approval → workout result → reassessment.
2. Treat programme building, session duplication, multi-week planning, exercise-library search, client roster management, workout history and progress review as the shared category baseline.
3. Make the dashboard useful for a PT managing many clients: filterable views, review queues, inactivity/adherence signals, next-session visibility and direct entry into the client workspace.
4. Keep nutrition, communities, marketing, messaging and technique-video libraries outside the initial paid-pilot scope. They add breadth without strengthening Banner Fitness’s core reason to join.
5. Preserve the current restrained editorial branding, but improve density and spacing at high-use surfaces. The interface should feel like a calm professional record system, not a gamified consumer fitness app.
6. Do not add complexity for its own sake. Advanced methods, periodisation labels and extra configuration should only appear when they help the PT make or explain a decision.

## Pilot success measures

- At least 5 of 10 invited PTs complete onboarding and create a real or redacted test client.
- A first programme can be created and reviewed without assistance in under 20 minutes.
- PTs report that the quality findings catch something they would otherwise have missed.
- At least three PTs use the product again in the following week.
- At least three PTs agree to pay the founding price after the trial.
- No unresolved data-access, export/delete or safety-language issue remains before real client data is encouraged.
