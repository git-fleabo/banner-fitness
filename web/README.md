# PT Learning Lab application

This is the Next.js App Router application for the private PT Learning Lab.
The current implementation contains the draft-only five-topic anatomy-and-
movement revision library, shared lesson engine, interactive checks, meaningful
progress and resume state, weak-area discovery, targeted revision, owner review
gates, and Cloudflare Workers deployment configuration. It is a revision
companion, not a replacement course.

## Environment

Before database, authentication, development-server or production-build work,
copy `.env.example` to `.env.local` and supply:

- `DATABASE_URL`: server-only Neon Postgres connection string;
- `NEON_AUTH_BASE_URL`: the Neon Auth endpoint; and
- `NEON_AUTH_COOKIE_SECRET`: a random secret of at least 32 characters.

Never prefix these variables with `NEXT_PUBLIC_`.

## Commands

```bash
pnpm dev
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm db:check
pnpm db:migrate
pnpm test:e2e
```

The E2E suite expects a locally installed Playwright Chromium browser. The live
Neon schema and authentication route are connected. Learner access still
requires a provisioned application profile and published content; all five
prototype topics remain draft-only. The private read-only draft preview is
available separately for content inspection, while authenticated production
smoke testing remains account-dependent.

## Banner Fitness PT workspace handoff

The current product state, deployed URL, database/catalogue changes, verification boundaries and next steps are maintained in [`docs/PROJECT_CONTEXT.md`](docs/PROJECT_CONTEXT.md). The PT prompt contract is maintained in [`skills/banner-fitness-pt-prompt/SKILL.md`](skills/banner-fitness-pt-prompt/SKILL.md) and mirrored to `public/banner-fitness-pt-prompt-skill.md` during builds.
