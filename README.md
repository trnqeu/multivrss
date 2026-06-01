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

- [ ] **Search UX revision** — keyboard shortcut (`/` to focus), results layout, empty/loading states
- [ ] **REST API** — `src/app/api/feeds/route.ts` for external clients

### Reading List (Instapaper/Pocket-style)

- [ ] **Save from feed** — one-click bookmark on any feed item
- [ ] **Save external link** — add any URL manually (title + description auto-fetched from og:title/og:description)
- [ ] **Private saved list** — view and manage saved links at `/saved`
- [ ] **Feed item retention / auto-purge** — delete `FeedItem` rows older than 90 days via a scheduled job; saved links are exempt

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
- [ ] **Accessibility (a11y)** — WCAG 2.1 AA compliance: full keyboard navigation, semantic HTML, ARIA labels, sufficient contrast, screen reader support, focus-visible outlines

### Monetization

- [ ] **Freemium plan** — Free tier: limited feeds and categories, no full-text search. Pro tier (~€5/month): unlimited feeds, full-text search, CSV export, API access.

### Marketing & Infrastructure

- [ ] **CDN + security** — Bunny CDN + Bunny Shield: cache static assets and public pages, WAF, DDoS protection, bot mitigation. Never cache authenticated traffic.
- [ ] **Server hardening** — Nginx rate limiting on sensitive endpoints (login, API); Fail2ban on VPS
- [ ] **OWASP secure development** — apply OWASP Top 10 across every feature: input validation, parameterized queries, CSRF protection, CSP header, `npm audit` in CI, secrets never in code/logs
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
