"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { label: "MANIFESTO", href: "/#manifesto" },
  { label: "GUIDE", href: "/guide" },
  { label: "SOURCES", href: "/sources" },
  { label: "TIPS", href: "/tips" },
] as const;

export default function MarketingNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href.startsWith("/#")) return pathname === "/";
    return pathname === href;
  };

  return (
    <nav
      aria-label="Main navigation"
      className="flex items-center justify-between px-[34px] py-[26px] border-b-2 border-black max-[920px]:px-[22px] max-[920px]:py-5"
    >
      <div className="flex items-center gap-[14px]">
        <Link href="/" className="flex items-center gap-[14px]">
          <Image src="/assets/multivrss-ico.png" alt="multivrss" width={34} height={34} className="w-[34px] h-[34px]" />
          <span className="text-[17px] font-extrabold tracking-[0.22em] text-terracotta uppercase">multivrss</span>
        </Link>
        <span className="font-mono text-[10px] tracking-[0.12em] text-black/30 border-l border-black/12 pl-[13px] hidden min-[920px]:inline">
          INTERNET READING ROOM
        </span>
      </div>

      <div className="hidden min-[920px]:flex items-center gap-[30px]">
        {NAV_ITEMS.map(({ label, href }) => (
          <Link
            key={label}
            href={href}
            className={`font-mono text-[11px] font-bold tracking-[0.18em] uppercase transition-colors ${
              isActive(href) ? "text-terracotta" : "text-black hover:text-terracotta"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      <div className="flex items-center gap-[10px]">
        <Link
          href="/login"
          className="border-2 border-black px-[15px] py-[10px] font-mono text-[10.5px] font-extrabold tracking-[0.18em] uppercase hover:bg-black hover:text-paper transition-colors"
        >
          SIGN IN
        </Link>
        <Link
          href="/register"
          className="bg-black text-paper border-2 border-black px-[15px] py-[10px] font-mono text-[10.5px] font-extrabold tracking-[0.18em] uppercase hover:bg-terracotta hover:text-black hover:border-terracotta transition-colors"
        >
          GET STARTED →
        </Link>
      </div>
    </nav>
  );
}
