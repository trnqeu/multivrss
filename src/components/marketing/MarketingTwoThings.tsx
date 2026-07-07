import type { Dictionary } from "@/lib/i18n";

interface Props {
  dict: Dictionary;
}

export default function MarketingTwoThings({ dict }: Props) {
  const t = dict.twoThings;

  return (
    <section className="px-[34px] py-[100px] border-t-2 border-black text-center max-[920px]:px-[26px] max-[920px]:py-20">
      <div className="max-w-[1200px] mx-auto">
        <p className="font-mono text-[11px] font-extrabold tracking-[0.24em] text-terracotta uppercase mb-9">
          {t.kicker}
        </p>

        <h2 className="font-black tracking-[-0.045em] leading-[0.9] text-[clamp(40px,7.5vw,96px)] m-0 flex flex-wrap justify-center items-baseline">
          <span>
            {t.headlineUpdates}
            <span className="text-terracotta font-extrabold px-[0.12em]">+</span>
          </span>
          <span>{t.headlineBookmarks}</span>
        </h2>

        <div className="flex justify-center gap-[110px] mt-10 flex-wrap max-[920px]:gap-12">
          <div className="max-w-[300px] text-left">
            <p className="font-mono text-[10.5px] font-extrabold tracking-[0.18em] uppercase text-terracotta mb-[9px]">
              {t.updatesLabel}
            </p>
            <p className="text-[14.5px] leading-[1.55] text-black/55 m-0">
              {t.updatesBody}
            </p>
          </div>
          <div className="max-w-[300px] text-left">
            <p className="font-mono text-[10.5px] font-extrabold tracking-[0.18em] uppercase text-terracotta mb-[9px]">
              {t.bookmarksLabel}
            </p>
            <p className="text-[14.5px] leading-[1.55] text-black/55 m-0">
              {t.bookmarksBody}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
