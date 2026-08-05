# PT Learning Lab — Decision Register and Chat Handoff

Last updated: 5 August 2026

This is the concise source of truth for decisions made during the PT Learning Lab planning conversation. A future chat should read this file first, then `PT_LEARNING_LAB_PRODUCT_BLUEPRINT.md`, before proposing or building anything.

No application has been built yet. The current artifacts are research, planning documents and visual concept boards only.

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

## Next planning step

The detailed learning outcomes and interactions for the squat-led anatomy-and-movement prototype are recorded in `PT_LEARNING_LAB_PROTOTYPE_LEARNING_PLAN.md`.

The first low-fidelity mobile and laptop wireframes for the shared lesson rhythm, planes-and-axes explorer and squat joint-action sequence have now been produced. Their decisions and review questions are recorded in `PT_LEARNING_LAB_WIREFRAME_DECISIONS.md`.

Next, review and revise this first pass, then wireframe the remaining feedback, glossary, mapping, resume and close states. Do not begin application code until the prototype wireframes have been reviewed and approved as a set.

Before learner-facing publication, confirm the current OriGym portal mapping for the joint-action topic: the local joint-action pages are stored in the Module 2 PDF but label themselves as Module 1.
