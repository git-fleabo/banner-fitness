# PT Learning Lab application

This is the Next.js App Router application for the private PT Learning Lab.
The current implementation completes foundation step 1: typed content
contracts, Human Movement Studio design tokens, a responsive overview shell,
server-only Neon/Auth adapters, and unit plus browser test harnesses.

## Environment

The preview and production build do not require secrets. Before database or
authentication work, copy `.env.example` to `.env.local` and supply:

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
pnpm test:e2e
```

The E2E suite expects a locally installed Playwright Chromium browser. No live
Neon schema, authentication route, or deployment is claimed by this foundation.
