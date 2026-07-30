# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **This is NOT the Next.js you know.** This version has breaking changes — APIs, conventions, and file structure may all differ from training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code.

## Teaching Mode — IMPORTANT

This project is a **learning exercise**. Do NOT write code unless explicitly asked to.

**Default flow:**
1. Explain *what* and *why*
2. Point to exact file(s) and line(s)
3. Show the code snippet for the user to write
4. Wait for implementation, then review

Only write code directly if the user says "write it for me", "fallo tu", or "go ahead".

## Guiding Principles

1. **Step-by-step:** Break tasks into small modules — do not generate the entire feature at once.
2. **Type safety:** Strict TypeScript. No `any`, no shortcuts.
3. **English only:** All code, comments, and UI strings must be in English — never Italian.
4. **Verify before moving on:** After each major step, confirm it works before proceeding.

## Commands

```bash
npm run dev          # Next.js dev server (port 3002)
npm run build        # Production build
npm run lint         # ESLint
npm run test         # Vitest unit tests (tests/unit/)
npm run test:watch   # Vitest watch mode
```

Database and services:

```bash
docker-compose up -d                          # Postgres (5435) + Redis (6379)
npx prisma migrate dev --create-only --name <name>   # Generate migration WITHOUT applying — always use this first, see Known Gotchas
npx prisma migrate dev                                # Apply after stripping the bogus searchVector lines (see Known Gotchas)
npx prisma migrate deploy                     # Apply existing migrations
npx prisma generate                           # Regenerate client after schema changes
```

Manual integration checks (`tsconfig.test.json` uses CommonJS — main tsconfig uses ESM which breaks ts-node):

```bash
npx ts-node --project tsconfig.test.json tests/test-rss.ts
```

## Verification Order

1. `npm run test` + `npm run lint`
2. `npm run build` for framework/route/component changes
3. `npx ts-node --project tsconfig.test.json tests/test-rss.ts` for RSS changes
4. After Prisma changes: create migration + `npx prisma generate`
5. When adding a new searchable text field: extend the generated `tsvector` column's migration SQL (see `prisma/migrations/*_add_fulltext_search`) and the corresponding branch query in `src/lib/search.ts`
6. Update this file when behavior or workflow changes

## Architecture

**Stack:** Next.js 16.2, React 19, TypeScript 5, Tailwind CSS 4, PostgreSQL 16 (native full-text search — `tsvector`/GIN, no separate search service), Prisma 7 (`@prisma/adapter-pg`), NextAuth v4 (JWT), Docker.

**Route structure:**

```
src/app/
  [lang]/(marketing)/     Localized public marketing site (en/it) at /[lang]
    page.tsx              Landing page
    blog/, guide/, sources/, tips/   Marketing content pages
  u/[username]/           Private dashboard shell (layout.tsx enforces auth + username match)
    page.tsx              Feed list (all feeds)
    category/[slug]/      Category-filtered feed
    source/[slug]/        Source-filtered feed
    saved/                Reading list (saved links)
    suggested/            Suggested feeds directory
  login|register|forgot-password|reset-password|verify-email/
  share-target/           PWA share-target endpoint (share links into the app)
  docs/route.ts           Scalar API reference UI, served from /api/openapi
  api/
    auth/[...nextauth]/   NextAuth handler
    categories/route.ts   Category CRUD
    feeds/sources/route.ts  Feed source CRUD
    saved/route.ts, saved/[id]/tags/route.ts   Saved links + tagging
    cron/sync/route.ts    Bearer-token cron (CRON_SECRET), syncs stale feeds
    internal/revalidate/route.ts  Internal-secret-gated cache revalidation
    search/route.ts       Full-text search (Postgres, see src/lib/search.ts)
    health/route.ts       Health check for deploy pipeline
    openapi/route.ts      OpenAPI schema
  actions/                Server Actions, split by domain (each file has its own 'use server')
    types.ts              Shared ActionState type
    shared.ts              frontpageTag() cache-tag helper
    auth.ts                 Register, verify email, password reset
    categories.ts           Category CRUD
    feeds.ts                Feed source CRUD, discovery, sync
    feed-items.ts           Read/unread, save/unsave, front-page dismiss
    saved-links.ts          External link saving, page title resolution
    csv.ts                  Feed import/export
    tags.ts                 Tag CRUD, tag assignment to links/items
    starter-packs.ts        Onboarding starter pack add/undo

src/lib/
  auth.ts                 NextAuth options + custom Prisma adapter (auto-generates username)
  prisma.ts               Prisma singleton (pg.Pool + @prisma/adapter-pg)
  rss.ts                  Feed URL validation (DNS + private IP check) + ingestion/sync
  search.ts               searchAllForUser() — Postgres full-text search (tsvector/GIN) across FeedItem + SavedLink, parameterized $queryRaw
  email.ts                Password reset via Resend
  utils.ts                slugify (uses underscores), isPrivateIp, PASSWORD_REGEX, decodeHtmlEntities
  domain-gate.ts          Semaphore: max 2 concurrent requests per hostname
  rate-limit.ts           In-memory rate limiter for login/password reset
  i18n/                   Dictionary-based i18n (en/it) for marketing routes
  blog.ts                 Markdown blog post loader
  frontpage.ts            Landing page data (stats, featured content)
  suggested-feeds.ts      Suggested feeds directory data
  youtube.ts              YouTube feed source support
  queue.ts, redis.ts      Background job queue (Redis-backed)
  revalidate.ts           Shared cache revalidation helpers
  cors.ts                 CORS handling for the extension/share-target origin

src/workers/feed-sync.ts  Background worker process for feed syncing
src/proxy.ts              Request proxy (Next.js 16 convention — not middleware.ts)
tests/unit/               Vitest unit tests
```

**Key conventions:**

- `src/proxy.ts` replaces `middleware.ts` in Next.js 16. Do not create a new `middleware.ts`.
- `params` in route segments is `Promise<{ slug: string }>` — must be awaited.
- `cacheComponents: true` in `next.config.ts`. Use `"use cache"` + `cacheLife` + `cacheTag` for cacheable server output. Use `connection()` to defer to request time when needed.
  - Do not put request-specific or private data inside a shared `"use cache"` scope.
- Call `revalidatePath()` / `revalidateTag()` **before** `redirect()` — redirect throws and skips subsequent calls.
- Server Components by default. `"use client"` only for interactive forms. Server Actions handle all mutations.
- Full-text search is native Postgres: `FeedItem.searchVector`/`SavedLink.searchVector` are `GENERATED ALWAYS AS (...) STORED` `tsvector` columns (see `prisma/migrations/*_add_fulltext_search`), populated automatically on every insert/update — no separate indexing step or sync-on-write call needed anywhere.
- Category names stored uppercase. `slugify()` uses underscores, not hyphens. Route lookup replaces hyphens with spaces when resolving slugs.

## Auth & Security — Mandatory

Every Server Action, route handler, and server component touching private data must call `getServerSession(authOptions)` and scope queries through the ownership chain:

```
User → Category → FeedSource → FeedItem
```

Never trust client-supplied IDs. Always filter by `userId`.

- **Cron sync** (`/api/cron/sync`): `Authorization: Bearer ${CRON_SECRET}`
- **Feed URLs:** treat as untrusted — `validateFeedUrl()` checks syntax, DNS, private IPv4/IPv6 ranges (SSRF guard). Apply the same check before fetching arbitrary URLs in `resolvePageTitle`.
- **Password reset:** never reveal whether an email exists (always respond generically).
- **Server Actions:** validate + normalize inputs at the top of each action.
- **Raw SQL:** only via Prisma's parameterized `$queryRaw`/`$executeRaw` tagged templates (`Prisma.sql`/`Prisma.join`/`Prisma.empty` for conditional fragments) — needed for Postgres full-text search (`tsvector`/`ts_rank_cd`/`ts_headline`, see `src/lib/search.ts`). Never use `$queryRawUnsafe` or string-concatenate values into SQL text; bind parameters, don't interpolate.
- **Dependencies:** prefer minimal. Flag any new package with known CVEs or excessive permissions.
- **Infrastructure:** no service (Postgres, Redis) exposed to public internet. All inter-service on internal Docker network.
- **Nginx headers in production:** `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`.
- Secrets live only in `.env` / `.env.production` — never in code, logs, or committed files.

## OWASP Secure Development — Mandatory

Apply OWASP Top 10 to every feature, route, and Server Action:

1. **Input validation** — validate + sanitize + normalize at the boundary. Use `validateFeedUrl()`, regex checks, length limits, type coercion.
2. **Authentication & session** — `getServerSession(authOptions)` on every private endpoint. JWT in httpOnly cookie. No token in URL params or Referrer.
3. **Authorization (broken access control)** — always scope by `userId`. Never use client-supplied IDs without ownership check.
4. **Injection** — Prisma parameterized queries by default; raw SQL (full-text search) only via `$queryRaw` tagged templates with bound parameters, never string concatenation. Never interpolate into shell commands.
5. **SSRF** — `validateFeedUrl()` blocks RFC 1918, loopback, link-local. Apply same guard to `resolvePageTitle`.
6. **Security headers** — CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy in Nginx or `next.config.ts`.
7. **Error handling** — never expose stack traces or DB errors to the client. Generic messages externally; structured logging internally.
8. **Cryptography** — passwords hashed via bcrypt (NextAuth). No custom crypto. JWT secret via env var only.
9. **Rate limiting** — login, password reset, API endpoints rate-limited at Nginx level; app-level via `src/lib/rate-limit.ts` for sensitive actions.
10. **Dependency hygiene** — `npm audit` before each deploy. Avoid unnecessary dependencies.

## Accessibility Checklist — Mandatory

Every new component, page, or feature must satisfy these before merge. Treat failures as blocking.

### Semantic HTML
- [ ] Landmark elements used appropriately (`<nav>`, `<main>`, `<aside>`, etc.)
- [ ] Heading hierarchy strict: h1 → h2 → h3 (never skip levels)
- [ ] Exactly one `<h1>` per page
- [ ] Skip-to-content link at top of every layout
- [ ] `<html lang="en">` set in root layout

### Forms & Inputs
- [ ] Every `<input>`, `<select>`, `<textarea>` has `<label htmlFor>` (use `sr-only` if hidden)
- [ ] Error messages associated via `aria-describedby`
- [ ] Error/success container has `role="alert"`
- [ ] Placeholder never used as sole label

### Keyboard & Focus
- [ ] All interactive elements reachable by keyboard (Tab, Enter, Escape, arrow keys)
- [ ] `:focus-visible` outline defined — never `outline-none` without a custom focus style
- [ ] Custom dropdowns implement WAI-ARIA focus management (arrow keys, Escape)
- [ ] Modals implement focus trap
- [ ] Elements hidden on hover (`opacity-0 group-hover:`) also visible on `group-focus-within:`

### ARIA
- [ ] No redundant ARIA (use native semantics where possible)
- [ ] `aria-label` values descriptive and contextual (not generic like "Menu")
- [ ] Multiple `<nav>` landmarks have distinct `aria-label` values
- [ ] Decorative overlay elements have `aria-hidden="true"`

### Color & Contrast
- [ ] Text < 18pt / 14px bold: contrast ≥ 4.5:1
- [ ] Text ≥ 18pt or 14pt bold: contrast ≥ 3:1
- [ ] No information conveyed by color alone
- [ ] Dark mode has its own contrast-verified color tokens

### Dynamic Content
- [ ] Loading spinners: `role="status"` + `aria-live="polite"`
- [ ] Optimistic updates (read/save toggle) announced via `aria-live`
- [ ] Empty states: `role="status"`
- [ ] Page title changes per route via `generateMetadata()`

### Images & Media
- [ ] All `<img>` have `alt` (descriptive for informational, `alt=""` for decorative)

## Data Model

- `Category`: unique per user `[userId, name]`
- `FeedSource`: unique by `[categoryId, url]`, globally unique `slug`
- `FeedItem`: unique by `[sourceId, externalId]` (NOT globally unique) — `externalId` used to deduplicate on upsert
- `PasswordResetToken`: per-user
- `Tag`: user-scoped; applied to both `SavedLink` and `FeedItem` via join tables
- Cascade deletes: `Category → FeedSource → FeedItem`
- Indexes on `FeedItem.sourceId` and `FeedItem.pubDate`
- `FeedItem.searchVector` / `SavedLink.searchVector`: generated `tsvector` columns (GIN-indexed, `'simple'` config, title weighted `A` over content/description weighted `B`) — declared `Unsupported("tsvector")?` in `schema.prisma`; the `GENERATED ALWAYS AS (...) STORED` expression and GIN index exist only in hand-written migration SQL, not the Prisma schema DSL

## Design System

- **Base:** `#000000` + `#FFFFFF`. No grays, no shadows, no border-radius.
- **Accent:** Terracotta `#E2725B` — text/borders only, never backgrounds. Avoid opacity below `/55` for text (contrast drops below 4.5:1 on paper background `#F6F3EC`).
- **Font:** Inter via `--font-inter`. Headings: bold, all-caps, wide tracking.
- **Layout:** Sharp 2px horizontal borders. No rounded corners.
- **Tailwind v4:** configured via `@import "tailwindcss"` + `@theme inline` in `src/app/globals.css`.
- **Inspiration:** Frank Lloyd Wright — black/white base with sparse organic palette for headings and accents.
- **Components:** Inputs and buttons feel "built into" the layout — not floating or superimposed.

## Known Gotchas

- `AGENTS.md` and `GEMINI.md` stay at repo root (read from root by their respective CLI tools); `docs/notes.md`, `docs/MARKETING_PLAN.md`, `docs/CICD.md`, `docs/EDITORIAL.md` live under `docs/`. All are in `.gitignore` — they exist only locally, never committed.
- No `opencode.json` in the repo.
- `slugify()` uses underscores; category names stored uppercase; route lookup replaces hyphens with spaces.
- No `.env.example` — check local `.env` for required vars.
- Untracked `.codex` path exists — do not delete or modify.
- `content/blog` (read by `src/lib/blog.ts`) does not exist on disk yet — the `/blog` route currently renders empty until posts are added.
- **`prisma migrate dev` reliably corrupts on every run** because of `FeedItem.searchVector`/`SavedLink.searchVector` (`Unsupported("tsvector")`, `GENERATED ALWAYS AS (...) STORED`, hand-written in `prisma/migrations/*_add_fulltext_search`). Prisma's diff engine always proposes `DROP INDEX "FeedItem_searchVector_idx"` / `DROP INDEX "SavedLink_searchVector_idx"` + `ALTER TABLE ... ALTER COLUMN "searchVector" DROP DEFAULT` — this fires even when the schema change is unrelated to search, and even on a second `migrate dev` run right after a clean apply. Postgres rejects the `DROP DEFAULT` on a generated column (error `42601`), but the `DROP INDEX` statements are NOT protected by that failure and commit for real, silently deleting the GIN indexes backing full-text search. Always run `prisma migrate dev --create-only --name <name>` first, delete the spurious `DropIndex`/`AlterTable searchVector` lines from the generated `migration.sql` by hand, then run `prisma migrate dev` (no args) to apply. If the indexes do get dropped, recreate them manually (exact SQL in `prisma/migrations/*_add_fulltext_search/migration.sql`) — do not reach for `prisma migrate reset`, it wipes all local data and is never necessary for this issue.

## Docker

**Local** (`docker-compose.yml`):
- Postgres `postgres:16-alpine` on host port `5435`, container `multivrss-db`
- Redis on host port `6379`, container `multivrss-redis`
- App runs outside Docker: `npm run dev` on port `3002`
- Local env vars: `DB_USER`, `DB_PASSWORD`, `DB_NAME`

**Prod/Staging** (`docker-compose.prod.yml`):
- All services on `internal` network — no public ports for DB or Redis
- App at `127.0.0.1:3001:3000` (loopback only, Nginx in front)
- Alternate env file: `ENV_FILE=.env.staging docker compose -f docker-compose.prod.yml up -d`
- Adminer: `docker compose -f docker-compose.prod.yml --profile tools up -d adminer`

**CI/CD pipeline:** push to `dev` → single workflow run: quality-gate (tsc, lint, test, audit) → Docker build → GHCR push → SSH deploy (sync compose file from git, prisma migrate, docker compose pull + up --force-recreate, health check on `localhost:3001`, auto-rollback on failure). Push to `main` runs the same pipeline targeting production. PRs trigger quality-gate only (no deploy).

## Environment Variables

```env
DATABASE_URL=postgresql://[USER]:[PASSWORD]@localhost:5435/multivrss-db?schema=public
NEXTAUTH_URL=http://localhost:3002
NEXTAUTH_SECRET=<secret>
GITHUB_ID=<oauth-client-id>
GITHUB_SECRET=<oauth-client-secret>
GOOGLE_ID=<oauth-client-id>
GOOGLE_SECRET=<oauth-client-secret>
CRON_SECRET=<secret>
INTERNAL_SECRET=<secret>      # gates /api/internal/revalidate (src/lib/revalidate.ts)
RESEND_API_KEY=<key>          # email transport (src/lib/email.ts)
STAGING_PASSWORD=<password>   # optional; enables Basic Auth in proxy.ts
EXTENSION_ORIGIN=<origin>     # allowed origin for CORS (src/lib/cors.ts)
REDIS_HOST=localhost          # background job queue (src/lib/queue.ts, redis.ts)
REDIS_PORT=6379
YOUTUBE_API_KEY=<key>         # optional; YouTube channels as feed sources (src/lib/youtube.ts)
SENTRY_DSN=<dsn>              # server/edge error reporting (src/sentry.server.config.ts, src/sentry.edge.config.ts)
NEXT_PUBLIC_SENTRY_DSN=<dsn>  # client-side error reporting (src/instrumentation-client.ts)
SENTRY_ORG=<org-slug>         # optional; source map upload at build time (next.config.ts)
SENTRY_PROJECT=<project-slug> # optional; source map upload at build time (next.config.ts)
SENTRY_AUTH_TOKEN=<token>     # optional; source map upload at build time, CI only
```

## Dependency Docs (chub)

For current third-party API docs, use Context Hub:

```bash
npm install -g @aisuite/chub
chub search "prisma"
chub get prisma/prisma --lang js
```

Caveat: `chub` can hang flushing PostHog telemetry. Use `timeout 25s chub ...` when needed.

## Skills

Load the relevant skill before coding in the corresponding area:

| Skill | When to use |
|-------|-------------|
| `nextjs16` | App Router, RSC, layouts, metadata, images, route handlers |
| `nextjs16-caching` | `"use cache"`, `cacheLife`, `cacheTag`, PPR, revalidation |
| `cache-components` | Cache Components deep dives, lifetime/tag debugging |
| `prisma` | Schema changes, queries, migrations, Prisma client |
| `nextauth-v4` | Auth setup, session handling, OAuth, route protection |
| `react19-forms` | Forms (`action` prop, `useActionState`, `useFormStatus`) |
| `rss-parser` | Feed fetching, RSS parsing, `syncFeed` |
| `next-best-practices` | Hydration errors, async APIs, route conventions |
| `react-best-practices` | Performance profiling, bundle size, re-renders |
| `security-and-hardening` | OWASP prevention, input validation, secure auth, SSRF guards |
| `chrome-devtools` | Browser debugging, DOM, network, LCP/CLS/INP |
| `frontend-design` | Building polished UI components, pages, layouts |
| `postgres-semantic-search` | pgvector, full-text search, ParadeDB, hybrid search |

Project-level skill definitions: `.agent-skills/skills/`. System skills: pre-installed.

## References

- `README.md` — product vision + roadmap (keep the roadmap section updated after each feature)
- `docs/notes.md` — Adminer recipe, curated feed seed list for onboarding, personal notes
- Every task should be checked against the roadmap in `README.md` to mark items done or adjust scope
