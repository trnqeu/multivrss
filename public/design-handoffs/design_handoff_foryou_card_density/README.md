# Handoff: For You card — density cleanup (Variant B) + river consistency

## Overview
The personalized **Front Page** "For You" cards became too dense once save/tag were added: under
each title sit **two metadata rows** carrying up to 8 competing signals —
`source · date · +TAG · ● · ◇` then `◆/✦ · reason text · affinity bar · number` — inside a card
only ¼-column wide.

This handoff specifies the agreed fix (**Variant B · "One line"**): collapse the card footer to a
**single tidy row**, drop the duplicate "why" diamond, drop the read-dot, replace the cryptic
affinity bar+number with a tiny 3-tick strength meter, and use the **same bookmark + `+ TAG`
logic as the river** so save/tag behaves identically everywhere.

## About the Design Files
`Front Page Card — Minimal.html` (with `card-minimal.jsx`, `design-canvas.jsx`) is a **design
reference created in HTML** — a side-by-side study showing the **current dense baseline** next to
three minimal directions. **Variant B is the one to build.** It is not production code: recreate it
in the existing MultivRSS codebase (Next.js App Router + React + Tailwind, terracotta/foreground/
background tokens, `font-mono`/`label-system` utilities) using the components already there.

## Fidelity
**High-fidelity.** Colors, type, spacing, and the consolidated control group are final as shown in
the **B · One line** artboard. Baseline / A / C artboards are context only.

## The change — Variant B

### Card anatomy (For You strip card)
Before (two rows):
```
[CAT]                              ◆        ← top: cat tag + reason glyph (remove glyph)
Title (serif, 3 lines)
source · date  + TAG  ●  ◇                  ← action row (collapse)
◆ SIMILAR TO YOUR READS  ──bar── 100        ← reason row (remove)
```
After (one row):
```
[CAT]
Title (serif, 3 lines)
▍▍▎ source ················ ⌗  + TAG          ← single foot row
```
Where `▍▍▎` = 3-tick strength meter, `⌗` = the river bookmark.

**Remove from the card:**
- the top-right reason glyph (`◆`/`✦`) — duplicated the masthead legend and read as a mystery symbol;
- the second `<Reason>` row entirely (glyph + reason text + 34px affinity bar + number);
- the read-dot `●` action (marking read happens when the article link is opened — confirm
  `FrontPageLink` already calls `markAsRead` on click; if so the explicit toggle is redundant).

**Keep, on one `flex items-center gap-2` foot row, in this order:**
1. **Strength meter** — 3 ticks. `ticks = Math.round(affinity / 100 * 3)`. Each tick `3px × 8px`,
   `gap 2px`; filled = `terracotta`, empty = `foreground/15`. `title="${affinity}% match"`.
   (Replaces the bar+number; communicates match strength without a literal number.)
2. **Source** — `text-[9px] font-bold uppercase tracking-[.14em] text-foreground/40 font-mono truncate`.
3. **Actions** (`ml-auto flex items-center gap-2`, always visible):
   - **Bookmark** save — use the existing `<Bookmark>` from `@/components/icons/Bookmark`
     (the river's icon, `M2 1.6 H12 V14.4 L7 10.4 L2 14.4 Z`). `filled` when saved,
     `text-terracotta`; unsaved `text-foreground/40 hover:text-terracotta`. size ~12.
   - **`+ TAG`** button — `border border-current font-mono text-[9px] font-bold uppercase
     text-foreground/30 hover:text-foreground px-1 py-0.5 leading-none whitespace-nowrap`,
     opens `AssignTagsModal` (existing).

The "why" (source vs similar) is **not shown as a symbol on the strip card** anymore — it stays
explained in the masthead legend. If you want to retain it, expose `reasonType` only via the
meter's `title` tooltip — never as an on-card glyph.

### Where to edit
- `src/components/FrontPage.tsx` → `ForYouCard` (the strip card): rebuild the footer as above; drop
  the `<Reason>` call inside the card and the top-right glyph span.
- `src/components/FrontPageItemActions.tsx`: this is the shared action cluster (`+ TAG`, `●`, `◇`).
  Drop the read-dot `●`; replace the `◇` text button with `<Bookmark filled={saved} … />`; order
  it **bookmark then `+ TAG`** to match the river. Keep all existing logic
  (`saveFeedItem`/`unsaveFeedItem`, optimistic `saved` state, `AssignTagsModal`, tag chips).
- The **category-section lead & list rows** in `FrontPage.tsx` (`CategoryColumn`) also render
  `FrontPageItemActions` + `<Reason>`. For consistency, apply the **same consolidated control
  group** there (bookmark + `+ TAG`); the larger lead card may keep `<Reason>`'s affinity since it
  has room, but the read-dot/`◇` should still become the shared bookmark. (Secondary to the strip
  card, but do it for a coherent page.)

## River consistency (required)
The user explicitly wants the **same bookmark + tag logic in the river**. Today the two river
renderers disagree:
- `src/components/SearchBar.tsx` (the **default river** on `?view=river`): has the `<Bookmark>` save
  but **no inline `+ TAG`**. → **Add `+ TAG`** next to the bookmark, opening `AssignTagsModal`,
  same markup/order as the front page card.
- `src/components/FeedItem.tsx` (used by `FeedList`): already has `+ TAG` + `<Bookmark>` but with
  its own spacing/border weights. → Align it to the shared pattern.

**Recommendation:** extract one small client component — e.g. `SaveTagControls({ itemId, saved,
tags, allTags })` — that renders `[<Bookmark>] [+ TAG]` with the shared logic
(`saveFeedItem`/`unsaveFeedItem`, `AssignTagsModal`, optimistic state, tag chips), and use it in:
`ForYouCard`, `CategoryColumn` (lead + rows), `FeedItem`, and the `SearchBar` river item. One
component = guaranteed identical icon, order, sizes, and behavior on the front page and the river.

## Interactions & States
- **Save**: click bookmark → optimistic toggle, `saveFeedItem`/`unsaveFeedItem`. Saved =
  filled terracotta bookmark.
- **Tag**: click `+ TAG` → `AssignTagsModal`; applied tags render as `#tag` chips before the
  controls (existing behavior).
- **Read**: on opening the article link (`FrontPageLink` / river `<a>`), mark read → row dims to
  `opacity-30` in the river; no separate read button on the card.
- Controls are **always visible** in Variant B (not hover-gated). Hover only changes color.
- Responsive: unchanged; the single foot row fits the ¼-column card at all breakpoints because the
  number/bar that used to overflow is gone.

## Design Tokens
| Token | Value |
|---|---|
| `--bg` / `--fg` / terracotta | `#000` / `#fff` / `#E2725B` |
| fg opacities used | /55 /40 /30 /20 /15 |
| Mono / Serif | `JetBrains Mono` / `Newsreader` |
| Cat tag | 8.5px / 800 / .16em / uppercase, terracotta, `border 1px terracotta/40`, pad `2px 6px` |
| Title | serif 15px / 600 / line-height 1.28, **3-line clamp** |
| Foot row | `flex items-center gap-2`, `mt-auto` |
| Strength meter tick | `3 × 8px`, gap 2px · on terracotta · off fg15 |
| Source | 9px / 800 / .14em / uppercase / fg40 / truncate |
| Bookmark | `@/components/icons/Bookmark`, size ~12, fg40 → terracotta (filled when saved) |
| `+ TAG` | mono 9px / 800 / uppercase, `border 1px current`, fg30 → fg, pad `1px 4px`, nowrap |

## Removed (net density win)
Per card: **−1 metadata row**, and these elements gone — reason glyph (×1 on card face), affinity
bar (34px), affinity number, read-dot `●`. Net: from ~8 footer signals to **4** on one line.

## Assets
- Save icon: existing `@/components/icons/Bookmark` (no new asset).
- All other glyphs/meter are CSS/inline — no raster assets.

## Files
- `Front Page Card — Minimal.html` — comparison study (baseline + A/B/C). Build **B**.
- `card-minimal.jsx` — the React source for the four card variants (see `CardB`).
- `design-canvas.jsx` — canvas host (presentation only; not part of the feature).
- Live codebase touch-points: `src/components/FrontPage.tsx`,
  `src/components/FrontPageItemActions.tsx`, `src/components/FeedItem.tsx`,
  `src/components/SearchBar.tsx`, `src/components/icons/Bookmark.tsx`,
  `src/components/AssignTagsModal.tsx`, `src/app/actions.ts`
  (`saveFeedItem`, `unsaveFeedItem`, `setFeedItemTags`).
