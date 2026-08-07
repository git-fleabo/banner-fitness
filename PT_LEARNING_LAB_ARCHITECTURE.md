# Phase 1 architecture and authoring note

Lessons are authored as the human-readable TypeScript package in
`web/src/lib/content/prototype-seed.ts`. Zod validates lesson metadata,
learning-object rhythm, questions, feedback, misconception codes, source keys
and the five-lesson package before import. `pnpm db:seed` is idempotent and
creates versioned draft records, source links and review targets without
publishing learner content.

The reusable App Router lesson route reads the latest permitted version. Owner
accounts may preview drafts; learners can read only published versions. Owner
review records source coverage, mapping uncertainty, rationale, approval and
publication as separate server-authorised transitions.

Progress stores meaningful lesson position, submitted attempts, coverage and
optional confidence. Browser-only selection, hover and animation state is not
persisted. Incorrect, partly-correct or misconception responses create one
explainable revision recommendation. Revision is calculated on normal requests
and uses varied authored question versions; no scheduler is required.

Visuals are original lightweight CSS/SVG-like schematic figures and structured
text is available for every important relationship. They are teaching
illustrations, not scientifically approved anatomy artwork; owner/source
review remains a publication gate.

The free-tier boundary is deliberate: Neon serverless access, repository-owned
content/assets, no external analytics/search/email/AI/media services, no
polling or background work, and local-first testing. The preferred host is
Cloudflare Workers; avoid Node-only APIs in application code and verify the
OpenNext adapter, authenticated cookies and Neon Auth callback before calling
production deployment complete.
