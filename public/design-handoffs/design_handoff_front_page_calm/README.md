# Handoff: Front Page — Calm redesign

## Overview
A calmer, less dense redesign of MultivRSS's personalized "Front Page" (the
curated digest view, as opposed to the chronological "River"). The original
Front Page packed three competing meta rows onto every card, a busy
always-visible action row, and a mystery-glyph "why this was picked" signal.
This redesign strips that back so headlines carry the page: hover-reveal
actions, a single dateline, terracotta used sparingly as a wayfinding accent
rather than a decoration, and no more inline reason/afﬁnity chrome.

## About the Design Files
The files in this bundle are **design references built in HTML/React**
(inline Babel JSX, no build step) — they show intended look, structure and
interaction, not production code to lift verbatim. The task is to **recreate
this design in the target codebase's existing stack** (whatever that is —
React/Vue/Swift/etc.), using its existing component patterns, data layer and
routing, not by embedding this HTML.

## Fidelity
**High-fidelity.** Colors, type, spacing and interaction states below are
final for this direction. Recreate pixel-for-pixel where the codebase's
component primitives allow; if a value doesn't map cleanly to an existing
token scale, prefer the closest existing token over introducing a new one and
flag the mismatch.

## Screens / Views
This bundle covers one view: **Front Page** (`.fp`), rendered inside the
existing app shell (left sidebar + top bar, unchanged from the live product —
included here only for layout context).

### 1. Masthead (`.mast`)
- One-line dateline (default / "oneline" state): `Mon, Jun 22 · Curated from
  25 read, 2 saved across 11 categories`. Mono font, 10px, uppercase,
  letter-spacing .06em, color `--fg45`; the counts (`25 read`, `2 saved`,
  `11 categories`) are bold and darker (`--fg70`).
- An alternate "full" masthead state exists (see Tweaks below) with three
  stacked meta rows (edition name + date + assembly note; then the curated
  counts). **The middle "legend" row explaining the ◆/✦ reason glyphs has
  been removed along with the reason system — do not port it.**
- Padding: `38px 0 0` top of section.

### 2. For You strip (`.band` → `.strip`)
- Kicker row: `FOR YOU` (11px, 800 weight, letter-spacing .24em, uppercase,
  color `--fg`) + a 1px hairline (`--fg14`) filling the remaining width.
  20px gap below before the grid.
- 4-card grid, `grid-template-columns: repeat(4, 1fr)`, `gap: 30px`.
- Each card (`.card`): 2px solid top border (`--fg`, full-bleed rule per
  card, not the whole strip), 14px padding-top, `flex-direction: column`,
  gap 11px.
  - **Category tag** (`.card__cat`): 9px, 800 weight, letter-spacing .16em,
    uppercase, color **terracotta `--tc` (#E2725B)** — this is a deliberate,
    permanent color choice (not just an accent-mode toggle), confirmed by the
    user in this session. Do not revert it to muted gray.
  - **Title** (`.card__title`): serif (Newsreader), 600 weight, 19px,
    line-height 1.2, letter-spacing -.01em. Hover → terracotta.
  - **Footer** (`.card__foot`): source · date meta (see Meta component below)
    + hover-reveal actions, pinned to bottom of card via `margin-top: auto`.
  - **No reason/affinity chrome on these cards** — it was removed entirely
    (see "What changed" below).

### 3. Category sections (`.sects` → one `.sect` per category)
- Section header (`.sect__head`): category name (`.sect__name`, 13px, 800
  weight, letter-spacing .22em, uppercase, color **terracotta `--tc`** — same
  rule as the For You card tags: always terracotta, not just under the
  "everywhere" accent tweak) + a hairline filling remaining width. **No
  "See all" here anymore** (moved — see below) and **no border-top divider
  between sections** (removed per user request — sections are separated by
  padding + the footer link only, no rule).
- Body (`.sect__body`): 2-column grid, `1.45fr 1fr`, 48px gap.
  - **Lead** (`.lead`, left column): serif title 27px/600/line-height 1.14,
    optional dek (serif, 15px, line-height 1.55, color `--fg55`, capped at
    50ch), then source·date + hover actions.
  - **List** (`.list`, right column): remaining items as rows, 15px
    vertical padding each, 1px hairline between rows (`--fg09`, no border on
    last row), serif title 17px/500, then source·date + hover actions.
  - **No "why"/reason line anywhere** in leads or rows — removed (see below).
- **Section footer** (`.sect__foot`): a single right-aligned "See all"
  control, **moved from the section header to the bottom of the section
  block** per user request — it now reads as the section's closing element
  instead of a top-right link, and takes over the job the divider rule used
  to do (visually capping the block).
  - Copy: `See all in {Category}` + a `→` arrow in a separate span.
  - Style: small bordered button, not a text link / not underlined (the user
    explicitly rejected underline treatments). `1px solid var(--fg22)`
    border, `2px` border-radius, `6px 11px` padding, 9.5px/800/letter-spacing
    .1em uppercase, color `--fg55` at rest.
  - Hover: border and text color → terracotta (`--tc`); the arrow span
    translates `3px` to the right (`transition: transform .16s`) — a small
    directional nudge, not a color-only hover.

## What changed (do not reintroduce)
1. **Removed the "why" reason signal entirely** — previously every lead and
   (optionally) every row showed a glyph (◆ for "source affinity" picks, ✦
   for "similarity" picks) plus a short reason phrase (e.g. "You saved 3 from
   Stratechery"). The user found the glyphs cryptic ("simbolo... non mi
   piace") and ultimately asked to drop the whole line, not just re-skin it.
   The underlying data (`item.reason`, `item.reasonType`, `item.affinity`)
   is still present in `data.js` for other views/future use, but the Front
   Page no longer renders it. **Do not add a legend, tooltip, or badge for
   this system on this screen.**
2. **Category labels are always terracotta** — both the For You card tag and
   the section name. This was previously conditional on an "accent:
   everywhere" debug tweak; it's now the shipped default regardless of that
   tweak's state.
3. **No divider rule between category sections** — spacing alone (34px
   padding top/bottom per section) separates them now.
4. **"See all" moved to the bottom of each section**, restyled as a bordered
   button (see above), never underlined.

## Interactions & Behavior
- **Hover-reveal actions** (`.acts`, opacity 0 → 1 on card/lead/row hover):
  save (bookmark outline), tag (+), dismiss (×). 12–16px icons, `--fg35` at
  rest, terracotta on hover. In the alternate "busy" chrome tweak these are
  always visible (`opacity: 1`) — the shipped default is hover-reveal
  ("calm").
- **Title hover**: color → terracotta, 0.12s.
- **See-all hover**: border + text → terracotta, arrow nudges right 3px.
- No click-through/navigation logic is implemented in this static mock —
  titles/rows are visually interactive elements only; wire real navigation
  in the target app.

## Responsive / Mobile — read carefully
The prototype's mobile behavior was audited and fixed in this session; the
following are load-bearing, not incidental:

- **Sidebar** (`.sb`, 236px, left rail with nav + category counts): hidden
  entirely below **760px**. Below that width the app is single-column,
  content-only — the target app should use its own drawer/hamburger pattern
  to restore navigation access on mobile, this mock doesn't include one.
- **Top bar** (`.top`) — **this is the part that was actually broken and
  fixed**: at full width it lays out search box (240px min-width) + tab
  switcher (Front Page / River) + 3 secondary actions (+Source, URL, ↻ Sync)
  + 2 icon buttons, all in one row with no wrapping. Measured overflow at a
  390px viewport: **666px of content in a 388px container** — tabs, Sync,
  and the icon buttons were pushed off-screen and inaccessible. Fix applied
  below 760px:
  - Search box collapses to icon-only (`min-width:0; flex:0 0 auto`,
    placeholder text hidden via `.search__ph{display:none}`).
  - The two lowest-priority actions, **"+Source" and "URL"**, are hidden
    entirely (`.tbtn--source, .tbtn--url{display:none}`) — they're power-user
    actions, acceptable to drop from the compact bar or move behind a menu
    in the real implementation.
  - **Sync (↻) and the two trailing icon buttons stay visible** — these were
    treated as must-keep. Tabs (Front Page / River) also remain, unshortened.
  - `.top` padding tightens to `0 14px`, gap to `8px`.
  - **This top-bar behavior is a mock-level patch, not a final spec.** It
    proves the content fits; the real implementation should design a proper
    compact/mobile top bar (e.g. overflow menu for Source/URL, or a second
    row) rather than just hiding those two actions — flag this to design if
    a better mobile top-bar treatment is wanted before building.
- **For You strip**: 4 columns → 2 columns at ≤1180px → 1 column at ≤760px.
- **Section body** (lead + list, `1.45fr 1fr`): collapses to a single
  column (`1fr`, 24px gap) at ≤1180px — list stacks below the lead.
- No behavior changes below 760px for section footer / See-all button —
  it stays as-is, right-aligned, full width available since strip is 1 col.
- Not addressed in this mock (call out if relevant to your target): no
  distinct phone-frame/touch-target audit was done beyond the top bar fix;
  verify tap target sizes (≥44px) when adapting to a native mobile surface.

## Design Tokens
Colors (CSS custom properties, cream/terracotta theme):
- `--bg: #f6f3ec` (page background)
- `--fg: #000` (ink)
- `--tc: #E2725B` (terracotta accent — category labels, hover states, active
  tab underline)
- `--fg70: rgba(0,0,0,.70)` / `--fg55: rgba(0,0,0,.55)` /
  `--fg45: rgba(0,0,0,.45)` / `--fg35: rgba(0,0,0,.35)` /
  `--fg22: rgba(0,0,0,.22)` / `--fg14: rgba(0,0,0,.14)` /
  `--fg09: rgba(0,0,0,.09)` / `--fg05: rgba(0,0,0,.05)` — black-alpha ramp
  used for all secondary text, hairlines, and borders (no separate gray hex
  values are used anywhere).

Typography:
- Mono: `"JetBrains Mono", ui-monospace, monospace` — all UI chrome (labels,
  meta, buttons, nav).
- Serif: `"Newsreader", Georgia, serif` — all editorial content (titles,
  deks). Loaded via Google Fonts with weights 400/500/600 + italic 400.

Spacing / radius:
- Card grid gap 30px; section body gap 48px; section vertical padding 34px.
- Border radius is minimal throughout: `2px` on buttons/pills (search box,
  see-all, nav items) — this is a sharp, editorial system, not a rounded one.
- Rule weights: 2px solid for structural dividers (card top-border, sidebar
  border, top-bar border), 1px for hairlines (`--fg14`/`--fg09`).

No shadows are used anywhere in this design — flat, bordered surfaces only.

## Assets
- `assets/multivrss-ico.png` — sidebar brand mark (30×30). Sourced from the
  existing product assets, not newly created for this design.
- No other imagery; this view is text/typography-led by design.

## Files in this bundle
- `Front Page - Calm.html` — standalone runnable reference (open directly in
  a browser; no build step, loads React/Babel from CDN).
- `frontpage/calm.jsx` — the Front Page components (Sidebar, TopBar,
  Masthead, ForYou, Section, FrontPage). **This is the primary file to read**
  for exact markup/structure.
- `frontpage/calm-app.jsx` — app shell wiring + the Tweaks panel config used
  during design exploration (`chrome`: calm/busy, `header`: oneline/full,
  `accent`: restrained/everywhere). These tweaks are a design-exploration
  aid, not a feature to ship — the shipped defaults are `chrome: calm`,
  `header: oneline`, `accent: restrained` (with the two exceptions noted
  above — category-label terracotta is unconditional, not tied to the accent
  tweak).
- `frontpage/data.js` — sample data shape (`CATS`, `LEAD`, `FORYOU`,
  `STORIES`, `RIVER`). Confirms the `reason`/`reasonType`/`affinity` fields
  still exist on each item even though Front Page no longer displays them.
- `frontpage/tweaks-panel.jsx` — generic tweaks-panel harness (design-tool
  scaffolding, not part of the product UI).
