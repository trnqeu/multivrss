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

MultivRSS is three things in one:

1. **RSS Reader** — subscribe to feeds organized in categories, read and search articles in a private dashboard.
2. **Reading List** — save any link (from your feeds or from anywhere on the web, like Instapaper or Pocket), annotate it, and build a personal archive.
3. **Public Profile** — optionally publish a curated "best-of internet" list at your own public URL (`multivrss.com/[username]`), visible to anyone without login.

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
| `multivrss.com/[username]` | Everyone | User's public "best-of" reading list |

The authenticated product routes currently live inside `src/app/(app)`. The `(app)` route group is omitted from URLs by design. If a future real `/app` URL segment is desired, create a normal `app` segment instead of relying on `(app)`.

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
- [ ] **REST API** — `src/app/api/feeds/route.ts` for external clients

### Sync Performance & Scalability

- [x] **Staleness filter nel cron** — sincronizzare solo feed con `lastSync < 30min fa` o `null`, invece di tutti i feed a ogni tick
- [x] **Batch UPDATE per item cambiati** — sostituire gli update uno-a-uno dentro il loop con `prisma.$transaction`
- [x] **Meilisearch fire-and-forget** — `addDocuments()` lanciato senza await con `.catch()` per errori
- [x] **Priorità feed mai sincronizzati** — `orderBy: { lastSync: { sort: 'asc', nulls: 'first' } }` in cron e syncAllFeeds
- [x] **Rate limiting per dominio** — `DomainGate` con semaforo: max 2 richieste concorrenti per hostname
- [ ] **Coda di job (BullMQ + Redis)** — sostituire `Promise.all` chunked con un job queue per retry, backoff, monitoring; ogni feed diventa un job indipendente
- [ ] **Rispetto TTL del feed** — leggere `<ttl>` o `Cache-Control` dal feed e non risincronizzare prima della scadenza dichiarata
- [ ] **Limite feed per utente** — max 50 feed per account (protezione cron da abusi)
- [ ] **Per-user feed limits** — hard cap per proteggere il cron da utenti con centinaia di feed

### Production Readiness Plan

A phased plan to make the app ready for real users at scale. Phases are ordered by priority and dependency.

#### Phase 1 — Quick wins (no architecture change)

- [x] **Gate Prisma query logging** — wrap `log: ['query']` in `src/lib/prisma.ts` behind `NODE_ENV !== 'production'`
- [x] **Email verification at signup** — `EmailVerificationToken` model, Resend email, `/verify-email` route, login blocked until `emailVerified` set (existing users backfilled)
- [x] **Per-user feed limit** — max 200 feeds per account enforced in `createFeedSource` action
- [x] **Fix FeedList semantic HTML** — added `role="list"` / `role="listitem"` to feed containers and items

#### Phase 2 — Infrastructure

- [ ] **Redis** — single Redis instance shared by rate limiter (replaces in-memory store) and BullMQ job queue; required before Phase 3
- [ ] **Monitoring** — Sentry for error tracking; Prometheus + Grafana (or BetterStack) for uptime and metrics

#### Phase 3 — Feed sync refactor (critical for scale)

- [ ] **BullMQ job queue** — each feed becomes an independent job with retry, exponential backoff, and dead-letter queue; cron enqueues jobs, workers execute them
- [ ] **Separate worker process** — run BullMQ workers outside the Next.js process so sync load does not affect web response times
- [ ] **TTL-aware scheduling** — read `<ttl>` or `Cache-Control` from feed response; skip re-sync until declared expiry
- [ ] **BullBoard dashboard** — mount BullMQ dashboard (admin-only route) for queue monitoring and manual job retry

#### Phase 4 — Evaluate Go worker (after measuring)

If Phase 3 metrics show CPU bottlenecks in feed parsing (not I/O), a dedicated Go service for feed fetching and XML parsing would be a natural next step. Go goroutines map directly to the `DomainGate` semaphore pattern already in place. Node.js handles I/O-bound concurrency well; Go adds value primarily when CPU-bound parsing at volume is the confirmed bottleneck. Measure first, then decide.

### DevOps & CI/CD

A structured CI/CD strategy to fully separate local, staging, and production environments.

**Current state:** deploy is a raw SSH script triggered on `dev` push. No automated tests run in CI, no environment separation, no rollback.

#### Environment separation

- [ ] **Three explicit environments** — Local (`localhost:3002`), Staging (`dev` branch → staging server + staging DB), Production (`main` branch → prod server + prod DB)
- [ ] **Per-environment env files** — `.env.staging` and `.env.production` managed via GitHub Secrets, never SSH-copied or committed

#### CI/CD pipeline (GitHub Actions)

- [ ] **`dev` push → staging deploy** — job sequence: `npm ci` → `npm run test` → `npm run lint` → `tsc --noEmit` → `npm audit` → `prisma migrate deploy` → SSH deploy → health check
- [ ] **`main` push → production deploy** — same sequence with manual approval gate before SSH deploy to prod
- [ ] **Prisma migration before code swap** — DB schema updated before new Next.js process starts; prevents schema/code mismatch during deploy

#### Deployment safety

- [ ] **`/api/health` route** — returns `{ status: "ok", db: "ok", meili: "ok" }` checking live DB and Meilisearch connectivity
- [ ] **Health check post-deploy** — hit `/api/health` after each deploy; fail the workflow (and alert) on non-200
- [ ] **Rollback on failure** — automated rollback to previous Git SHA if health check fails

#### Secret management

- [ ] **GitHub Secrets for all env vars** — replace SSH-copied `.env` with workflow-injected secrets at deploy time
- [ ] **Secret rotation procedure** — documented runbook for rotating `NEXTAUTH_SECRET`, `CRON_SECRET`, DB credentials without downtime

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

- [ ] **Chrome extension** — detect RSS feeds on the current page and add them with one click (depends on REST API)
- [ ] **Export feeds as CSV** — download all feed sources for the logged-in user
- [ ] **Onboarding — interest picker** — on first login, new users see a "Don't know where to start?" screen. They pick interest categories (e.g. News, Tech, Sports) and the app auto-creates categories with curated seed feeds (list in `notes.md`).
- [ ] **RSS feed creator** — generate a feed for websites that don't provide one
- [ ] **RSSHub integration** — allow users to subscribe to [RSSHub](https://docs.rsshub.app/) routes directly from the add-feed UI
- [ ] **Accessibility (a11y)** — WCAG 2.1 AA compliance
  - **CRITICAL**
    - [ ] **Focus indicator** — rimuovere `outline-none` globale su `button, input, select, textarea` (`src/app/globals.css:78`); definire `:focus-visible` personalizzato (outline terracotta 2px)
    - [ ] **Form label** — tutti gli input usano solo `placeholder` come etichetta (login, register, forgot-password, reset-password, AddFeedForm, EditSourceForm, PageHeader, SaveLinkBar). Aggiungere `<label htmlFor>` con `sr-only` se hidden
    - [ ] **Skip-to-content** — manca link "skip to main content" nel root layout (`src/app/layout.tsx`); aggiungere `href="#main-content"` + `id="main-content"` su `<main>`
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
