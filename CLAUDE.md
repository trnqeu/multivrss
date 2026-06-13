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
docker-compose up -d                          # Postgres (5435) + Meilisearch (7700)
npx prisma migrate dev --name <name>          # Create + apply migration
npx prisma migrate deploy                     # Apply existing migrations
npx prisma generate                           # Regenerate client after schema changes
```

Manual integration checks (`tsconfig.test.json` uses CommonJS — main tsconfig uses ESM which breaks ts-node):

```bash
npx ts-node --project tsconfig.test.json tests/test-rss.ts
npx ts-node --project tsconfig.test.json tests/test-meili.ts
```

## Verification Order

1. `npm run test` + `npm run lint`
2. `npm run build` for framework/route/component changes
3. `npx ts-node --project tsconfig.test.json tests/test-rss.ts` or `tests/test-meili.ts` for RSS/Meili changes
4. After Prisma changes: create migration + `npx prisma generate`
5. When adding searchable/filterable/sortable Meilisearch fields: update index settings + indexing payloads together
6. Update this file when behavior or workflow changes

## Architecture

**Stack:** Next.js 16.2, React 19, TypeScript 5, Tailwind CSS 4, PostgreSQL 16, Prisma 7 (`@prisma/adapter-pg`), Meilisearch, NextAuth v4 (JWT), Docker.

**Route structure:**

```
src/app/
  (marketing)/            Public marketing site at /
  u/[username]/           Private dashboard shell (layout.tsx enforces auth + username match)
    page.tsx              Feed list (all feeds)
    category/[slug]/      Category-filtered feed
    source/[slug]/        Source-filtered feed
    saved/                Reading list (saved links)
    suggested/            Suggested feeds directory
  login|register|forgot-password|reset-password/
  api/
    auth/[...nextauth]/   NextAuth handler
    cron/sync/route.ts    Bearer-token cron (CRON_SECRET), syncs stale feeds
    search/route.ts       Meilisearch proxy
  actions.ts              All Server Actions (mutations, sync, auth, password)

src/lib/
  auth.ts                 NextAuth options + custom Prisma adapter (auto-generates username)
  prisma.ts               Prisma singleton (pg.Pool + @prisma/adapter-pg)
  rss.ts                  Feed URL validation (DNS + private IP check) + ingestion/sync
  meili.ts                Meilisearch singleton, index config, SearchHit type
  search.ts               searchFeedItemsForUser() with "use cache" + cacheTag
  email.ts                Password reset via Resend
  utils.ts                slugify (uses underscores), isPrivateIp, PASSWORD_REGEX
  domain-gate.ts          Semaphore: max 2 concurrent requests per hostname
  rate-limit.ts           In-memory rate limiter for login/password reset

src/proxy.ts              Request proxy (Next.js 16 convention — not middleware.ts)
tests/unit/               Vitest unit tests
```

**Key conventions:**

- `src/proxy.ts` replaces `middleware.ts` in Next.js 16. Do not create a new `middleware.ts`.
- `params` in route segments is `Promise<{ slug: string }>` — must be awaited.
- `cacheComponents: true` in `next.config.ts`. Use `"use cache"` + `cacheLife` + `cacheTag` for cacheable server output. Use `connection()` to defer to request time when needed.
  - `src/lib/search.ts` caches `getSourcesForUser()` with `cacheLife('minutes')` and `cacheTag('sources:${userId}')`.
  - Do not put request-specific or private data inside a shared `"use cache"` scope.
- Call `revalidatePath()` / `revalidateTag()` **before** `redirect()` — redirect throws and skips subsequent calls.
- Server Components by default. `"use client"` only for interactive forms. Server Actions handle all mutations.
- Meilisearch is synced inside `src/lib/rss.ts` after each upsert.
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
- **Meilisearch filters:** validate user-supplied filter values against the user's own data before interpolating (see `src/lib/search.ts`).
- **No raw SQL** — Prisma parameterized queries only. Never interpolate into shell commands or filter strings.
- **Dependencies:** prefer minimal. Flag any new package with known CVEs or excessive permissions.
- **Infrastructure:** no service (Postgres, Meilisearch) exposed to public internet. All inter-service on internal Docker network.
- **Nginx headers in production:** `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`.
- Secrets live only in `.env` / `.env.production` — never in code, logs, or committed files.

## OWASP Secure Development — Mandatory

Apply OWASP Top 10 to every feature, route, and Server Action:

1. **Input validation** — validate + sanitize + normalize at the boundary. Use `validateFeedUrl()`, regex checks, length limits, type coercion.
2. **Authentication & session** — `getServerSession(authOptions)` on every private endpoint. JWT in httpOnly cookie. No token in URL params or Referrer.
3. **Authorization (broken access control)** — always scope by `userId`. Never use client-supplied IDs without ownership check.
4. **Injection** — Prisma only. Never interpolate into shell commands or Meilisearch filter strings.
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

## Design System

- **Base:** `#000000` + `#FFFFFF`. No grays, no shadows, no border-radius.
- **Accent:** Terracotta `#E2725B` — text/borders only, never backgrounds. Avoid opacity below `/55` for text (contrast drops below 4.5:1 on paper background `#F6F3EC`).
- **Font:** Inter via `--font-inter`. Headings: bold, all-caps, wide tracking.
- **Layout:** Sharp 2px horizontal borders. No rounded corners.
- **Tailwind v4:** configured via `@import "tailwindcss"` + `@theme inline` in `src/app/globals.css`.
- **Inspiration:** Frank Lloyd Wright — black/white base with sparse organic palette for headings and accents.
- **Components:** Inputs and buttons feel "built into" the layout — not floating or superimposed.

## Known Gotchas

- `AGENTS.md`, `notes.md`, `GEMINI.md` are in `.gitignore` — they exist only locally, never committed.
- No `opencode.json` in the repo.
- `PASSWORD_REGEX` is duplicated in `src/lib/utils.ts` and `src/app/actions.ts`.
- `src/lib/prisma.ts` has verbose query logging enabled — gate behind `NODE_ENV` before production.
- `FeedList` renders items inside a `<p>` — be careful with semantics/accessibility changes.
- `slugify()` uses underscores; category names stored uppercase; route lookup replaces hyphens with spaces.
- No `.env.example` — check local `.env` for required vars.
- Untracked `.codex` path exists — do not delete or modify.

## Docker

**Local** (`docker-compose.yml`):
- Postgres `postgres:16-alpine` on host port `5435`, container `multivrss-db`
- Meilisearch on host port `7700`, container `multivrss-search`
- App runs outside Docker: `npm run dev` on port `3002`
- Local env vars: `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `MEILI_MASTER_KEY`

**Prod/Staging** (`docker-compose.prod.yml`):
- All services on `internal` network — no public ports for DB or Meilisearch
- App at `127.0.0.1:3001:3000` (loopback only, Nginx in front)
- Alternate env file: `ENV_FILE=.env.staging docker compose -f docker-compose.prod.yml up -d`
- Adminer: `docker compose -f docker-compose.prod.yml --profile tools up -d adminer`

**Staging CI deploy:** `npm ci` → `npx prisma generate` → `npx tsc --noEmit` → `npm run lint` → SSH deploy into `~/multivrss` on `dev` branch push.

## Environment Variables

```env
DATABASE_URL=postgresql://[USER]:[PASSWORD]@localhost:5435/multivrss-db?schema=public
MEILI_HOST=http://localhost:7700
MEILI_MASTER_KEY=<key>
NEXTAUTH_URL=http://localhost:3002
NEXTAUTH_SECRET=<secret>
GITHUB_ID=<oauth-client-id>
GITHUB_SECRET=<oauth-client-secret>
GOOGLE_ID=<oauth-client-id>
GOOGLE_SECRET=<oauth-client-secret>
CRON_SECRET=<secret>
RESEND_API_KEY=<key>          # email transport (src/lib/email.ts)
STAGING_PASSWORD=<password>   # optional; enables Basic Auth in proxy.ts
```

## Dependency Docs (chub)

For current third-party API docs, use Context Hub:

```bash
npm install -g @aisuite/chub
chub search "meilisearch"
chub get meilisearch/js --lang js
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
| `meilisearch` | Indexing, search, index settings, filter/sort config |
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
- `notes.md` — Adminer recipe, curated feed seed list for onboarding, personal notes
- Every task should be checked against the roadmap in `README.md` to mark items done or adjust scope
