# PT Learning Lab

PT Learning Lab is a private, self-guided learning companion for the OriGym
Level 3 Personal Trainer programme. The first product slice is a polished,
squat-led anatomy and movement experience.

## Current stage

Phase 1 implementation now includes the typed application foundation and live
data/authentication boundary in `web/`: Human Movement Studio design tokens, a
responsive prototype overview, validated five-lesson metadata, a versioned
Neon/Drizzle schema, invitation-only Google OAuth authentication, server-side
profile authorization and unit/E2E test harnesses.

The product decisions, curriculum plan, research findings, wireframe decisions
and frozen technical contract are recorded in the `PT_LEARNING_LAB_*.md`
documents.

## Repository contents

- Product, curriculum, research, and design decision records
- Human Movement Studio concept boards
- Reviewed reference-source manifests and approved source files
- Next.js application source and tests in `web/`

## Local application

From `web/`, copy `.env.example` to `.env.local` and supply the server-only Neon
values before running database, authentication or production-build commands.

- `npm run dev` — run the local application
- `npm run typecheck` — check TypeScript contracts
- `npm run lint` — run ESLint
- `npm test` — run Vitest unit/component tests
- `npm run build` — create the production build
- `npm run cf-build` — validate the Cloudflare OpenNext bundle
- `npm run db:check` — validate the tracked migration history
- `npm run db:migrate` — apply unapplied migrations to `DATABASE_URL`
- `./node_modules/.bin/playwright test` — run phone and laptop Playwright checks once Chromium is installed

## Source-material policy

The wider working folder contains OriGym course resources, duplicate downloads,
and private assessment records. Those folders are deliberately excluded from
Git by default.

Original source documents may be added to `references/` only after review. Each
included file should be necessary for development, suitable for storage in a
private repository, free of learner/client-identifiable information, and listed
in the reference manifest with its source and permitted use. Public YouTube
material should normally be recorded as a URL and provenance note rather than
downloaded into the repository.

Never commit certificates, assessor feedback, personal reports, completed
programme cards, consultations, consent forms, health information, exported
account archives, or other identifiable learner/client records.
