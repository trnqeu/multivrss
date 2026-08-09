"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Dictionary, Lang } from "@/lib/i18n";
import Wordmark from "@/components/Wordmark";
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
              .map((route) => (
                <Link
                  key={route.id}
                  href={routeHref(route, lang)}
                  className={linkClass(isRouteActive(route, lang, pathname))}
                >
                  {(route.footerLabel ?? route.label)[lang]}
                </Link>
              ))}
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mt-[36px] pt-[20px] border-t border-black/[0.14] font-mono text-[10px] tracking-[0.12em] text-black/[0.32] max-w-[1200px] mx-auto">
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
          Powered by{" "}
          <a
            href="https://trnq.eu/"
            target="_blank"
            rel="noopener"
            className="text-black/55 font-bold hover:text-terracotta transition-colors"
          >
            trnq.eu
          </a>{" "}
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
