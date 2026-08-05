# PT Learning Lab - Phase 1 Build Readiness

Status: approved to begin the anatomy-and-movement vertical slice

Date: 5 August 2026

This document freezes the minimum product, interaction, content and technical
contract required to start Phase 1. It does not approve learner-facing content
for publication and it does not expand the first build beyond the five-lesson
prototype.

## 1. Go decision

Phase 0 is complete enough to begin implementation.

The owner approved the first wireframe hierarchy with "Looks good" and then
asked to complete the final pre-build pass without waiting for further
permission. The following are therefore treated as approved for the vertical
slice:

- the laptop lesson rail;
- the outcome placement above the interaction;
- one dominant visual with adjacent controls and feedback on laptop;
- visual-first stacking on mobile;
- a persistent structured-text action;
- the Human Movement Studio visual direction; and
- the five-lesson squat-led learning sequence.

Approval here covers the experience contract. Individual lessons, questions,
sources and visuals still require owner approval before another learner can see
them.

## 2. Final interaction-state contract

The build must support these states without losing the learner's lesson
position:

1. **Explore:** untouched, focused, selected and submitted states remain
   distinct. An unscored prediction does not create practice evidence.
2. **Correct:** explain why the answer works and offer the next action. Never
   label one successful response as Secure.
3. **Partly correct:** preserve the correct part, identify the unresolved part
   and ask only for the smallest useful retry.
4. **Named misconception:** name the reasoning pattern, explain it and offer a
   targeted retry. Do not merely reveal the answer.
5. **Glossary overlay:** open above the lesson, retain selections and return
   focus to the invoking control when closed.
6. **Sources and mapping overlay:** show qualification topic, source location,
   review state and any mapping uncertainty without leaving the lesson.
7. **Structured text:** present an equivalent relationship or sequence, not a
   decorative image caption.
8. **Resume:** restore the exact step and selections; state clearly whether an
   answer had been submitted and whether evidence was recorded.
9. **Lesson close:** summarise the outcome, ask for optional confidence and
   explain the next recommendation.
10. **Revision reason:** identify the evidence that created the recommendation
    and allow the learner to remove, reschedule or override it.
11. **Challenge summary:** separate coverage, first-attempt practice and later
    demonstrated security; show the smallest useful next action.

On phone, the order remains visual, controls, feedback, then actions. On laptop,
the visual and controls may sit side by side. Dragging, colour perception and
animation are never required to complete an interaction.

## 3. Joint-action mapping decision

The discrepancy is handled as explicit dual metadata rather than silently
choosing one source label.

- **Prototype curriculum mapping:** provisional OriGym Module 1,
  `Introduction to Level 3 Personal Training`.
- **Primary local source location:** `Module 2/L3 Module 2.pdf`, pages 5-9.
- **Evidence:** the Module 2 contents page lists `Joint Actions`; the joint-action
  opener on page 5 labels itself `MODULE 1`; the general definitions continue
  through page 9. The Module 1 book also introduces joint actions in its
  synovial-joint coverage on pages 38-40.
- **Implementation rule:** store curriculum mapping and source-container
  location separately and show the discrepancy in the owner review view.
- **Publication rule:** recheck the signed-in portal placement before any
  invited learner sees this lesson. The portal session had expired during this
  pass, so current placement was not claimed as reverified.

This is no longer a build blocker because uncertainty is represented in the
model. It remains a learner-publication gate.

## 4. Technical foundation

### Application

- Next.js App Router with TypeScript.
- React client components only where an interaction needs browser state;
  lesson shells and read-only content default to server components.
- CSS custom properties plus CSS Modules for the Human Movement Studio design
  tokens and component styles.
- Semantic HTML first; SVG only for original diagrams that need scalable visual
  relationships.

### Data, authentication and permissions

- Neon Postgres, accessed only from server-side application code through the
  Neon serverless driver and Drizzle.
- Neon Auth Google OAuth for the first vertical slice, with access still gated
  by an owner-created profile. The local magic-link route is disabled because
  Neon verified the link on its Auth domain without transferring the session
  cookie to the application origin, and the live Magic Link plugin is disabled.
  The application auth adapter explicitly uses `SameSite=Lax` for its signed
  session-challenge cookies so top-level Google/Neon callbacks can complete
  without enabling cross-site subrequests.
- Owner-created invitations only.
- Neon Managed Better Auth is currently beta. Authentication stays behind a
  small application adapter so it can be replaced without changing lesson or
  progress contracts.
- A profile has `role` (`owner` or `learner`) and `status` (`invited`, `active`
  or `blocked`) from the first migration.
- Learners can read only published content and their own progress records.
- The owner can review content; publication requires an owner action.
- Database credentials never enter browser code. Every write passes through a
  server-side authorization boundary that verifies session, role, account
  status and record ownership.

### Delivery and quality

- Vercel is the initial deployment target; the application remains a normal
  Next.js project so hosting can change later.
- Drizzle schema, migrations and generated migration metadata are committed.
- Vitest and Testing Library cover content and interaction logic.
- Playwright covers the complete phone and laptop lesson route.
- Automated accessibility checks supplement keyboard and screen-reader-minded
  manual review.
- No advertising analytics or third-party session replay in the vertical
  slice.

## 5. Minimum content and progress model

The first schema must preserve these concepts even if some owner tooling arrives
later:

- `profiles`: role, account status and minimal display data;
- `curriculum_topics`: recommended sequence plus OriGym module mapping;
- `lessons` and immutable `lesson_versions`;
- `learning_objects` and immutable `learning_object_versions` for explains,
  explores, visuals and structured-text alternatives;
- `questions` and immutable `question_versions`;
- `glossary_terms` and versioned definitions;
- `source_records` and `source_links`, kept separate from curriculum mappings;
- `review_decisions`: draft, in review, approved, published or retired;
- `lesson_progress`: last position, coverage state and completion timestamps;
- `practice_attempts`: response, feedback category and misconception code;
- `review_queue`: reason, source evidence, due date and learner override; and
- `bookmarks`.

Published versions are never edited in place. Corrections create a new version,
preserving which version a learner encountered. Source records include title,
location or URL, page/range where relevant, retrieved/reviewed dates, source
type and rights/privacy status.

## 6. Initial route boundary

Phase 1 may create only the routes needed to prove the complete loop:

- sign-in and authentication callback;
- Learn home with recommended path and OriGym mapping;
- one reusable lesson route serving the five prototype lessons;
- glossary/search sufficient for prototype terms;
- review queue and progress summary;
- owner review list and lesson preview; and
- account progress export/reset/delete actions, which may begin as owner-tested
  functional controls rather than polished settings screens.

No public registration, payment, tutor dashboard, social feature, certificate,
AI assistant, narration, learner notes, full calculator suite or full Owner
Studio editor belongs in this slice.

## 7. Build sequence

1. **Complete (5 August 2026):** scaffold the typed application, design tokens,
   validation and test harness.
2. **Complete (5 August 2026):** add the live Neon/Drizzle schema and migrations,
   invite-only passwordless authentication, and server-side role, status and
   record-ownership enforcement.
3. **Complete (5 August 2026):** implement the versioned content contract and
   seed the five draft lessons, learning objects, questions, glossary and source
   links without publishing them.
4. **Complete (5 August 2026):** build the shared responsive lesson shell and
   accessibility primitives, including laptop rail, mobile progress treatment,
   structured-text disclosure and keyboard-reachable step navigation.
5. **Complete (5 August 2026):** build planes-and-axes and squat joint-action
   interactions, including selected, submitted, correct, partly-correct,
   named-misconception, retry, overlay and responsive states.
6. **Complete (5 August 2026):** add progress, evidence-recording attempts,
   exact-step-and-selection resume, lesson close, and an explainable review
   queue with learner reschedule and remove controls.
7. **Complete (5 August 2026):** add owner-only review inventory, lesson
   preview, recorded draft-to-review-to-approval workflow and publication
   gating for source completeness, rationale, mapping acknowledgement and a
   prior approval decision.
8. **Local pre-deployment validation complete (5 August 2026):** validate
   keyboard use, structured-text coverage, phone/laptop layouts,
   unauthenticated and owner authorization boundaries, account data controls
   and production builds. A deployed invited-learner smoke test remains a
   release check rather than a local build task.

## 8. Deferred decisions that do not block Phase 1

- the full Owner Studio editing experience;
- glossary and calculator scope beyond the prototype;
- practical-assessment content and advanced-system verification;
- final email provider and branded authentication templates;
- animation, narration, notes, reminders and source-grounded AI; and
- any invited pilot beyond the owner.

The next action is implementation step 7. The live Neon `main` branch contains
the three tracked migrations, the required content and progress tables, and
published-version protection triggers. Neon Auth Google OAuth is configured and
application access remains invitation-only. The first owner Auth user is linked
to Google, its matching application profile is `owner`/`active`, and the
signed-in `/learn` flow has been verified locally against live Neon Auth and
Postgres. Neon also contains five draft lesson versions, 31 draft learning-object
versions, 24 draft question versions, 25 draft glossary versions and 85 source
links; it contains zero published lessons. The idempotent seed and authoritative
inventory check live under `web/scripts/`. Deployment authentication is not yet
claimed. The reusable `/learn/[slug]` shell has been verified through the signed-in
owner route against live Neon at laptop and 390 px phone widths; no browser
runtime errors were observed. Phase 1 must remain a polished vertical slice
rather than an early whole-curriculum build. The two demanding interactions
have also been verified through the signed-in route: all plane-axis pairs,
stage-and-joint squat controls, correct/partly-correct/misconception feedback,
retry, structured text and phone stacking are present without drag dependence.
The learning-evidence loop has now also been verified through the signed-in
owner route and authoritative Neon reads: a completed lesson remains `covered`
rather than secure, an in-progress lesson restores its exact check and selected
answer with the prior evidence state stated explicitly, and queued review
recommendations expose their recorded reason plus working reschedule and remove
overrides. No draft content has been approved or published.
The owner review route now reports source coverage for every lesson, learning
object and question; exposes the joint-action mapping uncertainty; and keeps
preview, approval and publication as separate actions. Server-side transition
rules and unit tests prevent direct draft publication and require explicit
mapping acknowledgement where applicable. The signed-in owner route passed at
laptop and 390 px phone widths, while a fresh authoritative Neon inventory still
reports five drafts and zero published lessons. The state-changing approval and
publication controls were intentionally not exercised against those drafts.
The planned account-data boundary is also present: an authenticated learner can
export their own progress, attempts, reviews and bookmarks; reset progress while
keeping bookmarks; or delete all learning data while retaining the invited
sign-in profile. Both destructive paths require exact typed confirmations and
scope every deletion to the active account. The export returned successfully in
the signed-in owner route; reset and delete were intentionally not exercised.

The local pre-deployment pass now covers 23 unit/component tests, two Playwright
projects (laptop and phone) for the unauthenticated route with automated
serious/critical accessibility and overflow checks, signed-in owner checks at
laptop and phone widths, explicit keyboard focus/Enter operation, live Neon
inventory checks and a clean optimized production build. The remaining release
boundary is a first private deployment followed by authentication and data
ownership smoke tests using a separate invited learner account. That deployment
does not require publishing the five draft lessons.

## 9. Technical decision evidence

Reviewed 5 August 2026:

- [Next.js App Router documentation](https://nextjs.org/docs/app)
- [Next.js installation and TypeScript defaults](https://nextjs.org/docs/app/getting-started/installation)
- [Next.js deployment options](https://nextjs.org/docs/app/getting-started/deploying)
- [Neon Next.js guide](https://neon.com/docs/guides/nextjs)
- [Neon Auth Next.js API-only quick start](https://neon.com/docs/auth/quick-start/nextjs-api-only)
- [Neon serverless driver](https://neon.com/docs/serverless/serverless-driver)

These sources confirm the chosen framework's current App Router and TypeScript
path, normal Node deployment support, Neon serverless Postgres access and the
current Neon Auth integration path. Neon Managed Better Auth is documented as
beta. These sources do not replace project-specific authorization, privacy or
deployment testing. The local magic-link loop was diagnosed from the generated
email destination, live Auth session rows and the absence of an application
session cookie after redirect.
