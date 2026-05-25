import Link from "next/link";
import Image from "next/image";

export default function MarketingNav() {
  return (
    <nav className="flex items-center justify-between px-7 py-[22px] border-b-2 border-black">
      <div className="flex items-center gap-[14px]">
        <Image src="/assets/multivrss-ico.png" alt="" width={38} height={38} className="w-[38px] h-[38px]" />
        <span className="text-[18px] font-extrabold tracking-[0.22em] text-terracotta uppercase">multivrss</span>
        <span className="font-mono text-[10px] tracking-[0.12em] text-black/55 border-l border-black/10 pl-3 hidden sm:inline">
          RSS AGGREGATOR · READING LIST · PROFILE
        </span>
      </div>

      <div className="hidden lg:flex items-center gap-7 font-mono text-[11px] font-bold tracking-[0.18em] uppercase">
        <a href="#product" className="hover:text-terracotta transition-colors">PRODUCT</a>
        <a href="#tips" className="hover:text-terracotta transition-colors">TIPS</a>
        <a href="#pricing" className="hover:text-terracotta transition-colors">PRICING</a>
        <a href="#api" className="hover:text-terracotta transition-colors">API</a>
      </div>

      <div className="flex items-center gap-[10px]">
        <Link
          href="/login"
          className="border-2 border-black px-[14px] py-[9px] font-mono text-[10.5px] font-extrabold tracking-[0.18em] uppercase hover:bg-black hover:text-paper transition-colors"
        >
          SIGN IN
        </Link>
        <Link
          href="/register"
          className="bg-black text-paper border-2 border-black px-[14px] py-[9px] font-mono text-[10.5px] font-extrabold tracking-[0.18em] uppercase hover:bg-terracotta hover:text-black hover:border-terracotta transition-colors"
        >
          GET STARTED →
        </Link>
      </div>
    </nav>
  );
}
