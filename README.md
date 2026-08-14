# Banner Fitness PT workspace

Banner Fitness is a private personal-training workspace for managing clients,
PAR-Q and assessment information, preferences, locations, programme design,
workout results, performance records, programme quality review and the
supporting PT prompt bundle.

The current product is deliberately focused on the PT workflow: create a
client, screen and understand their context, design and review a programme,
assign it, and record progress over time. The former curriculum and lesson
feature has been retired.

## Repository contents

- Banner Fitness PT application and tests in `web/`
- PT prompt contract and generated public copy
- Programme-library, quality-review and client-data governance documentation
- Design references and private source-material manifests

## Local application

From `web/`, copy `.env.example` to `.env.local` and supply the server-only
Neon and authentication values before running database or production commands.

- `pnpm dev` — run the application
- `pnpm typecheck` — check TypeScript contracts
- `pnpm lint` — run ESLint
- `pnpm test` — run unit/component tests
- `pnpm build` — create the production build
- `pnpm db:check` — validate the tracked migration history
- `pnpm db:migrate` — apply unapplied migrations to `DATABASE_URL`

Identifiable client records, health information and exported account archives
must not be committed to the repository.
