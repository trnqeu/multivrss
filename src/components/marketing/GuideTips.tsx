import type { ReactNode } from "react";

// Feed URL tricks, shown as the last section of the guide (/[lang]/guide#tips).
// They used to be their own English-only page at /tips, which now redirects here.

type TipData = {
  num: string;
  title: { en: string; it: string };
  body: { en: ReactNode; it: ReactNode };
  snippet: ReactNode;
  inverted?: boolean;
};

const TIPS: TipData[] = [
  {
    num: "01 / GOOGLE NEWS",
    title: { en: "Any search becomes a feed.", it: "Ogni ricerca diventa un feed." },
    body: {
      en: <>Insert <code>/rss</code> after the TLD in any Google News search URL.</>,
      it: <>Inserisci <code>/rss</code> dopo il dominio in qualsiasi URL di ricerca di Google News.</>,
    },
    snippet: <>news.google.com<b>/rss</b>/search?q=site%3Areuters.com&amp;hl=en</>,
  },
  {
    num: "02 / SUBSTACK",
    title: { en: "/feed at the root.", it: "/feed alla radice." },
    body: {
      en: <>Every Substack publication exposes its feed at <code>/feed</code>.</>,
      it: <>Ogni pubblicazione Substack espone il suo feed su <code>/feed</code>.</>,
    },
    snippet: <>stratechery.com<b>/feed</b></>,
  },
  {
    num: "03 / REDDIT",
    title: { en: "Any subreddit, any user.", it: "Ogni subreddit, ogni utente." },
    body: {
      en: <>Append <code>.rss</code> to any subreddit or user URL.</>,
      it: <>Aggiungi <code>.rss</code> in fondo all&apos;URL di un subreddit o di un utente.</>,
    },
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
    title: { en: "The hidden Atom feed.", it: "Il feed Atom nascosto." },
    body: {
      en: <>Every channel has one. Grab the channel ID and use:</>,
      it: <>Ce l&apos;ha ogni canale. Prendi l&apos;ID del canale e usa:</>,
    },
    snippet: <>youtube.com/feeds/videos.xml?<b>channel_id=…</b></>,
  },
  {
    num: "05 / MEDIUM",
    title: { en: "Users and publications.", it: "Utenti e pubblicazioni." },
    body: {
      en: <>Prefix the path with <code>/feed</code> on medium.com.</>,
      it: <>Su medium.com metti <code>/feed</code> davanti al percorso.</>,
    },
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
    title: { en: "The original RSS.", it: "L'RSS delle origini." },
    body: {
      en: <>Nearly every WordPress site exposes a feed at <code>/feed</code>.</>,
      it: <>Quasi ogni sito WordPress espone un feed su <code>/feed</code>.</>,
    },
    snippet: <>example.com<b>/feed</b></>,
  },
  {
    num: "07 / GITHUB",
    title: { en: "Releases, commits, tags.", it: "Release, commit, tag." },
    body: {
      en: <>Atom feeds, no auth required. Three flavors per repo.</>,
      it: <>Feed Atom, senza autenticazione. Tre varianti per ogni repository.</>,
    },
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
    title: { en: "Kill the Newsletter.", it: "Kill the Newsletter." },
    body: {
      en: <>Generates a unique inbox; subscribe with it, get the feed.</>,
      it: <>Genera una casella email unica: iscriviti con quella e ottieni il feed.</>,
    },
    snippet: <>kill-the-newsletter.com<b> ↗</b></>,
  },
  {
    num: "09 / RSSHUB",
    title: { en: "When all else fails.", it: "Quando non funziona nient'altro." },
    body: {
      en: <>RSSHub builds feeds for hundreds of sites that ship none. Self-host it or use a public instance.</>,
      it: <>RSSHub crea feed per centinaia di siti che non ne hanno. Puoi ospitarlo tu o usare un&apos;istanza pubblica.</>,
    },
    snippet: <>docs.rsshub.app<b> ↗</b></>,
    inverted: true,
  },
];

export default function GuideTips({ isIt }: { isIt: boolean }) {
  const lang = isIt ? "it" : "en";

  return (
    <section id="tips" aria-labelledby="tips-heading" className="px-[34px] pt-[54px] pb-[54px] max-[960px]:px-[22px] scroll-mt-6">
      <div className="max-w-[1200px] mx-auto">
        <div className="border-t-2 border-black pt-[54px] grid grid-cols-1 min-[960px]:grid-cols-[1.15fr_1fr] gap-12 items-end mb-10">
          <div>
            <p className="font-mono text-[11px] font-extrabold tracking-[0.2em] text-terracotta uppercase mb-4">
              {isIt ? "// SUGGERIMENTI · 9 TRUCCHI" : "// TIPS · 09 TRICKS"}
            </p>
            <h2 className="normal-case font-black text-[clamp(30px,3.6vw,52px)] leading-[1] tracking-[-0.025em] m-0">
              {isIt ? (
                <>Ogni sito ha un feed. <em className="not-italic text-terracotta">Quasi tutti lo nascondono bene.</em></>
              ) : (
                <>Every site has a feed. <em className="not-italic text-terracotta">Most just hide it well.</em></>
              )}
            </h2>
          </div>
          <p className="text-[15.5px] leading-[1.62] text-black/55 m-0 max-w-[480px]">
            {isIt ? (
              <>
                Trucchi sugli URL per trasformare quasi ogni sito in un feed RSS: ricerche di Google News,
                Substack, subreddit, canali YouTube, release di GitHub. Incolla uno di questi in{" "}
                <span className="font-mono font-extrabold text-terracotta">+ ADD</span> e sei iscritto.
              </>
            ) : (
              <>
                URL tricks to turn almost any site into an RSS feed: Google News searches, Substacks,
                subreddits, YouTube channels, GitHub releases. Paste any of these into{" "}
                <span className="font-mono font-extrabold text-terracotta">+ ADD</span> and you&apos;re subscribed.
              </>
            )}
          </p>
        </div>

        <ul className="grid grid-cols-3 max-[960px]:grid-cols-2 max-[560px]:grid-cols-1 border-t-2 border-l-2 border-black list-none m-0 p-0">
          {TIPS.map((tip) => (
            <li
              key={tip.num}
              className={`border-r-2 border-b-2 border-black p-6 pb-7 min-h-[236px] flex flex-col ${
                tip.inverted ? "bg-black text-paper" : ""
              }`}
            >
              <div className="font-mono text-[10px] font-extrabold tracking-[0.18em] text-terracotta mb-[10px]">
                {tip.num}
              </div>
              <h3
                className={`normal-case text-[19px] font-extrabold tracking-[-0.005em] m-0 mb-[10px] ${
                  tip.inverted ? "text-paper" : ""
                }`}
              >
                {tip.title[lang]}
              </h3>
              <p
                className={`text-[13px] leading-[1.5] m-0 mb-[14px] [&_code]:font-mono [&_code]:text-[11px] ${
                  tip.inverted ? "text-white/55 [&_code]:text-paper" : "text-black/55 [&_code]:text-black"
                }`}
              >
                {tip.body[lang]}
              </p>
              <div
                lang="en"
                className={`mt-auto px-[13px] py-[11px] font-mono text-[10.5px] leading-[1.55] tracking-[0.02em] whitespace-pre-wrap break-all [&_b]:text-terracotta ${
                  tip.inverted ? "bg-paper text-black" : "bg-black text-paper"
                }`}
              >
                {tip.snippet}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
