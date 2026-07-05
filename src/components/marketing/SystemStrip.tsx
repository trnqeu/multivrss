"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Lang } from "@/lib/i18n";

interface Props {
  lang: Lang;
  version: string;
}

export default function SystemStrip({ lang, version }: Props) {
  const pathname = usePathname();

  const switchLangHref = (target: Lang) =>
    pathname.replace(/^\/(en|it)/, `/${target}`);

  return (
    <div className="flex items-center justify-between px-[34px] py-[11px] border-b border-black/12 font-mono text-[10.5px] font-semibold tracking-[0.13em] text-black/30 max-[920px]:px-[22px]">
      <div className="flex items-center gap-5 whitespace-nowrap max-[560px]:gap-3">
        <span>
          <span className="inline-block w-[7px] h-[7px] bg-terracotta align-middle mr-[7px]" aria-hidden="true" />
          <b className="text-black/55">LIVE</b>
        </span>
        <span>NODE_<b className="text-black/55">multivrss_alpha</b></span>
        <span>BUILD_<b className="text-black/55">{version}</b></span>
      </div>
      <div className="flex items-center gap-[9px]" role="group" aria-label="Language">
        <Link
          href={switchLangHref("en")}
          aria-label="Switch to English"
          className={`font-mono text-[10.5px] font-bold tracking-[0.16em] transition-colors px-0.5 ${
            lang === "en" ? "text-terracotta" : "text-black/30 hover:text-black"
          }`}
        >
          EN
        </Link>
        <span className="text-black/12" aria-hidden="true">/</span>
        <Link
          href={switchLangHref("it")}
          aria-label="Switch to Italian"
          className={`font-mono text-[10.5px] font-bold tracking-[0.16em] transition-colors px-0.5 ${
            lang === "it" ? "text-terracotta" : "text-black/30 hover:text-black"
          }`}
        >
          IT
        </Link>
      </div>
    </div>
  );
}
