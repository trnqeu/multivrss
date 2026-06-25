import Link from "next/link";

const SOURCES = [
  { cat: "MIND", name: "Farnam Street", domain: "fs.blog" },
  { cat: "SCIENCE", name: "Quanta Magazine", domain: "quantamagazine.org" },
  { cat: "TECH", name: "Simon Willison", domain: "simonwillison.net" },
  { cat: "NEWS", name: "Reuters", domain: "reuters.com" },
  { cat: "CULTURE", name: "Longreads", domain: "longreads.com" },
  { cat: "ENG", name: "Julia Evans", domain: "jvns.ca" },
] as const;

export default function MarketingSourcesPreview() {
  return (
    <section
      id="sources"
      className="px-[34px] py-[88px] border-t-2 border-black max-[920px]:px-[26px] max-[920px]:py-16"
    >
      <div className="max-w-[1200px] mx-auto">
        <p className="font-mono text-[11px] font-extrabold tracking-[0.22em] text-terracotta uppercase mb-4">
          {"//"} CURATED SOURCES
        </p>

        {/* Header */}
        <div className="flex items-end justify-between gap-10 mb-10 flex-wrap">
          <div>
            <h2 className="normal-case font-black text-[clamp(34px,4.4vw,60px)] tracking-[-0.025em] leading-[1]">
              The feeds we actually read.
            </h2>
            <p className="text-[15px] text-black/55 leading-[1.55] max-w-[460px] mt-[14px]">
              A hand-picked shelf to start from — no sponsorships, no rankings.
              Add any one to your reader; you&apos;ll be asked to sign up first.
            </p>
          </div>
          <Link
            href="/sources"
            className="font-mono text-[11px] font-extrabold tracking-[0.16em] uppercase border-b-2 border-black pb-1 whitespace-nowrap hover:text-terracotta hover:border-terracotta transition-colors"
          >
            SEE ALL 18 SOURCES →
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
                ADD
              </Link>
            </div>
          ))}
        </div>

        <p className="mt-8 font-mono text-[10px] tracking-[0.12em] text-black/30 uppercase">
          PUBLIC SHELF · <b className="text-terracotta">/sources</b> · UPDATED
          WEEKLY · NO ACCOUNT NEEDED TO BROWSE
        </p>
      </div>
    </section>
  );
}
