# PT Learning Lab — free-tier budget

Reviewed 7 August 2026 for the private owner prototype and a very small invited pilot.

## Services in use

| Service | Purpose | Free-tier evidence and operating limit | Safeguard and failure behaviour |
| --- | --- | --- | --- |
| Neon Postgres | Auth-linked profiles, versioned lesson metadata and meaningful progress | The application uses one serverless Neon project and the Neon serverless driver. Scale-to-zero and serverless connection behaviour are preserved; plan allowances must be checked in the Neon console before a wider pilot. Neon consumption-history endpoints are only available for paid usage-based plans, so this repo does not assume that API for monitoring. | One project, no preview branches, no binaries, no polling, indexed reads, purposeful writes only. If the database is unavailable, protected learning and progress writes fail closed; static lesson code is not used to bypass authorisation. Re-check the current Neon pricing page before inviting more than a very small pilot. |
| Neon Auth / Google OAuth | Invitation-gated sign-in | Google’s official web-server OAuth flow supports confidential server-side applications and redirect URIs. No email delivery provider is used. | Existing callback and profile gate remain required. If Auth is unavailable, sign-in fails; there is no public-registration fallback. Re-check provider quotas and terms before participant payments. |
| Cloudflare Workers | Preferred production host | Workers Free documents 100,000 requests/day, 10 ms CPU/request, 128 MB memory, 50 external subrequests/request and 3 MB compressed Worker size. See [Workers limits](https://developers.cloudflare.com/workers/platform/limits/) and [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/). | Static assets are repository-owned; no Cron, Queues, Durable Objects, AI, KV, D1, R2 or paid add-ons. Exceeding the free request limit returns the platform limit response; no automatic upgrade is enabled. Reconsider a paid plan only after measured pilot traffic and a spending cap are agreed. |
| GitHub private repository / Actions | Source control and bounded local-first validation | GitHub Free currently includes 2,000 standard-runner minutes/month and 500 MB artifact storage for private repositories. See [GitHub Actions billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions). | Run the full suite locally; if CI is used, one Linux job, concurrency cancellation, short retention, no screenshots or dependency folders as artifacts. GitHub blocks usage after included quota when no payment method is available; no paid runner is used. |

## Expected acceptance-journey usage

One owner demonstration is approximately 25–45 page requests, 2–4 reads per
lesson route, 1 dashboard read for the current weak-area signals, 1 write when
a meaningful position changes, 1 write per submitted check, 1 completion write
and 1 revision completion/reschedule write. Library search and filters are
client-side over the five-item dataset and do not query Neon. There is no
polling, telemetry stream, background job, notification or media processing.
Five lessons are authored in the repository and imported idempotently; large
unchanged lesson structures are not copied on every learner action.

## Disabled cost-generating features

No runtime AI, hosted search, external CMS, external asset storage, analytics,
session replay, error-monitoring SaaS, transactional email, reminders, video,
audio, paid image generation, scheduled database jobs, queues or payment
collection is required for the application to work.

## Expansion warnings

Before inviting a larger cohort, accepting one-off participant fees or making
the product commercial, re-check Neon and Cloudflare current pricing/quotas,
Google OAuth quotas and terms, privacy/retention obligations, authentication
support, backups, abuse controls, production incident handling and whether
GitHub Actions can remain below the included allowance. Never add a service
whose normal operation can silently create a bill; configure hard caps or a
fail-closed path first.
