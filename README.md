# MultivRSS

A high-performance RSS aggregator SaaS. Stack: Next.js 16 (App Router, TypeScript), Tailwind CSS 4, PostgreSQL + Prisma 7, Meilisearch, Docker.

---

## Roadmap

### In progress

- [x] **Fix OAuth sign-in (GitHub + Google)** — providers are declared but require the Prisma Adapter + `Account`/`Session`/`VerificationToken` schema models to persist OAuth users

### Core features

- [x] **Meilisearch search bar** — full-text search UI over indexed feed items
- [ ] **Mark as read** — `FeedItem.read` field exists; needs server action + UI toggle
- [ ] **Saved/favorite articles** — schema change (`SavedItem` relation) + server action + UI
  - [ ] Save an article from the feed list (one-click bookmark)
  - [ ] Add an external article by URL (manual link entry with title/description)
  - [ ] Mark any saved article as "public" to include it in the user's public reading list
  - [ ] Public reading list page at `/u/[username]/list` — readable without login
- [ ] **Sidebar toggle** — open/close the sidebar from the main layout
- [ ] **Light / dark mode** — theme toggle with `prefers-color-scheme` as default; persist preference in `localStorage`
- [ ] **Search bar UX revision** — revisit placement, keyboard shortcut (e.g. `/` to focus), results layout, and empty/loading states

### Polish & extras

- [ ] **Article view** — verify and complete `src/app/source/[slug]/page.tsx`
- [ ] **REST API** — expose feeds via `src/app/api/feeds/route.ts` for external clients
- rss feed creator for webite that doesn't provide one
- [ ] **AI agent integration** — TBD
- [ ] **Vector database** — TBD

### Roadmap additions (2026-04-24)

- [ ] **Export feeds as CSV** — let users download all their feed sources as a CSV file
- [ ] **Collapsible sidebar categories** — toggle open/close feed sources per category in the left sidebar
- [ ] **Alphabetical feed sorting** — sort feed sources within each sidebar category alphabetically (case-insensitive); future: add secondary sort by most recent update
- [ ] **Marketing homepage** — landing page at `/` presenting the project to new visitors
- [ ] **Protect staging environment** — HTTP basic auth or IP allowlist via Nginx for `staging.multivrss.com`
- [ ] **Server hardening** — Fail2ban + Nginx rate limiting against bots and brute-force; evaluate Crowdsec or ModSecurity (WAF) as alternatives
- [ ] **Onboarding feed suggestions** — show curated feed proposals to new users on first login (seed list available in `notes.md`)
- [ ] **Chrome extension** — detect RSS feeds on the current page and add them to MultivRSS with one click (depends on REST API above)
- [ ] **Feed item retention / auto-purge** — delete `FeedItem` rows older than a configurable threshold (default 90 days) via a scheduled job; saved/public articles must be exempt from purging
