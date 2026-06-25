# MultivRSS — Editorial Plan

A living document for blog content at `/blog`. Posts live in `content/blog/` as Markdown files.
Update this file whenever a post is drafted, published, or when format rules change.

---

## Content Principles

- **Own perspective first.** No generic "10 tips" listicles. Every post has a point of view.
- **Short is fine.** A 300-word "feed of the day" is a full post. Quality over length.
- **Product-adjacent, not product-obsessed.** The blog is about the open web and RSS culture, not just MultivRSS features.
- **English only** in post body. Filenames and slugs use kebab-case.
- **Markdown + frontmatter.** Every post starts with: `title`, `date`, `category`, `excerpt`, `read` (e.g. `3 MIN`).

---

## Post Categories

| Category | Purpose | Frequency |
|----------|---------|-----------|
| `MANIFESTO` | Strong opinions on reading, attention, open web | Rare — when there's something real to say |
| `PRODUCT` | Feature releases, design decisions, behind-the-scenes | Per major release |
| `GUIDE` | How-to: find feeds, build habits, self-host | 1–2/month |
| `FEED OF THE DAY` | One recommended feed + why it's worth following | 3–5/week (flagship format) |
| `SELF-HOST` | Docker, VPS, infra for the technical reader | As needed |
| `FIELD NOTES` | Short observations on RSS, reading culture, the web | 1/week |

---

## Flagship Format: Feed of the Day

The single most important content type. Low effort to produce, high value to the reader, and perfectly on-brand for an RSS reader.

### Format spec

```markdown
---
title: "Feed of the Day: [Source Name]"
date: YYYY-MM-DD
category: FEED OF THE DAY
excerpt: One sentence on what the feed is about and why it's worth subscribing.
read: 2 MIN
feed_url: https://example.com/feed.xml
---

## [Source Name]

**What it is:** One sentence description.
**Who it's for:** Target reader.
**Why it's great:** 2–3 sentences. What makes this feed stand out — voice, frequency, depth, uniqueness.
**Subscribe:** `[source URL]` → add `/feed` (or note the exact feed URL)

> [Optional pull quote from a recent post that shows the feed's voice.]
```

### Rules

- Never recommend a feed you haven't read at least 5 posts from.
- Always include the literal feed URL so readers can paste it directly into MultivRSS.
- If the site is non-obvious (e.g. a YouTube channel, a Substack, a Reddit thread), explain *how* to get the RSS URL.
- Keep it to 200–400 words max. The goal is discovery, not a review essay.
- Tag as `FEED OF THE DAY` in frontmatter so it can be filtered/aggregated separately.

---

## Pipeline

| Status | Post | Category | Target date |
|--------|------|----------|-------------|
| **Draft** | Why we killed the infinite scroll | MANIFESTO | — |
| **Draft** | Reading lists that outlive the apps that hold them | PRODUCT | — |
| **Draft** | Self-host MultivRSS with Docker in ten minutes | SELF-HOST | — |
| **Planned** | Feed of the Day: Hacker News | FEED OF THE DAY | — |
| **Planned** | Feed of the Day: Simon Willison's Weblog | FEED OF THE DAY | — |
| **Planned** | Feed of the Day: Daring Fireball | FEED OF THE DAY | — |
| **Planned** | Feed of the Day: The Guardian Science | FEED OF THE DAY | — |
| **Planned** | Feed of the Day: Stratechery | FEED OF THE DAY | — |
| **Planned** | How to turn any YouTube channel into an RSS feed | GUIDE | — |
| **Planned** | The 10 feeds every developer should follow | GUIDE | — |
| **Planned** | Kill the Newsletter: turn email into RSS | GUIDE | — |
| **Planned** | RSS is not dead — it's the only thing left | MANIFESTO | — |

---

## Planned "Feed of the Day" Posts

A queue of feeds worth covering, with brief notes.

### Tech & Dev
- **Hacker News** (`https://news.ycombinator.com/rss`) — the obvious one, worth a post explaining the front-page vs `/newest` feeds and how to filter by score.
- **Simon Willison's Weblog** (`https://simonwillison.net/atom/everything/`) — one of the best personal tech blogs. Posts with genuine depth on AI, Python, open source.
- **Julia Evans** (`https://jvns.ca/atom.xml`) — low-frequency, high-quality. Comics + long posts on debugging and systems programming.
- **Filippo Valsorda** (`https://filippo.io/index.xml`) — Go, cryptography, open-source sustainability. Dense and authoritative.
- **Dan Luu** (`https://danluu.com/atom.xml`) — rare posts but each one is a primary source. Performance, engineering culture, empiricism.

### Journalism & Current Affairs
- **Reuters Top News** (`https://feeds.reuters.com/reuters/topNews`) — clean, high-frequency wire feed without editorial noise.
- **The Guardian - World** (`https://www.theguardian.com/world/rss`) — long-form alongside wire reporting.
- **ProPublica** (`https://www.propublica.org/feeds/propublica/main`) — investigative journalism, rarely wrong.

### Science
- **Quanta Magazine** (`https://api.quantamagazine.org/feed/`) — science writing that doesn't condescend. Maths, physics, biology.
- **NASA Breaking News** (`https://www.nasa.gov/rss/dyn/breaking_news.rss`) — mission updates and images.

### Culture & Writing
- **Brain Pickings / The Marginalian** (`https://www.themarginalian.org/feed/`) — long, researched, lyrical. Weekly pace is sustainable.
- **Aeon Magazine** (`https://aeon.co/feed.rss`) — philosophy, psychology, and culture essays. Quality/density ratio is exceptional.

### Tools & Open Source
- **GitHub Blog** (`https://github.blog/feed/`) — product announcements and engineering posts. Useful if you use GitHub daily.
- **Changelog Podcast** (`https://changelog.com/podcast.rss`) — shows that RSS handles audio too. Good intro to the "podcast = RSS" angle.

---

## Notes on the Blog Route

- Future route: `/blog/[slug]` driven by `.md` files in `content/blog/`
- Index at `/blog` sorted by date, filterable by category
- RSS feed for the blog itself at `/blog/feed.xml` (already referenced in `MarketingBlog.tsx`)
- "Feed of the Day" posts can optionally have their own sub-feed: `/blog/fotd.xml`
- No CMS — Markdown + Git is the CMS

---

## Publishing Checklist

Before publishing any post:

- [ ] Frontmatter complete: `title`, `date`, `category`, `excerpt`, `read`
- [ ] For FEED OF THE DAY: `feed_url` present and tested in MultivRSS
- [ ] English only (no Italian in post body)
- [ ] Slug is kebab-case, under 60 chars
- [ ] Excerpt under 140 chars (for OG/Twitter card)
- [ ] No orphaned links or broken references
- [ ] Update this file: move post from Planned → Draft → Published in the Pipeline table
