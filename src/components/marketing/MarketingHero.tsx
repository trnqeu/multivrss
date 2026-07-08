import Image from "next/image";
import Link from "next/link";
import type { Dictionary } from "@/lib/i18n";

interface Props {
  dict: Dictionary;
}

export default function MarketingHero({ dict }: Props) {
  const t = dict.hero;

  return (
    <section
      id="manifesto"
      className="px-[34px] pt-[104px] pb-[96px] max-[920px]:px-[26px] max-[920px]:pt-16 max-[920px]:pb-16 [@media(max-height:800px)]:pt-[56px] [@media(max-height:800px)]:pb-[48px]"
    >
      <div className="grid grid-cols-1 min-[920px]:grid-cols-[1.2fr_1fr] gap-14 items-center max-w-[1200px] mx-auto">
        <div>
          <p className="font-mono text-[10.5px] font-bold tracking-[0.18em] text-terracotta uppercase mb-[30px] [@media(max-height:800px)]:mb-[14px]">
            {"//"} {t.kicker}
          </p>
          <h1 className="normal-case font-black text-[clamp(52px,7vw,116px)] min-[920px]:text-[clamp(52px,calc(7vw_-_9px),84px)] leading-[0.95] tracking-[-0.035em] mb-[48px] text-balance [@media(max-height:800px)]:text-[clamp(40px,6vw,56px)] [@media(max-height:800px)]:mb-[24px]">
            {t.headline1}
            <br />
            <span className="text-terracotta font-extrabold px-[6px]">&</span>
            {t.headline2}
          </h1>
          <p className="text-[18px] leading-[1.6] max-w-[540px] text-black/55 font-medium mb-[40px] [@media(max-height:800px)]:mb-[20px] [@media(max-height:800px)]:text-[16px] [@media(max-height:800px)]:leading-[1.45]">
            {t.bodyIntro}
            <b className="text-black font-bold">{t.bodyBold1}</b>
            {t.bodyMid}
            <b className="text-black font-bold">{t.bodyBold2}</b>
            {t.bodySuffix}<br></br>
            <b className="text-black font-bold">{t.bodyReclaim}</b>
          </p>
          <div className="flex items-center gap-5 flex-wrap">
            <Link
              href="/register"
              className="bg-terracotta text-black border-2 border-terracotta px-[20px] py-[14px] font-mono text-[11.5px] font-extrabold tracking-[0.2em] uppercase hover:bg-black hover:text-terracotta hover:border-black transition-colors"
            >
              {t.cta}
            </Link>
            {t.subCta && (
              <span className="font-mono text-[10.5px] font-bold tracking-[0.18em] text-black/30 uppercase">
                {t.subCta}
              </span>
            )}
          </div>
        </div>

        <div className="w-full max-[920px]:mt-8">
          <div className="border-2 border-black bg-black shadow-[14px_14px_0_rgba(0,0,0,0.12)]">
            <div className="flex items-center gap-2 px-[14px] py-[11px] border-b-2 border-black bg-white">
              <span
                aria-hidden="true"
                className="flex items-center gap-2"
              >
                <span className="w-[10px] h-[10px] rounded-full border-[1.5px] border-black" />
                <span className="w-[10px] h-[10px] rounded-full border-[1.5px] border-terracotta bg-terracotta" />
                <span className="w-[10px] h-[10px] rounded-full border-[1.5px] border-black" />
              </span>
              <span className="font-mono text-[11px] font-bold tracking-[0.1em] text-black/55">
                multivrss — reading room
              </span>
            </div>
            <Image
              src="/assets/hero-app-shot-dark.png"
              alt="MultivRSS reading room"
              width={1352}
              height={615}
              className="w-full h-auto block"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}
