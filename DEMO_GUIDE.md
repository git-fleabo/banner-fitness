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
