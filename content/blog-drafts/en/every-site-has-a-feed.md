---
title: "Every site still has a feed — you just have to ask."
category: "GUIDE"
date: "18 JUN 2026"
lang: "en · it"
featured: true
excerpt: "Google News, Substack, Reddit, YouTube, GitHub releases. A map of the RSS endpoints hiding in plain sight on the modern web, and how to turn each into a one-click subscription."
---

The open web never stopped having feeds. We just forgot to look.

## The usual suspects

**Substack** publishes a feed at `https://yourauthor.substack.com/feed`. No settings to enable, no account required.

**YouTube channels** expose an Atom feed at `https://www.youtube.com/feeds/videos.xml?channel_id=CHANNEL_ID`. Find the channel ID in the page source or the URL.

**Reddit** appends `.rss` to any subreddit or user page: `https://reddit.com/r/programming.rss`.

**GitHub releases** ship a feed at `https://github.com/USER/REPO/releases.atom`. Works for any public repository.

**Podcasts** are RSS by design — copy the feed URL from your podcast app's share sheet.

## Finding hidden feeds

When a site doesn't advertise its feed, look in the HTML `<head>`:

```html
<link rel="alternate" type="application/rss+xml" href="/feed.xml" />
```

Or add `/feed`, `/rss`, `/atom.xml`, `/feed.xml` to the domain and see what responds.

Most WordPress, Ghost, and Hugo sites respond at one of those paths. Medium publications respond at `https://medium.com/feed/PUBLICATION`.

## When there is truly no feed

Use a service that converts a page into a feed — or ask MultivRSS to monitor it for you (coming soon).

The point is: the infrastructure never left. RSS is alive, it just stopped being loud about it.
