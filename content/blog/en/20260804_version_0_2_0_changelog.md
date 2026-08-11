---
title: "Multivrss 0.2 up close"
category: "PRODUCT DESIGN"
date: "05 AUG 2026"
translationSlug: "20260804_versione_020_changelog"
featured: false
author: "Stefano Trinchero"
excerpt: "In my original plan, multivrss.com was supposed to be simple and minimal, but how can a Product Manager resist the temptation to add a ton of useless features?"
---

*Translated from the original Italian with the help of AI. If a sentence sounds a bit off, that's probably why.*

In my original plan, MultivRSS was supposed to be simple and minimal, but how can a Product Manager resist the temptation to add a ton of useless features? After piling on enough of them, I had to build a page just to keep track of the changes, and try to impose some discipline on how I publish updates.

## Changelog and version tracking

Here you'll find the [changelog](https://multivrss.com/en/changelog) page, with a concise description of every change made in each version.


## Readability for in-app reading

The feature I'm proudest of is the integration with Mozilla's [Readability](https://github.com/mozilla/readability) library, which lets MultivRSS users read articles directly inside the dashboard.

![View of an article open in Reader Mode inside MultivRSS](/blog/20260804/readability.png)


And I'm even prouder of the fact that, as of today, you can:

- **copy articles as plain text** (and maybe paste them into an LLM prompt)
- **download articles as markdown** (and maybe drop them into your favorite *second brain*. And if you don't have a *second brain*, I'd suggest starting [here](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f))

## A few other things

- The app's internal search engine originally ran on [Meilisearch](https://www.meilisearch.com/): blazing fast, extremely capable, and also the textbook definition of *overkill*. I realized Postgres's full-text search was more than enough to search across feeds and saved articles, so I backtracked and removed Meilisearch entirely. If this project had any users, they probably wouldn't have noticed a thing
- **Account deletion**: if this project had any users, they would now be able to delete their own account
- **Progressive Web App**: from Chrome you can install the site as an app and use the PWA on both desktop and mobile. I personally use it on both, with great results
- The ability to **tag** saved articles
- You can paste a **YouTube channel link** and follow it as a source
- Noticeable improvements to the **suggested feeds** page, hopefully one I'll keep updating regularly
- A [**FAQ**](https://multivrss.com/en/faq) page
- Integration with [Sentry](https://sentry.io/) for error reporting

There's definitely more, but this is already long enough.

Until next time.
