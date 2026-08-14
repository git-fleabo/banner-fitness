# Banner Fitness PT workspace

This is the Next.js App Router application for the private Banner Fitness PT
workspace. It supports client records, PAR-Q and assessment review, goals,
preferences, locations, exercise-library management, programme design,
programme templates, workout and performance tracking, quality review and the
PT prompt bundle. The former curriculum and lesson feature has been retired.

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

The workspace is invitation-gated. Use the designer for the PT workflow and
`/account/data` for the authenticated PT-data export and deletion controls.

The current product state, deployment details, verification boundaries and
next steps are maintained in [`docs/PROJECT_CONTEXT.md`](docs/PROJECT_CONTEXT.md).
The PT prompt contract is maintained in [`skills/banner-fitness-pt-prompt/SKILL.md`](skills/banner-fitness-pt-prompt/SKILL.md).
