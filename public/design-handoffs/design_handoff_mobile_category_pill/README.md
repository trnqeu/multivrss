# Handoff: Mobile category filter — Option B (pinned CAT pill → bottom sheet)

## Overview
On mobile, the only way to reach the category filter is to **scroll the telemetry strip horizontally** to its far right, where `CAT: <value> ▾` sits behind `INDEX · TIME · FILTER: ALL · UNREAD · READ`. It's invisible until you scroll, so most users never find it (the other route — the left sidebar — is also hidden behind the hamburger on mobile).

**Option B** fixes this by pulling `CAT` out of the scrolling strip and **pinning it to the left edge** as a small pill that is always on screen. Tapping it opens a **bottom sheet** — a list of categories that slides up from the bottom, right under the thumb. Selecting a category sets the existing `?cat` URL param; the stream refilters via the effect that already exists.

Desktop is unchanged: the inline `CAT: <value> ▾` dropdown already shipped in `SearchBar.tsx` stays exactly as-is.

## Fidelity
**High-fidelity.** Reuse the real Tailwind classes from `SearchBar.tsx`/`MobileCategoryStrip.tsx` and the existing design system: sharp 2px borders, no radius, no shadows, JetBrains Mono, terracotta (`#E2725B`) for the active state.

## Why Option B (vs the alternatives explored)
- **Discoverable:** the pill never scrolls off — it's the first thing in the telemetry row, always visible.
- **Thumb-reachable:** the sheet opens from the bottom; rows are large tap targets (≥44px), unlike the cramped top dropdown.
- **Zero new data layer:** reuses `?cat` + `getCategories()` exactly like desktop. Sidebar and desktop dropdown stay in sync automatically (shared URL param).
- **Minimal chrome:** no new persistent bar (that was Option C / the bottom tab bar). The pill borrows space that's already in the telemetry row.

> Faster fallback if you want to ship today: **Option A** — the repo already contains `src/components/MobileCategoryStrip.tsx` (a horizontal chip rail, `md:hidden`) that is **written but never mounted**. Rendering it under the telemetry strip is a one-line change. It works but adds a second full-width row; Option B is more compact and more discoverable.

## Files to modify
| File | Change |
|---|---|
| `src/components/SearchBar.tsx` | Restructure the telemetry row so the pinned pill sits **outside** the `overflow-x-auto` scroll area; add `hidden md:inline-flex` to the existing desktop CAT control. |
| `src/components/MobileCategorySheet.tsx` | **New** — the pill + bottom sheet (full reference in this bundle). |
| `src/app/globals.css` | Add one `@keyframes sheet-up` (slide-up animation). |

## What already exists (reuse — do not rebuild)
| Piece | Location | Notes |
|---|---|---|
| `cat` value | `SearchBar.tsx` — `searchParams.get('cat') ?? 'ALL'` | Category filter is a URL param (`?cat=`). The search effect already reads it and refetches. **Source of truth — keep it in the URL.** |
| `setCategory(next)` | `SearchBar.tsx` | Existing helper: deletes `?cat` for ALL, else sets it and deletes `?source`. The new sheet does the same thing. |
| `getCategories()` | `src/app/actions.ts` | Returns the user's categories. Same call the desktop dropdown uses. |
| Desktop CAT dropdown | `SearchBar.tsx` (telemetry block) | The inline `CAT: <value> ▾ + listbox`. **Leave its behaviour; just hide it on mobile.** |
| `MobileCategoryStrip.tsx` | `src/components/` | Existing-but-unmounted chip rail = Option A. Not used by Option B, but good prior art for the `md:hidden` + `?cat` pattern. |

## The change

### 1. SearchBar.tsx — restructure the telemetry row
Today the telemetry is a single scrolling div:
```tsx
<div className="px-8 py-3 border-b-2 border-foreground … flex items-center gap-4 overflow-x-auto min-h-[2.5rem]">
    <span className="whitespace-nowrap"> …INDEX · TIME · FILTER… · CAT… </span>
</div>
```
The pinned pill must NOT live inside `overflow-x-auto` (or it would scroll away). Wrap the row in an outer flex with two children — the pill (mobile only) and the scrolling content:

```tsx
<div className="flex items-stretch border-b-2 border-foreground min-h-[2.5rem]">
    {/* Pinned CAT pill — mobile only, never scrolls */}
    <MobileCategorySheet />

    {/* Existing telemetry content — now the scrolling part */}
    <div className="flex-1 min-w-0 px-8 py-3 text-[10px] font-bold uppercase tracking-widest text-foreground/50 flex items-center gap-4 overflow-x-auto">
        <span className="whitespace-nowrap">
            {/* INDEX · TIME · FILTER toggles … unchanged … */}
            {/* CAT desktop control … see step 2 … */}
        </span>
    </div>
</div>
```
Notes:
- Move `border-b-2 border-foreground` and `min-h-[2.5rem]` to the **outer** wrapper; keep `px-8 py-3 … overflow-x-auto` on the **inner** scrolling div.
- `MobileCategorySheet` renders its pill with `md:hidden` + `shrink-0`, so it's invisible on desktop and the row collapses to today's layout there.

### 2. SearchBar.tsx — hide the desktop CAT control on mobile
Find the inline CAT segment (the `<span className="inline-flex items-center">` that wraps the `catButtonRef` button + `✕` + dropdown). Add `hidden md:inline-flex` so it only shows from `md` up:
```tsx
{/* was: <span className="inline-flex items-center"> */}
<span className="hidden md:inline-flex items-center">
    {'CAT: '}
    …existing button + clear + dropdown…
</span>
```
Also hide its leading `· ` separator on mobile so the strip doesn't end with a dangling dot — wrap that `<span className="mx-3">·</span>` (the one right before CAT) in `hidden md:inline`.

Result: **mobile** shows the pinned pill; **desktop** shows the inline dropdown. They both write `?cat`, so they're always consistent.

### 3. Add the bottom-sheet component
Drop in `MobileCategorySheet.tsx` from this bundle (`src/components/`). It:
- renders the pill (`md:hidden shrink-0`, terracotta when a category is active),
- opens a `role="dialog"` bottom sheet with a scrim,
- lists `ALL` + `getCategories()`, current selection highlighted `bg-terracotta text-background`,
- writes `?cat` via `router.push` (same logic as `SearchBar.setCategory`),
- closes on row tap / scrim tap / `✕` / Escape, and locks body scroll while open.

### 4. globals.css — slide-up keyframe
```css
@keyframes sheet-up {
    from { transform: translateY(100%); }
    to   { transform: translateY(0); }
}
```
The sheet uses `motion-safe:animate-[sheet-up_.26s_cubic-bezier(.2,.8,.2,1)]`, so reduced-motion users get an instant sheet.

## Interactions & behaviour
- **Default:** pill reads `CAT · ALL`, dimmed (`bg-background`, `text-foreground`). No `?cat` in the URL.
- **Tap pill →** bottom sheet slides up. Rows are full-width, ≥44px tall.
- **Pick a category →** sets `?cat=<NAME>` (and clears `?source`), closes the sheet, stream refilters. Pill fills terracotta and shows the category name.
- **Pick ALL →** removes `?cat`, pill returns to the dimmed default.
- **Dismiss:** tap a row, tap the scrim, tap `✕`, or press Escape.
- Sidebar / desktop dropdown stay in sync — all three write the same `?cat` param.

### Accessibility (blocking per AGENTS.md)
- Pill: `aria-haspopup="dialog"` + `aria-expanded`.
- Sheet: `role="dialog"` `aria-modal="true"` `aria-label="Filter by category"`; scrim button has `aria-label`; rows expose `aria-selected`.
- Body scroll locked while open; Escape closes; `:focus-visible` outlines preserved on pill, rows, and `✕`.
- Respects `prefers-reduced-motion` via `motion-safe:`.

## State management
- `cat` stays a **URL search param** (source of truth) — do not move to local state; the fetch effect already depends on it and deep-links must keep working.
- New **local** state lives only in `MobileCategorySheet`: `open` (sheet visibility) and `categories` (loaded once via `getCategories()`).
- No new server actions.

## Design tokens (from `src/app/globals.css`)
| Token | Light | Dark |
|---|---|---|
| `--background` | `#f6f3ec` | `#000000` |
| `--foreground` | `#000000` | `#FFFFFF` |
| `--terracotta` | `#E2725B` | `#E2725B` |

Pill text: `text-[9px]/[10px] font-extrabold tracking-widest`, `CAT` label at `text-foreground/40`. Active pill: `bg-terracotta` with `text-background`. Sheet rows: `px-6 py-4 border-b border-foreground/[0.08]`, selected `bg-terracotta text-background`. Sheet container: `bg-background border-t-2 border-foreground`. **No radius (except the 2px grab handle), no shadows.**

## Assets
None. All glyphs are text (`·`, `▾`, `✕`, `☰`).

## Files in this bundle (design references)
- `Mobile Category Filter — Option B.html` — the spec: three phone states (default / sheet open / active). **Build to this.**
- `MobileCategorySheet.tsx` — production-shaped reference React component. Adapt class strings to the real `getCategories()` return shape.
- `Mobile Category Filter (4 options).html` — the original interactive exploration (Options 0/A/B/C) for context on why B was chosen.

## Verification (per AGENTS.md)
1. `npm run lint`
2. `npm run dev` (port 3002) → resize to a mobile width (or device toolbar). The telemetry row shows a pinned `CAT · ALL ▾` pill on the left; the rest of the strip scrolls independently behind it.
3. Tap the pill → bottom sheet slides up with `ALL` + every category.
4. Pick a category → `?cat=` appears in the URL, the stream refilters, the pill fills terracotta with the name; pick `ALL` → `?cat` removed, pill resets.
5. Confirm the desktop inline `CAT ▾` dropdown is hidden below `md` and visible at/above `md`, and that both write the same `?cat`.
6. Open the sidebar, pick a category there → pill label updates to match (shared param).
7. Keyboard (Escape closes, focus-visible) + light/dark theme + `prefers-reduced-motion` pass; `npm run build`.
