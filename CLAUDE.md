# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

---

## Project: MultivRSS

A high-performance RSS aggregator SaaS. Stack: Next.js 16 (App Router, TypeScript), Tailwind CSS 4, PostgreSQL + Prisma 7, Meilisearch, Docker.

---

## Commands

```bash
# Development
npm run dev           # Start Next.js dev server
npm run build         # Production build
npm run lint          # ESLint

# Database
docker-compose up -d                          # Start PostgreSQL (port 5435) + Meilisearch (port 7700)
npx prisma migrate dev --name <name>          # Create and apply a new migration
npx prisma migrate deploy                     # Apply existing migrations
npx prisma generate                           # Regenerate Prisma client after schema changes

# Integration tests (no test runner configured)
npx ts-node tests/test-rss.ts                 # Test RSS sync engine
npx ts-node tests/test-meili.ts               # Test Meilisearch connectivity
```

---

## Architecture

```
src/
  app/
    page.tsx        # Main feed view — React Server Component, queries Prisma directly
    layout.tsx      # Root layout
    actions.ts      # Server Actions (form mutations, e.g. createFeedSource)
    globals.css     # Tailwind v4 (@import "tailwindcss") + CSS custom properties
  components/
    Sidebar.tsx     # Category nav — RSC
    AddFeedForm.tsx # "use client" — uses useActionState (React 19) for form state
  lib/
    prisma.ts       # Prisma singleton with @prisma/adapter-pg connection pooling
    meili.ts        # Meilisearch client singleton
    rss.ts          # RSS sync engine: fetch → upsert Postgres → index Meilisearch
prisma/
  schema.prisma     # Models: Category → FeedSource → FeedItem (cascade deletes)
  migrations/       # Prisma migrations
tests/              # Manual integration tests (ts-node)
docker-compose.yml  # PostgreSQL 16 on port 5435, Meilisearch on 7700
```

**Key patterns:**
- Server Components by default; `"use client"` only for interactive forms.
- Server Actions handle all mutations — no API routes yet.
- Prisma client uses `@prisma/adapter-pg` (not the default engine) — pass a `pg.Pool` instance.
- Meilisearch is synced inside the RSS ingestion engine (`src/lib/rss.ts`) after each upsert.

**Data model:**
- `Category` (1) → `FeedSource` (N) → `FeedItem` (N)
- `FeedItem.externalId` is unique — used to deduplicate on upsert.
- Indexes on `FeedItem.sourceId` and `FeedItem.pubDate`.

---

## Guiding Principles (from project spec)

1. **Step-by-step:** Break tasks into small modules — do not generate the entire feature at once.
2. **Type safety:** Strict TypeScript. No `any`, no shortcuts.
3. **English only:** All code, comments, and UI strings must be in English — never Italian.
4. **Verify before moving on:** After each major step, confirm it works before proceeding.

---

## Design System: Digital Organicism

UI inspired by Frank Lloyd Wright — black/white base with a sparse organic palette used only for headings and accents.

- **Base colors:** Pure Black `#000000` and Pure White `#FFFFFF` for all backgrounds, borders, body text.
- **Organic accent:** Terracotta `#E2725B` (`text-terracotta`, `border-terracotta`) — used sparingly for headings, category labels, and interactive elements (buttons). Never as a general background.
- **Rule:** terracotta on text and borders only. All other surfaces remain black or white.
- **Geometry:** Sharp rectangular edges. `border-radius: 0` everywhere.
- **Typography:** Single sans-serif family (Inter). Headings: bold, all-caps, wide tracking.
- **Layout:** Strong horizontal lines (2px borders) for structure. Horizontal emphasis over vertical stacking.
- **Components:** Inputs and buttons feel "built into" the layout — not floating or superimposed.

---

## Environment Variables

```env
DATABASE_URL=postgresql://[USER]:[PASSWORD]@localhost:5435/multivrss-db?schema=public
MEILI_HOST=http://localhost:7700
MEILI_MASTER_KEY=<key>
```

No `.env.example` exists — check `.env` locally.
