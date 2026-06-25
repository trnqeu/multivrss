function RssIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
      <circle cx="2.6" cy="11.4" r="1.7" fill="currentColor" />
      <path
        d="M1 6.2a6.8 6.8 0 0 1 6.8 6.8M1 1.6A11.4 11.4 0 0 1 12.4 13"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
      />
    </svg>
  );
}

const POSTS = [
  { cat: "MANIFESTO", title: "Why we killed the infinite scroll.", date: "09 JUN 2026", read: "4 MIN" },
  { cat: "PRODUCT", title: "Reading lists that outlive the apps that hold them.", date: "28 MAY 2026", read: "5 MIN" },
  { cat: "SELF-HOST", title: "Self-host MultivRSS with Docker in ten minutes.", date: "14 MAY 2026", read: "8 MIN" },
];

export default function MarketingBlog() {
  return (
    <section
      id="blog"
      className="px-[34px] py-[88px] border-t-2 border-black max-[920px]:px-[26px] max-[920px]:py-16"
    >
      <div className="max-w-[1200px] mx-auto">
        <p className="font-mono text-[11px] font-extrabold tracking-[0.22em] text-terracotta uppercase mb-4">
          {"//"} JOURNAL
        </p>

        {/* Header row */}
        <div className="flex items-end justify-between gap-10 mb-12 flex-wrap max-[560px]:flex-col max-[560px]:items-start">
          <div>
            <h2 className="normal-case font-black text-[clamp(34px,4.4vw,60px)] tracking-[-0.025em] leading-[1]">
              Notes from the open web.
            </h2>
            <p className="text-[15px] text-black/55 leading-[1.55] max-w-[440px] mt-[14px]">
              Guides, product notes and short field manuals — written in
              Markdown, shipped in open format.
            </p>
          </div>
          <div className="flex flex-col items-end gap-[10px] text-right max-[560px]:items-start max-[560px]:text-left">
            <a
              href="/blog/feed.xml"
              className="inline-flex items-center gap-[10px] border-2 border-black px-[15px] py-[11px] font-mono text-[11px] font-extrabold tracking-[0.14em] uppercase transition-colors hover:bg-terracotta hover:border-terracotta"
            >
              <RssIcon />
              Subscribe to feed
            </a>
            <span className="font-mono text-[10px] tracking-[0.1em] text-black/30">
              FEED: /blog/it.xml · /blog/en.xml
            </span>
          </div>
        </div>

        {/* Blog grid */}
        <div className="grid grid-cols-1 min-[920px]:grid-cols-[1.5fr_1fr] gap-14 items-start">
          {/* Featured post */}
          <article className="flex flex-col gap-4 border-t-2 border-black pt-[22px]">
            <span className="font-mono text-[10px] font-extrabold tracking-[0.16em] uppercase text-terracotta">
              GUIDE
            </span>
            <h3 className="normal-case text-[34px] font-extrabold tracking-[-0.02em] leading-[1.08] m-0 hover:text-terracotta transition-colors cursor-pointer">
              Every site still has a feed — you just have to ask.
            </h3>
            <p className="text-[16px] leading-[1.6] text-black/55 m-0 max-w-[52ch]">
              Google News, Substack, Reddit, YouTube, GitHub releases. A map of
              the RSS endpoints hiding in plain sight on the modern web, and how
              to turn each into a one-click subscription.
            </p>
            <div className="flex items-center gap-3 font-mono text-[10px] font-semibold tracking-[0.1em] text-black/30 uppercase">
              <span>18 JUN 2026</span>
              <span className="text-black/12">·</span>
              <span>6 MIN</span>
              <span className="text-black/12">·</span>
              <span>it · en</span>
            </div>
          </article>

          {/* Post list */}
          <ul className="list-none m-0 p-0 flex flex-col">
            {POSTS.map((post, i) => (
              <li
                key={post.title}
                className={`py-[22px] flex flex-col gap-[9px] ${
                  i === 0 ? "border-t-2 border-black" : "border-t border-black/7"
                }`}
              >
                <span className="font-mono text-[10px] font-extrabold tracking-[0.16em] uppercase text-terracotta">
                  {post.cat}
                </span>
                <h4 className="text-[19px] font-bold tracking-[-0.01em] leading-[1.25] m-0 hover:text-terracotta transition-colors cursor-pointer">
                  {post.title}
                </h4>
                <div className="flex items-center gap-3 font-mono text-[10px] font-semibold tracking-[0.1em] text-black/30 uppercase">
                  <span>{post.date}</span>
                  <span className="text-black/12">·</span>
                  <span>{post.read}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-9 font-mono text-[10px] tracking-[0.12em] text-black/30 uppercase">
          MARKDOWN-FED ·{" "}
          <b className="text-terracotta">/content/blog/*.md</b> · STATIC BUILD
        </p>
      </div>
    </section>
  );
}
