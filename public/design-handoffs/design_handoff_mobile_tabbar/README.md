# Handoff: Mobile bottom tab bar (replace the floating ☰)

## Overview
On mobile the only persistent nav affordance is a **lone ☰ floating bottom-left** (`MobileFloatingNav`), duplicated by a second ☰ in the header. The instinct (bottom = thumb-reachable) is right, but a bare floating glyph is unpolished and redundant.

Replace it with a **bottom tab bar** — the conventional, discoverable mobile pattern:

```
  FEED            SAVED            MENU             ADD
  river/dashboard  saved items     opens the drawer  add a source
```

`MENU` opens the **existing** mobile drawer (categories + nav), so nothing about the drawer itself changes — only how it's triggered. The repo already has a `MobileTabBar` stub (FEED · ADD · ME), unmounted; this replaces it with the approved set.

> **Recommended:** the 4-tab bar above (matches the approved prototype). If you want the lowest-risk change, ship the **3-tab variant — FEED · SAVED · MENU** — and leave Add in the header. See "Variant" at the bottom. Pick one before starting; the only difference is whether you wire the ADD tab.

## Fidelity
**High-fidelity.** `Mobile Navigation.html` is the source of truth (open it, select **Option B**). Match the design system: sharp **2px top border**, no radius, no shadows, JetBrains Mono labels, terracotta active state with a 2px top accent, ≥44px tap targets.

## ⚠️ Read this first — what changed since the design was approved
The header's Add control is **no longer a `showAdd` boolean** living in `PageHeader`. It is now a self-contained **`<AddPopover>`** (paste a link → "Follow as source" / "Save the link"). There is nothing in `PageHeader` to "lift" for the ADD tab.

So the ADD tab now uses its **own** shared `<AddFeedForm>` modal, owned by `MobileActionsContext` (reference updated in this bundle). The header `AddPopover` stays exactly as-is. Both lead to adding a source — that's fine; they don't conflict. (If you'd rather not have two Add paths on mobile, take the 3-tab variant and drop the ADD tab.)

## Files
| File | Change |
|---|---|
| `src/components/MobileTabBar.tsx` | **Rewrite** to FEED · SAVED · MENU · ADD (reference: `MobileTabBar.reference.tsx`). Its props change from `{ onAdd, onMe, username }` to just `{ username }`. |
| `src/components/MobileActionsContext.tsx` | **New** — owns one shared `<AddFeedForm>` so the ADD tab can open it from anywhere (reference included). *Skip entirely for the 3-tab variant.* |
| `src/components/MobileShell.tsx` | Render `<MobileTabBar username=… />` as the bottom row of the mobile column (so it never overlaps content). Add a `username` prop. |
| `src/app/u/[username]/layout.tsx` | Remove `<MobileFloatingNav />`; (4-tab) fetch `getCategories()` and wrap in `<MobileActionsProvider categories=…>`; pass `username` to the shell. |
| `src/components/MobileFloatingNav.tsx` | **Delete** (retired). |
| `src/components/PageHeader.tsx` | **Remove the redundant mobile ☰** (the `setMobileSidebarOpen(true)` button) — the MENU tab now owns the drawer. Leave the wordmark, search, `AddPopover`, sync, theme & settings. Desktop header untouched. |

## Step 1 — the tab bar
Use `MobileTabBar.reference.tsx`. Key points:
- `'use client'`; reads `usePathname()` for the active tab.
- `FEED` → `router.push('/u/[username]')`; `SAVED` → `router.push('/u/[username]/saved')` (**this route already exists**).
- `MENU` → `useMobileSidebar().setOpen(true)` — the drawer already exists in `SidebarContainer` (mobile overlay). No drawer changes.
- `ADD` → `useMobileActions().openAdd()` (4-tab only).
- `md:hidden`, `shrink-0`, `border-t-2 border-foreground`, `pb-[env(safe-area-inset-bottom)]` for the home-indicator inset. Each tab ≥44px tall.

## Step 2 — mount it without overlapping content
The bar must be a **flex child** of the mobile column, not a `fixed` overlay, so the river isn't hidden behind it. In `MobileShell.tsx`:

```tsx
export default function MobileShell({ username, children }: { username: string; children: React.ReactNode }) {
  return (
    <main id="main-content" tabIndex={-1} className="flex-1 flex flex-col min-h-0 min-w-0">
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {children}
      </div>
      <MobileTabBar username={username} />   {/* md:hidden — only shows on mobile */}
    </main>
  );
}
```
Because the bar is `md:hidden`, desktop layout is unchanged. The scroll area inside `page.tsx` keeps its own scroll; the bar sits below it.

## Step 3 — layout wiring
In `src/app/u/[username]/layout.tsx`:
- **Delete** the `<MobileFloatingNav />` line and its import.
- Pass `username` to `<MobileShell>`.
- **(4-tab only)** fetch categories and wrap the tree in `<MobileActionsProvider>`:

```tsx
import { getCategories } from '@/app/actions';
import { MobileActionsProvider } from '@/components/MobileActionsContext';
// …
const categories = await getCategories();   // same call page.tsx already makes

return (
  <MobileSidebarProvider>
    <MobileActionsProvider categories={categories}>
      <AutoSync />
      <SessionWatcher />
      <div className="flex flex-1 overflow-hidden h-screen bg-background text-foreground relative">
        <SidebarContainer><Sidebar username={session.user.username} /></SidebarContainer>
        <MobileShell username={session.user.username}>{children}</MobileShell>
      </div>
    </MobileActionsProvider>
  </MobileSidebarProvider>
);
```
(For the 3-tab variant, skip the provider + `getCategories` import; everything else is identical.)

## Step 4 — de-dupe the header
The MENU tab now owns the drawer, so the mobile header ☰ is redundant. In `PageHeader.tsx`, inside the `md:hidden` "search closed" block, **delete the ☰ button**:

```tsx
{/* DELETE this — the MENU tab opens the drawer now */}
<button onClick={() => setMobileSidebarOpen(true)} aria-label="Open navigation" …>☰</button>
```
Keep everything else in the mobile header (wordmark, ⌕ search, `<AddPopover>`, ↻ sync, theme, settings). `useMobileSidebar()` may now be unused in `PageHeader` — drop the import if your linter flags it. **Leave the desktop header untouched.**

> The header's `<AddPopover>` stays. On a 4-tab bar you'll have two ways to add a source (header popover + ADD tab) — intentional and harmless. If you want exactly one Add path on mobile, take the 3-tab variant instead.

## Interactions & behaviour
- Tabs reflect the current route: FEED active on `/u/[username]`, SAVED on `/u/[username]/saved`.
- MENU opens the drawer (categories/sources); the drawer's own ✕ / scrim close it.
- ADD opens the Add-Feed modal from anywhere (4-tab).
- The bar is always visible on mobile (doesn't scroll away) and hidden from `md` up.

### Accessibility
- `<nav aria-label="Primary">`; active tab marked `aria-current="page"`.
- Every tab is a `<button>` ≥44px tall with a text label (not icon-only) + focus-visible outline.
- Respects the safe-area inset; no essential motion.

## Design tokens
| Token | Light | Dark |
|---|---|---|
| `--background` | `#f6f3ec` | `#000000` |
| `--foreground` | `#000000` | `#FFFFFF` |
| `--terracotta` | `#E2725B` | `#E2725B` |

Bar: `border-t-2 border-foreground`, height ≈64px. Label: `text-[8.5px] font-bold uppercase tracking-[0.18em]`, terracotta when active + a 2px terracotta top accent. No radius, no shadows.

## Variant (lower-risk, 3 tabs)
Ship **FEED · SAVED · MENU** only:
- Skip `MobileActionsContext.tsx` and the `MobileActionsProvider` wrap entirely.
- Leave the header `<AddPopover>` as the single Add affordance.
- `MobileTabBar` drops the ADD tab (and its `useMobileActions` import).
- Same bar, one fewer wire, no extra `getCategories` call in the layout.

## Files in this bundle
- `Mobile Navigation.html` — interactive prototype. Select **Option B** for the approved design (Options 0/A/C are the alternatives that were considered). Drag from the left edge in A/C to feel the swipe gesture.
- `MobileTabBar.reference.tsx` — the bar (4 tabs).
- `MobileActionsContext.reference.tsx` — the ADD bridge (now owns a shared `<AddFeedForm>` — updated for the current `AddPopover` reality).

## Verification
1. `npm run lint` · `npm run build`.
2. `npm run dev` (3002), mobile width: a bottom bar shows FEED · SAVED · MENU (· ADD); the old floating ☰ is gone; no ☰ left in the mobile header.
3. MENU opens the existing drawer; categories/sources work; ✕/scrim close it.
4. SAVED/FEED switch routes and the active tab follows; ADD opens the Add-Feed modal (4-tab).
5. Content isn't hidden behind the bar (scroll to the last river item); safe-area inset respected on a notched device.
6. Desktop (≥md) unchanged. Light/dark pass.
