import Image from "next/image";
import Link from "next/link";
import type { Dictionary, Lang } from "@/lib/i18n";

interface Props {
  lang: Lang;
  dict: Dictionary;
}

export default function MarketingClosing({ lang, dict }: Props) {
  const t = dict.closing;

  return (
    <section className="px-[34px] py-[120px] bg-black text-paper border-t-2 border-black relative overflow-hidden max-[920px]:px-[26px] max-[920px]:py-20">
      <Image
        src="/assets/multivrss-ico.png"
        alt=""
        width={600}
        height={600}
        className="absolute -right-[130px] -bottom-[170px] w-[600px] h-[600px] opacity-[0.08] pointer-events-none"
        aria-hidden="true"
      />
      <div className="max-w-[920px] mx-auto text-center relative z-[2]">
        <p className="font-mono text-[11px] font-extrabold tracking-[0.24em] text-terracotta mb-5">
          {"//"} {t.kicker}
        </p>
        <h2 className="normal-case font-black text-[clamp(38px,5.6vw,88px)] tracking-[-0.03em] leading-[1] m-0 mb-6 text-balance">
          {t.headlinePre}
          <em className="not-italic text-terracotta">{t.headlineAccent}</em>
          {t.headlineSuffix}
        </h2>
        <p className="text-[16px] text-white/55 max-w-[540px] mx-auto mb-[38px] leading-[1.6]">
          {t.body}
        </p>
        <div className="flex gap-[14px] justify-center flex-wrap">
          <Link
            href="/register"
            className="bg-terracotta text-black border-2 border-terracotta px-[20px] py-[14px] font-mono text-[11.5px] font-extrabold tracking-[0.2em] uppercase hover:bg-black hover:text-terracotta hover:border-black transition-colors"
          >
            {t.cta}
          </Link>
          <Link
            href={`/${lang}#blog`}
            className="border-2 border-paper text-paper px-[20px] py-[14px] font-mono text-[11.5px] font-extrabold tracking-[0.2em] uppercase hover:bg-paper hover:text-black transition-colors"
          >
            {t.secondaryCta}
          </Link>
        </div>
      </div>
    </section>
  );
}
