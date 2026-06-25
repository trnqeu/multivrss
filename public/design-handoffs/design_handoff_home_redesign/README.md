# Handoff: Marketing Site — Home + Curated Sources + Tips

## Overview
A redesigned public marketing site for **MultivRSS**, positioned as your
**"Internet Reading Room"** — the calm place to read the internet. Replaces the
previous single landing (`public/home-page.html` / `src/components/marketing/*`).

It is now **three public pages** sharing one chrome (system strip + brand nav + footer),
one design system, and one EN/IT language switch (choice persists across pages):
1. **Home** (`MultivRSS Home.html`) — hero/manifesto, Blog, Curated-Sources **preview**.
2. **Curated Sources** (`MultivRSS Curated Sources.html`) — public "shelf" of all suggested
   feeds, grouped by category, each with an **ADD → sign-up** action.
3. **Tips & Tricks** (`MultivRSS Tips.html`) — the "Field Manual" of RSS URL tricks (moved off
   the home into its own page).

Key changes vs. the old landing:
- **No more open-source / GitHub.** All "Continue with GitHub", "View on GitHub" and repo
  links removed. No "built in the open" copy.
- **No public reading-list sharing / public profile.** The old "03 / PUBLISH — public best-of
  profile" pillar is gone. Manifesto is now **two lines** (Read / Save), not three.
- **New Blog section** ("Journal"), Markdown-driven, with an **RSS subscribe badge** in its header.
- **New Curated Sources** concept: a public, curator-owned shelf of recommended feeds; ADD on any
  source routes a logged-out visitor to sign-up. Home shows a 6-item preview; the full list is its
  own shareable/SEO page.
- **Tips moved to its own page**, linked from nav + footer (was an on-home section).
- **Bilingual EN/IT** with a language switcher (English is the default/first language).
- **More minimal**: dropped the 3-pillar block, the live product-preview strip, and the pricing
  section; slimmed the top system strip; more whitespace.
- **No "no algorithm" claim** anywhere — the real front page uses a light selection algorithm, so
  that promise was removed. Messaging kept to: ad-free, calm, no infinite scroll, no engagement traps.

## About the Design Files
The files in this bundle (the three `MultivRSS *.html`) are **design references created in HTML** —
prototypes showing the intended look, copy, and behavior. They are **not production code to copy
directly**.

The task is to **recreate this design in the existing codebase** — this repo is **Next.js (App
Router) + React + TypeScript + Tailwind v4** (see `src/components/marketing/`, `next.config.ts`,
`postcss.config.mjs`). Rebuild the page as React components using the project's established
patterns (server components where possible, Tailwind utility classes, the existing font setup),
**not** by dropping the raw HTML in. The standalone HTML uses a tiny `data-i18n` + dictionary
script only because it must run as a single file; in the app, use the project's real i18n
approach (see "Internationalization" below).

## Fidelity
**High-fidelity (hifi).** Final colors, typography, spacing, copy, and hover states are all
intentional. Recreate the UI pixel-perfectly using the codebase's Tailwind setup. Exact values
are listed in **Design Tokens** below; the HTML is the source of truth for anything not spelled out.

---

## Screens / Views
**Routing**: Home `/`, Curated Sources `/sources`, Tips `/tips`. The three pages share the system
strip, brand nav (logo links home), and footer. Nav menu items: `MANIFESTO` (home `#manifesto`),
`BLOG` (home `#blog`), `SOURCES` (home `#sources` anchor on home; full `/sources` page otherwise),
`TIPS` (`/tips`). The active page's nav item is terracotta. In the prototypes, cross-page links use
URL-encoded filenames (`MultivRSS%20Tips.html` etc.); in the app use real routes.

--- 

## HOME (`/`)
Single scrolling page, max content width **1200px**, centered, on a warm paper background.
Section order top→bottom: system strip → brand nav → hero → Blog → Curated-Sources preview →
closing CTA → footer.

### 1. Top system strip (slim)
- Full-width bar, `padding: 11px 34px`, bottom border `1px solid rgba(0,0,0,.12)`.
- Font: JetBrains Mono, **10.5px**, weight 600, `letter-spacing: .13em`, color `rgba(0,0,0,.30)`;
  emphasized `<b>` parts in `rgba(0,0,0,.55)`.
- **Left group** (gap 20px, each item `white-space:nowrap`): `■ LIVE` (7×7px terracotta square +
  "LIVE"), `NODE_multivrss_alpha`, `BUILD_0.1.0`.
- **Right**: language switch — `IT / EN`, two mono buttons (10.5px, weight 700, `.16em`), a
  `/` separator in `rgba(0,0,0,.12)`. Active language is **terracotta**; inactive `rgba(0,0,0,.30)`,
  hover → black.

### 2. Brand nav
- `padding: 26px 34px`, bottom border **2px solid #000**.
- **Left (brand)**: logo `multivrss-ico.png` 34×34, wordmark "multivrss" (Inter, 17px, weight 800,
  `.22em`, uppercase, **terracotta**), then a divider `|` + tagline "INTERNET READING ROOM"
  (JetBrains Mono, 10px, `.12em`, `rgba(0,0,0,.30)`, left border `1px solid rgba(0,0,0,.12)`,
  padding-left 13px). Tagline hidden < 920px.
- **Center menu** (gap 30px; hidden < 920px): `MANIFESTO` (→`#manifesto`), `BLOG` (→`#blog`),
  `TIPS` (→`#tips`). JetBrains Mono, 11px, weight 700, `.18em`, uppercase, black, hover terracotta.
- **Right CTAs** (gap 10px):
  - `SIGN IN` — `.btn-line`: 2px black border, `padding 10px 15px`, mono 10.5px/800/.18em uppercase;
    hover → black bg, paper text.
  - `GET STARTED →` — `.btn-solid`: black bg, paper text, 2px black border; hover → terracotta bg,
    black text.

### 3. Hero (`#manifesto`)
- `padding: 104px 34px 96px`. Grid `1.2fr / 1fr`, gap 56px, `align-items:center`. Collapses to one
  column < 920px (`padding 64px 26px`).
- **Kicker**: "// YOUR INTERNET READING ROOM" — `.label` style (mono 10.5px/700/.18em uppercase),
  **terracotta**, margin-bottom 30px.
- **H1**: Inter, weight **900**, `font-size: clamp(52px, 7vw, 116px)`, `line-height: .95`,
  `letter-spacing: -.035em`, `text-wrap: balance`, margin-bottom 34px. Copy (two lines):
  `Read the open web.` / `Save what matters.` The leading `/` on line 2 is a `<span class="slash">`
  in **terracotta**, weight 800, `padding: 0 6px`.
- **Lede**: Inter 18px, `line-height 1.6`, max-width 540px, color `rgba(0,0,0,.55)`, weight 500,
  margin-bottom 40px. Bold runs (`updates`, `bookmarks`, `Reclaim your attention.`) are black/weight 700.
  Copy (EN): *"MultivRSS is your Internet Reading Room — the calm place to read the internet. All you
  really want from the web is **updates** and **bookmarks**: the feeds you picked, the links you kept.
  No ads, no engagement traps. **Reclaim your attention.**"*
- **Meta row** (gap 20px): `→ START FREE` (`.btn-terra`: terracotta bg, black text, 2px terracotta
  border, `padding 14px 20px`, mono 11.5px/800/.2em uppercase; hover → black bg, terracotta text) +
  note "FREE FOREVER · NO CARD" (mono label, `rgba(0,0,0,.30)`).
- **Hero art** (right, justify-end): a positioned stamp "MARK_v2.1 · ICOSAHEDRON + WAVES · **STABLE**"
  (mono 10px/700/.16em, muted; "STABLE" terracotta) above the image `multivrss-mark.png`
  (max-width 460px, the terracotta RSS-waves + icosahedron mark). On mobile, art justifies left.

### 4. Blog / "Journal" (`#blog`)
- `.section`: `padding 88px 34px`, top border **2px solid #000** (64px 26px < 920px).
- **Section kicker**: "// JOURNAL" (mono 11px/800/.22em uppercase, terracotta, margin-bottom 16px).
- **Header row** (`blog-head`, flex space-between, align-end, wraps):
  - Left: H2 "Notes from the open web." (Inter, `clamp(34px,4.4vw,60px)`, weight 900, `-.025em`,
    line-height 1) + sub (Inter 15px, `rgba(0,0,0,.55)`, max-width 440px): *"Guides, product notes and
    short field manuals — written in Markdown, shipped in open format."*
  - Right (`rss-col`, align-end, text right): **RSS badge** (`.rss-badge`) — 2px black border,
    `padding 11px 15px`, mono 11px/800/.14em uppercase, with an inline RSS glyph (circle + two arcs,
    `currentColor`) and label "Subscribe to feed"; hover → terracotta bg + black. Below it a feeds
    line (mono 10px/.1em, muted): `FEED: /blog/it.xml · /blog/en.xml`.
- **Body grid** (`blog-grid`): `1.5fr / 1fr`, gap 56px, align-start. One column < 920px.
  - **Featured** (`.feat`, left): top border 2px black, padding-top 22px, vertical stack gap 16px:
    - category (mono 10px/800/.16em uppercase, **terracotta**) — "GUIDE"
    - H3 (Inter 34px, weight 800, `-.02em`, line-height 1.08; hover terracotta) —
      "Every site still has a feed — you just have to ask."
    - dek (Inter 16px, `rgba(0,0,0,.55)`, max-width 52ch) — Google News / Substack / Reddit / etc.
    - meta row (mono 10px/600/.1em uppercase, muted, dot separators): `18 JUN 2026 · 6 MIN · it · en`
  - **Post list** (`.post-list`, right): 3 rows. First row top border 2px black; subsequent rows top
    border `1px solid rgba(0,0,0,.07)`; each `padding 22px 0`, stack gap 9px:
    - category (same style) · H4 (Inter 19px, weight 700, `-.01em`, line-height 1.25; hover terracotta)
      · meta (date · read-time).
    - Posts: **MANIFESTO** "Why we killed the infinite scroll." (09 JUN 2026 · 4 MIN);
      **PRODUCT** "Reading lists that outlive the apps that hold them." (28 MAY 2026 · 5 MIN);
      **SELF-HOST** "Self-host MultivRSS with Docker in ten minutes." (14 MAY 2026 · 8 MIN).
- **Markdown note** below grid (`.md-note`, mono 10px/.12em uppercase, muted, margin-top 36px):
  `MARKDOWN-FED · /content/blog/*.md · STATIC BUILD` (with the path in terracotta `<b>`).

### 5. Curated Sources — preview (`#sources`)
- `.section` (top border 2px black). Kicker "// CURATED SOURCES" (terracotta).
- **Header** (`sugg-head`, flex space-between, align-end, wraps): left = H2 "The feeds we actually
  read." (Inter `clamp(34px,4.4vw,60px)`, weight 900, `-.025em`) + sub (Inter 15px, `rgba(0,0,0,.55)`,
  max-width 460px): *"A hand-picked shelf to start from — no sponsorships, no rankings. Add any one to
  your reader; you'll be asked to sign up first."* Right = link `SEE ALL 18 SOURCES →` (mono
  11px/800/.16em uppercase, 2px black bottom-border; hover terracotta) → `/sources`.
- **Grid** (`sugg-grid`): 2 columns (1 < 920px), gap `0 56px`, top border 2px black. Each `.src-row`:
  flex space-between, `padding 16px 0`, bottom border `1px solid rgba(0,0,0,.07)`. Left meta (baseline,
  gap 12px): category tag (mono 9.5px/800/.14em uppercase, terracotta, fixed 78px width) · name
  (Inter 16.5px/700) · domain (mono 11px, `rgba(0,0,0,.30)`; hidden < 920px). Right: **ADD button**
  (`.btn-add`) — 1.5px black border, `padding 7px 12px`, mono 10px/800/.14em uppercase, leading `+`
  in terracotta; hover → terracotta bg + black. Links to `#signup` (route to auth/sign-up).
- 6 preview rows: Farnam Street (MIND), Quanta Magazine (SCIENCE), Simon Willison (TECH),
  Reuters (NEWS), Longreads (CULTURE), Julia Evans (ENG).
- **Note** below grid (`sugg-note`, mono 10px/.12em uppercase, muted):
  `PUBLIC SHELF · /sources · UPDATED WEEKLY · NO ACCOUNT NEEDED TO BROWSE` (path in terracotta `<b>`).

### 6. Closing CTA
- `.close`: `padding 120px 34px`, **black bg, paper text**, top border 2px black, `overflow:hidden`.
- Faint watermark: `multivrss-ico.png` at `right:-130px; bottom:-170px; 600×600; opacity .08;
  pointer-events:none`.
- Centered inner (max-width 920px): tag "// END_OF_FEED" (mono 11px/800/.24em, terracotta) →
  H2 (Inter `clamp(38px,5.6vw,88px)`, weight 900, `-.03em`) **"Reclaim your attention."** with
  "attention" in a terracotta `<em>` (non-italic) → paragraph (16px, `rgba(255,255,255,.55)`,
  max-width 540px): *"MultivRSS is where you come to read the internet in peace — just your updates
  and your bookmarks, in an open format that's yours and built to last. The web was meant to be read,
  not scrolled."*
- Button row (gap 14px, centered): `→ CREATE YOUR ACCOUNT` (`.btn-terra`) + `READ THE BLOG ↗`
  (`.btn-line-inv`: 2px paper border, paper text; hover → paper bg, black text).

### 7. Footer
- Paper bg, top border 2px black, `padding 44px 34px 30px`.
- Row grid `1.5fr / 1fr / 1fr`, gap 28px (2 cols < 920px):
  - **Brand col**: icon 28×28 + "multivrss" wordmark (14px) + blurb (`.blurb`, max-width 300px,
    12.5px, `rgba(0,0,0,.55)`): *"An RSS aggregator and reading list in one open-format dashboard.
    Ad-free, calm, yours."*
  - **Product**: Reader, Reading list, Search, Blog.
  - **Resources**: Curated sources (`/sources`), Tips & tricks (`/tips`), RSS feeds, Changelog, Status.
  - Column headers `h5`: mono 10.5px/800/.2em uppercase, **terracotta**. Links 12.5px/.55 black on hover.
- **Bottom bar** (`.bot`): top border `1px solid rgba(0,0,0,.12)`, margin-top 36px, padding-top 20px,
  flex space-between, mono 10px/.12em, muted: left `© 2026 MULTIVRSS · MADE IN TORINO`, right
  `v0.1.0 · BUILD 2026.05.23`.

---

## CURATED SOURCES PAGE (`/sources`)
Standalone, **public** (no login to browse), shareable/SEO. Same chrome; system strip right slot
reads `PUBLIC_shelf`; nav `SOURCES` item active.
- **Header** (`.head`, `padding 80px 34px 46px`): kicker "// CURATED SOURCES · PUBLIC" → H1 "The
  shelf." (Inter `clamp(48px,6vw,104px)`, weight 900, `-.035em`) → intro grid `1.3fr/1fr`: paragraph
  (17px, `rgba(0,0,0,.55)`, max-width 560px) explaining hand-picked / no sponsorships / public + that
  ADD leads to a 20-second sign-up; right = count block (mono, right-aligned) `18 SOURCES` /
  `07 CATEGORIES · UPDATED WEEKLY`.
- **Category groups** (`.grp`, each top border 2px black): a `grp__head` row = category name
  (mono 13px/800/.22em uppercase) + flex-1 hairline + count (mono 10px/700). Below, a 2-column list
  (`grp__list`, 1 col < 920px) of `.src` rows: name (Inter 16.5px/700) + domain (mono 11px, muted) on
  the left, **ADD button** (same `.btn-add` as home preview) on the right → `#signup`.
  Categories in the prototype: MIND (3), TECHNOLOGY (4), NEWS (3), SCIENCE (2), DESIGN (2),
  ENGINEERING (2), CULTURE (2).
- **Closing**: black band, tag "// READY_TO_READ" → H2 "Add the whole *shelf*." (terracotta `<em>`) →
  paragraph → `→ START FREE` (`.btn-terra`).
- **Footer**: slim single-row variant — left `← BACK TO HOME`, right copyright.
- **Data**: the source list/counts are static design samples. Back with a real curated collection
  (per source: name, domain, feed URL, category, locale availability). The counts (`18 SOURCES`,
  `07 CATEGORIES`) and the home preview's `SEE ALL 18 SOURCES` must be derived from that data, not
  hard-coded. ADD wires to sign-up for logged-out visitors; for logged-in users it should add the
  feed directly.

---

## TIPS PAGE (`/tips`)
Standalone "Field Manual". Same chrome; system strip right slot `FIELD_manual`; nav `TIPS` active.
- **Header** (`.head`): kicker "// FIELD MANUAL — 08 TRICKS" → row grid `1.15fr/1fr` align-end: H1
  "Every site has a feed. Most just hide it well." (Inter `clamp(40px,5vw,84px)`, weight 900, `-.03em`)
  + intro (16px, `rgba(0,0,0,.55)`, max-width 480px; inline `+ SOURCE` token mono/terracotta/800).
- **Grid** (`.tips-grid`): **3 columns** (2 < 920px, 1 < 560px). Top+left 2px black border on the grid,
  right+bottom 2px black per cell — reads as a ledger of boxed cells. Each `.tip`: `min-height 236px`,
  `padding 24px 24px 28px`, flex column:
  - `num` (mono 10px/800/.18em, terracotta) e.g. "01 / GOOGLE NEWS"
  - H4 (Inter 19px/800)
  - p (Inter 13px, `rgba(0,0,0,.55)`) — `<code>` spans JetBrains Mono 11px, black
  - `.snip` pinned to bottom (`margin-top:auto`): black bg, paper text, mono 10.5px/1.55,
    `white-space:pre-wrap; word-break:break-all`, the operative URL fragment in terracotta `<b>`.
  - **9 tiles**: Google News (`/rss`), Substack (`/feed`), Reddit (`.rss`), YouTube
    (`feeds/videos.xml?channel_id=`), Medium (`/feed`), WordPress (`/feed`), GitHub
    (`/releases.atom`, `/commits.atom`), Newsletters (kill-the-newsletter.com), and **RSSHub**
    (the 9th tile is **inverted** — black bg / paper text — as a visual accent). Snippet text is
    language-neutral; only surrounding prose is translated. Google News snippet uses `hl=en`/`hl=it`.
- **Closing**: black band, tag "// + SOURCE" → H2 "Now point them at *one river*." → `→ START FREE`.
- **Footer**: slim single-row variant (back-to-home + copyright).

---

## Interactions & Behavior
- **Language switch**: clicking IT/EN swaps every translatable node and the `<title>`, sets
  `document.documentElement.lang`, marks the active button terracotta, and persists the choice.
- **Hover states**: described per component above (buttons invert; links/headings → terracotta).
- **Anchor + page nav**: home menu jumps to `#manifesto` / `#blog` / `#sources`; `TIPS` and the
  Curated-Sources `SEE ALL` link go to the standalone `/tips` and `/sources` pages. Logo → home.
- **ADD buttons** (home preview + sources page): for a logged-out visitor route to sign-up
  (`#signup` placeholder); for a logged-in user, add the feed to their reader directly.
- **Responsive**: breakpoints at **920px** (collapse hero/blog/sugg grids to one column, hide nav
  menu + brand tagline, tighten padding; sources groups + tips grid reflow) and **560px** (tips grid → 1,
  blog header stacks, RSS column left-aligns).
- No loading/error/validation states — these are static marketing pages. CTAs are placeholders
  (`href="#"` / `#signup`); wire them to real auth/sign-up, the blog, and feed-add actions.

## Internationalization
- Two locales: **English (default/first)** and **Italian**. The page defaults to `en`; if no stored
  preference and the browser language starts with `it`, it falls back to `it`.
- In the standalone file this is a `DICT = { it:{…}, en:{…} }` object keyed by `data-i18n` keys, with
  values applied via `innerHTML` (so bold/`<em>`/`<code>` markup is part of the string). Choice is
  persisted to `localStorage['mv_lang']`.
- **In the app**: replace this with the project's real i18n (e.g. `next-intl` / App Router locale
  segments). Keep the same content keys/strings. Each page carries its own `DICT` block at the bottom;
  **shared keys must stay identical across pages** (`sys.live`, `nav.*`, `footer.copy`, the `add`
  label, etc.) — in the app, hoist these into a shared catalog so the three pages don't drift. Code
  snippets, URLs, build/version stamps, and the wordmark are **not** translated; the Google News
  snippet uses `hl=en`/`hl=it` per locale.

## State Management
- `lang: 'en' | 'it'` — the only real state, **shared across all three pages** via
  `localStorage['mv_lang']`. Source: stored value → else navigator language (`it*` → it) → else `'en'`.
  Transition: language-switch button click. Side effects: re-render all i18n strings, set `<html lang>`,
  set document title, persist. Each page re-reads the stored value on load, so the choice follows the
  user from Home → Sources → Tips.
- Blog posts should come from Markdown in `/content/blog/*.md` (front-matter: title, category, date,
  read-time, locale). The blog list here is a static design sample; back it with a real content
  collection. RSS feeds (`/blog/en.xml`, `/blog/it.xml`) generated per locale at build.
- Curated sources should come from a real curated collection (see Curated Sources page above); the
  preview on Home is the first 6 of that collection.

## Design Tokens
Colors:
- `--black` **#000000**
- `--paper` **#f6f3ec** (warm off-white page bg)
- `--terra` **#E2725B** (terracotta accent — the only accent color)
- ink scale on black: `.55` `rgba(0,0,0,.55)`, `.30` `rgba(0,0,0,.30)`, `.12` `rgba(0,0,0,.12)` (lines),
  `.07` `rgba(0,0,0,.07)` (hairlines)
- on-black text: `rgba(255,255,255,.55)` (`--w-2`), `rgba(255,255,255,.25)` (`--w-3`)

Typography (Google Fonts):
- **Inter** — weights 400/500/600/700/800/900 — all UI text & display headings
- **JetBrains Mono** — 400/500/600/700 — all labels, kickers, stamps, code snippets, nav menu
- **Major Mono Display** — present for geometric numerals (used sparingly; carried over from brand)
- Display H1: weight 900, `clamp(52–116px)`, `line-height .95`, `letter-spacing -.035em`
- Section H2: weight 900, `clamp(32–60px)`, `-.025em`
- Body/lede: Inter 15–18px, `line-height 1.55–1.6`
- Mono labels: 10–11.5px, weight 700–800, `letter-spacing .12–.24em`, UPPERCASE

Spacing / structure:
- Content max-width **1200px**, centered; horizontal page padding **34px** (26px ≤ 920px)
- Section vertical padding **88px** (64px ≤ 920px); hero **104px / 96px**; closing **120px**
- Dividers: section separators **2px solid #000**; sub-rules **1px solid rgba(0,0,0,.12)**;
  list hairlines **1px solid rgba(0,0,0,.07)**
- **No border radius anywhere** (hard edges are intentional — buttons, badges, cells are all square)
- **No box-shadows** — depth comes from borders and the black/paper contrast only

## Assets
In `./assets/` (copied alongside this README):
- `multivrss-ico.png` — icosahedron logo mark (used in nav, footer, and as the closing watermark).
- `multivrss-mark.png` — terracotta RSS-waves + icosahedron hero illustration (transparent PNG,
  1254×960).
Both already exist in the repo at `public/assets/`. Reuse those; do not re-import.
The inline RSS glyph in the blog badge is a tiny hand-rolled SVG (circle + two arcs) — recreate as a
small component or use the project's icon set.

## Files
- `MultivRSS Home.html` — home design reference (hero, Blog, Curated-Sources preview).
- `MultivRSS Curated Sources.html` — the public `/sources` page (full grouped shelf).
- `MultivRSS Tips.html` — the `/tips` Field Manual page.
Each is a single self-contained file (styles in `<head>`, content in `<body>`, i18n `DICT` + switch
logic in the `<script>` at the bottom) and shares the same chrome + tokens. They are the source of
truth; the three `DICT` blocks together are the EN/IT message catalog.
- Old landing being replaced (for reference): `public/home-page.html`,
  `src/components/marketing/MarketingHero.tsx` (+ siblings in `src/components/marketing/`).

## Implementation notes / gotchas
- **Drop these from the old landing**: GitHub buttons/links, the public-profile ("PUBLISH") pillar,
  the live product-preview strip, the pricing section, and any "no algorithm" / "built in the open" copy.
- The front page (the logged-in reader) **does** use a light selection algorithm — keep marketing copy
  consistent with that (no "no algorithm" promise). Allowed claims: ad-free, calm, no infinite scroll,
  no engagement traps, open-format, yours.
- Keep the square-edged, mono-labelled "system/editorial" aesthetic; terracotta is a rare highlight,
  not a fill — don't over-apply it.
