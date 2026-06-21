# Handoff: Category filter integrated into the telemetry strip (minimal)

## Overview
Add a **category filter** to the dashboard's **telemetry strip** — the line that already reads `INDEX · TIME · FILTER: ALL · UNREAD · READ`. Instead of a new control in the top bar, the category lives **inline** right after the read-state toggles as `CAT: <value> ▾`, in the exact same minimal text style.

Today the only way to filter by category is clicking entries in the **left sidebar**, and the active category is shown in the telemetry as **non-interactive text** (`cat="NEWS"`) that also **hides** the ALL/UNREAD/READ toggles while active. This change makes the category **visible, switchable, and clearable** without leaving the stream — and keeps the read-state toggles always present.

## About the Design Files
The files in this bundle are **design references created in HTML** — a mockup canvas, not production code to copy. Recreate this in the existing **Next.js 16 / React 19 / Tailwind v4** codebase by editing the real component, following its patterns and design system (sharp 2px borders, no radius, no shadows, JetBrains Mono system text, terracotta underline for the active toggle).

## Fidelity
**High-fidelity.** The mock's plain CSS emulates Tailwind; prefer the real Tailwind classes already in `SearchBar.tsx`. The whole point is that the new `CAT` control is visually **identical** to the existing `FILTER` toggles — reuse their exact class strings.

## File to modify
`src/components/SearchBar.tsx` — the telemetry strip is at **lines 122–166**, inside the `{/* Telemetry */}` block. This is a `'use client'` component.

## What already exists (reuse — do not rebuild)
| Piece | Location | Notes |
|---|---|---|
| `cat` value | `SearchBar.tsx:35` — `searchParams.get('cat') ?? 'ALL'` | The category filter is a **URL search param** (`?cat=`). The search effect already reads it and refetches (`SearchBar.tsx:59`, dependency array line 73). |
| `getCategories()` server action | `src/app/actions.ts:25` | Returns the user's categories. Use it to populate the dropdown. |
| Read-state toggles | `SearchBar.tsx:135–157` | `['ALL','UNREAD','READ']` mapped to buttons; active = `text-foreground underline underline-offset-4 decoration-terracotta`, inactive = `text-foreground/30 hover:text-foreground/60`. **Copy this exact styling for CAT.** |
| `activeFilter` string | `SearchBar.tsx:115` | Currently used to render static text — see the quirk below. |

## The core quirk to fix
`SearchBar.tsx:132–134`:
```tsx
{sourceIdParam || cat !== 'ALL' ? (
    <span className="text-foreground">{activeFilter}</span>   // ← replaces the toggles entirely
) : (
    <span> …ALL · UNREAD · READ buttons… </span>
)}
```
When a category (or source) is active, the **read toggles disappear** and you get dead text. The redesign **removes this either/or**: the read-state toggles are **always rendered**, and `CAT` is appended as its own interactive segment.

## The change — telemetry strip (`SearchBar.tsx:122`)

### 1. Get categories + router
Near the top of the component (with the other hooks):
```tsx
import { useRouter, useSearchParams } from 'next/navigation';
import { getCategories } from '@/app/actions';
// …
const router = useRouter();
const [categories, setCategories] = useState<{ name: string; count: number }[]>([]);
const [catOpen, setCatOpen] = useState(false);

useEffect(() => {
    void getCategories().then(setCategories);
}, []);
```
(Match the actual return shape of `getCategories()` — adapt `{ name, count }` to whatever it returns; counts are optional in the UI.)

### 2. Set/clear the category via the URL param
Category lives in the URL (so deep-links + the existing fetch effect keep working). Helper:
```tsx
function setCategory(next: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (!next || next === 'ALL') params.delete('cat');
    else params.set('cat', next);
    router.push(`?${params.toString()}`);
    setCatOpen(false);
}
```

### 3. Always render the read toggles, then append CAT
Replace the `{sourceIdParam || cat !== 'ALL' ? (…static…) : (…toggles…)}` conditional (lines 132–166) so the **toggles always render**. If a `source` filter is active you may still show `activeFilter` for the source case only — but `cat` is now its own control. Structure:

```tsx
{'FILTER: '}
<span className="inline whitespace-nowrap">
    {(['ALL','UNREAD','READ'] as const).map((f, i) => {
        const isActive = f === 'ALL' ? !readFilter : readFilter === f.toLowerCase();
        return (
            <span key={f}>
                {i > 0 && <span className="mx-1 text-foreground/30">{'·'}</span>}
                <button
                    onClick={() => setReadFilter(f === 'ALL' ? undefined : f.toLowerCase())}
                    className={`bg-transparent border-0 px-0 py-0 transition-colors cursor-pointer inline text-[10px] font-bold uppercase tracking-widest ${
                        isActive ? 'text-foreground underline underline-offset-4 decoration-terracotta'
                                 : 'text-foreground/30 hover:text-foreground/60'}`}
                >{f}</button>
            </span>
        );
    })}
</span>

<span className="mx-3">{'·'}</span>

{/* CAT segment — same visual language as the read toggles */}
<span className="relative inline-flex items-center">
    {'CAT: '}
    <button
        onClick={() => setCatOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={catOpen}
        className={`inline-flex items-center gap-1 bg-transparent border-0 px-0 py-0 cursor-pointer text-[10px] font-bold uppercase tracking-widest ${
            cat !== 'ALL' ? 'text-foreground underline underline-offset-4 decoration-terracotta'
                          : 'text-foreground/30 hover:text-foreground/60'}`}
    >
        {cat}
        <span className="text-[8px] text-foreground/45">▾</span>
    </button>
    {cat !== 'ALL' && (
        <button
            onClick={() => setCategory(null)}
            title="Clear category"
            className="ml-2 bg-transparent border-0 p-0 text-terracotta text-[11px] leading-none cursor-pointer"
        >✕</button>
    )}

    {catOpen && (
        <div
            role="listbox"
            className="absolute top-6 right-0 z-20 w-[200px] bg-background border-2 border-foreground"
        >
            <button
                onClick={() => setCategory(null)}
                className={`flex w-full items-center justify-between px-3 py-2 border-b border-foreground/10 text-left ${cat === 'ALL' ? 'bg-terracotta text-background' : 'hover:bg-foreground/[0.04]'}`}
            >
                <span className="text-[10px] font-bold uppercase tracking-widest">ALL</span>
            </button>
            {categories.map(c => (
                <button
                    key={c.name}
                    onClick={() => setCategory(c.name)}
                    className={`flex w-full items-center justify-between px-3 py-2 border-b border-foreground/10 last:border-b-0 text-left ${cat === c.name ? 'bg-terracotta text-background' : 'hover:bg-foreground/[0.04]'}`}
                >
                    <span className="text-[10px] font-bold uppercase tracking-widest">{c.name}</span>
                    {typeof c.count === 'number' && (
                        <span className={`text-[9px] font-bold ${cat === c.name ? 'text-background' : 'text-foreground/40'}`}>{String(c.count).padStart(2,'0')}</span>
                    )}
                </button>
            ))}
        </div>
    )}
</span>
```

### 4. Keep the strip on one line
The container already has `flex items-center gap-4 overflow-x-auto min-h-[2.5rem]` (line 123) and the inner `<span>` is `whitespace-nowrap` — keep both. The CAT segment is `relative` so the dropdown anchors to it; the dropdown uses `right-0` so it doesn't push the strip width. Don't let the dropdown participate in the horizontal scroll width (absolute positioning handles that).

## Interactions & Behavior
- **CAT: ALL ▾** is the default (dimmed, like an inactive read toggle). No `?cat` in the URL.
- Clicking **CAT** opens a compact dropdown: `ALL` + each category (with optional count). Selecting one sets `?cat=<NAME>` and closes the menu; the existing fetch effect refetches automatically.
- When a category is active, the value is **underlined in terracotta** (identical to the active read toggle) and a **✕** appears to clear it (removes `?cat`).
- Read-state toggles (`ALL/UNREAD/READ`) remain **always visible and usable**, even with a category active (this is the bug fix).
- The sidebar category list keeps working unchanged — both routes write the same `?cat` param, so they stay in sync.
- **Escape** closes the dropdown; an outside-click closes it too (mirror any existing click-outside pattern in the codebase, or add a lightweight `useEffect` listener). Closing returns focus to the CAT button.

### Accessibility (blocking per AGENTS.md)
- CAT button: `aria-haspopup="listbox"` + `aria-expanded`; dropdown `role="listbox"`, rows are buttons (acceptable) or `role="option"` with `aria-selected`.
- The ✕ clear button needs an accessible name (`title`/`aria-label="Clear category filter"`).
- Maintain `:focus-visible` outlines on the CAT button, ✕, and every dropdown row.
- Keyboard: Enter/Space opens; Escape closes and restores focus. (Arrow-key navigation within the list is a nice-to-have, not blocking.)

## State Management
- `cat` stays a **URL search param** (source of truth) — do **not** move it to local state; the fetch effect (`SearchBar.tsx:48–73`) already depends on it and deep-links must keep working.
- New **local** state: `categories` (loaded once via `getCategories()`) and `catOpen` (dropdown visibility).
- `readFilter` stays local, unchanged.
- No new server actions — `getCategories()` already exists.

## Design Tokens (from `src/app/globals.css`)
| Token | Light | Dark |
|---|---|---|
| `--background` | `#f6f3ec` | `#000000` |
| `--foreground` | `#000000` | `#FFFFFF` |
| `--terracotta` | `#E2725B` | `#E2725B` |
| Mono font | JetBrains Mono | — |

Telemetry text: `text-[10px] font-bold uppercase tracking-widest text-foreground/50`. Active segment: `text-foreground underline underline-offset-4 decoration-terracotta`. Inactive: `text-foreground/30 hover:text-foreground/60`. Separators: `<span className="mx-3">·</span>` between groups, `mx-1 text-foreground/30` between toggles. Dropdown: `bg-background border-2 border-foreground`, rows `px-3 py-2 border-b border-foreground/10`, selected row `bg-terracotta text-background`. **No radius, no shadows.**

## Assets
None. All glyphs are text (`·`, `▾`, `✕`).

## Files in this bundle (design references)
- `Save URL on Dashboard.html` — mockup canvas. **This feature is in the "Filtro categoria — integrato nella telemetria (minimale)" section**: artboard `cf-default` (CAT: ALL), `cf-active` (CAT: NEWS + ✕), `cf-open` (dropdown open).
- `cat-telemetry.jsx` — React source for these mockups (mirror the markup/measurements of `TelemetryStrip`).
- `dashboard.jsx`, `topbar-variants.jsx`, `tag-modal.jsx`, `category-filter.jsx`, `design-canvas.jsx` — other mocks + canvas harness; not relevant to this feature.

## Verification (per AGENTS.md)
1. `npm run lint`
2. `npm run dev` (port 3002) → on the dashboard, telemetry shows `FILTER: ALL · UNREAD · READ · CAT: ALL ▾`.
3. Click CAT → pick a category → confirm `?cat=` appears in the URL, the stream refilters, the value underlines, and ✕ appears.
4. Confirm the read-state toggles are STILL visible and clickable while a category is active (the bug fix).
5. Click a category in the sidebar → confirm the CAT label updates to match (shared `?cat` param).
6. Keyboard + theme pass (light/dark); `npm run build` (touched client component).
