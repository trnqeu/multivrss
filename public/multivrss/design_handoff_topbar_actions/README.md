# Handoff: Top-bar actions redesign — "PASTE URL" + grouped ingest (Variant 3)

## Overview
Restructure the desktop dashboard **top bar** (`PageHeader`) so that adding a feed source and saving an external URL live together as one **"ingest" action group**, with **Sync** kept visually separate as a different kind of action (refresh, not add).

Concretely:
- Group `+ SOURCE` and `PASTE URL` into a single **segmented control** `[ SOURCE | URL ]`.
- Keep `↻ SYNC` as a standalone button to the right of the group.
- Clicking **URL** opens the existing `SaveLinkBar` as an inline popover strip directly under the header.

The feature this enables — *saving an external URL from the dashboard* — is already fully built on the backend. **No new server action, validation, or DB work is required.** This task is UI-only: surfacing the existing `SaveLinkBar` from a new entry point in the header.

## About the Design Files
The files in this bundle are **design references created in HTML** (a pan/zoom canvas of mockups). They show the intended look and behavior — they are **not** production code to copy. Recreate the design in the existing **Next.js 16 / React 19 / Tailwind v4** codebase using its established patterns (`PageHeader.tsx`, the `src/components/icons/` convention, the existing `SaveLinkBar`).

The HTML mock uses plain CSS to emulate Tailwind classes; **always prefer the real Tailwind classes already used in `PageHeader.tsx`** over the mock's raw pixel values where they differ.

## Fidelity
**High-fidelity.** Final colors, typography, spacing, borders, and interaction are specified. Recreate pixel-faithfully using the codebase's design system (sharp 2px borders, no radius, no shadows, terracotta accent on text/borders only).

## What already exists (reuse — do not rebuild)
| Piece | Location | Notes |
|---|---|---|
| `SaveLinkBar` component | `src/components/SaveLinkBar.tsx` | `'use client'` form: PASTE_URL_ tag · mono input · SAVE button. Optional `onSaved` callback. |
| `saveExternalLink` server action | `src/app/actions.ts:620` | Validates URL, resolves page title via `resolvePageTitle` (`actions.ts:583`), creates `SavedLink`, calls `revalidatePath('/u/{username}/saved')` + `updateTag('feed:{userId}')`. |
| The bar's states | already handled by `useActionState` | disabled until `new URL(value)` succeeds → `SAVING` while pending → resets form + fires `onSaved` on success. |
| Top bar to modify | `src/components/PageHeader.tsx` | `'use client'`. Desktop cluster + mobile cluster + `AddFeedForm` modal already wired here. |

## The change — `src/components/PageHeader.tsx`

### Current desktop cluster (for reference)
```tsx
<div className="hidden md:block flex-1" />
<div className="hidden md:flex items-center min-w-[280px] h-8 px-3 border border-foreground/20"> …search… </div>
<button onClick={() => setShowAdd(true)} className="hidden md:block … border border-foreground/30 px-3 py-1 …">+ SOURCE</button>
<button onClick={handleSync} className="hidden md:block … text-terracotta …">{isSyncing ? '↻ SYNCING...' : '↻ SYNC'}</button>
<div className="hidden md:flex items-center gap-3 ml-3"><ThemeToggle /><SettingsMenu … /></div>
```

### Target desktop cluster (Variant 3)
1. Add state: `const [showSaveUrl, setShowSaveUrl] = useState(false);`
2. Replace the lone `+ SOURCE` button with a **segmented group**, and place `PASTE URL` as the second segment:
```tsx
{/* Ingest action group */}
<div className="hidden md:flex items-stretch border border-foreground/30">
  <button
    onClick={() => setShowAdd(true)}
    className="flex items-center gap-2 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-foreground border-r border-foreground/20 hover:bg-foreground hover:text-background transition-colors"
  >
    <SourceIcon size={12} /> Source
  </button>
  <button
    onClick={() => setShowSaveUrl(v => !v)}
    aria-expanded={showSaveUrl}
    className={`flex items-center gap-2 px-3 py-1 text-[10px] font-bold uppercase tracking-widest transition-colors ${
      showSaveUrl ? 'bg-foreground text-background' : 'text-foreground hover:bg-foreground hover:text-background'
    }`}
  >
    <PasteUrlIcon size={12} /> URL
  </button>
</div>
```
3. Keep `↻ SYNC` exactly as-is, immediately after the group (it stays a separate, terracotta-text button — the visual separation is the point of V3).
4. Render the popover strip right after the `<header>` closes, before `<AddFeedForm>`:
```tsx
{showSaveUrl && (
  <div className="hidden md:block border-b-2 border-foreground bg-terracotta/[0.05] px-7 py-3.5">
    <SaveLinkBar onSaved={() => setShowSaveUrl(false)} />
  </div>
)}
```
- `onSaved` is used purely to **close the popover** after a successful save (there's no list to update in the header). The action already revalidates `/u/{username}/saved`, so the saved link shows up when the user navigates there.

### Mobile parity
The mobile cluster (the `{!searchOpen && (…md:hidden…)}` block) currently has a `+` button (opens `AddFeedForm`). Add a second compact icon button next to it that toggles the same `showSaveUrl` popover, using `<PasteUrlIcon size={14} />`. Render the popover strip without the `hidden md:block` so it shows on mobile too (drop that class or make a shared block).

## New icon components
Follow the existing `src/components/icons/` pattern (see `Rss.tsx`, `Bookmark.tsx`, `Discover.tsx` — they take a `size`/`className` prop and use `currentColor`). Add two **sharp, monoline** icons (no rounded corners — match the design system):

**`src/components/icons/Source.tsx`** — a plus:
```tsx
export function SourceIcon({ size = 13, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" className={className} aria-hidden="true">
      <path d="M7 1.5v11M1.5 7h11" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
```

**`src/components/icons/PasteUrl.tsx`** — a sharp clipboard:
```tsx
export function PasteUrlIcon({ size = 13, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" className={className} aria-hidden="true">
      <rect x="2.2" y="2.5" width="9.6" height="10" />
      <path d="M5 2.5V1.2h4v1.3" />
      <path d="M4.4 6h5.2M4.4 8.6h3.6" />
    </svg>
  );
}
```
(`Sync` already uses the `↻` glyph in `PageHeader`; no new icon needed there. If you want it to match, you can swap to a monoline refresh icon, but it's out of scope for V3.)

## Interactions & Behavior
- **URL button** toggles `showSaveUrl`. When open, the segment shows the active treatment (`bg-foreground text-background`) and `aria-expanded="true"`.
- **Popover strip** appears as a full-width band directly under the 56px header, separated by the same `border-b-2 border-foreground` motif, with a faint terracotta wash (`bg-terracotta/[0.05]`).
- **On successful save** → `SaveLinkBar` calls `onSaved` → popover closes. The bar already clears its own input and resets the form.
- **Escape / outside click** should also close the popover (a11y): add a `keydown` listener for `Escape` (mirror the existing search-bar Escape handling already in `PageHeader`) and/or a click-outside handler. Closing must also return focus to the URL toggle button.
- **Sync** is unchanged.

### Accessibility (blocking per AGENTS.md checklist)
- Both segment buttons need accessible names — the visible "Source" / "URL" text suffices; icons are `aria-hidden="true"`.
- URL toggle: `aria-expanded` reflects popover state.
- The popover is a form region; the existing `SaveLinkBar` input has its `name="url"` — ensure there's an associated label (add `aria-label="URL to save"` on the input, or a visually-hidden `<label htmlFor>`). The `PASTE_URL_` tag is decorative, not a label.
- Focus management: move focus into the URL input when the popover opens; restore focus to the toggle on close.
- `:focus-visible` outline must be present on all new buttons (don't strip it).

## State Management
Single new boolean in `PageHeader` (client component):
- `showSaveUrl: boolean` — controls popover visibility. Toggled by the URL segment, set `false` by `onSaved`, Escape, and outside-click.
No new data fetching. No new server state.

## Design Tokens (from `src/app/globals.css`)
| Token | Light (`:root`) | Dark (`.dark`) |
|---|---|---|
| `--background` (paper) | `#f6f3ec` | `#000000` |
| `--foreground` (ink) | `#000000` | `#FFFFFF` |
| `--terracotta` (accent) | `#E2725B` | `#E2725B` |
| `--line-bold` | `2px` | — |
| `--line-thin` | `1px` | — |
| Font sans | Inter (`--font-inter`) | — |
| Font mono | JetBrains Mono (`--font-jetbrains`) | — |
| `.label-system` | `text-[10px] font-bold uppercase tracking-widest` | — |

Spacing/borders to match `PageHeader`: header height `h-14` (56px), desktop horizontal padding `px-7`, inter-item `gap-6`. Borders are `border-foreground/30` (idle controls), `border-foreground/20` (inner segment divider), `border-b-2 border-foreground` (structural bands). **No border-radius, no shadows.** Terracotta only on text/borders, never as a fill background (the popover wash `bg-terracotta/[0.05]` is a deliberate ~5% tint, acceptable).

## Assets
- `assets/multivrss-ico.png` — brand mark (used in sidebar mock only; not needed for this feature, it already exists in the repo at `public/logo/multivrss-ico.png`).
- No other assets. Icons are inline SVG components defined above.

## Files in this bundle (design references)
- `Save URL on Dashboard.html` — the full mockup canvas. **Variant 3 is in the "Barra superiore — trattamenti" section, artboard `tb-v3`** (the segmented `SOURCE | URL` + separate `SYNC`). Artboard `tb-v4` shows the **popover-open** behavior recommended for the URL click.
- `topbar-variants.jsx` — React source for the header mockups (icons, segmented control, popover). Mirror the markup/measurements here.
- `dashboard.jsx` — the surrounding dashboard mock (sidebar, feed river) for context.
- `design-canvas.jsx` — canvas harness only; not relevant to implementation.

## Verification (per AGENTS.md)
1. `npm run lint`
2. `npm run dev` (port 3002) → on the dashboard, click **URL**, paste a link, press Enter / SAVE.
3. Navigate to `/u/{username}/saved` and confirm the link appears with its resolved title.
4. Keyboard pass: Tab to the URL button, Enter opens popover, focus lands in input, Escape closes and returns focus.
5. `npm run build` (PageHeader is a touched client component).
