import Link from "next/link";
import Image from "next/image";

export default function MarketingClosing() {
  return (
    <section className="px-7 py-[100px] bg-black text-paper border-t-2 border-black relative overflow-hidden">
      <Image
        src="/assets/multivrss-ico.png"
        alt=""
        width={620}
        height={620}
        className="absolute -right-[120px] -bottom-[160px] w-[620px] h-[620px] opacity-[0.08] pointer-events-none"
      />
      <div className="max-w-[980px] mx-auto text-center relative z-[2]">
        <p className="font-mono text-[11px] font-extrabold tracking-[0.24em] text-terracotta mb-[18px]">
          {'//'} END_OF_FEED
        </p>
        <h2 className="font-sans font-black text-[clamp(40px,6vw,96px)] tracking-[-0.03em] leading-[0.98] m-0 mb-[22px] text-balance">
          The web was meant to<br />be <em className="not-italic text-terracotta">read</em>, not scrolled.
        </h2>
        <p className="text-[16px] text-white/55 max-w-[560px] mx-auto mb-9 leading-[1.55]">
          Bring your sources. Keep your archive. Show your taste. MultivRSS is open-format, owned by you, and built to
          last longer than the next algorithm change.
        </p>
        <div className="flex gap-[14px] justify-center flex-wrap">
          <Link
            href="/register"
            className="bg-terracotta text-black border-2 border-terracotta px-[18px] py-[13px] font-mono text-[11.5px] font-extrabold tracking-[0.2em] uppercase hover:bg-black hover:text-terracotta hover:border-black transition-colors"
          >
            → CREATE YOUR ACCOUNT
          </Link>
          <Link
            href="https://github.com/anomalyco/multivrss"
            className="border-2 border-paper text-paper px-[18px] py-[13px] font-mono text-[11.5px] font-extrabold tracking-[0.2em] uppercase hover:bg-paper hover:text-black transition-colors inline-flex items-center gap-[10px]"
          >
            VIEW ON GITHUB ↗
          </Link>
        </div>
      </div>
    </section>
  );
}
