# Handoff: Empty-State Onboarding (new user, no feeds)

## Overview
When a new MultivRSS user has **0 feed sources**, the home route currently renders
`EmptyStream variant="no-sources"` — a dead-end with a single "+ ADD FIRST SOURCE" button.
This redesign replaces that dead-end with a **cold-start onboarding** that gets the user to a
populated front page in one click, while still offering manual paths.

It introduces a **starter-pack** concept: curated bundles of feeds (drawn from the existing
`SUGGESTED_FEEDS`) that the user can add as a group. One bundle ("The Essentials") is promoted
as a one-click "instant start"; the rest are pickable. Both fall back to the existing
`/suggested` directory and the manual add-URL flow.

## About the Design Files
The file in this bundle (`Empty State Onboarding.html`) is a **design reference created in
HTML/CSS/vanilla JS** — a prototype showing the intended look and behavior, **not production
code to copy directly**. The task is to **recreate this design inside the existing MultivRSS
codebase** (Next.js App Router + React + Tailwind, with the `terracotta`/`foreground`/`background`
tokens and `label-system` / `font-mono` utilities already defined). Reuse the app's existing
components (`EmptyStream`, `Sidebar`, server actions) and patterns rather than porting the
standalone JS.

## Fidelity
**High-fidelity.** Final colors, typography, spacing, copy and interaction timings are all
intended as shown. Recreate pixel-faithfully using the codebase's existing Tailwind tokens.
The one exception: the populated front page after onboarding is a **stub** in the prototype —
in the real app it's the existing `<FrontPage>` once `sourceCount > 0`.

## Where this lives in the codebase
- Trigger: `src/app/u/[username]/page.tsx` — currently `sourceCount === 0` → `<EmptyStream variant="no-sources" />`.
  Replace that branch with the new `<OnboardingEmptyState />`.
- Data source for packs: `src/lib/suggested-feeds.ts` (`SUGGESTED_FEEDS`).
- Add server action(s): `src/app/actions.ts` (next to `createFeedSource`).
- Directory link target already exists: `src/app/u/[username]/suggested/`.

---

## Screens / Views

The onboarding is one screen rendered inside the standard app chrome (sidebar + top bar). It has
**four states** driven by local state, not four routes.

### State 1 — IDLE (the empty state)
Centered column, `max-width: 760px`, padding `60px 32px 100px`, `text-align:center`.

Top to bottom:
1. **Logo mark** — `multivrss-ico.png`, `width:120px`, height auto, `opacity:.95`.
2. **Wordmark** — text "multivrss", `26px / 800 / letter-spacing .24em / uppercase`, color `--tc`, `margin-top:18px`.
3. **Signal badge** — inline-flex pill, `border:1px solid rgba(226,114,91,.4)`, padding `5px 12px`,
   `margin-top:26px`. Contains a `6×6` terracotta dot + text **`00 SOURCES · STANDBY`**
   (`10px / 800 / letter-spacing .26em`, color `--tc`).
4. **Title** — serif (Newsreader), `600 / 40px / line-height 1.08 / letter-spacing -.02em`,
   text **"No signal yet."**, `margin-top:20px`.
5. **Subline** — `13px / 500`, color `--fg55`, `line-height 1.6`, `max-width 42ch`, `margin-top:14px`.
   Text: **"Feed the reader. Drop in a `<b>`starter pack`</b>` and the stream comes alive — or wire up sources by hand."**
   (`<b>` = color `--fg`, weight 700.)
6. **Divider rule** — flex row, label **`FASTEST WAY IN`** (`10px / 800 / .22em`, `--fg40`) + 1px hairline `--fg15`. Margins `40px 0 24px`.
7. **Instant-start banner** (see Components).
8. **Divider rule** — label **`OR PICK A PACK`**.
9. **Starter-pack grid** — 4 cards (see Components).
10. **Fallback paths** — 2 rows (see Components), `margin-top:26px`.

### State 2 — WORKING (adding a pack)
Replaces the column content while the batch add runs.
- Logo mark at `opacity:.5`, wordmark.
- Spinner (`34×34`, `3px` ring, top border `--tc`, `spin .8s linear infinite`) + label
  "Adding `<Pack name>`…" (serif, 26px).
- A live **log list** that appends one line per feed every **240ms**: `✓ <Feed name>`
  (`10px / 600`, `✓` in `--tc`).

### State 3 — DONE (signal acquired)
- Logo mark, wordmark.
- Signal badge now reads **`SIGNAL ACQUIRED`** with a pulsing dot, border `--tc`.
- Title: a terracotta `✓` (34px) then "You're all set." (serif).
- Subline: "`<N>` sources from `<Pack name>` are now syncing. Your front page is being assembled from the first articles."
- CTA row (`margin-top:30px`, gap 12px): filled button **"Go to my front page →"** + ghost button **"Add another pack"**.
- Sidebar (see below) is now **populated** and the sync indicator goes live.

### State 4 — FRONT (stub)
Placeholder only. In the real app this is the existing `<FrontPage>` — once a source exists,
`page.tsx` already routes there. No new work beyond letting the redesigned state hand off.

---

## Components

### Sidebar — two states
The sidebar is the app's existing `Sidebar`. Two onboarding-specific changes:
- **Sync row**: when empty, dot is `--fg30` (static) and text reads `AWAITING FIRST SOURCE`.
  After adding, dot is `--tc` pulsing and text reads `LAST SYNC 0M AGO`.
- **Categories block**:
  - *Empty:* three skeleton bars (`height:9px`, bg `--fg08`, widths 80% / 62% / 71%) +
    note `NO SOURCES YET — add a pack to populate` (`9px / 700 / .12em`, `--fg30`).
  - *Populated:* real category list (name + zero-padded count + source names), matching the
    existing `Sidebar` category markup. Demo data adds TECH(3) / NEWS(3) / CULTURE(2).

### Instant-start banner
- Container: full width, `border:2px solid --tc`, background
  `linear-gradient(180deg, rgba(226,114,91,.12), transparent)`, padding `24px 26px`,
  flex row, gap 24px, `text-align:left`. Collapses to column under 680px.
- Left: bolt glyph `⚡`, `30px`, `--tc`.
- Body: kicker **`ONE-COMMAND SETUP`** (`9px / 800 / .22em`, `--tc`) → title **"Load the Essentials"**
  (serif `600 / 22px`) → paragraph **"`<b>`6 curated sources`</b>`, auto-sorted into categories.
  Executes in one click. Reversible."** (`11.5px / 500`, `--fg55`, `max-width 52ch`).
- Action: filled button **"+ Load Essentials"** → triggers WORKING state for the `essentials` pack.

### Button styles
- `.btn` base: mono `11px / 800 / .16em / uppercase`, padding `13px 20px`, `border:2px`, transition .12s.
- `--fill`: bg `--tc`, text `--bg`; hover inverts (bg `--bg`, text `--tc`).
- `--ghost`: transparent, text+border `--fg`; hover bg `--fg`, text `--bg`.

### Starter-pack grid
- 2×2 grid, `gap:1px` over a `--fg15` background with a `--fg15` outer border (hairline cell separators).
  Collapses to 1 column under 680px.
- Each **card** (`.pack`): bg `--bg`, padding `20px`, flex column, gap 12px, `text-align:left`.
  - **Top row**: pack name (serif `600 / 19px`) + count badge `NN FEEDS` (`8.5px / 800 / .14em`, `--fg40`).
  - **Chips**: first 3 feed names as bordered chips (`9px / 700`, `border 1px --fg20`, padding `3px 7px`),
    plus a `+N more` chip (`--fg40`) if the pack has more.
  - **Foot row**: category line in `--tc` (`8.5px / 800 / uppercase`) + **"+ Add pack"** button
    (`9.5px / 800 / .13em`, `border 1px --fg`, hover inverts).
  - **Added state** (`.pack.added`): `outline:2px solid --tc` (inset), button becomes filled terracotta
    and reads "✓ Added", non-interactive.

### Fallback paths
Two stacked rows, same `1px`-gap-over-`--fg15` treatment.
- Each row (`.path`): flex, gap 16px, padding `16px 20px`, hover bg `--fg04`.
  - Leading icon (`--tc`, 18px wide): discover glyph / `+`.
  - Title (`11.5px / 800 / uppercase`) + description (`10px / 500`, `--fg40`).
  - Trailing `→` (`--fg30`, turns `--tc` on hover).
- Row 1: **"Open the directory"** — "40+ curated sources, organised by topic — add them one by one." → routes to `/u/[username]/suggested`.
- Row 2: **"Pipe in a URL"** — "Already know a site you love? Drop its RSS / Atom link." → opens the existing add-URL flow.

### Toast (undo)
- Fixed, bottom-center, `border:2px solid --tc`, padding `13px 18px`, slides up + fades in (`.28s`).
- Text **"`<N>` SOURCES ADDED · syncing…"** (`10.5px / 700`, count in `--tc`) + **"Undo"** button
  (`9.5px / 800`, `border 1px --fg30`, hover inverts).
- Auto-dismiss after **6000ms**. Undo removes the added pack and returns to IDLE.

---

## Interactions & Behavior
- **Add a pack** (instant button or any card's "+ Add pack"):
  1. Switch to WORKING; after `350ms` start appending log lines, one per feed every `240ms`.
  2. When all feeds are logged, wait `420ms`, switch to DONE, show the toast.
  3. Pack id is recorded as added; the sidebar populates; sync indicator goes live.
- **Already-added pack**: card shows the added state and its button is a no-op.
- **"Add another pack"** (DONE): returns to IDLE with previously-added packs marked.
- **"Go to my front page →"**: hands off to the real front page.
- **Undo** (toast): clears added packs, returns to IDLE.
- **Directory / URL paths**: navigate to existing routes/flows (stubs in the prototype).
- **Responsive**: sidebar hidden < 1100px; pack grid + instant banner go single-column < 680px.

## State Management
Local component state is enough; persistence is via the DB (sources actually created).
- `addedPacks: string[]` — ids of packs added this session (drives card "added" badges + undo).
- `view: 'idle' | 'working' | 'done'` — front page is the app's normal route once a source exists.
- `currentPack` — pack being added (for working/done copy).
- Data fetching: a server action that creates all feeds in a pack (batch `createFeedSource`),
  then revalidates so `sourceCount > 0` and the real front page renders.

### Suggested server-side shape
```ts
// src/lib/suggested-feeds.ts — define bundles referencing existing SUGGESTED_FEEDS by name/url
export const STARTER_PACKS = [
  { id: 'essentials', name: 'The Essentials', cats: 'Tech · News · Culture',
    feedUrls: [/* Hacker News, The Guardian, The Verge, BBC News, Noema, xkcd */] },
  // tech / news / culture …
];

// src/app/actions.ts
export async function addStarterPack(packId: string) {
  // resolve feeds, ensure target categories exist, create FeedSource rows in a transaction,
  // revalidatePath(`/u/${username}`)
}
```
Undo = delete the just-created sources for that pack (keep their ids from the action's return).

## Design Tokens
| Token | Value |
|---|---|
| `--bg` | `#000000` |
| `--fg` | `#ffffff` |
| `--tc` (terracotta) | `#E2725B` |
| fg opacities | 70 .70 · 55 .55 · 50 .50 · 40 .40 · 30 .30 · 20 .20 · 15 .15 · 08 .08 · 04 .04 |
| terracotta tints | `tc12` rgba(226,114,91,.12) · `tc20` .20 · `tc40` .40 |
| Mono font | `"JetBrains Mono", ui-monospace, monospace` |
| Serif font | `"Newsreader", Georgia, serif` |
| Section borders | `2px solid --fg` (hard) · `1px solid --fg15` (hairline) |
| Hairline grid gaps | `gap:1px` over a `--fg15` background |
| Timings | log step `240ms` · post-log `420ms` · toast life `6000ms` · transitions `.12s`/`.28s` |

Typography roles in use:
- System labels: mono, `8.5–11px`, weight `700–800`, `letter-spacing .12–.26em`, uppercase.
- Editorial titles/pack names/deks: Newsreader serif, weight `500–600`.
- Body/meta: mono `10–13px`, weight `400–600`.

## Assets
- `multivrss-ico.png` — the existing app logo mark (faceted polygon, terracotta accent). Included
  in this folder; in the codebase use the existing `/logo` asset (`/logo/multivrss-mark.png` per
  `EmptyStream`).
- All glyphs (RSS, bookmark, discover, bolt `⚡`, arrows, `✓`) are inline SVG / unicode — no raster assets.

## Files
- `Empty State Onboarding.html` — the full interactive prototype (all four states, chrome, packs, toast).
- `assets/multivrss-ico.png` — logo mark used by the prototype.
- Reference in the live codebase: `src/components/EmptyStream.tsx`, `src/app/u/[username]/page.tsx`,
  `src/lib/suggested-feeds.ts`, `src/app/u/[username]/suggested/SuggestedPageClient.tsx`, `src/app/actions.ts`.
