"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import type { Lang } from "@/lib/i18n";
import type { Dictionary } from "@/lib/i18n";
import Wordmark from "@/components/Wordmark";

interface Props {
  lang: Lang;
  dict: Dictionary;
}

export default function MarketingNav({ lang, dict }: Props) {
  const pathname = usePathname();
  const t = dict.nav;

  const hrefFor = (item: (typeof t.items)[number]) =>
    "isAnchor" in item && item.isAnchor ? `/${lang}${item.slug}` : `/${lang}/${item.slug}`;

  const isActive = (item: (typeof t.items)[number]) => {
    if ("isAnchor" in item && item.isAnchor) return pathname === `/${lang}`;
    return pathname === `/${lang}/${item.slug}`;
  };

  const switchLangHref = (target: Lang) => {
    // Blog post slugs are translated independently per language and have no
    // shared mapping, so a same-slug swap can 404. Fall back to the blog
    // index on the target language instead.
    if (/^\/(en|it)\/blog\/.+/.test(pathname)) return `/${target}#blog`;
    return pathname.replace(/^\/(en|it)/, `/${target}`);
  };

  return (
    <nav
      aria-label="Main navigation"
      className="flex items-center justify-between px-[34px] py-[26px] border-b-2 border-black max-[920px]:px-[22px] max-[920px]:py-5"
    >
      <div className="flex items-center gap-[14px]">
        <Link href={`/${lang}`} className="group flex items-center gap-[14px]">
          <Image
            src="/assets/multivrss-ico.png"
            alt="multivrss"
            width={34}
            height={34}
            className="w-[34px] h-[34px] motion-safe:group-hover:animate-spin"
          />
          <Wordmark className="text-[19px] tracking-[0.1em]" />
        </Link>
        <span className="font-mono text-[10px] tracking-[0.12em] text-black/30 border-l border-black/12 pl-[13px] hidden min-[920px]:inline">
          THE INTERNET READING ROOM
        </span>
      </div>

      <div className="hidden min-[920px]:flex items-center gap-[30px]">
        {t.items.map((item) => (
          <Link
            key={item.label}
            href={hrefFor(item)}
            className={`font-mono text-[11px] font-bold tracking-[0.18em] uppercase transition-colors ${
              isActive(item) ? "text-terracotta" : "text-black hover:text-terracotta"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>

      <div className="flex items-center gap-[10px]">
        {/* Language switcher */}
        <div className="hidden min-[920px]:flex items-center gap-0 border border-black/20 font-mono text-[9.5px] font-extrabold tracking-[0.14em]">
          {(["en", "it"] as const).map((l, i) => (
            <Link
              key={l}
              href={switchLangHref(l)}
              aria-label={`Switch to ${l === "en" ? "English" : "Italian"}`}
              className={`px-[9px] py-[6px] uppercase transition-colors ${
                lang === l
                  ? "bg-black text-paper"
                  : "text-black/40 hover:text-black"
              } ${i === 0 ? "" : "border-l border-black/20"}`}
            >
              {l}
            </Link>
          ))}
        </div>

        <Link
          href="/login"
          className="hidden min-[920px]:inline-flex border-2 border-black px-[15px] py-[10px] font-mono text-[10.5px] font-extrabold tracking-[0.18em] uppercase hover:bg-black hover:text-paper transition-colors"
        >
          {t.signIn}
        </Link>
        <Link
          href="/register"
          className="bg-black text-paper border-2 border-black px-[15px] py-[10px] font-mono text-[10.5px] font-extrabold tracking-[0.18em] uppercase hover:bg-terracotta hover:text-black hover:border-terracotta transition-colors"
        >
          {t.getStarted}
        </Link>
      </div>
    </nav>
  );
}
