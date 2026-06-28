# Handoff: MultivRSS — User Guide page + "Add source" control redesign

## Overview
This bundle contains two related design deliverables for MultivRSS (the RSS reading-room app):

1. **User Guide page** (`MultivRSS Guide.html`) — a public, single-scroll "How it works" page that explains the eight core actions a user can take, with one screenshot + one short paragraph per action. Bilingual IT/EN.
2. **"Add source" control redesign** (`Add Source — Alternatives.html`) — a proposed UX improvement for the top-bar control that currently reads `+ SOURCE` / `URL`. The file presents the current problem and three alternatives; **Option B was selected** and is the one to implement. The Guide's step 01 already reflects Option B.

## About the design files
The files in this bundle are **design references created in HTML** — prototypes that show the intended look and behavior, **not production code to copy verbatim**. The task is to **recreate these designs in MultivRSS's existing codebase** (Next.js / React + the app's current component and CSS conventions). Re-use existing components, tokens, and patterns where they exist; the HTML here only encodes the visual + interaction intent.

The app already exists (Next.js App Router, see `src/app` and `src/components` in the repo). Relevant existing components: `AddFeedForm.tsx`, `SaveLinkBar.tsx`, `SearchBar.tsx`, `Sidebar.tsx`, `AssignTagsModal.tsx`, `SyncButton.tsx`, `MobileTabBar.tsx`, `ImportCsvForm.tsx`, `ExportCsvButton.tsx`.

## Fidelity
**High-fidelity.** Final colors, typography, spacing, and copy. Recreate pixel-closely using the codebase's existing libraries/patterns. The Guide's steps 02–08 use **real cropped screenshots** of the live app (in `guide/img/`); step 01 uses an **HTML mock** because Option B is a new design that does not exist in the app yet.

---

# PART 1 — "Add source" control redesign (Option B)  ← implement this

## Problem
The top bar currently shows two buttons: `+ SOURCE` and `URL`. Both accept a pasted URL but do different things:
- **SOURCE** → subscribe to an ongoing **feed** (every new post flows in). Backed by `AddFeedForm.tsx`.
- **URL** → **save a single link/article** to *Saved*, to read once. Backed by `SaveLinkBar.tsx`.

The labels describe the *input* ("a URL"), not the *outcome*, so users can't tell which to pick. "SOURCE" is also RSS jargon.

## Option B — one entry point + a guided popover
Replace the two buttons with **a single `+ Add ▾` button** in the top bar. Clicking it opens a **popover** containing:
1. A paste field — `› https://…` ("Paste a link" / "Incolla un link").
2. Two stacked, **described** choices:
   - **Follow as source** — *"Get every new post in your stream."* (icon: `+` in a 2px-bordered square)
   - **Save the link** — *"Drop it in Saved, to read once."* (icon: bookmark, on a terracotta-filled square)

### Why
- Removes the ambiguity: each action carries a one-line description, so the app teaches the difference at the moment of use.
- Cleans up the top bar (one control instead of two).
- Scales: future actions (e.g. import OPML/CSV) can live in the same menu.

### Enhancement (optional, from Option C)
On paste, **auto-detect** whether the URL is a feed or an article and visually pre-highlight the likely choice (keep both available). Requires reliable server-side detection + error handling; ship the basic popover first, add detection later.

## Layout & components (Option B)
**Top-bar button**
- Label: `+ Add ▾` (IT: `+ Aggiungi ▾`). Mono font, 11px, weight 800, letter-spacing .12em, uppercase.
- Fill: black (`#000`), text paper (`#f6f3ec`); the leading `+` is terracotta (`#E2725B`). Padding 9px 13px. No border radius (square).
- Sits at the right of the top bar, before `↻ SYNC`.

**Popover** (anchored below the button, right-aligned)
- Width ~340px. Background `#fff`, 2px solid black border, no radius, no shadow (flat, matches house style).
- Header strip: mono 9.5px/800, letter-spacing .16em, uppercase, color `rgba(0,0,0,.32)`, padding 10px 13px, 1.5px bottom hairline `rgba(0,0,0,.12)`. Text: "PASTE A LINK".
- Paste field: 12px margin, 1.5px solid black border, paper background, padding 10px 12px, mono 11px, placeholder color `rgba(0,0,0,.32)`; leading `›` caret in terracotta, weight 800.
- Each choice row: full width, padding 12px 13px, 1.5px top hairline, hover background = paper. Left icon box 28×28, 2px black border (second one filled terracotta). Title: Inter 13px/800. Description: Inter 11px, color `rgba(0,0,0,.55)`, line-height 1.4.

## Interactions & behavior
- Click `+ Add` → toggle popover open. Click outside / Esc → close.
- Paste/typing a URL into the field enables the two choices (and, with detection, highlights one).
- **Follow as source** → existing add-feed flow (`AddFeedForm` logic): resolve feed, subscribe, add to current/chosen category, refresh stream.
- **Save the link** → existing save-link flow (`SaveLinkBar` logic): store URL in *Saved*.
- Loading: show inline progress on the chosen action while resolving. Error: if a feed can't be found under "Follow", surface a hint and offer "Save the link" instead.

## State
- `addOpen: boolean` (popover visibility)
- `url: string` (paste field)
- `detectedKind?: 'feed' | 'article'` (optional auto-detect)
- `busy: boolean`, `error?: string`

---

# PART 2 — User Guide page (`MultivRSS Guide.html`)

## Purpose
A public, marketing-style "How it works" page (same chrome as Home/Tips/Sources). One screenshot + one short paragraph per action; a quick numbered index at the top jumps to each step (anchor links). Add a `GUIDE` / `GUIDA` item to the site nav (currently only added on this page).

## Structure / views
1. **System bar** — mono status strip (LIVE · NODE · GETTING_started) + IT/EN language toggle.
2. **Nav** — brand (icon + `multivrss` wordmark) · menu (Manifesto / Guide / Sources / Tips) · Sign in / Get started.
3. **Hero** — kicker `// HOW IT WORKS — 08 THINGS YOU CAN DO`, headline ("Everything MultivRSS does, in eight small moves."), one-paragraph intro.
4. **Quick index** — 4-col grid (2-col tablet, 1-col mobile) of 8 numbered cells linking to `#s01`–`#s08`. Hover inverts to black/paper.
5. **8 steps** — two-column grid (text | media), alternating media side per step. Each: mono number+kicker, headline with one terracotta `<em>`, ≤2-sentence body, mono "key" chips. Media sits in a framed "window" (`.shot`) with a mono caption bar.
   - 01 Add a source — **HTML mock of Option B** (see Part 1)
   - 02 Sort into categories — sidebar screenshot
   - 03 Front Page & River — front-page screenshot
   - 04 Save & tag — Assign-tags modal screenshot
   - 05 Search & filter — filter-field screenshot
   - 06 Sync — sync-button screenshot
   - 07 Import / Export CSV — mono "terminal" card (no screenshot exists)
   - 08 On mobile — three phone screenshots on a dark strip
6. **Closing CTA** — black section, "Eight moves. One quiet river." + Start reading.
7. **Footer** — back to home + copyright.

## Behavior
- **Language toggle (IT/EN):** swaps every `[data-i18n]` node's `innerHTML` from a `DICT`, sets `<html lang>` and `document.title`, persists to `localStorage['mv_lang']` (shared across all site pages). On load: read `mv_lang`, else default `en` unless `navigator.language` starts with `it`.
- **Anchor nav:** `html{scroll-behavior:smooth}`, each step has `scroll-margin-top`.
- Responsive breakpoints at 960px (steps collapse to one column, nav menu hidden) and 560px.

## Design tokens (both deliverables)
- Colors: black `#000`, paper `#f6f3ec`, terracotta accent `#E2725B`, card white `#fff`, dark strip `#1d1b18`.
  Ink tints: `rgba(0,0,0,.55)`, `.32`, line `rgba(0,0,0,.12)`, hairline `rgba(0,0,0,.07)`.
- Type: **Inter** (400–900) for prose/headlines; **JetBrains Mono** (400–700) for labels, kickers, captions, code.
- Headlines: weight 900, letter-spacing ≈ -.02 to -.03em. Labels/kickers: mono, uppercase, letter-spacing .12–.2em.
- Borders: 2px solid black (structural), 1.5px for inner/hairlines. **No border-radius, no shadows** — flat editorial look.
- Spacing: section padding 34px (desktop) / 20px (mobile); step vertical padding 54px.

## Assets
- `guide/assets/multivrss-ico.png` — app icon (brand mark; from project `assets/`).
- `guide/img/*.png` — cropped screenshots of the live app (sidebar, frontpage, river, saved, tags-modal, cmd-search, cmd-sync, three mobile shots). `cmd-source.png` is now unused (step 01 became the Option B HTML mock) and can be ignored/removed.
- Fonts loaded from Google Fonts (Inter, JetBrains Mono).

## Files in this bundle
- `MultivRSS Guide.html` — the guide page (step 01 = Option B mock).
- `Add Source — Alternatives.html` — current control + 3 options; **Option B is the chosen direction**.
- `guide/` — assets referenced by the guide page.
- `README.md` — this document.
