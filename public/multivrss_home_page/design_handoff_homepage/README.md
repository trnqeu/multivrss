# Handoff: MultivRSS Marketing Homepage

## Overview

This handoff covers the **public marketing homepage** for MultivRSS — the page served at the root route `/` to logged-out visitors. It introduces the product (RSS aggregator + reading list + public profile), shows the actual product UI, documents the "RSS tricks" power-user content, presents the Free/Pro pricing, and converts visitors to signup.

Logged-in users are redirected away from this page to `/` (the reader app); the design here is **for the marketing surface only**.

## About the Design Files

The files in this bundle are **design references created in HTML** — a static prototype showing intended look, layout, copy and behavior. They are **not production code to copy directly.**

The task is to recreate this design in the existing MultivRSS codebase (Next.js 16 App Router, TypeScript, Tailwind CSS, shadcn/ui components — see `AGENTS.md` and `README.md`) using its established patterns: server components by default, Tailwind utility classes, the existing color tokens defined in `tailwind.config.ts` / `globals.css`, and the shadcn primitives in `src/components/ui/*`.

The HTML uses inline `<style>` blocks and CSS custom properties only because it has to stand alone — in the real codebase, **all styling must go through Tailwind utilities** and the design tokens defined below.

## Fidelity

**High-fidelity (hifi).** All colors, spacing, typography weights/sizes, borders, and copy are final. Recreate pixel-perfectly. The only thing that should change vs. the HTML reference is the implementation layer (Tailwind classes instead of inline CSS, React components instead of static markup, real links instead of `#` placeholders).

## File Map (Reference → Codebase)

Suggested file structure inside the existing Next.js app:

```
src/
  app/
    (marketing)/                   ← new route group, no shared layout w/ app
      layout.tsx                   ← marketing-only layout (no auth gate)
      page.tsx                     ← THE HOMEPAGE — composes the sections below
  components/
    marketing/
      SystemStrip.tsx              ← top "LIVE / NODE / BUILD" bar
      MarketingNav.tsx             ← brand + menu + sign in / get started
      Hero.tsx                     ← manifesto + mark image
      Pillars.tsx                  ← 3-column READ / SAVE / PUBLISH
      LivePreview.tsx              ← black product-UI block (uses real reader components if available)
      TipsAndTricks.tsx            ← 4x2 grid of RSS URL tricks
      Pricing.tsx                  ← Free vs Pro plan cards
      ClosingCTA.tsx               ← final black hero w/ CTA
      MarketingFooter.tsx
      primitives/
        ButtonLine.tsx             ← bordered black/white button
        ButtonSolid.tsx            ← solid black button
        ButtonTerra.tsx            ← solid terracotta button
        Label.tsx                  ← mono label (// HEADER text)
```

Server components for everything except interactive bits — there are none on this page beyond `<Link>` and `<button>` form posts to NextAuth, so the whole page can be a server component.

---

## Screens / Views

There is **one screen**: the homepage at `/`. It is a single long-scroll page composed of 9 horizontal bands separated by 2px black hairlines.

### Band 01 — System Strip (top)

- **Purpose:** Setting the "instrument panel / dashboard" tone. Echoes the `CONNECTION: [PROTECTED]` aesthetic of the logged-in app.
- **Height:** ~36px
- **Layout:** flex space-between, horizontal padding 28px, vertical padding 10px, `border-bottom: 1px solid rgba(0,0,0,0.12)`
- **Left group:** `● LIVE` (terracotta dot 7×7px) · `NODE_multivrss_alpha` · `CONNECTION_protected` · `BUILD_0.1.0 · 2026.05.23`
- **Right group:** `UPTIME_99.98%` · `ITEMS_INDEXED_1 248 902` · `READERS_TODAY_3 412`
- **Typography:** JetBrains Mono, 10.5px, weight 600, letter-spacing 0.12em, uppercase. Values (after the underscore) are weight 700 black; labels are `rgba(0,0,0,0.55)`.

### Band 02 — Marketing Nav

- **Height:** ~82px
- **Layout:** flex space-between, padding 22px 28px, `border-bottom: 2px solid #000`
- **Left (Brand lockup):**
  - 38×38px `multivrss-ico.png`
  - Wordmark "MULTIVRSS" — Inter, 18px, weight 800, letter-spacing 0.22em, uppercase, color **#E2725B**
  - Vertical divider (1px, 12px padding-left)
  - Tagline "RSS AGGREGATOR · READING LIST · PROFILE" — JetBrains Mono, 10px, letter-spacing 0.12em, color `rgba(0,0,0,0.55)`
- **Center (Menu):** PRODUCT · TIPS · PRICING · API — Mono 11px, weight 700, letter-spacing 0.18em, uppercase. Hover → terracotta.
- **Right (CTA):**
  - `SIGN IN` — `ButtonLine` (2px black border, padding 9px 14px, mono 10.5px/800/0.18em uppercase). Hover → solid black bg, paper text.
  - `GET STARTED →` — `ButtonSolid` (black bg, paper text, 2px border). Hover → terracotta bg, black text & border.

### Band 03 — Hero

- **Padding:** 72px 28px 0
- **Layout:** 2-column grid, `grid-template-columns: 1.25fr 1fr`, gap 48px, items end.

**Left column:**
- Label "// MANIFESTO — 03 LINES" (terracotta mono label, 28px margin-bottom)
- H1 — Inter, weight 900, `clamp(56px, 7.4vw, 122px)`, line-height 0.95, letter-spacing -0.035em, balanced wrap. Three lines:
  - `Read the open web.`
  - `/Save what matters.` (slash is `weight: 800` terracotta with 6px horizontal padding)
  - `/Publish your best.`
- Lede paragraph — 17.5px, line-height 1.55, max-width 560px, weight 500, color `rgba(0,0,0,0.55)`. **Bold spans are black.** Exact copy:
  > MultivRSS is an RSS aggregator, a reading list, and a public "best-of" profile — in **one fast, ad-free, open-format** dashboard. No algorithm, no engagement traps. Just the feeds **you** picked, the links **you** kept, and the page **you** publish.
- Meta row: `→ START FREE` (terracotta button, larger), `CONTINUE WITH GITHUB` (line button), label `FREE FOREVER · NO CARD` in 55%-black mono.

**Right column (hero-art):**
- min-height 460px, flex items-end justify-end
- Watermark stamp top-left: bordered box (1px hairline), 6px 10px padding, mono 10px/700/0.18em. Text: `MARK_v2.1 · ICOSAHEDRON + WAVES · STABLE` (last word terracotta)
- `assets/multivrss-mark.png` at max-width 520px, full-width responsive

### Band 04 — Three Pillars

- **Layout:** 3 equal columns, each `border-right: 2px solid #000` (last has none), `border-bottom: 2px solid #000` on the band as a whole.
- **Each pillar:** padding 40px 32px 44px
  - **Num label** — mono 11px/800/0.2em, terracotta, 14px margin-bottom. Values: `01 / READ`, `02 / SAVE`, `03 / PUBLISH`
  - **H3** — Inter 28px/800, letter-spacing -0.01em, line-height 1.15, 14px margin-bottom. Two lines with `<br/>`.
  - **Body** — 14.5px, line-height 1.6, 55%-black; bold spans go full black.
  - **URL** — mono 11px/0.08em terracotta, 18px margin-top. Pillar 03's URL has `[username]` as a bold-terracotta inline strong.

Exact copy (see HTML lines 313–339 in `home-page.html`).

### Band 05 — Live Product Preview

- **Wrapper:** padding 64px 28px, paper background.
- **Head:** flex justify-between, `align-items: flex-end`. Left = 36px/800 title with the word `product` in terracotta italic. Right = mono caption, uppercase, max-width 280px, right-aligned.
- **Product card:** the actual reader UI rendered at marketing scale.
  - 2-col grid `220px 1fr`, black background, paper text, 2px black border.
  - **Sidebar:** brand lockup at top, then `NAV_ROOT` / `_ ALL FEEDS`, then category blocks. Each category has a header row (`MIND | 03`) underlined by a 2px terracotta border, followed by sources list.
  - **Main:** header row (title + filter field + `+ SOURCE` + `↻ SYNC` pills), then a status strip `INDEX_30 / 1 000 ITEMS · TIME_5 MS · FILTER_* · CATEGORY_*`, then the **river** — a single dense paragraph of feed items separated by `//` (terracotta) with source tags in terracotta uppercase and timestamps + descriptions in lower-contrast paper.

**This is the only band where you should reach into the real app components.** If `<FeedList>`, `<Sidebar>`, `<RiverItem>` exist in `src/components/reader/*`, import them here and feed them a hard-coded sample payload — that way the marketing page literally shows the product, kept in sync automatically.

### Band 06 — Tips & Tricks

- Anchor `#tips`. Top padding 80px, bottom padding 40px, 2px black top border.
- **Head:** 2-col grid. Left = mono terracotta tag + H2 (`clamp(36px,4.4vw,64px)`, weight 900, letter-spacing -0.025em). Right = 16px/55%-black body explaining the section.
- **Grid:** 4 columns × 2 rows, border-collapse style (`border-top` + `border-left` on the grid, `border-right` + `border-bottom` on each cell). Each cell: min-height 220px, padding 22px 22px 26px, flex column.
  - Num (mono terracotta)
  - H4 (18px/800)
  - Body (12.5px/55%-black)
  - Code snippet at bottom: black bg, paper text, mono 10px, padding 10px 12px, line-height 1.55. The "magic part" of the URL (e.g. `/rss`, `/feed`, `.rss`) is wrapped in `<b>` and rendered terracotta.

8 tricks: Google News, Substack, Reddit, YouTube, Medium, WordPress, GitHub, Newsletters — exact copy and snippets in HTML lines 396–456.

### Band 07 — Pricing

- Anchor `#pricing`. Padding 80px 28px, 2px black top border.
- **Head:** flex space-between. Left = mono terracotta tag + H2 ("Two plans. No middle."). Right = mono caption, uppercase, right-aligned, max-width 280px.
- **Plans grid:** 2 columns, 2px black outer border, 2px black vertical divider.
  - **Free plan:** paper bg, black text. Top row = name (28px/800/0.04em uppercase) + price (`Major Mono Display`, 40px). Feature list — 7 items: 4 enabled (`+` terracotta marker), 3 disabled (`—`, opacity 0.45). CTA = full-width `ButtonLine`.
  - **Pro plan:** black bg, paper text, terracotta name + price. 7 features all enabled. CTA = `ButtonTerra`, full-width.

Exact features in HTML lines 460–495.

### Band 08 — Closing CTA

- Padding 100px 28px, black background, paper text.
- Watermark: `multivrss-ico.png` 620×620px at 8% opacity, positioned `right: -120px; bottom: -160px`, `pointer-events: none`.
- Content: centered, max-width 980px, z-index 2.
  - Mono terracotta tag `// END_OF_FEED`
  - H2 `clamp(40px,6vw,96px)`, weight 900, letter-spacing -0.03em, line-height 0.98. Text: "The web was meant to be **read**, not scrolled." (`read` is terracotta italic-styled-as-normal)
  - Body 16px/55%-paper, max-width 560px
  - Row of 2 CTAs: `→ CREATE YOUR ACCOUNT` (terracotta) + `VIEW ON GITHUB ↗` (paper-bordered line button)

### Band 09 — Footer

- Padding 36px 28px 28px, 2px black top border, paper bg.
- 4-column grid `1.3fr 1fr 1fr 1fr`.
- Column 1: small brand lockup + descriptor sentence.
- Columns 2–4: section headers (mono terracotta 10.5px/800/0.2em uppercase) + link lists (12.5px/55%-black, hover → black).
- Bottom strip: flex space-between, 1px hairline top border, 32px margin-top, mono 10px copyright + version line. `b` spans (`NODE_alpha`, `99.98%`) are terracotta.

---

## Interactions & Behavior

This page is **almost entirely static.** The only interactive elements:

- **Buttons / Links:**
  - `GET STARTED` → `/signup`
  - `START FREE` → `/signup`
  - `CONTINUE WITH GITHUB` → NextAuth GitHub provider (existing in codebase: `signIn('github')`)
  - `SIGN IN` → `/login`
  - `GO PRO` → `/checkout?plan=pro` (or whatever Stripe checkout route exists)
  - `VIEW ON GITHUB` → external repo URL (TBD — pull from `package.json` `repository.url` if defined)
  - Menu links (`#product`, `#tips`, `#pricing`) → smooth-scroll anchors. Add `scroll-behavior: smooth` to `html` for the marketing route group only.

- **Hover states** (all already specified per-component above). Standard pattern: black ↔ paper ↔ terracotta inversions. No transitions over 150ms.

- **No JS state**, no client components, no animations. Server component only.

- **Auth-aware redirect:** in the page's server component, check session via `auth()`. If logged in, `redirect('/reader')` (or whatever the app's authenticated landing is).

## State Management

None. The page is purely presentational.

The dynamic-looking values in the **System Strip** (`UPTIME 99.98%`, `ITEMS_INDEXED 1 248 902`, `READERS_TODAY 3 412`) and **Footer** are **intentionally hard-coded**. They communicate "this is a real running system", not real-time telemetry. **Do not** wire them up to an API on first pass — that's a future enhancement.

If/when you do wire them: use server-side fetching in the layout, cache for 60s with `revalidate`, and gracefully degrade to the hard-coded values on error.

## Responsive Behavior

Breakpoint at **900px** (matches Tailwind's `lg` ≈ 1024px loosely — round to `lg:` in Tailwind):

- Hero grid collapses 2-col → 1-col
- Pillars collapse 3-col → 1-col, borders rotate from right to bottom
- Live product preview collapses sidebar → top stack
- Tips grid collapses 4-col → 2-col
- Pricing collapses 2-col → 1-col
- Footer collapses 4-col → 2-col
- Nav menu hides; replace with hamburger sheet (use existing shadcn `Sheet` component if present)

## Design Tokens

**Colors** — add to `tailwind.config.ts` if not already present. The project already uses these; verify and reuse:

| Token | Hex / value | Tailwind suggestion |
|---|---|---|
| `--paper` | `#f6f3ec` | `bg-paper` |
| `--black` | `#000000` | `bg-black` |
| `--white` | `#ffffff` | `bg-white` |
| `--terra` | `#E2725B` | `text-terracotta` / `bg-terracotta` |
| `--ink-2` (55% black) | `rgba(0,0,0,0.55)` | `text-black/55` |
| `--ink-3` (25% black) | `rgba(0,0,0,0.25)` | `text-black/25` |
| `--ink-line` (12% black) | `rgba(0,0,0,0.12)` | `border-black/10` |
| `--w-2` (55% white) | `rgba(255,255,255,0.55)` | `text-white/55` |
| `--w-3` (25% white) | `rgba(255,255,255,0.25)` | `border-white/25` |

**Typography:**

| Family | Use | Tailwind |
|---|---|---|
| Inter (400/500/600/700/800/900) | Body + headlines | `font-sans` |
| JetBrains Mono (400/500/600/700) | Labels, code, system text | `font-mono` |
| Major Mono Display | Display prices, decorative | `font-display` (add to config) |

Load via Google Fonts (already in HTML head) — in Next.js use `next/font/google` instead.

**Spacing scale** used: 6 · 10 · 12 · 14 · 18 · 22 · 28 · 32 · 36 · 40 · 48 · 64 · 72 · 80 · 100 px. All map cleanly to Tailwind's default scale (1.5 · 2.5 · 3 · 3.5 · 4.5 · 5.5 · 7 · 8 · 9 · 10 · 12 · 16 · 18 · 20 · 25).

**Borders:** Always `2px solid black` for structural dividers. `1px solid rgba(0,0,0,0.12)` for hairlines (system strip bottom, footer bottom). **No border-radius anywhere** — sharp 90° corners are part of the visual identity.

**Shadows:** None. Zero. The design system is shadowless and uses borders + contrast for elevation.

**Letter-spacing scale:** `-0.035em` (hero H1), `-0.025em` (section H2), `-0.01em` (H3), `0.04em` (plan name uppercase), `0.08em` (URLs), `0.12em` (system strip), `0.18em` (mono labels, button text), `0.2em` (pillar nums), `0.22em` (wordmark, footer headers), `0.24em` (closing tag).

## Assets

All in `assets/` folder of this bundle (and already in the project at `/assets/`):

- `multivrss-ico.png` — square app icon (icosahedron mark, terracotta on black). Used in nav lockup, sidebar lockup, footer lockup, closing watermark.
- `multivrss-mark.png` — full mark composition (icosahedron + waves). Used **only** in the hero right column.

These come from the existing brand exploration files in the project root (`logo-redesign.html`, `logo-explorations.jsx`). The two PNGs in `assets/` are the final stable versions (`MARK_v2.1`).

## Files in This Bundle

- `README.md` — this document
- `home-page.html` — the design reference (single self-contained HTML file)
- `assets/multivrss-ico.png` — app icon (icosahedron)
- `assets/multivrss-mark.png` — full mark (icosahedron + waves)

## Implementation Order (Suggested)

1. **Set up route + tokens.** Create `(marketing)` route group with its own `layout.tsx`. Add design tokens (paper, terracotta, ink scales) to `tailwind.config.ts`. Load fonts via `next/font`.
2. **Build primitives.** `<Label>`, `<ButtonLine>`, `<ButtonSolid>`, `<ButtonTerra>` first — they're used across every band.
3. **Top-to-bottom static bands.** SystemStrip → Nav → Hero → Pillars. Match measurements pixel-for-pixel against `home-page.html` open side-by-side in browser.
4. **Live preview band.** Either (a) hard-code the markup as in the reference, or (b) import real reader components from `src/components/reader/*` with a hard-coded sample payload. Option (b) is preferred long-term — the marketing page then auto-updates as the reader evolves.
5. **Tips & Tricks, Pricing, Closing, Footer.** Mostly content + small primitives.
6. **Responsive sweep** at 900px breakpoint.
7. **Wire CTAs** to existing auth/signup/checkout routes. Add `auth()` redirect for logged-in users.
8. **A11y pass.** Headline hierarchy is already correct (one H1, then H2s, then H3/H4). Verify color contrast on `text-black/55` against paper bg (should pass AA at 14.5px+). Add `aria-label` to icon-only buttons. Ensure all interactive elements are keyboard-reachable.

## Out of Scope (for this handoff)

- The **logged-in reader UI** — only the preview band approximates it. The real reader is a separate handoff.
- The **`/signup`, `/login`, `/[username]` routes** — link targets only.
- **Real telemetry** for the system strip — see "State Management" above.
- **i18n** — copy is English-only per the project's English-only UI rule.
