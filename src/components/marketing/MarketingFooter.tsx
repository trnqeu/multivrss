"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Dictionary, Lang } from "@/lib/i18n";
import Wordmark from "@/components/Wordmark";
import UndurableLogo from "@/components/marketing/UndurableLogo";
import TrnqWordmark from "@/components/marketing/TrnqWordmark";
import { NAV_ROUTES, LEGAL_ROUTES, FOOTER_GROUP_LABELS, routeHref, isRouteActive, type FooterGroup } from "@/config/routes";
import { version } from "../../../package.json";

interface Props {
  lang: Lang;
  dict: Dictionary;
}

const FOOTER_GROUPS: FooterGroup[] = ["product", "explore", "account"];

export default function MarketingFooter({ lang, dict }: Props) {
  const t = dict.footer;
  const pathname = usePathname();

  const footerRoutes = NAV_ROUTES.filter((r) => r.inFooter);

  const linkClass = (active: boolean) =>
    `block text-[12.5px] font-medium leading-[1.95] transition-colors ${
      active ? "text-terracotta" : "text-black/55 hover:text-black"
    }`;

  return (
    <footer className="bg-paper border-t-2 border-black px-[30px] pt-[36px] pb-[24px] max-[920px]:px-[22px]">
      <div className="grid grid-cols-2 min-[920px]:grid-cols-[1.5fr_1fr_1fr_1fr] gap-7 items-start max-w-[1200px] mx-auto">
        <div className="col-span-2 min-[920px]:col-span-1">
          <div className="flex items-center gap-[14px] mb-[14px]">
            <Image src="/assets/multivrss-ico.png" alt="" width={28} height={28} className="w-[28px] h-[28px]" />
            <Wordmark className="text-[15px] tracking-[0.1em]" />
          </div>
          <p className="text-[12.5px] text-black/55 font-medium max-w-[300px] leading-[1.95]">
            {t.tagline}
          </p>
        </div>

        {FOOTER_GROUPS.map((group) => (
          <div key={group}>
            <h5 className="m-0 mb-[14px] font-mono text-[10px] font-extrabold tracking-[0.2em] text-terracotta uppercase">
              {FOOTER_GROUP_LABELS[group][lang]}
            </h5>
            {footerRoutes
              .filter((r) => r.footerGroup === group)
              .map((route) =>
                route.external ? (
                  <a
                    key={route.id}
                    href={routeHref(route, lang)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={linkClass(false)}
                  >
                    {(route.footerLabel ?? route.label)[lang]}
                    <span className="sr-only"> {dict.openSource.newTabHint}</span>
                  </a>
                ) : (
                  <Link
                    key={route.id}
                    href={routeHref(route, lang)}
                    className={linkClass(isRouteActive(route, lang, pathname))}
                  >
                    {(route.footerLabel ?? route.label)[lang]}
                  </Link>
                ),
              )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 mt-[36px] border-y-2 border-black max-w-[1200px] mx-auto">
        <a
          href="https://undurable.com/works/multivrss"
          target="_blank"
          rel="noopener"
          className="group flex flex-col gap-[14px] py-[24px] sm:pr-[30px] sm:border-r-2 border-black"
        >
          <span className="font-mono text-[10px] font-extrabold tracking-[0.2em] text-terracotta">{t.partOf}</span>
          <UndurableLogo className="h-[34px] w-auto self-start text-black" />
          <span className="text-[12.5px] text-black/55 font-medium leading-[1.6] group-hover:text-black transition-colors">
            {t.undurableBlurb}
          </span>
          <span className="sr-only">Undurable {dict.openSource.newTabHint}</span>
        </a>
        <a
          href="https://trnq.eu/"
          target="_blank"
          rel="noopener"
          className="group flex flex-col gap-[14px] py-[24px] border-t-2 sm:border-t-0 sm:pl-[30px] border-black"
        >
          <span className="font-mono text-[10px] font-extrabold tracking-[0.2em] text-terracotta">{t.madeBy}</span>
          <TrnqWordmark className="text-[32px] text-black h-[34px] flex items-center" />
          <span className="text-[12.5px] text-black/55 font-medium leading-[1.6] group-hover:text-black transition-colors">
            {t.trnqBlurb}
          </span>
          <span className="sr-only">trnq.eu {dict.openSource.newTabHint}</span>
        </a>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mt-[20px] font-mono text-[10px] tracking-[0.12em] text-black/[0.32] max-w-[1200px] mx-auto">
        <span>© 2026 MULTIVRSS · MADE IN TORINO</span>
        <div className="flex items-center gap-4">
          {LEGAL_ROUTES.map((route) => (
            <Link
              key={route.id}
              href={routeHref(route, lang)}
              className={`transition-colors ${
                isRouteActive(route, lang, pathname) ? "text-terracotta" : "hover:text-black"
              }`}
            >
              {route.label[lang]}
            </Link>
          ))}
        </div>
        <span>
          <Link
            href={`/${lang}/changelog`}
            className="text-black/[0.32] font-semibold text-[9px] hover:text-terracotta transition-colors"
          >
            v{version}
          </Link>
        </span>
      </div>
    </footer>
  );
}
