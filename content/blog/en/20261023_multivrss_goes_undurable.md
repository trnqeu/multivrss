---
title: "MultivRSS goes Undurable"
category: "PRODUCT DESIGN"
date: "23 OCT 2026"
translationSlug: "20261023_multivrss_diventa_undurable"
featured: false
author: "Stefano Trinchero"
excerpt: "The links you save on MultivRSS can now fade: first they lose their details, then their title, then they're gone. Why did I do it?"
---

*Translated from the original Italian with the help of AI. If a sentence sounds a bit off, that's probably why.*

I recently launched a project called [Undurable](https://undurable.com). I described it as a "lab for technological impermanence", because it's meant to be a place to explore **controlled forgetting**, "data fading", "de-databasing" and other made-up notions, all attempts at solving a problem that is probably mine alone: the abuse of memory in digital ecosystems.

If you want to dig deeper, there's a short [manifesto](https://undurable.com/manifesto) where I try to explain the reasons behind this work.

I wanted MultivRSS to become part of Undurable because at some point I asked myself a question: with MultivRSS, haven't I just built myself **yet another place to pile things up forever**? And isn't that exactly the problem I'm trying to tackle with Undurable?

I mainly use MultivRSS to read and save interesting links. But I used to save those "interesting links" on Pocket. Then, when Pocket shut down, I downloaded them all and put them on Instapaper. Then, when I built MultivRSS, I downloaded them from Instapaper and imported them into MultivRSS. I'll probably keep doing the same thing for the rest of my life, but I started wondering: why am I doing this? How many of these articles will ever actually get "used"? Probably none. Many of them I never even read, precisely because I was saving them. "I'll save this and read it later", we tell ourselves, but later never comes, the reading list keeps growing, and we end up dragging around an inert collection of abandoned digital objects. Wouldn't it make more sense to save less and read more? Or to save less, read less, and understand the few things we do read more deeply?

So I decided to add a new feature to MultivRSS that makes saved links decay over time.

## How it works in concrete terms

A link you save and never open again loses its description after about ten weeks. After about five months it becomes a **trace**: no title, only the site it came from, the month you saved it and its tags. Something like "a link from theguardian.com, saved in March, tagged climate". After about nine months it's gone.

Coming back to a link, on the other hand, extends its life. Opening an item, finding it with search, reading it in Reader Mode, editing its title or tags: every one of these gestures gives it more life. And at the top of the saved page there's a new section, **Fading soon**, that each week shows what is about to lose something, with a **Keep** button next to each item.

Fading is optional. For existing accounts it stays off until you turn it on in *Settings → Account*.

## The choices

Before writing a single line of code I set a few rules, and treated them as constraints rather than good intentions.

**Opt-in, never retroactive.** Nobody lost anything with the update. Turning fading on restarts every saved item from zero: a link saved two years ago and never reopened doesn't vanish that same night.

**Forgetting is irreversible.** What fades is deleted from the database: no trash, no history, no undo. Turning fading off stops it, but gives nothing back. One honest caveat: database backups are kept for 30 days, so a forgotten link can still exist in a backup for up to 30 days, and then it's gone for good.

**Fading by subtraction, not by contrast.** The obvious temptation was to make the text lighter and lighter. But the MultivRSS design system has no grays and requires a contrast of at least 4.5:1: unreadable text is an accessibility problem, not a metaphor. So a faded item loses *information*, and says so: a text label (FADED, TRACE) and a dashed or dotted separator. What's left reads perfectly well.

**One at a time.** There is no "keep all". It would have been the first button people asked for and the last one I'd add: choosing what to keep, one item at a time, is the whole point.

**Eternity is not for sale.** Fading will never become a reverse Premium feature, the "pay and your links stay forever" kind.

**Imports never backdate.** Links imported from Pocket, Instapaper or CSV start fresh, whatever their original date. Otherwise anyone arriving with ten years of archive would watch it evaporate overnight.

## How it works technically

I wanted the way links are "remembered" to loosely mirror how human memory works, trying to build in a few of the mechanisms that strengthen a memory: affinity, recall, and actually using that particular piece of information.

Every saved item has two numbers: when you last touched it, and a **stability**, measured in days, that starts at 60. From those two numbers we compute its **retention**, meaning how well you remember it:

```
R = exp(-days since last touch / stability)
```

R is 1 right after a touch and slowly drifts toward zero. It's never stored in the database: it's computed every time. When it drops below 0.30 the item loses its description, below 0.08 it becomes a trace, below 0.01 it's forgotten. With a stability of 60 days, the three thresholds fall at 72, 152 and 276 days.

### Touches

Every interaction is a "touch" and does two things: it raises stability, so the curve falls more slowly, and it winds back the clock of the last touch. By how much depends on the gesture:

| Gesture | Weight |
|---|---|
| Opening the link | the lightest |
| Editing title or tags | a bit more |
| Finding it with search | more |
| Keep in Fading soon | more still |
| Reading it in Reader Mode | the strongest |

Searching is worth more than opening for a simple reason: scrolling a list is *recognizing*, searching is *recalling*. If you go looking for something, it stuck with you.

There's one detail that makes the model behave more like memory than like a click counter. The gain in stability is proportional to how close the item was to fading: it's the *spacing effect*, known for more than a century in memory research. An example with the real numbers:

- you open a link the day after saving it: stability goes from 60 to about 61 days. Almost nothing;
- you read it in Reader Mode after 70 days, when it was about to lose its description: stability rises to 93 days, and the next fade moves more than three months away.

Ten clicks in a row on a freshly saved item add almost nothing. Rescuing one that was nearly lost is worth a lot. And there's a ceiling: even a heavily used item, once abandoned, is gone within a few years.

One last rule: a touch can bring retention back up, but it never moves an item back to an earlier stage. If a link has already lost its description, that description no longer exists. Lost words stay lost.

### Association of ideas

This part wasn't in the original plan. When you read, search or keep an item, the two most related saved items get a weaker touch: a shared tag, shared words in the title, the same site. A bit like when one article brings another back to mind.

It's a touch that only raises stability, without winding back the clock, and it stops after one step: an association never triggers further ones in a chain, otherwise everything would stay alive. And each item can receive at most one a day, so that a very generic article isn't kept alive by all its neighbors.

Affinity is computed on the text that still exists. So an item that fades also loses its associations: a trace, with no words left, connects to the others only through tags and site.

### How it works even more technically

There's no new service. The model is a handful of pure TypeScript functions, with no database and no clock: time is a parameter, which makes it possible to test months of forgetting in a millisecond. The state lives in three columns in PostgreSQL, next to each saved item.

Every night a job in the same worker that already syncs feeds makes three passes, in this order: it forgets what's below 0.01, reduces to a trace what's below 0.08, and removes the description of what's below 0.30. It works in batches of a thousand rows, with SQL queries that compute retention right in the database, and it's idempotent: running it twice in a row changes nothing the second time. It also has a dry-run mode that counts what it would do without touching anything. The logs only ever get numbers, never titles or URLs.

Touches leave the browser with `sendBeacon`, which doesn't slow down navigation, and only from explicit gestures. Never while a page is being generated on the server: Next.js prefetches links, and a touch recorded during rendering would count pages nobody looked at as reads.

## What now

Fading is off for every existing account: if you want to try it, you'll find it in *Settings → Account*. There, and in the [FAQ](https://multivrss.com/en/faq#faq-saved-fading), you'll also find the details of how it works.

I don't know yet what all this will lead to. Will it help us give more weight to the things we save? Will we read more? Will what we read stay with us longer? I don't know, but I do know that a list that only grows stopped being read a long time ago, and knowing that something can disappear may be the only reason to go back to it.
