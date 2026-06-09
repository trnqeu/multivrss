<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# MultivRSS Agent Notes

Teaching mode, stack, commands, architecture quirks, and security rules. Keep this file updated when behavior or workflow changes.

## Teaching Mode — IMPORTANT

This project is a **learning exercise**. Do NOT write code for the user unless explicitly asked to.

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
npm run dev          # Next dev server (webpack, port 3002)
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

Manual integration checks:

```bash
npx ts-node --project tsconfig.test.json tests/test-rss.ts
npx ts-node --project tsconfig.test.json tests/test-meili.ts
```

Note: `tsconfig.test.json` uses CommonJS / `moduleResolution: node` for ts-node compat. The main `tsconfig.json` uses `module: esnext` (Next.js/webpack) which breaks direct ts-node.

## Stack & Quick Facts

- **Stack:** Next.js 16.2, React 19, TypeScript 5, Tailwind CSS 4, PostgreSQL 16, Prisma 7 (`@prisma/adapter-pg`), Meilisearch, NextAuth v4 (JWT), Docker.
- **Router:** App Router under `src/`. Private dashboard at `/u/{username}/`. Marketing homepage at `/` (redirects authenticated users).
- **Proxy:** `src/proxy.ts` (not middleware.ts). Matcher covers all non-public paths via regex. Protects `/u/*` routes via JWT. Supports staging Basic Auth via `STAGING_PASSWORD`.
- **Caching:** `cacheComponents: true` in `next.config.ts`. Use Next.js 16 Cache Components model.
- **Dynamic params:** `params: Promise<{ slug: string }>` — must be awaited.
- **Order matters:** call `revalidatePath()` before `redirect()` (redirect throws).
- **`"use cache"`:**
  - `src/lib/search.ts` caches `getSourcesForUser()` with `cacheLife('minutes')` and `cacheTag('sources:${userId}')`.
  - Do not put request-specific/private data inside shared `"use cache"` scope.
  - Use `connection()` to defer a route to request time when needed.
- **Key patterns:** Server Components by default; `"use client"` only for interactive forms. Server Actions handle all mutations. Prisma client uses `@prisma/adapter-pg` with a `pg.Pool` instance. Meilisearch is synced inside the RSS ingestion engine (`src/lib/rss.ts`) after each upsert.

## Auth & Security — Mandatory

Every Server Action, route handler, and server component touching private data must call `getServerSession(authOptions)` and scope queries through the ownership chain:

```
User → Category → FeedSource → FeedItem
```

Never trust client-supplied IDs. Always filter by `userId`.

**Specific rules:**
- **Cron sync** (`/api/cron/sync`): `Authorization: Bearer ${CRON_SECRET}`
- **Feed URLs:** treat as untrusted input — `validateFeedUrl()` checks syntax, DNS, private IPv4 ranges
- **Password reset:** never reveal whether an email exists (generic response)
- **Server Actions:** validate + normalize inputs at the top of each action
- **No raw SQL** — Prisma parameterized queries only
- **Injection:** Never interpolate user input into SQL, shell commands, or search filters without sanitization.
- **Sensitive data:** Secrets, keys, and passwords live only in `.env` / `.env.production` — never in code, logs, or committed files.
- **Dependencies:** Prefer minimal dependencies. Flag any new package with known CVEs or excessive permissions.
- **Infrastructure:** No service (Postgres, Meilisearch) exposed to public internet. All inter-service communication on internal Docker network.
- **Headers:** Nginx must set `X-Content-Type-Options`, `X-Frame-Options`, and `Referrer-Policy` headers in production.

## OWASP Secure Development — Mandatory

Apply OWASP Top 10 principles to every feature, every route, every Server Action:

1. **Input validation** — validate + sanitize + normalize all user input at the boundary. Use `validateFeedUrl()`, regex checks, length limits, type coercion. Never trust client data.
2. **Authentication & session** — `getServerSession(authOptions)` on every private endpoint. JWT in httpOnly cookie. No token in URL params or Referrer.
3. **Authorization (broken access control)** — always scope queries by `userId`. Never use client-supplied IDs without ownership check. Cascade deletes enforce data isolation.
4. **Injection (SQL, NoSQL, OS)** — Prisma parameterized queries only. Never interpolate into shell commands or search filter strings. Sanitize Meilisearch filter expressions.
5. **SSRF** — `validateFeedUrl()` checks DNS resolves to public IPs only (excludes RFC 1918, loopback, link-local). Same check before fetching arbitrary URLs in `resolvePageTitle`.
6. **Security headers** — CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy. Set in Nginx (production) or `next.config.ts`.
7. **Error handling & logging** — never expose stack traces, DB errors, or sensitive data to the client. Generic error messages externally; structured logging internally.
8. **Cryptography** — passwords hashed via NextAuth (bcrypt). No custom crypto. JWT secret via env var only.
9. **Rate limiting** — login, password reset, API endpoints rate-limited at Nginx level. Consider app-level for sensitive actions.
10. **Dependency hygiene** — `npm audit` before each deploy. Flag packages with known CVEs or excessive permissions. Avoid unnecessary dependencies.

## Accessibility Checklist — Mandatory

Every new component, page, or feature must satisfy these checks before merge. Treat failures as blocking.

### Semantic HTML
- [ ] Landmark elements (`<nav>`, `<main>`, `<aside>`, `<header>`, `<footer>`, `<section>`, `<article>`) used appropriately
- [ ] Heading hierarchy is strict: h1 → h2 → h3 → h4 → h5 (never skip levels)
- [ ] Exactly one `<h1>` per page
- [ ] Skip-to-content link present at top of every layout
- [ ] `<html lang="en">` set in root layout

### Forms & Inputs
- [ ] Every `<input>`, `<select>`, `<textarea>` has a `<label>` with `htmlFor` matching `id`
- [ ] Error messages associated to input via `aria-describedby`
- [ ] Error/success container has `role="alert"`
- [ ] Placeholder never used as sole label

### Keyboard & Focus
- [ ] All interactive elements reachable and operable via keyboard (Tab, Enter, Escape, arrow keys)
- [ ] `:focus-visible` outline defined globally — never use `outline-none` without a custom focus style
- [ ] Custom dropdowns/menus implement WAI-ARIA Authoring Practices (focus management, arrow keys, Escape)
- [ ] Modals and overlays implement focus trap when open
- [ ] Elements hidden on hover (`opacity-0 group-hover:`) also visible on focus-within (`group-focus-within:`)

### ARIA
- [ ] No redundant ARIA (use native semantics where possible)
- [ ] `aria-label` values are descriptive and contextual (not generic like "Menu")
- [ ] Multiple `<nav>` landmarks have distinct `aria-label` values
- [ ] Decorative overlay elements have `aria-hidden="true"`

### Color & Contrast
- [ ] Text smaller than 18pt / 14px bold: contrast ratio ≥ 4.5:1
- [ ] Text 18pt+ or 14pt+ bold: contrast ratio ≥ 3:1
- [ ] No information conveyed by color alone
- [ ] Dark mode has its own contrast-verified color tokens

### Dynamic Content
- [ ] Loading spinners have `role="status"` with `aria-live="polite"`
- [ ] Optimistic updates (read/save toggle) announce change via `aria-live` region
- [ ] Empty states communicated with `role="status"`
- [ ] Page title changes meaningfully between routes (`generateMetadata()` per page)

### Images & Media
- [ ] All `<img>` have `alt` attribute (descriptive for info, `alt=""` for decorative)

## Data Model

- `Category`: unique per user `[userId, name]`
- `FeedSource`: unique by `[categoryId, url]`, has global unique `slug`
- `FeedItem`: unique by `[sourceId, externalId]` (NOT globally unique)
- `PasswordResetToken`: per-user
- Cascade deletes: `Category → FeedSource → FeedItem`
- `FeedItem.externalId` is unique per source — used to deduplicate on upsert.
- Indexes on `FeedItem.sourceId` and `FeedItem.pubDate`.

## Design System

- **Base:** `#000000` + `#FFFFFF`. No grays, no shadows, no border-radius.
- **Accent:** Terracotta `#E2725B` — text/borders only, never backgrounds.
- **Font:** Inter (via `--font-inter`). Headings: bold, all-caps, wide tracking.
- **Layout:** Sharp 2px horizontal borders. No rounded corners.
- **Tailwind v4:** configured via `@import "tailwindcss"` + `@theme inline` in `src/app/globals.css`.
- **Inspiration:** Frank Lloyd Wright — black/white base with sparse organic palette used only for headings and accents.
- **Components:** Inputs and buttons feel "built into" the layout — not floating or superimposed.

## Repo Map

Key files an agent should know:

```text
src/app/
  (app)/                    Private route group at /
    page.tsx                Feed dashboard
    category/[slug]/        Category-filtered feed list
    source/[slug]/          Source-filtered feed list
    search/page.tsx         Search results
    layout.tsx              App shell with sidebar
  (marketing)/              Marketing route group at /
    page.tsx                Landing page (redirects authenticated users)
    layout.tsx
  actions.ts                Server Actions (CRUD, sync, auth, password)
  api/
    auth/[...nextauth]/     NextAuth route
    cron/sync/route.ts      Bearer-token cron sync
    search/route.ts         Meilisearch search proxy
  login|register|forgot-password|reset-password/

src/lib/
  auth.ts                   NextAuth options + custom Prisma adapter
  prisma.ts                 Prisma singleton (pg.Pool + PrismaPg adapter)
  rss.ts                    Feed validation + RSS ingestion/sync
  meili.ts                  Meilisearch singleton + index config
  search.ts                 searchFeedItemsForUser() with "use cache"
  email.ts                  Password reset via Resend
  utils.ts                  slugify, private IP check, PASSWORD_REGEX

src/proxy.ts                Request proxy (replaces middleware.ts)
tests/unit/                 Vitest unit tests (56 tests, 7 files)
```

## Dependency Docs With Chub

For current third-party API docs, use Context Hub (`chub`):

```bash
npm install -g @aisuite/chub
chub search "meilisearch"
chub get meilisearch/js --lang js
chub annotate stripe/api "Needs raw body for webhook verification"
```

Caveat: `chub` can hang while flushing PostHog telemetry. Use `timeout 25s chub ...` when needed.

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

## Known Gotchas

- `.gitignore` excludes `AGENTS.md`, `notes.md`, `GEMINI.md` — instruction files exist **only locally**, never committed.
- No `opencode.json` exists in the repo.
- `slugify()` uses underscores; category names stored uppercase; route lookup replaces hyphens with spaces.
- `PASSWORD_REGEX` duplicated in both `src/lib/utils.ts` and `src/app/actions.ts`.
- `src/lib/prisma.ts` has an Italian comment + verbose query logging enabled.
- `FeedList` renders items inline inside one `<p>` — be careful with semantics/accessibility changes.
- No `.env.example` — check `.env` locally for required vars.
- Existing untracked `.codex` path — do not delete or touch unrelated user files.

## Docker

**Local** (`docker-compose.yml`):
- Postgres `postgres:16-alpine` on host port `5435`, container `multivrss-db`
- Meilisearch `getmeili/meilisearch:latest` on host port `7700`, container `multivrss-search`
- App runs outside Docker on `npm run dev` port `3002`
- Local vars: `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `MEILI_MASTER_KEY`

**Prod/Staging** (`docker-compose.prod.yml`):
- All services on `internal` network only — no public ports for DB or Meilisearch
- App at `127.0.0.1:3001:3000` (loopback only, Nginx in front)
- Supports alternate env files: `ENV_FILE=.env.staging docker compose -f docker-compose.prod.yml up -d`
- Adminer: `docker compose -f docker-compose.prod.yml --profile tools up -d adminer`

**Deploy (staging CI):** `npm ci` → `npx prisma generate` → `npx tsc --noEmit` → `npm run lint` → SSH deploy into `~/multivrss` on `dev` branch push.

## Verification Order

1. `npm run test` + `npm run lint`
2. `npm run build` for framework/route/component changes
3. `npx ts-node --project tsconfig.test.json tests/test-rss.ts` or `tests/test-meili.ts` for RSS/Meili changes
4. After Prisma changes: create migration + `npx prisma generate`
5. When adding searchable/filterable/sortable fields: update Meilisearch settings + indexing payloads together
6. Update this file when behavior or workflow changes

## Environment Variables (local)

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

Email transport uses Resend (`RESEND_API_KEY`) — see `src/lib/email.ts`.

## References

- `README.md` — product vision, roadmap, tips & tricks (keep the roadmap section updated after each feature)
- `notes.md` — Adminer recipe, curated feed seed list for onboarding, personal notes

Every task should be checked against the roadmap in `README.md` to mark items as done or adjust scope.
