import Link from "next/link";
import type { Dictionary, Lang } from "@/lib/i18n";

const SOURCES = [
  { cat: "TECH", name: "Hacker News", domain: "news.ycombinator.com" },
  { cat: "NEWS", name: "BBC News", domain: "bbc.co.uk" },
  { cat: "CULTURE", name: "The Verge", domain: "theverge.com" },
  { cat: "MUSIC", name: "The FADER", domain: "thefader.com" },
  { cat: "SCIENCE", name: "Noema Magazine", domain: "noemamag.com" },
  { cat: "PODCAST", name: "Lex Fridman Podcast", domain: "lexfridman.com" },
] as const;

interface Props {
  lang: Lang;
  dict: Dictionary;
}

export default function MarketingSourcesPreview({ lang, dict }: Props) {
  const t = dict.sources;

  return (
    <section
      id="sources"
      className="px-[34px] py-[88px] border-t-2 border-black max-[920px]:px-[26px] max-[920px]:py-16"
    >
      <div className="max-w-[1200px] mx-auto">
        <p className="font-mono text-[11px] font-extrabold tracking-[0.22em] text-terracotta uppercase mb-4">
          {"//"} {t.kicker}
        </p>

        {/* Header */}
        <div className="flex items-end justify-between gap-10 mb-10 flex-wrap">
          <div>
            <h2 className="normal-case font-black text-[clamp(34px,4.4vw,60px)] tracking-[-0.025em] leading-[1]">
              {t.title}
            </h2>
            <p className="text-[15px] text-black/55 leading-[1.55] max-w-[460px] mt-[14px]">
              {t.subtitle}
            </p>
          </div>
          <Link
            href={`/${lang}/sources`}
            className="font-mono text-[11px] font-extrabold tracking-[0.16em] uppercase border-b-2 border-black pb-1 whitespace-nowrap hover:text-terracotta hover:border-terracotta transition-colors"
          >
            {t.seeAll}
          </Link>
        </div>

        {/* 2-col grid */}
        <div className="grid grid-cols-1 min-[920px]:grid-cols-2 gap-x-14 border-t-2 border-black">
          {SOURCES.map((src) => (
            <div
              key={src.name}
              className="flex items-center justify-between gap-[18px] py-4 border-b border-black/7"
            >
              <div className="flex items-baseline gap-3 min-w-0">
                <span className="font-mono text-[9.5px] font-extrabold tracking-[0.14em] uppercase text-terracotta w-[78px] shrink-0">
                  {src.cat}
                </span>
                <span className="text-[16.5px] font-bold tracking-[-0.005em] whitespace-nowrap overflow-hidden text-ellipsis">
                  {src.name}
                </span>
                <span className="font-mono text-[11px] text-black/30 tracking-[0.04em] whitespace-nowrap hidden min-[920px]:inline">
                  {src.domain}
                </span>
              </div>
              <Link
                href="/register"
                className="group inline-flex items-center gap-1 border-[1.5px] border-black px-3 py-[7px] font-mono text-[10px] font-extrabold tracking-[0.14em] uppercase shrink-0 hover:bg-terracotta hover:border-terracotta transition-colors"
              >
                <span className="text-terracotta text-[13px] leading-none group-hover:text-black transition-colors">
                  +
                </span>
                {t.add}
              </Link>
            </div>
          ))}
        </div>

        <p className="mt-8 font-mono text-[10px] tracking-[0.12em] text-black/30 uppercase">
          {t.footer}
        </p>
      </div>
    </section>
  );
}
