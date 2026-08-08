import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";

// This page has no Italian translation — the same English content is served
// at both /en/tips and /it/tips. Point the canonical at the one real URL so
// Google consolidates the two instead of flagging an unresolved duplicate.
// Do not add a `languages` hreflang entry here: there is no distinct
// Italian version to declare (see localizedAlternates() in src/lib/i18n for
// pages that do have one).
export const metadata: Metadata = {
  title: "Tips & Tricks · MultivRSS",
  description: "A field manual of RSS URL tricks to turn almost any site into a feed.",
  alternates: {
    canonical: "/en/tips",
  },
};

type TipData = {
  num: string;
  title: string;
  body: ReactNode;
  snippet: ReactNode;
  inverted?: boolean;
};

const TIPS: TipData[] = [
  {
    num: "01 / GOOGLE NEWS",
    title: "Any search becomes a feed.",
    body: (
      <>
        Insert <code>/rss</code> after the TLD in any Google News search URL.
      </>
    ),
    snippet: (
      <>
        news.google.com<b>/rss</b>/search?q=site%3Areuters.com&amp;hl=en
      </>
    ),
  },
  {
    num: "02 / SUBSTACK",
    title: "/feed at the root.",
    body: (
      <>
        Every Substack publication exposes its feed at <code>/feed</code>.
      </>
    ),
    snippet: (
      <>
        stratechery.com<b>/feed</b>
      </>
    ),
  },
  {
    num: "03 / REDDIT",
    title: "Any subreddit, any user.",
    body: (
      <>
        Append <code>.rss</code> to any subreddit or user URL.
      </>
    ),
    snippet: (
      <>
        {"reddit.com/r/programming"}
        <b>.rss</b>
        {"\nreddit.com/r/worldnews"}
        <b>.rss</b>
      </>
    ),
  },
  {
    num: "04 / YOUTUBE",
    title: "The hidden Atom feed.",
    body: <>Every channel has one. Grab the channel ID and use:</>,
    snippet: (
      <>
        youtube.com/feeds/videos.xml?<b>channel_id=…</b>
      </>
    ),
  },
  {
    num: "05 / MEDIUM",
    title: "Users and publications.",
    body: (
      <>
        Prefix the path with <code>/feed</code> on medium.com.
      </>
    ),
    snippet: (
      <>
        {"medium.com"}
        <b>/feed</b>
        {"/@username\nmedium.com"}
        <b>/feed</b>
        {"/publication-name"}
      </>
    ),
  },
  {
    num: "06 / WORDPRESS",
    title: "The original RSS.",
    body: (
      <>
        Nearly every WordPress site exposes a feed at <code>/feed</code>.
      </>
    ),
    snippet: (
      <>
        example.com<b>/feed</b>
      </>
    ),
  },
  {
    num: "07 / GITHUB",
    title: "Releases, commits, tags.",
    body: <>Atom feeds, no auth required. Three flavors per repo.</>,
    snippet: (
      <>
        {"github.com/owner/repo"}
        <b>/releases.atom</b>
        {"\ngithub.com/owner/repo"}
        <b>/commits.atom</b>
      </>
    ),
  },
  {
    num: "08 / NEWSLETTERS",
    title: "Kill the Newsletter.",
    body: <>Generates a unique inbox; subscribe with it, get the feed.</>,
    snippet: (
      <>
        kill-the-newsletter.com<b> ↗</b>
      </>
    ),
  },
  {
    num: "09 / RSSHUB",
    title: "When all else fails.",
    body: (
      <>
        RSSHub builds feeds for hundreds of sites that ship none. Self-host it
        or use a public instance.
      </>
    ),
    snippet: (
      <>
        docs.rsshub.app<b> ↗</b>
      </>
    ),
    inverted: true,
  },
];

export default function TipsPage() {
  return (
    <>
      {/* Page header */}
      <header className="px-[34px] pt-[80px] pb-[44px] max-[920px]:px-[22px] max-[920px]:pt-14 max-[920px]:pb-8">
        <div className="max-w-[1200px] mx-auto">
          <p className="font-mono text-[10.5px] font-bold tracking-[0.18em] text-terracotta uppercase mb-[22px]">
            {"//"} FIELD MANUAL · 08 TRICKS
          </p>
          <div className="grid grid-cols-1 min-[920px]:grid-cols-[1.15fr_1fr] gap-12 items-end">
            <h1 className="normal-case font-black text-[clamp(40px,5vw,84px)] leading-[0.98] tracking-[-0.03em] m-0">
              Every site has a feed. Most just hide it well.
            </h1>
            <p className="text-[16px] leading-[1.6] text-black/55 m-0 max-w-[480px]">
              A working list of URL tricks to turn almost any site into an RSS
              feed: Google News searches, Substacks, subreddits, YouTube
              channels, GitHub releases. Paste any of these into the{" "}
              <span className="font-mono font-extrabold text-terracotta">
                + SOURCE
              </span>{" "}
              field and you&apos;re subscribed.
            </p>
          </div>
        </div>
      </header>

      {/* Tips grid */}
      <section className="px-[34px] pb-10 max-[920px]:px-[22px]">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid grid-cols-3 max-[920px]:grid-cols-2 max-[560px]:grid-cols-1 border-t-2 border-l-2 border-black">
            {TIPS.map((tip) => (
              <div
                key={tip.num}
                className={`border-r-2 border-b-2 border-black p-6 pb-7 min-h-[236px] flex flex-col ${
                  tip.inverted ? "bg-black text-paper" : ""
                }`}
              >
                <div className="font-mono text-[10px] font-extrabold tracking-[0.18em] text-terracotta mb-[10px]">
                  {tip.num}
                </div>
                <h4
                  className={`text-[19px] font-extrabold tracking-[-0.005em] m-0 mb-[10px] ${
                    tip.inverted ? "text-paper" : ""
                  }`}
                >
                  {tip.title}
                </h4>
                <p
                  className={`text-[13px] leading-[1.5] m-0 mb-[14px] [&_code]:font-mono [&_code]:text-[11px] ${
                    tip.inverted ? "text-white/55 [&_code]:text-paper" : "text-black/55 [&_code]:text-black"
                  }`}
                >
                  {tip.body}
                </p>
                <div
                  className={`mt-auto px-[13px] py-[11px] font-mono text-[10.5px] leading-[1.55] tracking-[0.02em] whitespace-pre-wrap break-all [&_b]:text-terracotta ${
                    tip.inverted ? "bg-paper text-black" : "bg-black text-paper"
                  }`}
                >
                  {tip.snippet}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="px-[34px] py-24 bg-black text-paper border-t-2 border-black text-center max-[920px]:px-[22px] max-[920px]:py-[72px]">
        <p className="font-mono text-[11px] font-extrabold tracking-[0.24em] text-terracotta mb-[18px]">
          {"//"} + SOURCE
        </p>
        <h2 className="normal-case font-black text-[clamp(34px,4.6vw,68px)] tracking-[-0.03em] leading-[1] m-0 mb-5">
          Now point them at{" "}
          <em className="not-italic text-terracotta">one river</em>.
        </h2>
        <p className="text-[15.5px] text-white/55 max-w-[520px] mx-auto mb-8 leading-[1.6]">
          Collect every feed above into a single, calm, typography-first
          reader. No thumbnails, no infinite scroll: just what&apos;s new.
        </p>
        <Link
          href="/register"
          className="inline-block bg-terracotta text-black border-2 border-terracotta px-[20px] py-[14px] font-mono text-[11.5px] font-extrabold tracking-[0.2em] uppercase hover:bg-black hover:text-terracotta hover:border-black transition-colors"
        >
          → START FREE
        </Link>
      </section>
    </>
  );
}
