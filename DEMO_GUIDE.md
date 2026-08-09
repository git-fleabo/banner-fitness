# PT Learning Lab — Phase 1 demo guide

## Run locally

```bash
cd web
cp .env.example .env.local
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Required server variables are documented in `web/.env.example`. A working
Neon database, Neon Auth email delivery configuration and an owner profile
matching the invited email are required for the signed-in journey. Content
remains draft by default; the owner can preview it without publishing.

## Demonstration route

1. Sign in at `/auth/sign-in` as the invited owner.
2. Open `/learn`; use **Continue learning** and open **Joint actions**.
3. Choose Lower → Knee, deliberately choose Quadriceps contraction, read the
   named misconception, then retry. Use the **Compare the phase** map to make
   one correct and one incorrect selection; the correct selection is preserved.
4. Move to Check, submit an incorrect answer, leave the lesson, return to
   verify the meaningful step and submitted answer resume, then complete it
   with confidence 1–2.
5. Return to `/learn`, open Today’s revision, and complete the varied check.
6. Open `/owner/review`, preview a draft, inspect mapping/source warnings, and
   confirm that learner accounts cannot see unapproved drafts.

## Weak-area discovery acceptance

- Learn shows due revisits, confidence and meaningful coverage state beside each aid.
- Search finds concepts, memory cues and common traps without a hosted search service.
- Filters expose due revisits, low confidence, not started, in progress and covered areas.
- A queued item opens a targeted changed check where an authored variation exists, then clears only after a correct response.
- A lesson closed with confidence 1–2 creates a low-confidence revisit; confidence remains a recommendation signal, not a mastery score.

## Learner-loop acceptance

- Opening any lesson records a step-only position before practice evidence exists.
- Leaving and returning to a lesson resumes that step without inventing a scored
  attempt.
- A submitted check restores its selected answer and evidence state.
- Revisiting a covered lesson keeps it covered and shows the recorded coverage
  summary rather than asking the learner to complete it again.

## Lesson 1 authoring acceptance

- Explore toggles an original front/back reference figure, checks the four defining features of anatomical position and explicitly tests subject-left versus screen-left.
- Apply walks through five directional comparisons covering limb attachment, midline, front/back and body-surface relationships, then transfers the reference into the starting squat stance.
- Check includes named feedback for viewer-left, proximal/higher, anterior/travelling-forward and superficial/visible misconceptions, with retry or glossary guidance.
- The learner-facing wording, visuals and activities are original and all Lesson 1 content remains draft-only until the owner approves publication.

## Lesson 2 authoring acceptance

- Explore lets the learner inspect sagittal, frontal and transverse planes with their body divisions, perpendicular axes and representative movement examples.
- Apply sorts bodyweight squat, lateral raise and standing torso rotation by predominant plane, with retry feedback and an explicit “predominant, not only” close.
- Check covers plane-versus-axis reversal, sagittal-versus-forward language and the misconception that an exercise belongs absolutely to one plane.
- Lesson 2 remains draft-only until the owner approves publication.

## Lesson 3 authoring acceptance

- Explore compares standing, lower and return squat states across hip, knee and ankle, keeping the ankle description as dorsiflexion on descent and movement back towards neutral on return.
- Apply builds a precise sentence from phase, joint and action, with native controls and written structured text as the keyboard-accessible alternative.
- Check distinguishes joint action from muscle action, phase from action and flexion from forward travel, with named misconception feedback.
- Lesson 3 remains draft-only until the owner approves publication.

## Lesson 4 authoring acceptance

- Explore analyses squat descent, elbow-curl lowering, lateral-raise lifting and standing torso rotation with progressively fewer prompts.
- Apply diagnoses explanation quality by checking for phase, named joint or region, action and an observable clue such as angle change or relation to the midline.
- Check includes single-frame evidence, exercise-name and overall-direction traps, with retry or revision guidance.
- Lesson 4 remains draft-only until the owner approves publication.

## Lesson 5 authoring acceptance

- Explore runs a six-step mixed movement case covering viewpoint, directional comparison, predominant plane, perpendicular axis, phase-specific joint actions and explanation repair.
- Apply transfers the method to changed viewpoints, body proportions and movement directions so the learner cannot rely on artwork recognition.
- Check contains six core questions and six variations, with outcome-level feedback and no claim that one attempt creates Secure.
- Lesson 5 remains draft-only until the owner approves publication.

## Validation

```bash
npm run typecheck && npm run lint && npm test && npm run db:check && npm run build
./node_modules/.bin/playwright test
```

## Cloudflare release handoff

The local OpenNext build is verified with `npm run cf-build`. The Worker has
now been uploaded as `pt-learning-lab`; Cloudflare reports version
`482aa86f-ca62-4a4d-8f11-7e397d69afd4` and the hostname
`https://pt-learning-lab.pt-learning-lab.workers.dev`. The deployment record and
three secret changes are present. The public endpoint now serves the private
sign-in page; authenticated production smoke testing still requires an invited
owner and learner check.

When deploying from a fresh machine:

```bash
./node_modules/.bin/wrangler login
./node_modules/.bin/wrangler whoami
npm run deploy
```

If Wrangler reports that a `workers.dev` subdomain is not registered, open
<https://dash.cloudflare.com/> → Workers & Pages → account onboarding and
register an available subdomain once, then rerun `npm run deploy`.

Set `DATABASE_URL`, `NEON_AUTH_BASE_URL` and `NEON_AUTH_COOKIE_SECRET` as Worker
secrets, configure Neon Auth email delivery, run the tracked Drizzle migrations
once against the single Neon project, and verify the email-code owner and
separate invited learner journeys. Do not use a
temporary deployment, enable a paid plan, publish drafts, or add R2/KV/D1.
