# Handoff: AssignTagsModal — visible tag creation (Variant 1)

## Overview
Improve the **tag-assignment modal** so creating a new tag is **explicit and immediate**, instead of an invisible side effect of pressing APPLY.

Today (`AssignTagsModal.tsx`) typing a name that doesn't exist does nothing visible — the tag is only created deep inside `handleApply` via the `canCreate` branch. The user gets no affordance, no Enter-to-create, no confirmation.

Variant 1 is a **surgical** change to the existing modal:
1. An explicit **"+ CREATE NEW TAG # <name>"** row appears under the input whenever the typed text matches no existing tag.
2. **Enter** creates that tag inline (or toggles the single match) — created tags appear immediately as selected chips.
3. The dark "terminal" input is **lightened** to match the paper/ink design system.
4. A **selected count** is shown in the section label and on the APPLY button.

This is UI/UX only. The server actions already exist — `createTag(name)` and `setFeedItemTags(itemId, tagIds)` — and are reused as-is.

## About the Design Files
The files in this bundle are **design references created in HTML** — a mockup canvas, not production code to copy. Recreate Variant 1 in the existing **Next.js 16 / React 19 / Tailwind v4** codebase by editing the real `AssignTagsModal.tsx`, using its established patterns and the project design system (sharp 2px borders, no radius, no shadows, terracotta accent on text/borders only, JetBrains Mono for system labels).

## Fidelity
**High-fidelity.** Final layout, colors, typography, and interaction are specified. The mock's plain CSS emulates Tailwind; prefer the real Tailwind classes already in `AssignTagsModal.tsx`.

## File to modify
`src/components/AssignTagsModal.tsx` (single file — the modal is self-contained and already `'use client'`).

## What already exists (reuse — do not rebuild)
| Piece | Location | Notes |
|---|---|---|
| `createTag(name)` | `src/app/actions.ts` | Returns `{ success: boolean; tag?: { id, name } }`. |
| `setFeedItemTags(itemId, tagIds)` | `src/app/actions.ts` | Persists the final tag set for the item. |
| Modal scaffold, Escape handling, backdrop click-to-close | `AssignTagsModal.tsx` | Keep. |
| `selectedIds: Set<string>`, `toggleTag`, `handleApply` | `AssignTagsModal.tsx:24-79` | Extend, don't replace. |

## The changes — step by step

### 1. Make the tag list mutable (so created tags render instantly)
`AssignTagsModal.tsx:25` currently:
```tsx
const [localTags] = useState<TagVM[]>(allTags);
```
Add a setter:
```tsx
const [localTags, setLocalTags] = useState<TagVM[]>(allTags);
```

### 2. Add an inline "create" handler
Place near `toggleTag` (around line 44). It reuses the existing `createTag` action, appends the new tag, selects it, and clears the search so the create row disappears:
```tsx
const handleCreate = useCallback(async () => {
    const name = search.trim();
    if (!name || exactMatch || isPending) return;
    setIsPending(true);
    try {
        const result = await createTag(name);
        if (result.success && result.tag) {
            const tag = result.tag;
            setLocalTags(prev => [...prev, tag]);
            setSelectedIds(prev => new Set(prev).add(tag.id));
            setSearch('');
        }
    } finally {
        setIsPending(false);
    }
}, [search, exactMatch, isPending]);
```

### 3. Enter key on the input
Add `onKeyDown` to the `<input>` (currently `AssignTagsModal.tsx:122-129`):
```tsx
onKeyDown={e => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    if (canCreate) {
        void handleCreate();
    } else if (filtered.length === 1) {
        toggleTag(filtered[0].id);     // exact/sole match → toggle it
        setSearch('');
    }
}}
```

### 4. Lighten the input (drop the dark terminal box)
Replace the input's `className` dark tokens. Currently:
```tsx
className="w-full pl-8 pr-4 py-3 bg-[#141409] border-2 border-foreground font-mono text-[13px] text-foreground placeholder:text-white/20 outline-none"
```
Use design-system surfaces:
```tsx
className="w-full pl-8 pr-12 py-3 bg-background border-2 border-foreground font-mono text-[13px] text-foreground placeholder:text-foreground/30 outline-none focus-visible:border-terracotta"
```
Keep the `>` terracotta prompt at `left-3`. Add an `aria-label="Filter or create a tag"` to the input (placeholder is not a label — AGENTS.md a11y rule). Add a right-aligned `↵` hint that shows only when there is text:
```tsx
{search.trim() && (
    <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[11px] text-foreground/35 border border-foreground/25 px-1.5 leading-[18px] select-none pointer-events-none">↵</span>
)}
```

### 5. The explicit CREATE row (the core of V1)
Render this **directly under the input wrapper**, inside the same field, only when `canCreate`:
```tsx
{canCreate && (
    <button
        type="button"
        onClick={() => void handleCreate()}
        className="mt-2.5 flex w-full items-center gap-3 px-3 py-2.5 bg-terracotta/[0.08] border-2 border-terracotta font-mono cursor-pointer hover:bg-terracotta/[0.14] transition-colors"
    >
        <span className="text-terracotta font-bold text-[15px] leading-none">+</span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-terracotta">Create new tag</span>
        <span className="px-2.5 py-1 bg-terracotta text-background text-[10px] font-bold uppercase"># {search.trim()}</span>
        <span className="ml-auto text-[9px] tracking-widest text-foreground/40">PRESS ↵</span>
    </button>
)}
```

### 6. Selected count
Section label (`EXISTING_DIRECTORY`, `AssignTagsModal.tsx:135`) — append a count:
```tsx
<span className="font-mono text-[10px] uppercase tracking-widest text-terracotta">
    EXISTING_DIRECTORY
    {selectedIds.size > 0 && (
        <span className="ml-2 text-foreground/40 text-[9px]">{String(selectedIds.size).padStart(2,'0')} SELECTED</span>
    )}
</span>
```
APPLY button (`AssignTagsModal.tsx:172`) — append a count badge:
```tsx
{isPending ? 'APPLYING…' : <>APPLY{selectedIds.size > 0 && <span className="ml-2 px-1.5 bg-background text-terracotta leading-[16px]">{selectedIds.size}</span>}</>}
```
(Keep the existing `disabled={isPending}` and the terracotta styling.)

### 7. Keep handleApply's create branch as a safety net
Leave the existing `if (canCreate) { … createTag … }` inside `handleApply` (`AssignTagsModal.tsx:57-64`) untouched. After inline create, `search` is cleared so `canCreate` is `false` and no double-creation occurs; the branch still covers the case where a user types and clicks APPLY without pressing Enter.

### 8. Minor a11y fix while here
The × close button (`AssignTagsModal.tsx:101`) uses `border-white/40` — wrong in light mode. Change to `border-foreground/40`.

## Interactions & Behavior
- Typing filters `EXISTING_DIRECTORY` (unchanged) AND, when no exact match, reveals the CREATE row.
- **Enter**: `canCreate` → create + select inline; else single match → toggle + clear.
- **Click CREATE row**: same as create. New tag appears as a selected chip in the directory; input clears; row disappears.
- **Chips**: click toggles selection (unchanged).
- **APPLY**: persists the selected set via `setFeedItemTags`; still creates any pending typed tag as a safety net; calls `onTagsApplied` + `onClose` (unchanged).
- **Escape / backdrop click**: close (unchanged).
- Disable the CREATE row and APPLY while `isPending`.

### Accessibility (blocking per AGENTS.md)
- `aria-label` on the input (placeholder ≠ label).
- CREATE row is a real `<button type="button">` with visible text — fine for screen readers.
- Maintain `:focus-visible` outlines on input, chips, CREATE row, and footer buttons.
- Fix the × button border token (step 8).
- Consider `role="status"` + `aria-live="polite"` near the directory so creating a tag is announced (nice-to-have).

## State Management
Extend existing client state in the modal:
- `localTags` → make mutable with `setLocalTags` (append on create).
- `selectedIds: Set<string>` → add created tag id immediately.
- `search` → cleared after a successful inline create.
- `isPending` → also guards `handleCreate`.
No new server state; `createTag` + `setFeedItemTags` already exist.

## Design Tokens (from `src/app/globals.css`)
| Token | Light | Dark |
|---|---|---|
| `--background` (paper) | `#f6f3ec` | `#000000` |
| `--foreground` (ink) | `#000000` | `#FFFFFF` |
| `--terracotta` | `#E2725B` | `#E2725B` |
| Mono font | JetBrains Mono (`--font-jetbrains`) | — |

Spacing/borders: modal `max-w-lg`, `border-2 border-foreground`, structural bands `border-b-2 / border-t-2 border-foreground`. Input `border-2 border-foreground`, `py-3`, `pl-8 pr-12`. CREATE row: `bg-terracotta/[0.08]`, `border-2 border-terracotta`, `px-3 py-2.5`. Chips: `border-2`, `px-3 py-1.5`, selected = `bg-terracotta text-background border-terracotta`. **No radius, no shadows.** Terracotta only on text/borders + the deliberate ~8% wash on the CREATE row.

## Assets
None. All glyphs are text (`+`, `#`, `>`, `↵`, `×`).

## Files in this bundle (design references)
- `Save URL on Dashboard.html` — mockup canvas. **Variant 1 is in the "Modale tag — redesign" section, artboard `tm-v1`** (explicit create row + Enter hint + count). `tm-now` shows the current modal for comparison; `tm-v2` is the larger alternative (not chosen).
- `tag-modal.jsx` — React source for the modal mockups (mirror the markup/measurements of `TagModalV1`).
- `dashboard.jsx`, `topbar-variants.jsx`, `design-canvas.jsx` — surrounding mock + canvas harness; not relevant to this feature.

## Verification (per AGENTS.md)
1. `npm run lint`
2. `npm run dev` (port 3002) → open any feed item's "+ TAG" → type a new name → confirm the CREATE row appears → press Enter → it becomes a selected chip → APPLY.
3. Type an existing name → confirm it filters and Enter toggles it; no CREATE row shows for an exact match.
4. Keyboard pass: focus input, Enter creates; Tab reaches CREATE row, chips, CANCEL/APPLY; Escape closes.
5. Check both light and dark themes (input is now `bg-background`, not the old dark box).
6. `npm run build` (touched client component).
