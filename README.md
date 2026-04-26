# MultivRSS

A high-performance RSS aggregator and personal reading list SaaS. Stack: Next.js 16 (App Router, TypeScript), Tailwind CSS 4, PostgreSQL + Prisma 7, Meilisearch, Docker.

---

## Product Vision

MultivRSS is three things in one:

1. **RSS Reader** — subscribe to feeds organized in categories, read and search articles in a private dashboard.
2. **Reading List** — save any link (from your feeds or from anywhere on the web, like Instapaper or Pocket), annotate it, and build a personal archive.
3. **Public Profile** — optionally publish a curated "best-of internet" list at your own public URL (`multivrss.com/[username]`), visible to anyone without login.

---

## URL Architecture

| URL | Who sees it | What it is |
|-----|-------------|------------|
| `multivrss.com/` | Everyone | Marketing landing page — project presentation, curated feed suggestions, login/register |
| `multivrss.com/app` | Authenticated users | Private RSS reader dashboard |
| `multivrss.com/app/search` | Authenticated users | Full-text search over indexed feed items |
| `multivrss.com/app/category/[slug]` | Authenticated users | Filtered view by category |
| `multivrss.com/app/source/[slug]` | Authenticated users | Filtered view by feed source |
| `multivrss.com/app/saved` | Authenticated users | Private reading list (all saved links) |
| `multivrss.com/[username]` | Everyone | User's public "best-of" reading list |

---

## Roadmap

### Done

- [x] OAuth sign-in (GitHub + Google) with Prisma Adapter
- [x] Meilisearch full-text search bar
- [x] Sidebar toggle (open/close)
- [x] Collapsible sidebar categories
- [x] Alphabetical feed sorting within categories
- [x] Manual sync button (syncs all feeds for the logged-in user)

### In progress

- [ ] **Article view** — verify and complete `src/app/source/[slug]/page.tsx`

### Reading List (Instapaper/Pocket-style)

- [ ] **Save from feed** — one-click bookmark on any feed item
- [ ] **Save external link** — add any URL manually (title + description auto-fetched from og:title/og:description)
- [ ] **Private saved list** — view and manage saved links at `/app/saved`
- [ ] **Public toggle** — mark any saved link as "public" to include it in the user's public profile
- [ ] **Public profile page** — `multivrss.com/[username]` readable without login; shows the user's curated public links
- [ ] **Feed item retention / auto-purge** — delete `FeedItem` rows older than 90 days via a scheduled job; saved/public links are exempt

### Core features

- [ ] **Mark as read** — `FeedItem.read` field exists; needs server action + UI toggle
- [ ] **Search UX revision** — keyboard shortcut (`/` to focus), results layout, empty/loading states
- [ ] **Light / dark mode** — theme toggle; persist preference in `localStorage`
- [ ] **REST API** — `src/app/api/feeds/route.ts` for external clients
- [ ] **Chrome extension** — detect RSS feeds on the current page and add them with one click (depends on REST API)
- [ ] **Export feeds as CSV** — download all feed sources for the logged-in user
- [ ] **Onboarding — interest picker** — on first login, new users see a "Don't know where to start? Let's add some MultivRSS favourite feeds." screen. They pick one or more interest categories (e.g. News, Tech, Sports, Mind, Art, Literature) and the app auto-creates those categories in their account and populates them with a curated seed list of feeds maintained by MultivRSS. Users can remove or edit anything afterwards. Seed list lives in `notes.md`.
- [ ] **RSS feed creator** — generate a feed for websites that don't provide one
- [ ] **Accessibility (a11y)** — WCAG 2.1 AA compliance: full keyboard navigation, semantic HTML, ARIA labels on all interactive elements, sufficient color contrast ratios, screen reader support, focus-visible outlines

### Monetization

- [ ] **Advertising on public profile pages** — display ads on `multivrss.com/[username]` (visible to unauthenticated visitors); keep the private `/app` dashboard ad-free
- [ ] **Freemium plan** — Free tier: limited feeds and categories, no full-text search. Pro tier (~€5/month): unlimited feeds, full-text search, CSV export, API access. Key design challenge: restrict the free tier enough to drive upgrades without frustrating users.

### Marketing & Infrastructure

- [ ] **Landing page** — `multivrss.com/` with project presentation, feature highlights, login/register, curated feed examples, and a Tips & Tricks section (see below)
- [ ] **Protect staging** — HTTP basic auth or IP allowlist via Nginx for `staging.multivrss.com`
- [ ] **CDN + security** — Bunny CDN + Bunny Shield in front of the VPS: cache static assets and public pages (`/`, `/[username]`), WAF (OWASP Top 10), DDoS protection, bot mitigation, and rate limiting — all upstream before traffic reaches the server. Never route `/app` through CDN to avoid session data leaks. Free tier covers the basics; Advanced ($9.5/mo) adds complex bot mitigation and AI WAF. Fail2ban on the VPS as a last line of defense.
- [ ] **Server hardening** — Nginx rate limiting on sensitive endpoints (login, API); Fail2ban as last-resort IP banning at VPS level
- [ ] **OWASP secure development** — apply OWASP Top 10 mitigations across every feature: input validation at all boundaries, parameterized queries only, CSRF protection on all mutations, `Content-Security-Policy` header, dependency audit (`npm audit`) in CI, secrets never in code or logs
- [ ] **AI agent integration** — TBD
- [ ] **Vector database** — TBD
- [ ] **Database backups** — set up periodic automated `pg_dump` backups; evaluate one of: Hetzner Storage Box (SFTP/rsync, cheap, same infra), Backblaze B2, or Cloudflare R2 (S3-compatible object storage, near-zero cost at small scale, geo-separated from Hetzner)

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
