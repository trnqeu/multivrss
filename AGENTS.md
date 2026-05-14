<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# MultivRSS Agent Notes

These notes are the working memory for future agents in this repository. Keep them updated when architecture, commands, data ownership rules, or roadmap priorities change.

## Project Snapshot

MultivRSS is a personal RSS aggregator and reading-list SaaS.

- Stack: Next.js 16.2, React 19, TypeScript, Tailwind CSS 4, PostgreSQL, Prisma 7 with `@prisma/adapter-pg`, Meilisearch, NextAuth v4, Docker.
- Product direction from `README.md`: private RSS reader, Instapaper/Pocket-style saved links, and optional public profile pages.
- Code and UI copy must be English. User-facing discussion can be Italian.
- This is a learning project. Prefer small, explainable steps and document why changes are made.

## Teaching Mode — IMPORTANT

This project is a **learning exercise**. The user is building this project to learn. Do NOT write code for the user unless explicitly asked to.

**Default behavior for every task:**
1. Explain *what* needs to be done and *why*.
2. Point to the exact file(s) and line(s) to edit.
3. Show the code snippet the user should write themselves.
4. Wait for the user to implement it, then review.

Only take over and write code directly if the user says something like "write it for me", "fallo tu", or "go ahead".

## Guiding Principles (from project spec)

1. **Step-by-step:** Break tasks into small modules — do not generate the entire feature at once.
2. **Type safety:** Strict TypeScript. No `any`, no shortcuts.
3. **English only:** All code, comments, and UI strings must be in English — never Italian.
4. **Verify before moving on:** After each major step, confirm it works before proceeding.

## Commands

```bash
npm run dev          # Next dev server, webpack, port 3002
npm run build        # Production build
npm run lint         # ESLint
npm run test         # Vitest unit tests
npm run test:watch   # Vitest watch mode
```

Database and services:

```bash
docker-compose up -d
npx prisma migrate dev --name <name>
npx prisma migrate deploy
npx prisma generate
```

Manual integration checks:

```bash
npx ts-node --project tsconfig.test.json tests/test-rss.ts
npx ts-node --project tsconfig.test.json tests/test-meili.ts
```

Note: `tsconfig.test.json` switches to `module: CommonJS` / `moduleResolution: node` so `ts-node` can resolve modules correctly. The main `tsconfig.json` uses `module: esnext` (for Next.js/webpack) which breaks direct ts-node execution.

## Dependency Documentation With Chub

For dependency work, API/library usage, or any feature that depends on current third-party behavior, use Context Hub (`chub`) from `https://github.com/andrewyng/context-hub` to fetch current docs before coding.

Install when needed:

```bash
npm install -g @aisuite/chub
```

Typical agent workflow:

```bash
chub search "openai"
chub get openai/chat --lang py
chub search "stripe payments"
chub get stripe/api --lang js
```

When a useful local caveat is discovered, annotate it for future sessions:

```bash
chub annotate stripe/api "Needs raw body for webhook verification"
```

Use `chub help` if command syntax is unclear. If `chub` is unavailable or installation needs network access, ask for approval before installing or fetching docs. Prefer Chub-sourced current documentation over memory for dependency APIs.

Observed local caveat: `chub` can print useful results and then hang while flushing PostHog telemetry if that network call fails. Use `timeout 25s chub ...` when needed, and keep the retrieved docs output.

## Required Reading Before Code Changes

- Always read the relevant local Next.js 16 docs under `node_modules/next/dist/docs/` before touching App Router, route handlers, caching, proxy, layouts/pages, forms, or Server Actions.
- Useful docs already identified:
  - `01-app/01-getting-started/03-layouts-and-pages.md`
  - `01-app/01-getting-started/07-mutating-data.md`
  - `01-app/01-getting-started/08-caching.md`
  - `01-app/01-getting-started/09-revalidating.md`
  - `01-app/01-getting-started/15-route-handlers.md`
  - `01-app/01-getting-started/16-proxy.md`
  - `01-app/02-guides/upgrading/version-16.md`
  - `01-app/02-guides/data-security.md`
- Next 16 specifics used here:
  - Dynamic route `params` are typed as promises, for example `params: Promise<{ slug: string }>` and must be awaited.
  - `proxy.ts` replaces the old `middleware.ts` convention. Export `proxy`, not `middleware`.
  - Use `connection()` when a page must bind dynamic rendering to the incoming request.
  - Call `revalidatePath()` before `redirect()` because `redirect()` throws a framework control-flow exception.
  - This repo has `cacheComponents: true` in `next.config.ts`; use the Next.js 16 Cache Components model for caching decisions.

## Next.js App Router Organization

This project intentionally uses the App Router inside the optional `src` folder:

- `src` separates application source from root configuration files and does not affect URL paths.
- `src/app` enables App Router routing.
- Special routing files include `layout.tsx`, `page.tsx`, `loading.tsx`, `not-found.tsx`, `error.tsx`, `global-error.tsx`, `template.tsx`, `default.tsx`, and `route.ts`.
- Nested folders define URL segments. For example `src/app/blog/page.tsx` maps to `/blog`.
- Dynamic segments use square brackets: `[slug]`, `[...slug]`, and `[[...slug]]`.
- Route groups use parentheses, for example `(app)`, and are omitted from the URL.
- Private folders use a leading underscore, for example `_components`, and are ignored by the router.
- A folder is not publicly routable until it contains a `page.tsx` or `route.ts`.
- Files can be colocated inside `app` route folders without becoming routable, but this repo currently keeps shared code in `src/components` and `src/lib`.
- Component hierarchy is recursive: `layout`, `template`, `error`, `loading`, `not-found`, then `page` or nested layouts.
- Parallel routes use `@slot`; intercepted routes use patterns such as `(.)folder`, `(..)folder`, `(..)(..)folder`, and `(...)folder`. Use these only for specific UI patterns like modal overlays or slot-based layouts.

Cache Components guidance for Next 16:

- `cacheComponents: true` is enabled in `next.config.ts`.
- Use `"use cache"` only for data/components/routes whose output is safe to cache and share.
- Do not put request-specific secrets, sessions, cookies, headers, or user-owned private data inside a shared `"use cache"` scope.
- For private/request-specific work, keep data uncached, pass runtime values as arguments where appropriate, or use the documented private-cache model deliberately.
- Use `connection()` to defer a route/component to request time when it depends on runtime values such as unique IDs, current time, request environment, or uncached request data.
- When a route accesses uncached dynamic data under Cache Components, wrap the dynamic part in `Suspense` or make the cache boundary explicit to avoid build-time blocking errors.

## Repository Map

```text
src/app/
  (app)/                  Private app route group. Currently mounted at `/`, not `/app`.
    page.tsx              Main authenticated feed dashboard.
    category/[slug]/      Category-filtered feed list.
    source/[slug]/        Source-filtered feed list. README calls this in progress.
    search/page.tsx       Search results page.
    layout.tsx            Private app shell with sidebar.
  actions.ts              Server Actions for feed CRUD/sync/auth/password/read state.
  api/
    auth/[...nextauth]/   NextAuth route.
    cron/sync/route.ts    Bearer-token cron sync endpoint.
    search/route.ts       Authenticated Meilisearch route.
  login|register|forgot-password|reset-password/
  layout.tsx              Root HTML, Inter font, providers, global chrome.
  globals.css             Tailwind v4 import, CSS variables, global design rules.

src/components/           Server and client components.
src/lib/
  auth.ts                 NextAuth options and custom Prisma adapter username creation.
  prisma.ts               Prisma singleton using pg Pool and PrismaPg adapter.
  rss.ts                  Feed URL validation and RSS ingestion.
  meili.ts                Meilisearch singleton and index settings.
  email.ts                Password reset email transport.
  utils.ts                slugify, private IP detection, shared password regex.

prisma/schema.prisma      Database model.
tests/unit/               Vitest unit tests.
tests/test-*.ts           Manual integration scripts.
```

## Current Routing

The private product UI is organized under `src/app/(app)`. `(app)` is a route group, not a URL segment.

Current authenticated routes:

- `/` -> `src/app/(app)/page.tsx`
- `/search` -> `src/app/(app)/search/page.tsx`
- `/category/[slug]` -> `src/app/(app)/category/[slug]/page.tsx`
- `/source/[slug]` -> `src/app/(app)/source/[slug]/page.tsx`
- Planned `/saved` -> `src/app/(app)/saved/page.tsx`

If a future real `/app` URL prefix is desired, create a normal route segment such as `src/app/app/...`; do not expect `(app)` to appear in URLs.

## Data Model

Main ownership chain:

```text
User -> Category -> FeedSource -> FeedItem
```

Important models:

- `User`: `username`, `email`, optional `password`, auth relations, categories, password reset tokens.
- `Category`: unique per user by `[userId, name]`.
- `FeedSource`: belongs to category, unique by `[categoryId, url]`, has global unique `slug`.
- `FeedItem`: belongs to source, unique by `[sourceId, externalId]`, has `read`.
- `PasswordResetToken`: per-user password reset flow.

Important schema note: `FeedItem.externalId` is not globally unique despite older docs implying that. The real unique constraint is `[sourceId, externalId]`.

## Authentication And Authorization

- NextAuth config lives in `src/lib/auth.ts`.
- Session strategy is JWT.
- Credentials users authenticate by email/password with bcrypt.
- OAuth users are created through a custom Prisma adapter that derives unique `username` values from email slugs.
- `src/types/next-auth.d.ts` augments session user fields.
- Any Server Action, route handler, or server component query that touches private data must call `getServerSession(authOptions)` or otherwise verify identity.
- Always scope private data through the ownership chain, normally `category: { userId: session.user.id }` or `source: { category: { userId: session.user.id } }`.
- Never trust client-supplied IDs without checking ownership.

## Security — IMPORTANT

All code and infrastructure changes must prioritize security. Follow OWASP guidelines by default.

**Mandatory checks for every change:**
- **Injection:** Never interpolate user input into SQL, shell commands, or search filters without sanitization. Use Prisma's parameterized queries exclusively — never raw SQL with string concatenation.
- **Authentication & authorization:** Every API route and Server Action must verify the session and that the requested resource belongs to the authenticated user (`userId` scope check). Never trust client-supplied IDs alone.
- **Sensitive data:** Secrets, keys, and passwords live only in `.env` / `.env.production` — never in code, logs, or committed files.
- **Input validation:** Validate and sanitize all user input at system boundaries (API routes, Server Actions). Reject unexpected shapes early.
- **Dependencies:** Prefer minimal dependencies. Flag any new package that has known CVEs or excessive permissions.
- **Infrastructure:** No service (Postgres, Meilisearch) is exposed to the public internet. All inter-service communication happens on the internal Docker network.
- **Headers:** Nginx must set `X-Content-Type-Options`, `X-Frame-Options`, and `Referrer-Policy` headers in production.

When reviewing or writing code, flag any potential OWASP Top 10 issue immediately before proceeding.

Project-specific security notes:

- Treat every feed URL as untrusted input. `validateFeedUrl()` currently checks URL syntax, `http`/`https`, DNS resolution, and private IPv4 ranges. If improving it, consider redirects, IPv6 private/reserved ranges, DNS rebinding, timeouts, and maximum response size.
- Server Actions are mutation boundaries. Validate and normalize inputs at the top of each action.
- Password reset must not reveal whether an email exists. Preserve the generic response behavior.
- Cron sync route requires `Authorization: Bearer ${CRON_SECRET}`.

## RSS And Search Flow

Feed creation:

1. `createFeedSource()` in `src/app/actions.ts` validates session and form input.
2. `validateFeedUrl()` in `src/lib/rss.ts` rejects invalid or private/reserved targets.
3. The RSS feed is parsed once with `rss-parser`.
4. A unique source slug is generated with `slugify()`.
5. `FeedSource` is created.
6. `syncFeed(source.id, prefetchedFeed)` upserts items and indexes them in Meilisearch.
7. If initial sync fails, the new source is deleted.

Sync:

- `syncAllFeeds()` syncs stale feeds for the current user, using a 30-minute freshness threshold.
- `src/app/api/cron/sync/route.ts` syncs all sources in chunks of 5 with bearer-token auth.
- `syncFeed()` calls `configureMeiliIndex()`, upserts `FeedItem` rows, indexes documents into the `items` index, then updates `lastSync`.

Search:

- `src/app/api/search/route.ts` requires a session.
- It first loads source IDs owned by the user, then builds a Meilisearch filter from those IDs.
- Keep `sourceId` filterable and `pubDate` sortable in `configureMeiliIndex()`.

## Design System: Digital Organicism

UI inspired by Frank Lloyd Wright — black/white base with a sparse organic palette used only for headings and accents.

- **Base colors:** Pure Black `#000000` and Pure White `#FFFFFF` for all backgrounds, borders, body text.
- **Organic accent:** Terracotta `#E2725B` (`text-terracotta`, `border-terracotta`) — used sparingly for headings, category labels, and interactive elements (buttons). Never as a general background.
- **Rule:** terracotta on text and borders only. All other surfaces remain black or white.
- **Geometry:** Sharp rectangular edges. `border-radius: 0` everywhere.
- **Typography:** Single sans-serif family (Inter). Headings: bold, all-caps, wide tracking.
- **Layout:** Strong horizontal lines (2px borders) for structure. Horizontal emphasis over vertical stacking.
- **Components:** Inputs and buttons feel "built into" the layout — not floating or superimposed.

Project-specific UI notes:

- Tailwind CSS 4 is configured through `@import "tailwindcss"` and `@theme inline` in `src/app/globals.css`.
- Current UI uses some symbolic text such as `NAV_ROOT`, `SOURCE_ID`, `SYNC_PATH`; keep that style coherent if extending existing screens.

## Component Patterns

- Server Components by default.
- Use `"use client"` only for state, event handlers, `useActionState`, router hooks, or browser APIs.
- `AddFeedForm`, `SearchBar`, `FeedItem`, sidebar toggles, and buttons with pending/local state are client components.
- Prefer Server Actions for app mutations unless a public/external API is explicitly required.
- Keep data fetching close to server pages/components. Avoid exposing private data to client components beyond the fields they render.

## Known Mismatches And Gotchas

- `src/proxy.ts` currently protects only `/`. Private routes also include `/search`, `/category/*`, `/source/*`, and future `/saved`; update the matcher before relying on proxy-level protection for all authenticated pages.
- `README.md` marks "Mark as read" as todo, but `markAsRead()` and client click handling already exist in a basic form.
- `README.md` says source page needs verification; `src/app/(app)/source/[slug]/page.tsx` exists and filters through user ownership.
- `src/lib/prisma.ts` enables query logging and includes an Italian comment. If touching it, keep code/comments English and consider log verbosity for production.
- `src/lib/utils.ts` has a shared `PASSWORD_REGEX`, but `src/app/actions.ts` currently duplicates the regex.
- `FeedList` renders many items inline inside one paragraph; be cautious when changing semantics/accessibility.
- `slugify()` uses underscores. Category route lookup replaces hyphens with spaces, while category names are stored uppercase; review route generation before changing category URLs.
- Existing git status shows an untracked `.codex` path. Do not delete or rewrite unrelated user/local files.

## Roadmap From README

Near-term:

- Verify and complete article/source view.
- Finish saved links / reading list:
  - save from feed,
  - save external URL with metadata fetch,
  - private `/saved`,
  - public toggle,
  - public profile `/{username}`,
  - auto-purge unsaved feed items older than 90 days.
- Improve mark-as-read UI if needed.
- Revise search UX: `/` shortcut, result layout, empty/loading states.
- Add light/dark theme with persisted preference.
- Add REST API for external clients, then Chrome extension.
- Export feeds as CSV.
- Add onboarding interest picker using curated seeds from `notes.md`.
- Add RSS feed creator for sites without feeds.
- Integrate RSSHub (https://docs.rsshub.app/) to generate RSS feeds for sites that don't offer them natively — allow users to subscribe to RSSHub routes directly from the add-feed UI.
- Improve accessibility toward WCAG 2.1 AA.

Optional / future:

- **Reader mode via `@mozilla/readability` + `jsdom`:** extract full article content from saved URLs (and optionally from RSS entries that only ship summaries). Apply the same URL validation logic as `validateFeedUrl()` before fetching. Integrate in the "save external URL" flow once saved links are complete. Note: the Go library at github.com/cixtor/readability is not suitable — use the JS implementation.

Business/infrastructure:

- Landing page with feed-finding tips.
- Freemium limits and Pro plan.
- Ads only on public profiles, never private dashboard.
- Staging protection, CDN/security, server hardening, OWASP practices, backups.
- AI agent integration — TBD.
- Vector database — TBD.

## Docker, Dev, Staging, And Deploy

Local development services use `docker-compose.yml`:

- `database`: `postgres:16-alpine`, container name `multivrss-db`, host port `5435` mapped to container `5432`, persistent volume `postgres_data`.
- `meilisearch`: `getmeili/meilisearch:latest`, container name `multivrss-search`, host port `7700`, persistent volume `meilisearch_data`, `MEILI_ENV=development`.
- Required local compose env vars: `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `MEILI_MASTER_KEY`.
- App dev server runs outside Docker with `npm run dev` on port `3002`.
- Local `DATABASE_URL` should point to localhost port `5435`; local `MEILI_HOST` should usually be `http://localhost:7700`.

Staging/production-style deployment uses `docker-compose.prod.yml`:

- `app`: image `multivrss-app:latest`, `restart: unless-stopped`, loads `${ENV_FILE:-.env.production}`, joins only the `internal` Docker network, and binds `127.0.0.1:3001:3000`. This means the app is reachable only from the host loopback unless Nginx or another reverse proxy exposes it.
- `db`: `postgres:16-alpine`, internal network only, persistent volume `pgdata`.
- `meilisearch`: `getmeili/meilisearch:v1.13`, internal network only, persistent volume `meilidata`.
- `db` and `meilisearch` are intentionally not published to public host ports in prod/staging.
- The compose file supports alternate env files with `ENV_FILE=.env.staging docker compose -f docker-compose.prod.yml up -d`.

Docker image details from `Dockerfile`:

- Uses `node:24-alpine` for `deps`, `builder`, and `runner` stages.
- Installs dependencies with `npm ci`.
- Runs `npx prisma generate` before `npm run build`.
- Runtime copies Next standalone output from `.next/standalone`, static assets, `public`, and `docker-entrypoint.sh`.
- Runtime sets `NODE_ENV=production`, `PORT=3000`, exposes `3000`, and starts `docker-entrypoint.sh`.
- `docker-entrypoint.sh` is minimal: `set -e` then `exec node server.js`.

Typical staging build/deploy flow:

```bash
docker build -t multivrss-app:latest .
ENV_FILE=.env.staging docker compose -f docker-compose.prod.yml up -d
```

Typical production flow:

```bash
docker build -t multivrss-app:latest .
docker compose -f docker-compose.prod.yml up -d
```

After deploys that include schema migrations, run migrations deliberately against the deployed database:

```bash
docker compose -f docker-compose.prod.yml exec app npx prisma migrate deploy
```

Deployment security reminders:

- Put Nginx in front of `127.0.0.1:3001` for staging/production TLS, hostnames, rate limits, and headers.
- Protect `staging.multivrss.com` with HTTP basic auth or an IP allowlist before exposing it.
- Keep Postgres and Meilisearch on the Docker `internal` network only.
- Never cache authenticated dashboard traffic through a public CDN. Public pages like a future marketing home page and `/{username}` can be considered for CDN caching only after session/cookie behavior is audited.
- Required production headers from the project spec: `X-Content-Type-Options`, `X-Frame-Options`, and `Referrer-Policy`.

## Implementation Checklist

Before coding:

1. Read `README.md`, ``, and this file for current priorities and constraints.
2. Read the relevant local Next.js docs under `node_modules/next/dist/docs/`.
3. Use `chub` for current dependency/API documentation when touching third-party APIs or adding/changing dependencies.
4. Check `git status --short` and avoid touching unrelated work.
5. Identify auth/ownership boundaries before changing queries or actions.

While coding:

1. Keep changes small and feature-scoped.
2. Prefer existing patterns before adding abstractions or dependencies.
3. Keep TypeScript strict. Do not introduce `any`.
4. Keep code, comments, and UI strings in English.
5. Revalidate affected paths after mutations.
6. If adding a Prisma model or field, create a migration and regenerate the client.
7. If adding searchable/filterable/sortable fields, update Meilisearch settings and indexing payloads together.

After coding:

1. Run the smallest relevant checks first, usually `npm run test` and/or `npm run lint`.
2. Run `npm run build` for route, Server Component, or framework-level changes.
3. For RSS/Meili changes, use the manual integration scripts when services are available.
4. Update `README.md`, ``, or `AGENTS.md` when behavior or workflow changes.

## Environment Variables

Common local variables:

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
```

Email variables depend on the active transport in `src/lib/email.ts`; inspect that file before changing password reset behavior.
