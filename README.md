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

### Marketing & Infrastructure

- [ ] **Landing page** — `multivrss.com/` with project presentation, feature highlights, login/register, and curated feed examples
- [ ] **Protect staging** — HTTP basic auth or IP allowlist via Nginx for `staging.multivrss.com`
- [ ] **Server hardening** — Fail2ban + Nginx rate limiting; evaluate Crowdsec or ModSecurity (WAF)
- [ ] **AI agent integration** — TBD
- [ ] **Vector database** — TBD
