# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project follows [Semantic Versioning](https://semver.org/).

## [1.0.0] - 2026-09-17

MultivRSS's first public release, open source under the MIT license.

### Added
- MIT license: the project is now open source
- Reader Mode now works on saved external links, not just feed items
- Import saved links from CSV (Instapaper, Pocket, or any generic URL/title/tags CSV)
- Export saved links as CSV
- Front Page keeps every category visible and shows a dek (excerpt) on every item, with live edition-progress tracking
- MultivRSS Digest: a blog rubric that lets readers save articles or subscribe to feeds inline, without leaving the post
- New suggested feeds: Henrik Karlsson, Stanford Encyclopedia of Philosophy
- Animated app loading screen

### Changed
- Redesigned the Saved list; it now refreshes automatically when you navigate back to it
- Feed items are now retained by last-seen-in-feed instead of publish date, so purge timing matches when an item actually drops off its source feed
- The saved-page tag filter bar is fully collapsible on mobile, no longer flickers on hover, and no longer gets clipped by the header
- Restructured the repository for public release: a product-first README with screenshots, a dedicated ROADMAP.md and SELF_HOSTING.md, CONTRIBUTING.md and issue/PR templates, and a fully local (gitignored) `docs/` for internal notes

### Fixed
- Self-hosting instructions were missing a required `npx prisma generate` step, and referenced the discontinued `docker-compose` binary instead of `docker compose`
- Raised the Server Actions body size limit to 10MB so larger CSV imports (Pocket/Instapaper exports) no longer fail with "Body exceeded 1 MB limit"
- Paginated the Saved page (was loading and rendering every saved article/link at once): added "LOAD MORE", moved tag/search filtering server-side, added supporting DB indexes
- Fixed stale `useActionState` results reopening the wrong modal (the share-target flow and the saved-link tag editor)
- Retried Reader Mode extraction scoped to the page's main/article landmark when the first attempt returned nothing useful
- Fixed a false-positive history-length check that could bounce users out of the app entirely
- Patched all HIGH/CRITICAL dependency advisories; the PR auto-close bot no longer catches Dependabot's own updates

## [0.2.1] - 2026-08-08

### Added
- Save and tag articles directly from Reader Mode
- Copy article text or download it as Markdown from Reader Mode
- Public changelog page
- Unread indicator on the blog nav link; session-aware marketing navigation
- Author structured data (BlogPosting JSON-LD) and byline links on blog posts

### Changed
- Reworked front page / river action cluster hierarchy
- Source names are now clickable; fixed "For You" text truncation
- Source/category page headers condensed to a single row, metadata de-emphasized
- Read/edit pills in Saved are icon-only

### Fixed
- Modal state no longer resurfaces on back/forward navigation (stale local
  `useState` visibility — see `useCloseOnNavigate` in CLAUDE.md Known Gotchas)
- Back navigation fixed for standalone PWA (history-based)
- Canonical and hreflang metadata added to blog pages
- Reader Mode links no longer prefetch, avoiding queueing behind other actions
- Resolved Dependabot alerts in transitive dev dependencies

## [0.2.0] - 2026-08-04

### Added
- In-app Reader Mode with full-text article extraction (Readability + sanitize-html, Redis-cached)
- Tags: create, assign to saved links and feed items, merge on rename collision
- Saved links (reading list) with tagging, external link saving, page title resolution
- YouTube channels as feed sources
- PWA support: service worker registration, maskable icon, share-target endpoint
- Sentry error reporting (server, edge, and client)
- Personal API keys with premium gate for external tool access
- Suggested feeds directory with search, category filters, and bulk-add
- Sources page with search, category filters, and bulk-add
- FAQ page on the marketing site (en/it)
- Self-service account deletion (Settings → Account danger zone): type-to-confirm
  plus password re-check, deletes immediately via existing cascade relations

### Changed
- Migrated full-text search from Meilisearch to native Postgres full-text search
  (generated `tsvector` columns, GIN indexes) — removed the Meilisearch service
  entirely; saved links are now searchable alongside feed items in the same
  search bar for the first time
- Sources page switched from list to card grid with descriptions

### Fixed
- Assorted feed source URL and modal/UX fixes accumulated since 0.1.0

## [0.1.0] - Initial release

- Baseline: authenticated feed reading app with categories, feed sources,
  read/unread and save/unsave, cron-based feed sync, NextAuth login.
