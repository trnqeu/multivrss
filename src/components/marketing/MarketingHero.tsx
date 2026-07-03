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
      className="px-[34px] pt-[104px] pb-[96px] max-[920px]:px-[26px] max-[920px]:pt-16 max-[920px]:pb-16"
    >
      <div className="grid grid-cols-1 min-[920px]:grid-cols-[1.2fr_1fr] gap-14 items-center max-w-[1200px] mx-auto">
        <div>
          <p className="font-mono text-[10.5px] font-bold tracking-[0.18em] text-terracotta uppercase mb-[30px]">
            {"//"} {t.kicker}
          </p>
          <h1 className="normal-case font-black text-[clamp(52px,7vw,116px)] leading-[0.95] tracking-[-0.035em] mb-[34px] text-balance">
            {t.headline1}
            <br />
            <span className="text-terracotta font-extrabold px-[6px]">/</span>
            {t.headline2}
          </h1>
          <p className="text-[18px] leading-[1.6] max-w-[540px] text-black/55 font-medium mb-[40px]">
            {t.bodyIntro}
            <b className="text-black font-bold">{t.bodyBold1}</b>
            {t.bodyMid}
            <b className="text-black font-bold">{t.bodyBold2}</b>
            {t.bodySuffix}
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

        <div className="flex items-center justify-end max-[920px]:justify-start">
          <div className="relative w-full max-w-[460px]">
            <div className="font-mono text-[10px] font-bold tracking-[0.16em] text-black/30 mb-[6px]">
              MARK_v2.1 · ICOSAHEDRON + WAVES ·{" "}
              <b className="text-terracotta">STABLE</b>
            </div>
            <Image
              src="/assets/multivrss-mark.png"
              alt=""
              width={920}
              height={704}
              className="w-full h-auto"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
