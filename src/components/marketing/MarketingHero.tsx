"use client";

import Image from "next/image";
import Link from "next/link";
import { signIn } from "next-auth/react";

export default function MarketingHero() {
  return (
    <section className="px-7 pt-[72px] pb-0 border-b-2 border-black overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-[1.25fr_1fr] gap-12 items-end">
        <div>
          <p className="font-mono text-[10.5px] font-bold tracking-[0.18em] text-terracotta uppercase mb-7">
            {'//'} MANIFESTO — 03 LINES
          </p>
          <h1 className="font-sans font-black text-[clamp(56px,7.4vw,122px)] leading-[0.95] tracking-[-0.035em] mb-8 text-balance">
            Read the open web.<br />
            <span className="text-terracotta font-extrabold px-[6px]">/</span>Save what matters.<br />
            <span className="text-terracotta font-extrabold px-[6px]">/</span>Publish your best.
          </h1>
          <p className="text-[17.5px] leading-[1.55] max-w-[560px] text-black/55 font-medium mb-9">
            MultivRSS is an RSS aggregator, a reading list, and a public &ldquo;best-of&rdquo; profile — in <b className="text-black font-bold">one fast, ad-free, open-format</b> dashboard.
            No algorithm, no engagement traps. Just the feeds <b className="text-black font-bold">you</b> picked, the links <b className="text-black font-bold">you</b> kept, and the page <b className="text-black font-bold">you</b> publish.
          </p>
          <div className="flex items-center gap-[18px] pb-14 flex-wrap">
            <Link
              href="/register"
              className="bg-terracotta text-black border-2 border-terracotta px-[18px] py-[13px] font-mono text-[11.5px] font-extrabold tracking-[0.2em] uppercase hover:bg-black hover:text-terracotta hover:border-black transition-colors"
            >
              → START FREE
            </Link>
            <button
              onClick={() => signIn("github")}
              className="border-2 border-black px-[14px] py-[9px] font-mono text-[10.5px] font-extrabold tracking-[0.18em] uppercase hover:bg-black hover:text-paper transition-colors"
            >
              CONTINUE WITH GITHUB
            </button>
            <span className="font-mono text-[10.5px] font-bold tracking-[0.18em] text-black/55 uppercase">
              FREE FOREVER · NO CARD
            </span>
          </div>
        </div>

        <div className="relative min-h-[280px] lg:min-h-[460px] flex items-end justify-end">
          <div className="absolute top-3 left-3 font-mono text-[10px] font-bold tracking-[0.18em] text-black/55 border border-black/10 px-[10px] py-[6px]">
            MARK_v2.1 · ICOSAHEDRON + WAVES · <b className="text-terracotta">STABLE</b>
          </div>
          <Image src="/assets/multivrss-mark.png" alt="" width={520} height={400} className="w-full max-w-[520px] h-auto" />
        </div>
      </div>
    </section>
  );
}
