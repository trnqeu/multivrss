# Handoff: Personalized FRONT PAGE (curated view alongside the RIVER)

## Overview
A second way to read the feed. Today the dashboard shows only the **RIVER** — a flat, newest-first stream (`SearchBar.tsx`). This adds a **FRONT PAGE**: a newspaper-style, *curated* view that surfaces items most like what the user has **read or saved**, organized into a **FOR YOU** band + **per-category sections**. The user flips between the two with a tab switch above the content.

Locked product decisions (from the owner):
- **Switch placement:** tabs above the content (`≡ RIVER` / `▤ FRONT PAGE`), with a "CURATED FOR YOU" hint on the right.
- **Default view:** FRONT PAGE.
- **Front-page layout:** **Sections** (FOR YOU strip on top + an equal-weight category grid below).
- **"Why" signal:** **affinity** — every pick shows its reason + a match meter.
- **No sidebar entry** for the Front Page (the tabs are the only switch — avoid redundancy).

## Fidelity
**High-fidelity, interactive.** The prototype (`Personalized Front Page.html`) is the source of truth for layout, type, spacing and the "why" treatment. Rebuild in the real **Next.js 16 / React 19 / Tailwind v4** stack using the existing design system: sharp 2px borders, no radius, no shadows, **JetBrains Mono** for UI/labels, **Newsreader** (serif) for editorial headlines & deks, terracotta `#E2725B` accent.

> The prototype exposes other layouts (editorial / digest) and switch styles (segmented / pill) as **Tweaks** — those were exploration only. Ship the locked config above; the alternates are there if you want to compare.

## The two recommendation engines (build exactly these)
Each surfaced item is tagged `reasonType` and shown with a distinct glyph:

| Engine | `reasonType` | Glyph | How it's computed | Example reason |
|---|---|---|---|---|
| **Source affinity** | `source` | ◆ | Rank the user's feeds by read/save frequency; pull each top source's freshest **unread, unsaved** items. | "You saved 3 from Stratechery" · "You read Platformer daily" |
| **Meilisearch similarity** | `similar` | ✦ | Take the user's recent read/saved items as **queries** against the Meili index, filter out already-read & already-saved, keep the most relevant by ranking score. | "Similar to 'Deep Work' you saved" · "Matches what you read this week" |

`affinity` (0–100) drives the meter: for `similar` it's `_rankingScore × 100`; for `source` it's the normalized read/save frequency.

**Full server reference:** `getFrontPage.reference.ts` in this bundle — a complete, codebase-shaped implementation that reuses `lib/meili.ts`, the ownership-filter pattern from `lib/search.ts`, and Prisma's `FeedItem` (`read`, `savedAt`, `pubDate`, `sourceId`). Read its bottom-of-file NOTES for version caveats (`savedAt IS NULL`, `showRankingScore`, batching via `multiSearch`, caching/invalidation, empty-state fallback).

## Files to modify / add
| File | Change |
|---|---|
| `src/lib/frontpage.ts` | **New** — `getFrontPage(userId)` (see reference). Two engines → merge → group by category → rank. |
| `src/components/FeedViewSwitch.tsx` | **New** — client tab switch (`≡ RIVER` / `▤ FRONT PAGE`). Drives which view renders; persist choice in `?view=` so it deep-links. |
| `src/components/FrontPage.tsx` | **New** — the curated view (Masthead + FOR YOU strip + category grid + `Reason`). Server component fed by `getFrontPage`; mark-read/save buttons reuse existing actions. |
| `src/app/u/[username]/page.tsx` | Render the switch + conditionally `<SearchBar />` (river) or `<FrontPage />` based on `?view`. |
| `src/components/Sidebar.tsx` | **No change** — do **not** add a Front Page nav item (decision). |

## Wiring the switch (page.tsx)
The river is `<SearchBar />` (a client component reading `?q/?cat/?read`). Keep it. Add a `view` param:

```tsx
const view = (searchParams.view === 'river') ? 'river' : 'front';   // default: front
…
<FeedViewSwitch view={view} />            {/* tabs; pushes ?view= */}
<main className="…overflow-y-auto…">
  {sourceCount === 0
     ? <EmptyStream variant="no-sources" />
     : view === 'river'
        ? <SearchBar />
        : <FrontPage data={await getFrontPage(session.user.id)} />}
</main>
```

- `FeedViewSwitch` is `'use client'`; on click it does `router.push('?view=front'|'river')` (merge with existing params so a `?cat`/`?q` survives). Render as tabs on a `border-b-2 border-foreground` row — see prototype `.vtabs`.
- `FrontPage` can be a **server component** (data fetched on the server). The per-item **mark read / save** buttons are the only interactive bits — extract them into a tiny client component that calls the existing `markAsRead` / `saveFeedItem` actions (same optimistic pattern as `SearchBar`).

## Front Page structure (Sections layout)
Mirror `frontpage/frontpage.jsx → Sections` + `Personalized Front Page.html` CSS:

1. **Masthead** — "THE FRONT PAGE" (Newsreader, uppercase), a 3px rule, a dateline, and a **legend**: `◆ FROM SOURCES YOU FOLLOW · ✦ SIMILAR TO YOUR READS & SAVES`.
2. **Telemetry** (curated variant) — `CURATED FROM <n> READ · <n> SAVED · ACROSS <n> CATEGORIES · UPDATED 4M AGO` (from `stats`).
3. **FOR YOU strip** — 4 cards (`forYou[]`) in a 1px-gap sharp grid; each shows category tag, serif title, source · date, and a `Reason`.
4. **Category grid** — `sections[]`, one column per category: header rule + count, the first item rendered larger (lead), the rest as a list. Lead shows its `Reason`.

### The `Reason` component (the "why")
See `frontpage/frontpage.jsx → Reason`. Inputs: `{ reason, reasonType, affinity }` + the `signal` mode (`affinity` shipped). Renders: glyph (◆/✦) + uppercase reason text + a small terracotta match bar with the number. Keep the tooltip copy distinct per engine ("source affinity" vs "relevance").

## Design tokens
| Token | Light | Dark |
|---|---|---|
| `--background` | `#f6f3ec` | `#000000` |
| `--foreground` | `#000000` | `#FFFFFF` |
| `--terracotta` | `#E2725B` | `#E2725B` |

UI/labels: JetBrains Mono, `text-[9px]–[11px] font-bold uppercase tracking-widest`. Editorial headlines/deks: **Newsreader** serif (add to the font setup if not present). Match bar: 34×4px, `bg-foreground/15` track + terracotta fill. Sharp grid gaps use a 1px `bg-foreground/15` between `bg-background` cells. No radius, no shadows.

## Accessibility
- Tabs: `role="tablist"` / `role="tab"` + `aria-selected`; the rendered view is the panel.
- Each pick is a link to `item.link` (`target="_blank" rel="noopener noreferrer"`); mark-read/save are buttons with `aria-label` + `title`, focus-visible outlines.
- The match meter is decorative — put the number in text and an `aria-label`/`title` ("88% relevance").
- Light/dark + `prefers-reduced-motion` (no essential motion here).

## Files in this bundle
- `Personalized Front Page.html` — the interactive prototype (open it). Toggle **Tweaks** to compare layouts/switch styles; **ship the locked config** (tabs · front default · sections · affinity).
- `frontpage/` — prototype source: `data.js` (sample corpus with `reason`/`reasonType`/`affinity`), `chrome.jsx` (sidebar/topbar/telemetry/river), `frontpage.jsx` (the three layouts + `Reason`), `app.jsx` (view state + Tweaks), `tweaks-panel.jsx`.
- `getFrontPage.reference.ts` — production-shaped server logic for both engines. **The implementation contract.**

## Verification
1. `npm run lint` · `npm run build`.
2. `npm run dev` (port 3002) → dashboard opens on **FRONT PAGE** by default; tabs flip to RIVER and back; `?view=` updates and deep-links.
3. Confirm FOR YOU + category sections render, each pick shows ◆/✦ + reason + match meter; numbers in the telemetry match `stats`.
4. Read or save a few items, re-sync → those items drop out of recommendations (filtered) and affinities shift.
5. New-user / no-history account → page falls back to newest-per-category, never blank.
6. No Front Page entry in the sidebar. Light/dark pass.
