---
title: "Multivrss 1.0, now open source"
category: "PRODUCT DESIGN"
date: "17 SEP 2026"
translationSlug: "20260917_open_source_it"
featured: true
author: "Stefano Trinchero"
excerpt: "Somewhere between 0.2 and today, MultivRSS turned into a real product. So I'm calling it 1.0, and putting the code out in the open."
---

*DRAFT, not yet published. Review, rewrite, then move to content/blog/en/ (and its Italian counterpart to content/blog/it/) when ready.*

Somewhere between version 0.2 and today, MultivRSS quietly turned into a product I actually trust enough to call finished, or at least "finished enough to stop calling it a beta." So today I'm bumping the version to 1.0, and doing the other thing I'd been putting off: making the code public.

## Why open source

If you read the [manifesto](https://multivrss.com/en/blog/20260725_why-the-internet-doesnt-love-me-back), you already know why MultivRSS exists. This is the practical follow-up: the code is now public on [GitHub](https://github.com/trnqeu/multivrss), under the MIT license.

To be upfront about what that does and doesn't mean: I'm not looking for contributors, and I don't accept external Pull Requests. Not because I don't trust anyone with the codebase, but because reviewing and maintaining someone else's changes on top of a solo project isn't something I have the time for right now. Bug reports are genuinely welcome, though, and if you want to run your own instance instead of using the hosted one, that's exactly what the code being public is for. There's a [self-hosting guide](https://github.com/trnqeu/multivrss/blob/main/SELF_HOSTING.md) for that.

## What's new since 0.2

A few things shipped along the way to 1.0:

- **Reader Mode now works on saved links too**, not just items from your feeds. Save anything from anywhere, then read it in-app.
- **CSV import and export for saved links**, compatible with Instapaper and Pocket exports, so leaving those tools behind doesn't mean starting from zero.
- **The Saved page got redesigned** and now actually refreshes itself when you navigate back to it, instead of quietly going stale.
- **The Front Page** keeps every category visible and shows a short excerpt on every item, with a running progress count for the day.
- **Digest**, a small experiment on the blog: save an article or subscribe to a feed I mention in a post, without leaving the page.

There's a full [changelog](https://multivrss.com/en/changelog) if you want the complete list.

Until next time.
