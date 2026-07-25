import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Curated Sources · MultivRSS",
  description:
    "A hand-picked shelf of RSS feeds to start from. No sponsorships, no rankings. Public and free to browse.",
};

const GROUPS = [
  {
    name: "CULTURE",
    sources: [
      { name: "The Guardian: Books", domain: "theguardian.com", url: "https://www.theguardian.com/books/rss" },
      { name: "The Conversation (English)", domain: "theconversation.com", url: "https://theconversation.com/articles.atom?language=en" },
      { name: "Luciano Floridi", domain: "mastodon.world", url: "https://mastodon.world/@lucianofloridi.rss" },
      { name: "NPR Topics: Movies", domain: "npr.org", url: "https://feeds.npr.org/1045/rss.xml" },
      { name: "The Verge", domain: "theverge.com", url: "https://www.theverge.com/rss/index.xml" },
      { name: "Wikipedia: On This Day", domain: "en.wikipedia.org", url: "https://en.wikipedia.org/w/api.php?action=featuredfeed&feed=onthisday&feedformat=atom" },
      { name: "Wikipedia: Picture of the Day", domain: "en.wikipedia.org", url: "https://en.wikipedia.org/w/api.php?action=featuredfeed&feed=potd&feedformat=atom" },
    ],
  },
  {
    name: "DESIGN",
    sources: [
      { name: "Michele De Lucchi's Substack", domain: "micheledelucchi.substack.com", url: "https://micheledelucchi.substack.com/feed" },
    ],
  },
  {
    name: "HUMOR",
    sources: [
      { name: "NPR Topics: Humor & Fun", domain: "npr.org", url: "https://feeds.npr.org/1052/rss.xml" },
      { name: "xkcd", domain: "xkcd.com", url: "https://xkcd.com/atom.xml" },
    ],
  },
  {
    name: "MUSIC",
    sources: [
      { name: "The Guardian: Music", domain: "theguardian.com", url: "https://www.theguardian.com/music/rss" },
      { name: "Pitchfork: Album Reviews", domain: "pitchfork.com", url: "https://pitchfork.com/feed/feed-album-reviews/rss" },
      { name: "The FADER", domain: "thefader.com", url: "https://www.thefader.com/feed.rss" },
      { name: "The Line of Best Fit", domain: "bestfitmusic.substack.com", url: "https://bestfitmusic.substack.com/feed" },
    ],
  },
  {
    name: "NEWS",
    sources: [
      { name: "404 Media", domain: "404media.co", url: "https://www.404media.co/rss/" },
      { name: "BBC News", domain: "bbc.co.uk", url: "https://www.bbci.co.uk/news/rss.xml" },
      { name: "Kagi News: World", domain: "news.kagi.com", url: "https://news.kagi.com/world.rss" },
      { name: "NPR Topics: News", domain: "npr.org", url: "https://feeds.npr.org/1001/rss.xml" },
      { name: "NPR: World Story of the Day", domain: "npr.org", url: "https://feeds.npr.org/1056/rss.xml" },
      { name: "Repubblica.it", domain: "repubblica.it", url: "https://www.repubblica.it/rss/homepage/rss2.0.xml" },
      { name: "Wikipedia: Current Events", domain: "en.wikipedia.org", url: "https://www.to-rss.xyz/wikipedia/current_events/" },
      { name: "The Guardian: World News", domain: "theguardian.com", url: "https://www.theguardian.com/world/rss" },
    ],
  },
  {
    name: "PODCAST",
    sources: [
      { name: "Dwarkesh Podcast", domain: "dwarkesh.com", url: "https://www.dwarkesh.com/feed/podcast/" },
      { name: "Lex Fridman Podcast", domain: "lexfridman.com", url: "https://lexfridman.com/feed/podcast/" },
      { name: "The Ezra Klein Show", domain: "nytimes.com", url: "https://feeds.simplecast.com/82Fl35Px" },
    ],
  },
  {
    name: "SCIENCE",
    sources: [
      { name: "Noema Magazine", domain: "noemamag.com", url: "https://www.noemamag.com/?feed=noemarss" },
    ],
  },
  {
    name: "SPORT",
    sources: [
      { name: "Dynasty League Football", domain: "dynastyleaguefootball.com", url: "https://dynastyleaguefootball.com/feed" },
      { name: "MLB.com Blogs", domain: "mlblogs.com", url: "https://mlbcomblogs.mlblogs.com/feed" },
    ],
  },
  {
    name: "TECH",
    sources: [
      { name: "Hacker News", domain: "news.ycombinator.com", url: "https://news.ycombinator.com/rss" },
      { name: "IEEE Spectrum", domain: "spectrum.ieee.org", url: "https://spectrum.ieee.org/customfeeds/feed/all-topics" },
      { name: "Kagi News: Technology", domain: "news.kagi.com", url: "https://news.kagi.com/tech.rss" },
      { name: "MIT News", domain: "news.mit.edu", url: "https://news.mit.edu/rss/feed" },
      { name: "NPR Topics: Technology", domain: "npr.org", url: "https://feeds.npr.org/1019/rss.xml" },
      { name: "NYT: Technology", domain: "nytimes.com", url: "https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml" },
      { name: "Simon Willison's Weblog", domain: "simonwillison.net", url: "https://simonwillison.net/atom/entries/" },
      { name: "The Next Web", domain: "thenextweb.com", url: "https://thenextweb.com/feed" },
      { name: "MultivRSS Blog (EN)", domain: "multivrss.com", url: "https://multivrss.com/blog/en.xml" },
      { name: "MultivRSS Blog (IT)", domain: "multivrss.com", url: "https://multivrss.com/blog/it.xml" },
    ],
  },
] as const;

const TOTAL = GROUPS.reduce((n, g) => n + g.sources.length, 0);

// Sends a logged-out visitor through login (or registration, via the link on
// that page) and back to /u/add, which completes the add once authenticated —
// see src/app/u/add/page.tsx. callbackUrl is threaded through the whole
// register → verify-email → login chain so the intent survives it.
function buildAddHref(feedUrl: string, feedName: string, categoryName: string): string {
  const resumePath = `/u/add?${new URLSearchParams({ feedUrl, feedName, category: categoryName })}`;
  return `/login?${new URLSearchParams({ callbackUrl: resumePath })}`;
}

function AddButton({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-1 border-[1.5px] border-black px-3 py-[7px] font-mono text-[10px] font-extrabold tracking-[0.14em] uppercase shrink-0 hover:bg-terracotta hover:border-terracotta transition-colors"
    >
      <span className="text-terracotta text-[13px] leading-none group-hover:text-black transition-colors">
        +
      </span>
      ADD
    </Link>
  );
}

export default function SourcesPage() {
  return (
    <>
      {/* Page header */}
      <header className="px-[34px] pt-[80px] pb-[46px] max-[920px]:px-[22px] max-[920px]:pt-14 max-[920px]:pb-9">
        <div className="max-w-[1200px] mx-auto">
          <p className="font-mono text-[10.5px] font-bold tracking-[0.18em] text-terracotta uppercase mb-[22px]">
            {"//"} CURATED SOURCES · PUBLIC
          </p>
          <h1 className="normal-case font-black text-[clamp(48px,6vw,104px)] leading-[0.95] tracking-[-0.035em] mb-[26px]">
            The shelf.
          </h1>
          <div className="grid grid-cols-1 min-[920px]:grid-cols-[1.3fr_1fr] gap-12 items-end">
            <p className="text-[17px] leading-[1.6] text-black/55 m-0 max-w-[560px]">
              These are the feeds we actually read at MultivRSS: hand-picked,
              no sponsorships, no rankings. Public and free: add any of them to
              your reader in one click. New here? Adding takes you to a
              20-second sign-up.
            </p>
            <div className="font-mono text-[11px] tracking-[0.14em] text-black/30 uppercase leading-[1.7] min-[920px]:text-right">
              <b className="text-black">{TOTAL} SOURCES</b>
              <br />
              <span>{GROUPS.length} CATEGORIES · UPDATED WEEKLY</span>
            </div>
          </div>
        </div>
      </header>

      {/* Category groups */}
      <section className="px-[34px] pb-8 max-[920px]:px-[22px]">
        <div className="max-w-[1200px] mx-auto">
          {GROUPS.map((group) => (
            <div key={group.name} className="border-t-2 border-black pt-[26px] pb-[30px]">
              <div className="flex items-center gap-4 mb-1.5">
                <span className="font-mono text-[13px] font-extrabold tracking-[0.22em] uppercase whitespace-nowrap">
                  {group.name}
                </span>
                <span className="flex-1 h-px bg-black/12" aria-hidden="true" />
                <span className="font-mono text-[10px] font-bold text-black/30">
                  {String(group.sources.length).padStart(2, "0")}
                </span>
              </div>
              <ul className="list-none m-0 p-0 grid grid-cols-1 min-[920px]:grid-cols-2 gap-x-14">
                {group.sources.map((src) => (
                  <li
                    key={src.name}
                    className="flex items-center justify-between gap-[18px] py-[15px] border-b border-black/7"
                  >
                    <div className="flex items-baseline gap-3 min-w-0">
                      <span className="text-[16.5px] font-bold tracking-[-0.005em] whitespace-nowrap overflow-hidden text-ellipsis">
                        {src.name}
                      </span>
                      <span className="font-mono text-[11px] text-black/30 tracking-[0.04em] whitespace-nowrap">
                        {src.domain}
                      </span>
                    </div>
                    <AddButton href={buildAddHref(src.url, src.name, group.name)} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Closing CTA */}
      <section className="px-[34px] py-24 bg-black text-paper border-t-2 border-black text-center max-[920px]:px-[22px] max-[920px]:py-[72px]">
        <p className="font-mono text-[11px] font-extrabold tracking-[0.24em] text-terracotta mb-[18px]">
          {"//"} READY_TO_READ
        </p>
        <h2 className="normal-case font-black text-[clamp(34px,4.6vw,68px)] tracking-[-0.03em] leading-[1] m-0 mb-5">
          Add the whole{" "}
          <em className="not-italic text-terracotta">shelf</em>.
        </h2>
        <p className="text-[15.5px] text-white/55 max-w-[520px] mx-auto mb-8 leading-[1.6]">
          Create your reading room and import every source above in one move,
          then make it yours: add, remove, organize by category.
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
