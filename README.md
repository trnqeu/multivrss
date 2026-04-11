# MultivRSS

A high-performance RSS aggregator SaaS. Stack: Next.js 16 (App Router, TypeScript), Tailwind CSS 4, PostgreSQL + Prisma 7, Meilisearch, Docker.

---

## Roadmap

### In progress

- [ ] **Fix OAuth sign-in (GitHub + Google)** — providers are declared but require the Prisma Adapter + `Account`/`Session`/`VerificationToken` schema models to persist OAuth users

### Core features

- [ ] **Meilisearch search bar** — full-text search UI over indexed feed items
- [ ] **Mark as read** — `FeedItem.read` field exists; needs server action + UI toggle
- [ ] **Saved/favorite articles** — schema change (`SavedItem` relation) + server action + UI
- [ ] **Sidebar toggle** — open/close the sidebar from the main layout

### Polish & extras

- [ ] **Article view** — verify and complete `src/app/source/[slug]/page.tsx`
- [ ] **REST API** — expose feeds via `src/app/api/feeds/route.ts` for external clients
- [ ] **AI agent integration** — TBD
- [ ] **Vector database** — TBD
