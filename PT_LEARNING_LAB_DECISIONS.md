# PT Learning Lab — Decision Register and Chat Handoff

Last updated: 5 August 2026

This is the concise source of truth for decisions made during the PT Learning Lab planning conversation. A future chat should read this file first, then `PT_LEARNING_LAB_PRODUCT_BLUEPRINT.md`, before proposing or building anything.

The Phase 1 five-lesson vertical slice is implemented locally. The remaining
production/authenticated smoke checks are release work; the frozen build contract is recorded in
`PT_LEARNING_LAB_BUILD_READINESS.md`.

## Product purpose

- Create an independent, self-guided learning and testing companion for the OriGym Level 3 Personal Trainer qualification.
- Cover the entire curriculum.
- Use the clearest learning sequence while making the mapping to OriGym Modules 1–8 immediately visible.
- The working title is **PT Learning Lab**.
- It is not an accredited course provider, tutor system or replica of the OriGym platform.

## Audience and access

- The owner will road-test it thoroughly first.
- It may later be opened to a very small invited learner group.
- No tutor features are required.
- No public registration.
- Passwordless email sign-in is preferred.
- Design an account status from the start so individual accounts can be blocked later, although blocking UI is deferred.
- Keep it free and private initially; no payment features.

## Curriculum and content

- Align specifically with OriGym for now.
- Use the complete curriculum rather than a revision-only subset.
- Follow a strong recommended path, but leave all content unlocked.
- Use short 5–10 minute lessons with optional deeper reference material.
- Show unobtrusive sources and OriGym module/topic mapping on every learning object.
- Distinguish clearly between **For your qualification** and **In current professional practice** when current guidance adds to or differs from static course material.
- Health and nutrition material must stay within Level 3 PT scope and make referral boundaries clear.
- Use original writing, questions, diagrams and illustrations. Original work still requires source-aware copyright review.
- Never reproduce OriGym’s protected quizzes, exam questions, diagrams or interactive lessons.
- Fictional client scenarios must be anonymised composites, never disguised copies of identifiable people.
- Personal consultation records, assessor feedback, certificates, banking/financial material and other identifiable source files are excluded from the publishing pipeline.
- The owner must review and approve every lesson and question before invited learners can see it.
- Content needs source metadata, review dates and version history.

## Learning experience

- The product is interactive, fun and highly visual, but adult rather than childish.
- Use purposeful challenges and satisfying feedback rather than trophies, streak pressure or superficial points.
- Provide Learn, Check, Revise, Mock, Reference and Rehearse modes.
- Include a global glossary and search.
- Include bookmarks and a review queue in the early product; free-form learner notes can come later.
- Include useful teaching calculators with learn/check/reference presentations, without medical or personalised nutrition prescribing.
- Narration and animation can come later.
- A source-grounded AI assistant may come later, not in the first version.
- Gentle reminders may come later.

## Practice and assessment

- Use frequent practice plus full mock assessments.
- Vary question formats: choice, matching, ordering, diagram labels, error spotting, calculations and scenarios.
- Practice gives immediate explanatory feedback.
- Mocks delay feedback until completion.
- Timed mocks are optional; learners can also choose untimed study mocks.
- Current portal parameters recorded on 4 August 2026 were:
  - Anatomy and physiology: 50 questions, 90 minutes, stated pass requirement 45.
  - Nutrition: 40 questions, 90 minutes, stated pass requirement 36.
- Assessment parameters must be versioned and rechecked because they may change.
- Practical preparation uses guided scenarios and checklists without video recording or automated competence claims in the first version.

## Progress and privacy

- Track learning progress only; do not add tutor monitoring or social activity.
- No learner interaction, comments, messaging or leaderboards.
- Do not issue a site certificate.
- Separate curriculum coverage, practice and demonstrated security.
- Generate an automatic but explainable revision queue.
- Learners can see why something is recommended and can override recommendations.
- Include an optional diagnostic; it changes recommendations but never locks content.
- Use minimal, privacy-conscious analytics.
- Learners must be able to export, reset and delete their progress.

## Devices and accessibility

- Design mobile-first, but make laptop use first-class rather than a stretched mobile layout.
- Meet an accessibility baseline from the beginning: keyboard access, focus states, contrast, text alternatives, adequate touch targets and structured-text equivalents for interactive diagrams.
- Do not rely on colour or future animation to communicate meaning.

## Content management and delivery approach

- Use a conventional coded application rather than a no-code platform.
- Provide a simple owner-only content review and editing interface.
- Start on free hosting if practical.
- Build a polished vertical slice before expanding the curriculum.
- Explore and approve wireframes before application code.
- Later technical choices must preserve content versioning, curriculum mapping, invite-only access and account status controls.

## Technical foundation for Phase 1

- Use Next.js App Router with TypeScript.
- Use CSS custom properties and CSS Modules for the Human Movement Studio system.
- Use Neon Postgres through server-only application code and Drizzle migrations.
- Use Neon Auth passwordless email verification codes behind a small application
  adapter; email entry is the learner-facing flow and possession of the inbox
  completes authentication. Managed Better Auth is currently beta, so
  replacement must remain possible.
- Never grant application access from an Auth sign-up alone; only
  owner-created invitation profiles can pass the server authorization gate.
- Keep database credentials out of browser code and enforce role, status and
  record ownership in server-side authorization checks.
- Store role and account status from the first migration.
- Keep curriculum mapping separate from source-container metadata.
- Use immutable published content versions and migration-controlled schema changes.
- Use Cloudflare Workers with the official OpenNext adapter as the preferred
  production target; retain normal Next.js local development and use Netlify
  only for a demonstrated compatibility blocker.
- Use Vitest/Testing Library for component and logic tests and Playwright for responsive end-to-end coverage.
- The detailed schema boundary, route boundary and build sequence are frozen in `PT_LEARNING_LAB_BUILD_READINESS.md`.

## Selected visual direction

- The chosen direction is the original **Human Movement Studio** board: `design/concept-boards/03-human-movement-studio.png`.
- Use warm sand and natural cream surfaces, deep teal structure, muted clay-red movement accents and small sage state cues.
- Use warm humanist sans-serif typography, softly rounded cards, organic but restrained illustration backdrops and approachable staged movement sequences.
- The tone is grounded, inclusive, reassuring, friendly and precise—not clinical, childish or spa-like.
- The Performance Notebook hybrid was explored and rejected. Do not generate another mock-up unless the owner later requests one.

## First prototype

- Start with the anatomy-and-movement vertical slice.
- Use the **squat as the recurring anchor movement**.
- The planned lesson sequence is:
  1. Anatomical position and directional terms.
  2. Planes and axes.
  3. Joint actions.
  4. Recognising actions in exercise.
  5. Mixed movement challenge.
- Introduce other movements only when required to explain something the squat cannot demonstrate clearly.
- The prototype must test original visual teaching, active questions, feedback, glossary links, revision scheduling, OriGym mapping, responsive layouts and owner approval.

## Verified project evidence

- The local folders were inventoried and reconciled against the signed-in OriGym Level 3 course on 4 August 2026.
- The seven substantial local theory books map strongly to portal Modules 1–7.
- Module 8 is assessment-focused and includes two portal exams plus practical guidance.
- Portal-only interactive lessons, assignments, quizzes and guidance should be treated as curriculum-map evidence, not copied as content.
- The practical SCORM activity was not started because doing so might have changed course progress.
- No portal exam was started, no content was submitted and no account state was intentionally changed.
- The local practical material indicates coverage of a cardiovascular training system, four advanced resistance systems and a core exercise with a progression or regression.
- A specific source gap around pyramids remains to be resolved before that practical content is written.
- An initial anonymised scan of the private OriGym Facebook group was completed on 5 August 2026 and is recorded in `PT_LEARNING_LAB_FACEBOOK_GROUP_FINDINGS.md`.
- The most prominent learner difficulties in that pass were programme-card reasoning, advanced training-system differentiation and calculations, and uncertainty about practical-assessment structure.
- The scan strengthens the planned emphasis on original guided programme-building, misconception-aware visual questions and practical rehearsal. It does not supply learner-facing wording, questions or authoritative answers.
- The owner’s ChatGPT project **PT Assessment** is an approved future planning source. It currently contains detailed conversations covering drop sets, forced repetitions, German volume training, matrix training, negatives, pre/post exhaust, pyramids, supersets, tri-sets, LSD, fartlek and interval training.
- Those conversations include OriGym YouTube transcripts followed by structured ChatGPT-generated breakdowns. The OriGym videos are publicly accessible on YouTube; they are not private course materials.
- Before using the breakdowns in learner-facing content, classify claims as transcript-supported, supported by another approved source, ChatGPT interpretation requiring verification, or current professional guidance. Use original wording and visuals rather than reproducing the transcripts or videos.

## Joint-action mapping status

- Use provisional Module 1 curriculum mapping for the prototype.
- Record `Module 2/L3 Module 2.pdf`, pages 5-9, as the primary local source location.
- Preserve the fact that the Module 2 contents page lists Joint Actions while the topic opener labels itself Module 1.
- The local Module 1 book also introduces joint actions on pages 38-40.
- This explicit dual metadata resolves the implementation ambiguity and remains visible in owner review.
- Current signed-in portal placement must still be rechecked before invited-learner publication; the portal session had expired during the final pass.

## Next step

The detailed learning outcomes and interactions for the squat-led anatomy-and-movement prototype are recorded in `PT_LEARNING_LAB_PROTOTYPE_LEARNING_PLAN.md`.

The mobile and laptop wireframes now cover the shared lesson rhythm, primary interactions, partly correct and named-misconception feedback, glossary and mapping overlays, resume, close, explainable revision and challenge summary. Their final decisions are recorded in `PT_LEARNING_LAB_WIREFRAME_DECISIONS.md`.

The owner approved the core wireframe hierarchy and authorised implementation.
Foundation steps 1 and 2 are complete. The typed Next.js application, Human
Movement Studio tokens, validated prototype metadata, live Neon/Drizzle schema,
passwordless email authentication route, profile authorization boundary and test
harnesses now live in `web/`. Access to protected routes requires both Neon
Auth and an application profile with an allowed account status.

Implementation step 3 is complete. The versioned content package and Neon seed
cover the five lessons, 31 learning objects, 26 questions, 25 glossary terms,
nine named misconception paths and source metadata for every authored target.
All content remains draft and the authoritative live check reports zero
published lessons.

Current milestone: Lesson 1, Anatomical position and directional terms, is now
fully authored as the content-quality template. Its reference-position lab,
five-pair directional comparison builder, squat transfer and expanded checks
remain draft-only pending owner approval.

Implementation step 4 is complete. The live Neon-backed lesson route now uses a
shared responsive shell with the approved laptop rail, mobile progress treatment,
outcome placement, structured-text disclosure, keyboard-reachable navigation,
owner draft labelling and content mapping. Signed-in laptop and 390 px phone
checks passed without browser runtime errors.

Implementation step 5 is complete. The plane explorer synchronises one plane,
its perpendicular axis, body division and representative movement; its pairing
check supports untouched, selected, correct, partly-correct, misconception and
retry states. The squat sequence keeps explicit standing/lower/return and
hip/knee/ankle controls, provides joint-and-phase-specific feedback, preserves
the approved ankle-return wording and identifies muscle-action substitution as
a named misconception. Both work without dragging and stack to one current
stage on mobile.

Implementation step 6 is complete. Progress and attempts are stored in Neon;
resume restores the exact evidence-recording check and selected answer; lesson
close records coverage separately from security; and the explainable review
queue supports revisit, reschedule and remove overrides. Signed-in local checks
and authoritative Neon reads passed without publishing any draft content.

Implementation step 7 is complete. The owner-only review inventory shows each
lesson version, source coverage, latest decision and any mapping uncertainty;
preview does not change content state. The server enforces separate review,
approval and publication transitions, including written rationale, complete
source coverage, explicit mapping acknowledgement and a prior approval
decision. The controls were not exercised against the five drafts, and Neon
still reports zero published lessons.

Implementation step 8 is locally complete. The test suite now covers keyboard
operation, structured-text presence, workflow gates and destructive-data
confirmation; unauthenticated Playwright checks run at laptop and phone sizes;
signed-in owner routes were checked responsively against live Neon; and the
optimized production build passes. Authenticated learners can export their own
learning data, reset progress while retaining bookmarks, or delete all learning
data after exact typed confirmation. The destructive actions were not exercised
against the owner account.

The next release step is a first private deployment plus smoke testing with a
separate invited learner account. Keep all five lessons draft during deployment
validation; publication remains a later explicit owner review decision.

Implementation step 9 is locally complete. The Learn home leads with Continue
learning, Today’s revision and a progress summary; all five lessons have
reusable explore/apply interactions; Joint Actions preserves correct joints
during targeted retry; and meaningful lesson position is persisted without
overwriting submitted evidence. OpenNext, Wrangler and static asset caching
configuration are committed. The Cloudflare build passes after removing the
redundant Node-only auth proxy; route-level server authorization remains the
protected-content boundary.
