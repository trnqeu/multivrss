# Roadmap

Forward-looking work only. Shipped features are recorded in
[`CHANGELOG.md`](../CHANGELOG.md), not here.

This is a solo project maintained in spare time — items are directional, not
commitments, and ordering can change. Feature ideas are welcome as
[Issues](https://github.com/trnqeu/multivrss/issues).

## Near-term features

- **Browser extension** — detect RSS feeds on the current page and add them
  with one click; save articles to the reading list. The REST API it needs
  (`GET`/`POST /api/feeds/sources`, CORS for the extension origin) already
  exists.
- **Onboarding interest picker** — on first login, a "Don't know where to
  start?" screen where new users pick interest categories and the app
  auto-creates categories with curated seed feeds.
- **Pocket `.zip` import** — Pocket's `.zip` mail export isn't parsed yet;
  only its CSV export works today (via the generic saved-links CSV importer).
- **Full backup export / restore** — a single archive covering feeds,
  categories, saved links, tags, and read state, with a restore flow.
- **Export scoped by tag / category** — exports are currently all-or-nothing.
- **RSS feed creator** — generate a feed for sites that don't publish one
  (structured extraction, a user-supplied CSS selector, or a sitemap
  fallback), served as a synthetic feed that refreshes on each sync tick.
- **RSSHub integration** — subscribe to [RSSHub](https://docs.rsshub.app/)
  routes directly from the add-feed UI.

## Accessibility (WCAG 2.1 AA)

The critical items (focus indicator, form labels, skip-to-content) are done.
Remaining:

- **Color contrast** — terracotta `#E2725B` on paper `#F6F3EC` is 3.89:1
  (below the 4.5:1 threshold); text at low opacity drops further. Darken the
  accent or stop using opacity below `/55` for informational text.
- **Error messages** — associate form errors via `aria-describedby` in
  `AddFeedForm`, `EditSourceForm`, login, register.
- **Custom dropdowns** — `ThreeDotMenu`, `AddFeedForm`, `EditSourceForm` need
  arrow-key navigation and focus management on open/close.
- **Mobile sidebar** — the overlay needs a focus trap.
- **Hover-only actions** — bookmark buttons that appear on
  `group-hover` also need `group-focus-within`.
- **Dynamic states** — loading spinners, errors, success feedback, and
  optimistic read/save changes need `role="status"` / `aria-live`.
- **Nav landmarks** — the sidebar and mobile tab bar need distinct
  `aria-label` values.

## Infrastructure & scaling

- **All-in-one `docker compose up`** — add an `app` service so one command
  starts Postgres + Redis + the app together. The app currently runs as a
  plain Node process outside Docker.
- **Container init entrypoint** — run `prisma migrate deploy` +
  `prisma generate` automatically on first start.
- **Monitoring** — Sentry alert rules on error spikes; Session Replay;
  explicit Prisma performance spans; uptime + infrastructure metrics
  (Prometheus/Grafana or a hosted equivalent).
- **BullBoard dashboard** — an admin-only route for queue monitoring and
  manual job retry.
- **Manual approval gate on production deploys** and native branch
  protection on `main` — both require a GitHub plan the repo isn't on yet.
- **Secret rotation runbook** — rotate `NEXTAUTH_SECRET`, `CRON_SECRET`, and
  DB credentials without downtime.
- **Database backups** — periodic automated `pg_dump` to off-site storage.
- **Load testing** — simulate concurrent users and high feed-sync volume
  (k6 or Artillery) before capacity-related infra changes.
- **Go feed-fetch worker** — only if profiling confirms CPU-bound XML
  parsing (not I/O) is the bottleneck at volume. Measure first.

## Quality guardrails (testing & CI)

Layered on top of the existing quality gate, each starting advisory
(non-blocking) and flipping to blocking once a baseline is established:

- Test-coverage baseline (`@vitest/coverage-v8`, scoped to `src/lib`,
  `src/app/actions`, route handlers, `src/proxy.ts`, `src/workers`).
- Mutation testing (Stryker) on the security-critical modules — SSRF guard,
  raw-SQL search, auth, validation primitives, concurrency gate, rate
  limiter.
- Gherkin/BDD acceptance tests for the feed lifecycle and the
  registration / email-verification / password-reset flows.
- Complexity linting (`eslint-plugin-sonarjs`) and unused-export/dependency
  detection (`knip`).
- A git-history secret scan (`gitleaks` / `trufflehog`) before each
  significant public milestone.

## Longer-term ideas

- **Android app** — wrap the existing PWA in a [Capacitor](https://capacitorjs.com/)
  WebView shell for Google Play, unlocking native push and share-target.
- **Public profiles** — mark a saved link "public" to surface it on an
  opt-in, login-free `multivrss.com/{username}` page.
- **Markdown-driven marketing home page** — edit hero/pillars/pricing/tips
  copy in `.md` files instead of React components.
- **AI agent integration** and a **vector database** — both TBD; the
  recommendation-engine note below is the concrete near-term version.

## Recommendation engine redesign

The home page "For You" strip currently ranks items with one engine (source
affinity, pure Prisma). A second engine — title similarity — was dropped in
the Meilisearch → Postgres search migration and needs a Postgres-native
replacement. Signals available: `FeedItem.savedAt` (strong, explicit) and
`FeedItem.read` (weak, implicit).

- **Option D — Postgres keyword similarity (lowest effort).** Reuse the
  existing `tsvector`/GIN columns: for each recent saved/read title, rank
  other unread items by `ts_rank_cd` against a `websearch_to_tsquery` (or
  `pg_trgm` for fuzzier matching). Term-based, not semantic — the same
  ceiling the old engine had. No new infrastructure; reuses
  `src/lib/search.ts` query patterns.
- **Option C — pgvector (maximum control).** Add the `pgvector` extension
  and an `embedding` column to `FeedItem`, generate embeddings on each sync,
  and query `ORDER BY embedding <=> avg(recent saved/read embeddings)`.
  Higher quality and most flexible; significantly more work.

Recommended path: Option D restores the original UX cheaply on the
Postgres-only stack; revisit Option C only if term-based similarity proves
insufficient in practice.

## Sustainability

The hosted instance is free today. The app already enforces limits that a
future paid tier would relax — **max 200 feeds per account** and **~90-day
retention** on unsaved articles. Any pricing/plans surface must show these
honestly and stay in sync with the values enforced in code.

Self-hosting sidesteps all of this — the code is MIT-licensed and the
[self-hosting guide](./self-hosting.md) is the supported path for running
your own instance without limits.
