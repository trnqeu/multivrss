import Image from "next/image";
import Link from "next/link";
import type { Dictionary, Lang } from "@/lib/i18n";

interface Props {
  lang: Lang;
  dict: Dictionary;
}

export default function MarketingFooter({ lang, dict }: Props) {
  const t = dict.footer;

  return (
    <footer className="bg-paper border-t-2 border-black px-[34px] pt-[44px] pb-[30px] max-[920px]:px-[22px]">
      <div className="grid grid-cols-2 min-[920px]:grid-cols-[1.5fr_1fr_1fr] gap-7 items-start max-w-[1200px] mx-auto">
        <div className="col-span-2 min-[920px]:col-span-1">
          <div className="flex items-center gap-[14px] mb-[14px]">
            <Image src="/assets/multivrss-ico.png" alt="" width={28} height={28} className="w-[28px] h-[28px]" />
            <span className="text-[14px] font-extrabold tracking-[0.22em] text-terracotta uppercase">multivrss</span>
          </div>
          <p className="text-[12.5px] text-black/55 font-medium max-w-[300px] leading-[1.95]">
            {t.tagline}
          </p>
        </div>

        <div>
          <h5 className="m-0 mb-[14px] font-mono text-[10.5px] font-extrabold tracking-[0.2em] text-terracotta uppercase">
            {t.productLabel}
          </h5>
          {t.productLinks.map((l) => (
            <Link
              key={l.label}
              href={"isAnchor" in l && l.isAnchor ? `/${lang}${l.href}` : (l.href ?? "#")}
              className="block text-[12.5px] text-black/55 font-medium leading-[1.95] hover:text-black transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div>
          <h5 className="m-0 mb-[14px] font-mono text-[10.5px] font-extrabold tracking-[0.2em] text-terracotta uppercase">
            {t.resourcesLabel}
          </h5>
          {t.resourceLinks.map((l) => (
            <Link
              key={l.label}
              href={"slug" in l ? `/${lang}/${l.slug}` : (l.href ?? "#")}
              className="block text-[12.5px] text-black/55 font-medium leading-[1.95] hover:text-black transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center mt-[36px] pt-[20px] border-t border-black/12 font-mono text-[10px] tracking-[0.12em] text-black/30 max-w-[1200px] mx-auto">
        <span>© 2026 MULTIVRSS · MADE IN TORINO</span>
        <span>v0.1.0 · BUILD 2026.05.23</span>
      </div>
    </footer>
  );
}
