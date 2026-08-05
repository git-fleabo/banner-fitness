# PT Learning Lab application

This is the Next.js App Router application for the private PT Learning Lab.
The current implementation completes foundation steps 1 and 2: typed content
contracts, Human Movement Studio design tokens, a responsive overview shell,
the versioned Neon/Drizzle schema, invitation-only magic-link authentication,
server-side profile authorization, and unit plus browser test harnesses.

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
Neon schema and authentication route are connected, and the first owner has an
invited application profile. Deployment and a fully verified signed-in owner
session are not yet claimed; the profile remains invited until its first
successful magic-link session.
