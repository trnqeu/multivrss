# MultivRSS

A high-performance RSS aggregator and personal reading list SaaS. Stack: Next.js 16 (App Router, TypeScript), Tailwind CSS 4, PostgreSQL + Prisma 7, Meilisearch, Docker.

---

## Next.js App Router Architecture

This project uses the Next.js 16 App Router under the optional `src` folder:

```text
src/app/
  layout.tsx              Root layout for every route
  page.tsx                Public route when present at this level
  (app)/                  Route group for the authenticated product UI
    layout.tsx            Private app shell with sidebar
    page.tsx              Private dashboard at `/`
    search/page.tsx       Private search at `/search`
    category/[slug]/      Private category page at `/category/[slug]`
    source/[slug]/        Private source page at `/source/[slug]`
  api/**/route.ts         Route Handlers / API endpoints
```

Important Next.js conventions used here:

- `src` is only a source folder; it does not affect URL paths.
- `app` enables the App Router.
- Folders define URL segments only when they are normal route folders.
- Route groups such as `(app)` organize routes and layouts without adding anything to the URL.
- A route becomes public only when a `page.tsx` or `route.ts` file exists.
- Dynamic route params use square brackets, for example `category/[slug]`.
- `proxy.ts` is the Next.js 16 request proxy convention; do not use the old `middleware.ts` naming for new work.
- `next.config.ts` enables `cacheComponents: true`, so caching work must follow the Next.js 16 Cache Components model.
- With Cache Components, use `"use cache"` only for cacheable output, keep request-specific/private data uncached or behind the appropriate runtime boundary, and use `connection()` when a route must defer to request time.

## Product Vision

MultivRSS is two things in one:

1. **RSS Reader** — subscribe to feeds organized in categories, read and search articles in a private dashboard.
2. **Reading List** — save any link (from your feeds or from anywhere on the web, like Instapaper or Pocket), annotate it, and build a personal archive.


---

## URL Architecture

| URL | Who sees it | What it is |
|-----|-------------|------------|
| `multivrss.com/` | Unauthenticated users: marketing landing. Authenticated users: redirect to `/u/{username}` | Marketing homepage / project presentation |
| `multivrss.com/u/{username}` | Authenticated users | Private RSS dashboard |
| `multivrss.com/u/{username}/search` | Authenticated users | Full-text search over indexed feed items |
| `multivrss.com/u/{username}/category/{slug}` | Authenticated users | Filtered view by category |
| `multivrss.com/u/{username}/source/{slug}` | Authenticated users | Filtered view by feed source |
| `multivrss.com/saved` | Authenticated users | Planned private reading list (all saved links) |


The authenticated product routes currently live inside `src/app/(app)`. The `(app)` route group is omitted from URLs by design. If a future real `/app` URL segment is desired, create a normal `app` segment instead of relying on `(app)`.

---

## CI/CD Pipeline

### Overview

Two deployment targets, one shared quality gate.

```
push → dev    →  Deploy to Staging    →  staging.multivrss.com
push → main   →  Deploy to Production →  multivrss.com
PR   → dev/main  →  CI (quality gate only, no deploy)
```

### Quality Gate (`ci.yml`)

Runs on every PR targeting `dev` or `main`, and is called internally by both deploy workflows via `workflow_call`. Steps in order:

1. `npm ci` — clean install
2. `npx prisma generate` — generate the Prisma client
3. `npx tsc --noEmit` — TypeScript type check
4. `npm run lint` — ESLint
5. `npm run test` — Vitest unit tests
6. `npm audit --audit-level=critical` — fails only on critical CVEs

`ci.yml` has no standalone `push` trigger. It runs either on PRs or when called by a deploy workflow — never duplicated.

### Dockerfile (multi-stage)

Three stages:

**`deps`** — installs `node_modules` (all dependencies). Kept separate so Docker caches it independently of source changes.

**`builder`** — copies source, runs `npx prisma generate` + `npm run build` (Next.js standalone output), then bundles the background worker (`src/workers/feed-sync.ts`) into a single `dist/worker.js` via esbuild. All worker dependencies except `@prisma/client` are bundled into the file; `@prisma/client` is left external because it requires native binaries and is already present in the standalone output.

**`runner`** — minimal production image. Copies only `.next/standalone`, `.next/static`, `public/`, and `dist/worker.js`. No source files, no full `node_modules`.

### Deploy pipeline (staging and production)

Both workflows are identical in structure. They differ only in the branch, env file, and the floating image tags pushed (`:staging` vs `:production` / `:latest`).

Each deploy runs **three jobs in sequence**:

**1. `quality-gate`** — calls `ci.yml` (reusable).

**2. `build`** — builds two Docker images and pushes them to GHCR (`ghcr.io/trnqeu/multivrss`):
- `:SHA-migrator` — the `builder` stage, used only to run `prisma migrate deploy`
- `:SHA` + `:staging` or `:production` / `:latest` — the `runner` stage (the actual app)

Layer caching uses `type=gha` (GitHub Actions cache) to avoid rebuilding unchanged layers.

**3. `deploy`** — connects to the server via SSH (`appleboy/ssh-action`) and runs:
1. `git fetch origin <branch> && git checkout origin/<branch> -- docker-compose.prod.yml` — syncs the compose file from git on every deploy to prevent server drift
2. Saves the current SHA to `~/.multivrss_staging_sha` (or `_prod_sha`) for rollback
3. Authenticates Docker against GHCR using the workflow's `GITHUB_TOKEN`
4. Pulls both new images explicitly
5. Runs Prisma migrations in an isolated one-shot container on the internal Docker network — schema is always updated before the new app starts, preventing schema/code mismatch
6. `docker compose pull app worker` — pulls new images for the two services that change on each deploy
7. `docker compose up -d --remove-orphans --force-recreate` — recreates all containers, guaranteeing the new image is used
8. Health check: polls `GET http://localhost:3001/api/health` every 5 s for up to 60 s (12 attempts). Uses the internal port directly — no DNS, no Nginx, no TLS in the path
9. On failure: pulls the previous SHA image and redeploys it with `--force-recreate`

### `/api/health` endpoint

`GET /api/health` checks all three backing services in parallel via `Promise.allSettled`. Returns HTTP 200 `{"status":"ok"}` only when all pass; returns HTTP 503 `{"status":"degraded", ...}` if any fail. The deploy script matches on the `"ok"` string — a degraded response triggers rollback.

| Field | Check |
|-------|-------|
| `db` | `prisma.$queryRaw\`SELECT 1\`` |
| `meili` | `meili.health()` |
| `redis` | `redis.ping()` |

### Production stack (`docker-compose.prod.yml`)

Five containers on an isolated `internal` Docker network. No service port is publicly exposed; the app listens on loopback only, with Nginx in front:

| Container | Image | Host binding |
|-----------|-------|-------------|
| `app` | `ghcr.io/trnqeu/multivrss:SHA` | `127.0.0.1:3001` |
| `worker` | same image, `node dist/worker.js` | none |
| `db` | `postgres:16-alpine` | none |
| `meilisearch` | `getmeili/meilisearch:v1.13` | none |
| `redis` | `redis:8-alpine` | none |

`adminer` is defined but only starts with `--profile tools` — never auto-started in normal operation.

### GitHub Secrets required

| Secret | Used by |
|--------|---------|
| `SSH_HOST` | staging + production deploy |
| `SSH_USER` | staging + production deploy |
| `SSH_KEY` | staging + production deploy |
| `GITHUB_TOKEN` | auto-provided by Actions (GHCR push + pull) |

### Full flow from `git push` to live

```
git push dev
    ↓
GitHub Actions — Deploy to Staging (single workflow run)
    ├─ quality-gate: tsc, lint, test, npm audit
    ├─ build: Docker multi-stage → GHCR (:SHA-migrator + :SHA + :staging)
    └─ deploy (SSH):
           ├─ sync docker-compose.prod.yml from git
           ├─ prisma migrate deploy (isolated one-shot container)
           ├─ docker compose pull app worker
           ├─ docker compose up -d --force-recreate
           ├─ GET http://localhost:3001/api/health × 12 (60 s)
           └─ on failure: --force-recreate with previous SHA
```

For production the flow is identical but triggers on `main`.

### Known limitations

- **Brief downtime on deploy** — `--force-recreate` stops the app container before starting the new one. Typical gap is 5–15 s depending on Next.js cold-start time. Zero-downtime would require a blue/green swap at the Nginx level.
- **Migration rollback asymmetry** — Prisma migrations run before the new container starts. If the deploy fails and rolls back to the previous code, the database schema stays at the newer version. All migrations must therefore be backwards-compatible with the previous code version (additive-only: no column renames, no drops).
- **Rollback unavailable on first deploy** — `PREV_SHA` is read from `~/.multivrss_staging_sha`. If the file does not exist (first ever deploy on a fresh server), rollback is skipped and the script exits 1 with no recovery.

---

## Roadmap

### Done

- [x] OAuth sign-in (GitHub + Google) with Prisma Adapter
- [x] Meilisearch full-text search bar (+ filters by category, time range, source, read status)
- [x] Sidebar toggle (open/close)
- [x] Collapsible sidebar categories
- [x] Alphabetical feed sorting within categories
- [x] Manual sync button (syncs all feeds for the logged-in user)
- [x] Accelerated sync with concurrency, Meili delta, timeout, non-blocking overlay
- [x] Read / unread toggle (pallino + opacity) with dual Prisma+Meilisearch write
- [x] Light / dark mode with paper as default, persisted in localStorage
- [x] Marketing landing page (`/`) with hero, pillars, live preview, tips, pricing
- [x] Protected staging via Basic Auth (`STAGING_PASSWORD` in proxy.ts)
- [x] Edit source modal (rename + change category with merge)
- [x] Category rename with auto-merge when target name exists
- [x] Server Actions test suite (56 Vitest tests across 7 files)
- [x] Dynamic route restructure: all private routes under `/u/{username}/`

### In progress / planned

- [x] **Search UX revision** — removed redundant `/search` page, search lives inline on the dashboard via `?q=`
- [x] **REST API** — `GET /api/feeds/sources` (list feed sources) and `POST /api/feeds/sources` (subscribe) with CORS support for Chrome Extension; authenticated via NextAuth session cookie
- [x] **API docs** — OpenAPI spec at `/api/openapi`; interactive Scalar UI at `/docs`
- [x] **Mobile category filter (Option B)** — pinned `CAT` pill at the left of the telemetry row (mobile only, never scrolls away); taps to open a bottom-sheet listing all categories; writes `?cat=`; desktop inline dropdown unchanged

### Sync Performance & Scalability

- [x] **Staleness filter nel cron** — sincronizzare solo feed con `lastSync < 30min fa` o `null`, invece di tutti i feed a ogni tick
- [x] **Batch UPDATE per item cambiati** — sostituire gli update uno-a-uno dentro il loop con `prisma.$transaction`
- [x] **Meilisearch fire-and-forget** — `addDocuments()` lanciato senza await con `.catch()` per errori
- [x] **Priorità feed mai sincronizzati** — `orderBy: { lastSync: { sort: 'asc', nulls: 'first' } }` in cron e syncAllFeeds
- [x] **Rate limiting per dominio** — `DomainGate` con semaforo: max 2 richieste concorrenti per hostname
- [x] **Coda di job (BullMQ + Redis)** — sostituire `Promise.all` chunked con un job queue per retry, backoff, monitoring; ogni feed diventa un job indipendente
- [x] **Rispetto TTL del feed** — leggere `<ttl>` o `Cache-Control` dal feed e non risincronizzare prima della scadenza dichiarata
- [x] **Limite feed per utente** — max 200 feed per account (protezione cron da abusi)
- [x] **Per-user feed limits** — hard cap per proteggere il cron da utenti con centinaia di feed

### Production Readiness Plan

A phased plan to make the app ready for real users at scale. Phases are ordered by priority and dependency.

#### Phase 1 — Quick wins (no architecture change)

- [x] **Gate Prisma query logging** — wrap `log: ['query']` in `src/lib/prisma.ts` behind `NODE_ENV !== 'production'`
- [x] **Email verification at signup** — `EmailVerificationToken` model, Resend email, `/verify-email` route, login blocked until `emailVerified` set (existing users backfilled)
- [x] **Per-user feed limit** — max 200 feeds per account enforced in `createFeedSource` action
- [x] **Fix FeedList semantic HTML** — added `role="list"` / `role="listitem"` to feed containers and items
- [ ] **CSP nonce** — replace `'unsafe-inline'` in `script-src` with a per-request nonce generated in `src/proxy.ts`; pass nonce to root layout via request header; blocks inline XSS even if an injection point is found

#### Phase 2 — Infrastructure

- [x] **Redis** — single Redis instance shared by rate limiter (replaces in-memory store) and BullMQ job queue; required before Phase 3
- [ ] **Sentry integration** — `@sentry/nextjs` SDK for error tracking in Server Actions, Route Handlers, cron sync, and RSS parser; session replay for UI bugs; performance tracing on Prisma/Meilisearch calls; alerting on error spikes
- [ ] **Uptime & metrics monitoring** — Prometheus + Grafana or BetterStack for infrastructure metrics and uptime checks

#### Phase 3 — Feed sync refactor (critical for scale)

- [x] **BullMQ job queue** — each feed becomes an independent job with retry, exponential backoff, and dead-letter queue; the stale-feed scan enqueues jobs, workers execute them
- [x] **Separate worker process** — run BullMQ workers outside the Next.js process so sync load does not affect web response times (`npm run worker`)
- [x] **TTL-aware scheduling** — read `<ttl>` or `Cache-Control` from feed response; skip re-sync until declared expiry
- [x] **Self-scheduled stale-feed scan** — worker process registers a BullMQ repeatable job (`upsertJobScheduler`, every 5 min) on startup instead of depending on an external host cron hitting `/api/cron/sync`; that route now only wraps the same scan logic (`src/lib/feed-sync-scheduler.ts`) as a manual/backup trigger
- [ ] **BullBoard dashboard** — mount BullMQ dashboard (admin-only route) for queue monitoring and manual job retry

#### Phase 4 — Evaluate Go worker (after measuring)

If Phase 3 metrics show CPU bottlenecks in feed parsing (not I/O), a dedicated Go service for feed fetching and XML parsing would be a natural next step. Go goroutines map directly to the `DomainGate` semaphore pattern already in place. Node.js handles I/O-bound concurrency well; Go adds value primarily when CPU-bound parsing at volume is the confirmed bottleneck. Measure first, then decide.

#### Phase 5 — Load testing

- [ ] **Load test suite** — simulate concurrent users and high feed-sync volume to find bottlenecks before production traffic does. Candidate tools: [k6](https://k6.io) (scripted, CI-friendly) or Artillery. Key scenarios: authenticated feed list page under N concurrent users, cron sync with M feeds in queue, Meilisearch search under load. Gate: run before any capacity-related infrastructure change and before each major release.

### DevOps & CI/CD

- [x] **Three explicit environments** — Local (`localhost:3002`), Staging (`dev` → `staging.multivrss.com`), Production (`main` → `multivrss.com`)
- [x] **`dev` push → staging deploy** — quality gate → Docker build → SSH deploy → health check → auto-rollback
- [x] **`main` push → production deploy** — same pipeline with manual approval gate before deploy
- [x] **Prisma migration before code swap** — runs in an isolated one-shot container before `docker compose up`
- [x] **`/api/health` route** — checks DB, Meilisearch, and Redis connectivity
- [x] **Rollback on failure** — automated rollback to previous SHA if health check fails after deploy
- [x] **GitHub Environments** — `staging` (auto) and `production` (manual reviewer) with scoped secrets
- [ ] **Secret rotation procedure** — runbook for rotating `NEXTAUTH_SECRET`, `CRON_SECRET`, DB credentials without downtime

### Self-Hosting _(optional / not yet decided)_

Steps to make the repo public and let users run their own instance.

- [ ] **Git history audit** — scan full history for committed secrets (`trufflehog filesystem .`); rewrite with `git filter-repo` if anything is found
- [ ] **`.env.example`** — document all required env vars with placeholder values and comments on where to obtain each (OAuth credentials, Resend API key, etc.)
- [ ] **All-in-one `docker-compose.yml`** — add an `app` service so `docker compose up` starts DB + Meilisearch + Next.js together; current compose assumes the app runs outside Docker
- [ ] **Init entrypoint** — run `prisma migrate deploy` + `prisma generate` automatically on first container start
- [ ] **Self-hosting guide in README** — prerequisites, clone, copy env, `docker compose up`, first login

### Reading List (Instapaper/Pocket-style)

- [x] **Save from feed** — one-click bookmark on any feed item (SearchBar + FeedItem)
- [x] **Save external link** — SaveLinkBar with auto-fetch of og:title/og:description
- [x] **Private saved list** — `/u/{username}/saved` with tag filter, remove, and inline tag management
- [x] **Feed item retention / auto-purge** — cron deletes `FeedItem` rows with `pubDate < 90 days` and `savedAt = null`; syncs Meilisearch index

### TBD / Future

- [ ] **Public toggle** — mark any saved link as "public" to include it in the user's public profile
- [ ] **Public profile page** — `multivrss.com/[username]` readable without login
- [ ] **Advertising** — monetization via public pages

### Core features

- [ ] **Chrome extension** — detect RSS feeds on the current page and add them with one click; save articles to reading list; REST API already in place
- [ ] **Export as CSV** — two separate exports: (1) all feed sources (URL, category, title) for re-importing into another RSS reader; (2) all saved links (URL, title, tags, saved date) compatible with Instapaper/Pocket CSV format
- [ ] **Import from CSV** — two separate imports: (1) feed list (OPML or CSV with URL + optional category); (2) saved links from Instapaper, Pocket, or any CSV with a URL column — maps to `SavedLink` rows
- [ ] **Onboarding — interest picker** — on first login, new users see a "Don't know where to start?" screen. They pick interest categories (e.g. News, Tech, Sports) and the app auto-creates categories with curated seed feeds (list in `notes.md`).
- [ ] **RSS feed creator** — generate a feed for websites that don't provide one
- [ ] **RSSHub integration** — allow users to subscribe to [RSSHub](https://docs.rsshub.app/) routes directly from the add-feed UI
- [ ] **Accessibility (a11y)** — WCAG 2.1 AA compliance
  - **CRITICAL**
    - [x] **Focus indicator** — global `:focus-visible` outline (terracotta 2px, 2px offset) defined in `src/app/globals.css`; stray per-component overrides (`PageHeader`, `SuggestedPageClient`) now restore a visible ring instead of `outline-none`
    - [x] **Form label** — all inputs now have an associated `<label htmlFor>` (`sr-only` where hidden), including `PageHeader` search fields, `ImportCsvForm` file input, and the `SuggestedPageClient` directory filter
    - [x] **Skip-to-content** — `href="#main-content"` link in `src/app/layout.tsx`, matching `id="main-content"` on `<main>` across all top-level pages
  - **HIGH**
    - [ ] **Contrasto colore** — terracotta `#E2725B` su carta `#F6F3EC` = 3.89:1 (soglia 4.5:1); testo `/30`, `/40` scende a 2.1:1 (Sidebar, FeedItem, SearchBar, PageHeader, CollapsibleCategory). Scurire terracotta o non usare opacità sotto `/55` per testo informativo
    - [ ] **Messaggi errore non associati** — errori in AddFeedForm, EditSourceForm, login, register senza `aria-describedby` collegato all'input
    - [ ] **Dropdown senza navigazione tastiera** — ThreeDotMenu, AddFeedForm, EditSourceForm: no arrow keys, no focus management su apertura/chiusura
    - [ ] **Focus trap sidebar mobile** — SidebarContainer overlay non blocca focus; implementare focus trap
    - [ ] **Pulsanti bookmark hover-only** — FeedItem, SearchBar, SavedView: `opacity-0 group-hover/item:opacity-100`. Aggiungere `group-focus-within/item:opacity-100`
    - [ ] **Stati dinamici muti** — loading spinner, errori, feedback successo, cambiamenti read/save ottimistici senza `role="alert"`, `aria-live="polite"`, `role="status"`
    - [ ] **Landmark nav senza etichetta** — due `<nav>` (Sidebar, MobileTabBar) senza `aria-label` distintivo

### Monetization

- [ ] **Freemium plan** — Free tier: limited feeds and categories, no full-text search. Pro tier (~€5/month): unlimited feeds, full-text search, CSV export, API access.
- [ ] **Display free tier limits on marketing landing page** — even before a paid tier exists, the pricing/plans section must show the hard limits already enforced in the app: **max 200 feeds** per account and **90-day article retention** (items older than 90 days are purged; saved links are exempt). This sets honest expectations and primes users for a future upgrade path. Copy must be kept in sync whenever these limits change in the code.
- [ ] **RSS feed generator (Pro)** — Pro-only feature: generate a valid RSS feed for any website that doesn't publish one. User provides a URL; the backend fetches the page, extracts a list of links + titles (via `@mozilla/readability` + `jsdom` or a CSS selector the user configures), and serves a synthetic `/feeds/[id].xml` endpoint that aggregates updates on each cron tick. The generated feed appears in the user's source list like any other feed. Key considerations: rate-limit fetching per domain (reuse `DomainGate`); store the CSS selector / extraction config in a new `GeneratedFeed` model linked to `FeedSource`; gate the feature behind a `plan === 'pro'` check in the Server Action; respect `robots.txt` (fetch and cache it alongside the feed). Candidate scraping strategies in order of reliability: (1) structured `<article>` / `<li>` extraction via Readability, (2) user-supplied CSS selector, (3) sitemap.xml fallback.

### Marketing & Infrastructure

- [ ] **Marketing site i18n** — multi-language support for the public marketing pages at `/` (hero, pricing, tips). Scope is marketing only — the authenticated dashboard stays English-only. Use Next.js 16 built-in i18n routing (`i18n` config in `next.config.ts`) with locale-prefixed URLs (e.g. `/it`, `/es`). Launch languages TBD; suggested starting pair: English (default) + Italian. Requires extracting all marketing copy into locale message files; `next-intl` is the recommended library for App Router.
- [ ] **CDN + security** — Bunny CDN + Bunny Shield: cache static assets and public pages, WAF, DDoS protection, bot mitigation. Never cache authenticated traffic.
- [ ] **Server hardening** — Nginx rate limiting on sensitive endpoints (login, API); Fail2ban on VPS
- [ ] **OWASP secure development** — apply OWASP Top 10 across every feature:
  - [ ] **Security headers** — CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy (via `next.config.ts` or Nginx)
  - [ ] **Rate limiting** — login, password reset, API endpoints (Nginx + app-level)
  - [ ] **Input validation library** — introduce Zod (or similar) for all Server Action inputs: username, email, category name length/format, source URL normalization
  - [ ] **SSRF guard for `resolvePageTitle`** — add `validateFeedUrl()`-style check before fetching arbitrary URLs in `actions.ts`
  - [x] **Disable Prisma query logging in production** — gated behind `NODE_ENV !== 'production'` in `src/lib/prisma.ts`
  - [ ] **`npm audit` in CI** — fail build on critical/moderate severities
  - [ ] **Password reset token** — move from URL query param to POST body to prevent Referrer leakage
  - [ ] **Security test suite** — adversarial scenarios: invalid ownership, token tampering, boundary inputs, CSRF attempts
- [ ] **Reader mode** — extract full article content from saved URLs via `@mozilla/readability` + `jsdom`
- [ ] **Database backups** — periodic automated `pg_dump`; evaluate Hetzner Storage Box, Backblaze B2, or Cloudflare R2
- [ ] **AI agent integration** — TBD
- [ ] **Vector database** — TBD
- [ ] **Markdown-driven home page** — allow updating marketing home page sections (hero copy, pillars, pricing, tips) by editing local `.md` files, without touching React components. Rendered server-side via `next-mdx-remote` or similar; hot-reloads in dev, statically included in production build.
- [ ] **Blog section** — `/blog` public section (no auth required) driven by Markdown files stored in `content/blog/`. Each `.md` file becomes a post at `/blog/[slug]`. Index page lists posts sorted by date. No CMS or database required — content is versioned in Git.

### Personalization

- [ ] **"For You" recommendations page** — `/u/[username]/for-you` shows articles from the user's subscribed feeds ranked by similarity to their saved and read history. Signal: `FeedItem.savedAt` (strong, explicit) and `FeedItem.read` (weak, implicit). Three implementation options in order of complexity:

  **Option A — Meilisearch keyword similarity (MVP, no new infrastructure)**
  - Take the titles of the last N saved/read `FeedItem`s; build a composite Meilisearch multi-query; aggregate, deduplicate, and filter already-read results.
  - Quality: medium (term-based, not semantic — misses synonyms and related concepts).
  - Effort: low (~2 sessions). Reuses existing Meilisearch index and `searchFeedItemsForUser()` pattern.

  **Option B — Meilisearch with AI embedder (recommended for semantic quality)**
  - Configure a Meilisearch embedder (Voyage AI ~$0.06/1M tokens, or Ollama free locally) to unlock the `/indexes/feed_items/similar` endpoint.
  - Send saved `FeedItem` IDs to `/similar`; Meilisearch returns K nearest neighbours by vector cosine similarity.
  - Requires: embedder config in `meili.ts`, one-time re-indexing of all existing articles, API key or local model.
  - Quality: high (true semantic similarity). The `/for-you` route itself changes minimally vs Option A.
  - Effort: medium (~3–4 sessions).

  **Option C — pgvector in PostgreSQL (maximum control)**
  - Add `pgvector` extension to Docker, add `embedding vector(1024)` column to `FeedItem`, generate and store embeddings on every feed sync (via Voyage AI or similar).
  - Query: average the embeddings of the last N saved/read items → `ORDER BY embedding <=> $avg_embedding LIMIT 20`.
  - Enables advanced ranking: weighted saved-vs-read signal, temporal decay, per-category boosting — without depending on Meilisearch for vectors.
  - This is the "Vector database — TBD" item above, made concrete.
  - Quality: high + most flexible. Effort: high (~6–8 sessions).

  **Recommended path:** implement Option A first (validate the UX and the signal), then upgrade to Option B once the page is live.

---

## Home Page — Tips & Tricks Section

Content planned for the marketing landing page. A curated list of tricks to help users find and create RSS feeds for sites that make them hard to discover.

### Google News

Any Google News search URL becomes an RSS feed by inserting `/rss` after the TLD:

```
https://news.google.com/search?q=site%3Areuters.com&hl=en-US&gl=US&ceid=US%3Aen
→
https://news.google.com/rss/search?q=site%3Areuters.com&hl=en-US&gl=US&ceid=US%3Aen
```

### Substack

Every Substack publication exposes a feed at `/feed`:

```
https://stratechery.com/feed
```

### Reddit

Append `.rss` to any subreddit URL:

```
https://www.reddit.com/r/programming.rss
https://www.reddit.com/r/worldnews.rss
```

### YouTube

Every YouTube channel has a hidden Atom feed. Find the channel ID in the URL and use:

```
https://www.youtube.com/feeds/videos.xml?channel_id=CHANNEL_ID
```

### Medium

Medium publications and user pages expose a feed at `/feed/`:

```
https://medium.com/feed/@username
https://medium.com/feed/publication-name
```

### WordPress sites

Nearly every WordPress site has a feed at `/feed`:

```
https://example.com/feed
```

### GitHub

GitHub exposes Atom feeds for releases, commits, and tags — no authentication needed:

```
https://github.com/owner/repo/releases.atom
https://github.com/owner/repo/commits.atom
https://github.com/owner/repo/tags.atom
```

### Podcast apps

Every podcast is natively an RSS feed. Copy the podcast's feed URL from any podcast directory (Apple Podcasts, Spotify for Podcasters, Listen Notes) and paste it directly into MultivRSS.

### Kill the Newsletter

[Kill the Newsletter](https://kill-the-newsletter.com/) converts any email newsletter into an RSS feed. It generates a unique inbox address — subscribe to the newsletter with that address and get every issue as a feed item.

### RSS-Bridge (self-hosted)

[RSS-Bridge](https://github.com/RSS-Bridge/rss-bridge) is an open-source tool that generates RSS feeds for hundreds of sites that don't provide one natively (Instagram, Twitter/X, Telegram channels, and more). Can be self-hosted or used via public instances.
