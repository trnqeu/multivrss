const tips = [
  {
    num: "01 / GOOGLE NEWS",
    title: "Any search becomes a feed.",
    desc: "Insert <code>/rss</code> after the TLD in any Google News search URL.",
    snip: "news.google.com<b>/rss</b>/search?q=site%3Areuters.com&amp;hl=en",
  },
  {
    num: "02 / SUBSTACK",
    title: "/feed at the root.",
    desc: "Every Substack publication exposes its feed at <code>/feed</code>.",
    snip: "stratechery.com<b>/feed</b>",
  },
  {
    num: "03 / REDDIT",
    title: "Any subreddit, any user.",
    desc: "Append <code>.rss</code> to any subreddit or user URL.",
    snip: "reddit.com/r/programming<b>.rss</b>",
  },
  {
    num: "04 / YOUTUBE",
    title: "The hidden Atom feed.",
    desc: "Every channel has one. Grab the channel ID and use:",
    snip: "youtube.com/feeds/videos.xml?<b>channel_id=…</b>",
  },
  {
    num: "05 / MEDIUM",
    title: "Users and publications.",
    desc: "Prefix the path with <code>/feed</code> on medium.com.",
    snip: "medium.com<b>/feed</b>/@username",
  },
  {
    num: "06 / WORDPRESS",
    title: "The original RSS.",
    desc: "Nearly every WordPress site exposes a feed at <code>/feed</code>.",
    snip: "example.com<b>/feed</b>",
  },
  {
    num: "07 / GITHUB",
    title: "Releases, commits, tags.",
    desc: "Atom feeds, no auth required. Three flavors per repo.",
    snip: "github.com/owner/repo<b>/releases.atom</b>",
  },
  {
    num: "08 / NEWSLETTERS",
    title: "Kill the Newsletter.",
    desc: "Generates a unique inbox; subscribe with it, get the feed.",
    snip: "kill-the-newsletter.com<b> ↗</b>",
  },
];

export default function MarketingTips() {
  return (
    <section id="tips" className="px-7 pt-20 pb-10 border-t-2 border-black">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-end mb-[38px]">
        <div>
          <p className="font-mono text-[11px] font-extrabold tracking-[0.22em] text-terracotta mb-[14px]">
            {'//'} FIELD MANUAL — 09 TRICKS
          </p>
          <h2 className="font-sans font-black text-[clamp(36px,4.4vw,64px)] tracking-[-0.025em] leading-none m-0">
            Every site has<br />a feed. Most just<br />hide it well.
          </h2>
        </div>
        <p className="text-[16px] leading-[1.55] text-black/55 max-w-[480px]">
          A working list of URL tricks to turn almost any site into an RSS feed. Copy-paste any of these into the{" "}
          <span className="font-mono text-terracotta font-extrabold">+ SOURCE</span> field and you&apos;re subscribed.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 border-t-2 border-l-2 border-black">
        {tips.map((tip) => (
          <div key={tip.num} className="border-r-2 border-b-2 border-black p-[22px_22px_26px] min-h-[220px] flex flex-col">
            <p className="font-mono text-[10px] font-extrabold tracking-[0.18em] text-terracotta mb-2">{tip.num}</p>
            <h4 className="text-[18px] font-extrabold tracking-[-0.005em] m-0 mb-[10px]">{tip.title}</h4>
            <p className="text-[12.5px] leading-[1.5] text-black/55 m-0 mb-3" dangerouslySetInnerHTML={{ __html: tip.desc }} />
            <div className="mt-auto bg-black text-paper font-mono text-[10px] leading-[1.55] tracking-[0.02em] px-3 py-[10px] break-all whitespace-pre-wrap">
              <span dangerouslySetInnerHTML={{ __html: tip.snip }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
