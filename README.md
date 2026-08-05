# PT Learning Lab

PT Learning Lab is a private, self-guided learning companion for the OriGym
Level 3 Personal Trainer programme. The first product slice is a polished,
squat-led anatomy and movement experience.

## Current stage

Phase 1 implementation has started with the typed application foundation in
`web/`: Human Movement Studio design tokens, a responsive prototype overview,
validated five-lesson metadata, server-only Neon/Auth adapters and unit/E2E test
harnesses. No live database or authentication project is connected yet.

The product decisions, curriculum plan, research findings, wireframe decisions
and frozen technical contract are recorded in the `PT_LEARNING_LAB_*.md`
documents.

## Repository contents

- Product, curriculum, research, and design decision records
- Human Movement Studio concept boards
- Reviewed reference-source manifests and approved source files
- Next.js application source and tests in `web/`

## Local application

From `web/`, copy `.env.example` to `.env.local` only when connecting a Neon
project. The current foundation builds without secrets.

- `pnpm dev` — run the local application
- `pnpm typecheck` — check TypeScript contracts
- `pnpm lint` — run ESLint
- `pnpm test` — run Vitest unit/component tests
- `pnpm build` — create the production build
- `pnpm test:e2e` — run phone and laptop Playwright checks once Chromium is installed

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
