# PT Learning Lab — Phase 1 demo guide

## Run locally

```bash
cd web
cp .env.example .env.local
pnpm install
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Required server variables are documented in `web/.env.example`. A working
Neon database, Neon Auth Google configuration and an owner profile linked to
the Google Auth user are required for the signed-in journey. Content remains
draft by default; the owner can preview it without publishing.

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

## Validation

```bash
pnpm typecheck && pnpm lint && pnpm test && pnpm db:check && pnpm build
pnpm test:e2e
```

Cloudflare deployment is intentionally a production follow-up until the
account credentials and current OpenNext adapter are available. Do not add a
paid plan. If deployed, set the same server secrets in Workers, use the Google
callback URL for the Worker hostname, run migrations once against the single
Neon project, and verify auth, cookies, owner gating, progress and revision.
