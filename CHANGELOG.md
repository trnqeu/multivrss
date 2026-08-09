# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project follows [Semantic Versioning](https://semver.org/).

## [0.2.2] - 2026-08-09

### Added
- Import saved links from CSV (Instapaper, Pocket, or any generic URL/title/tags CSV)
- Export saved links as CSV

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
