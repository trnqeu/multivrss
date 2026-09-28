"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import type { Lang } from "@/lib/i18n";
import type { Dictionary } from "@/lib/i18n";
import Wordmark from "@/components/Wordmark";
import SmartBackLink from "@/components/SmartBackLink";
import { NAV_ROUTES, REPO_URL, routeHref, isRouteActive } from "@/config/routes";

interface Props {
  lang: Lang;
  dict: Dictionary;
  username?: string;
}

export default function MarketingNav({ lang, dict, username }: Props) {
  const pathname = usePathname();
  const t = dict.nav;

  const links = NAV_ROUTES.filter((r) => r.inHeader && !r.headerButton);
  const authButtons = NAV_ROUTES.filter((r) => r.inHeader && r.headerButton);

  return (
    <nav
      aria-label="Main navigation"
      className="flex items-center justify-between px-[34px] py-[26px] border-b-2 border-black max-[920px]:px-[22px] max-[920px]:py-5 max-[420px]:px-[14px]"
    >
      <div className="flex items-center gap-[14px] max-[420px]:gap-[8px]">
        <Link href={`/${lang}`} className="group flex items-center gap-[14px] max-[420px]:gap-[8px]">
          <Image
            src="/assets/multivrss-ico.png"
            alt="multivrss"
            width={34}
            height={34}
            className="w-[34px] h-[34px] max-[420px]:w-[26px] max-[420px]:h-[26px] motion-safe:group-hover:animate-spin"
          />
          <Wordmark className="text-[19px] max-[420px]:text-[15px] tracking-[0.1em]" />
        </Link>
        <span className="font-mono text-[10px] tracking-[0.12em] text-black/30 border-l border-black/12 pl-[13px] hidden min-[920px]:inline">
          YOUR INTERNET READING ROOM
        </span>
      </div>

      <div className="hidden min-[920px]:flex items-center gap-[30px]">
        {links.map((route) => (
          <Link
            key={route.id}
            href={routeHref(route, lang)}
            className={`font-mono text-[11px] font-bold tracking-[0.18em] uppercase transition-colors ${
              isRouteActive(route, lang, pathname) ? "text-terracotta" : "text-black hover:text-terracotta"
            }`}
          >
            {route.label[lang]}
          </Link>
        ))}
      </div>

      <div className="flex items-center gap-[8px] max-[920px]:gap-[6px]">
        <a
          href={REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t.githubLabel}
          className="inline-flex items-center justify-center self-stretch px-[10px] max-[920px]:px-[7px] border-2 border-black hover:bg-black hover:text-paper transition-colors max-[420px]:hidden min-[920px]:max-[1079px]:hidden"
        >
          <svg aria-hidden="true" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
          </svg>
        </a>
        {username ? (
          <SmartBackLink
            fallbackHref={`/u/${username}`}
            className="bg-black text-paper border-2 border-black px-[15px] py-[10px] max-[920px]:px-[10px] max-[920px]:py-[8px] font-mono text-[10.5px] max-[920px]:text-[9px] font-extrabold tracking-[0.18em] uppercase hover:bg-terracotta hover:text-black hover:border-terracotta transition-colors"
          >
            {t.openApp}
          </SmartBackLink>
        ) : (
          authButtons.map((route) => (
            <Link
              key={route.id}
              href={routeHref(route, lang)}
              className={
                route.primary
                  ? "bg-black text-paper border-2 border-black px-[15px] py-[10px] max-[920px]:px-[10px] max-[920px]:py-[8px] font-mono text-[10.5px] max-[920px]:text-[9px] font-extrabold tracking-[0.18em] uppercase hover:bg-terracotta hover:text-black hover:border-terracotta transition-colors"
                  : "inline-flex border-2 border-black px-[15px] py-[10px] max-[920px]:px-[10px] max-[920px]:py-[8px] font-mono text-[10.5px] max-[920px]:text-[9px] font-extrabold tracking-[0.18em] uppercase hover:bg-black hover:text-paper transition-colors"
              }
            >
              {route.label[lang]}
            </Link>
          ))
        )}
      </div>
    </nav>
  );
}
