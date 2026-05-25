import Image from "next/image";

export default function MarketingLivePreview() {
  return (
    <section className="bg-paper px-7 py-16">
      <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between mb-[22px] gap-6">
        <div className="text-[36px] font-extrabold tracking-[-0.01em] leading-[1.05] max-w-[720px]">
          The reader is the <em className="not-italic text-terracotta">product</em>. Not<br />
          a marketing screenshot.
        </div>
        <div className="font-mono text-[11px] tracking-[0.14em] text-black/55 uppercase max-w-[280px] leading-[1.6] text-left lg:text-right">
          THE BLOCK BELOW IS THE ACTUAL APP UI. SAME COMPONENTS YOU&apos;LL SEE AFTER LOGIN. NOTHING IS FAKED.
        </div>
      </div>

      <div className="bg-black text-white border-2 border-black grid grid-cols-1 md:grid-cols-[220px_1fr] min-h-[460px]">
        <aside className="border-r-0 md:border-r-2 border-white p-[18px_18px_22px] flex flex-col gap-[22px] border-b-2 md:border-b-0 border-white">
          <div className="flex items-center gap-[10px] pb-[14px] border-b-2 border-white">
            <Image src="/assets/multivrss-ico.png" alt="" width={24} height={24} className="w-6 h-6" />
            <span className="text-[13px] font-extrabold tracking-[0.22em] text-terracotta">multivrss</span>
          </div>
          <div>
            <div className="font-mono text-[9.5px] font-bold tracking-[0.18em] text-white/55">NAV_ROOT</div>
            <div className="text-[11px] font-bold tracking-[0.15em] pl-[6px] mt-2">_ ALL FEEDS</div>
          </div>
          <div>
            <div className="flex justify-between pb-[6px] border-b-2 border-terracotta font-mono text-[11px] font-extrabold tracking-[0.18em] text-terracotta">
              <span>MIND</span><span className="text-white/55 font-bold text-[10px]">03</span>
            </div>
            <div className="flex flex-col gap-[4px] mt-[6px]">
              <span className="text-[9.5px] font-semibold tracking-[0.12em] text-white/55 pl-[4px]">SIMON WILLISON</span>
              <span className="text-[9.5px] font-semibold tracking-[0.12em] text-white/55 pl-[4px]">FARNAM STREET</span>
              <span className="text-[9.5px] font-semibold tracking-[0.12em] text-white/55 pl-[4px]">+1 MORE</span>
            </div>
          </div>
          <div>
            <div className="flex justify-between pb-[6px] border-b-2 border-terracotta font-mono text-[11px] font-extrabold tracking-[0.18em] text-terracotta">
              <span>NEWS</span><span className="text-white/55 font-bold text-[10px]">04</span>
            </div>
            <div className="flex flex-col gap-[4px] mt-[6px]">
              <span className="text-[9.5px] font-semibold tracking-[0.12em] text-white/55 pl-[4px]">NYT {'>'} WORLD</span>
              <span className="text-[9.5px] font-semibold tracking-[0.12em] text-white/55 pl-[4px]">THE GUARDIAN</span>
              <span className="text-[9.5px] font-semibold tracking-[0.12em] text-white/55 pl-[4px]">+2 MORE</span>
            </div>
          </div>
          <div>
            <div className="flex justify-between pb-[6px] border-b-2 border-terracotta font-mono text-[11px] font-extrabold tracking-[0.18em] text-terracotta">
              <span>SPORT</span><span className="text-white/55 font-bold text-[10px]">05</span>
            </div>
            <div className="flex flex-col gap-[4px] mt-[6px]">
              <span className="text-[9.5px] font-semibold tracking-[0.12em] text-white/55 pl-[4px]">NYT {'>'} BASEBALL</span>
              <span className="text-[9.5px] font-semibold tracking-[0.12em] text-white/55 pl-[4px]">CBS SPORTS</span>
              <span className="text-[9.5px] font-semibold tracking-[0.12em] text-white/55 pl-[4px]">+3 MORE</span>
            </div>
          </div>
        </aside>

        <div className="flex flex-col">
          <div className="flex items-center justify-between gap-4 p-[16px_22px] border-b-2 border-white flex-wrap">
            <div className="font-mono text-[10.5px] font-extrabold tracking-[0.18em] text-white/55">
              RIVER · <b className="text-terracotta">ALL FEEDS</b> · 30 ITEMS
            </div>
            <div className="flex items-center gap-[10px] flex-wrap">
              <div className="border border-white/25 p-[6px_10px] font-mono text-[10px] text-white/55 tracking-[0.1em]">
                Q. FILTER THE STREAM…
              </div>
              <div className="border border-terracotta text-terracotta p-[6px_10px] font-mono text-[9.5px] font-extrabold tracking-[0.18em]">
                + SOURCE
              </div>
              <div className="border border-white text-white p-[6px_10px] font-mono text-[9.5px] font-extrabold tracking-[0.18em]">
                ↻ SYNC
              </div>
            </div>
          </div>

          <div className="p-[10px_22px] border-b border-white/25 font-mono text-[10px] text-white/55 tracking-[0.08em] font-semibold">
            INDEX_<b className="text-terracotta font-bold">30 / 1 000 ITEMS</b> · TIME_<b className="text-terracotta font-bold">5 MS</b> · FILTER_<b className="text-terracotta font-bold">*</b> · CATEGORY_<b className="text-terracotta font-bold">*</b>
          </div>

          <div className="p-[18px_22px] text-[12.5px] leading-[1.8] font-medium">
            <span className="text-terracotta text-[9.5px] font-extrabold uppercase tracking-[0.15em]">SIMON WILLISON</span>
            <span className="text-white/25 mx-[6px]">·</span>
            <span className="text-white/55 text-[10.5px] font-normal">MAY 22</span>
            <span className="text-white/25 mx-[6px]">·</span>
            Highlights from my conversation about agentic engineering on Lenny&apos;s Podcast
            <span className="text-white/25 mx-[6px]">—</span>
            <span className="text-white/55 text-[10.5px] font-normal">I was a guest on Lenny Rachitsky&apos;s podcast this week, talking about how AI agents change…</span>
            <span className="text-terracotta font-bold mx-2">{'//'}</span>
            <span className="text-terracotta text-[9.5px] font-extrabold uppercase tracking-[0.15em]">NYT {'>'} WORLD NEWS</span>
            <span className="text-white/25 mx-[6px]">·</span>
            <span className="text-white/55 text-[10.5px] font-normal">MAY 22</span>
            <span className="text-white/25 mx-[6px]">·</span>
            A New Era of Exploring the Universe in Radio
            <span className="text-white/25 mx-[6px]">—</span>
            <span className="text-white/55 text-[10.5px] font-normal">With 263 antennas spread across the U.S. and Mexico, the new radio array opens a window onto…</span>
            <span className="text-terracotta font-bold mx-2">{'//'}</span>
            <span className="text-terracotta text-[9.5px] font-extrabold uppercase tracking-[0.15em]">HACKER NEWS</span>
            <span className="text-white/25 mx-[6px]">·</span>
            <span className="text-white/55 text-[10.5px] font-normal">MAY 22</span>
            <span className="text-white/25 mx-[6px]">·</span>
            Show HN: Vibe coding SwiftUI apps is a lot of fun
            <span className="text-white/25 mx-[6px]">—</span>
            <span className="text-white/55 text-[10.5px] font-normal">I&apos;ve been prototyping with LLM-driven Swift codegen…</span>
            <span className="text-terracotta font-bold mx-2">{'//'}</span>
            <span className="text-terracotta text-[9.5px] font-extrabold uppercase tracking-[0.15em]">YAHOO — MLB</span>
            <span className="text-white/25 mx-[6px]">·</span>
            <span className="text-white/55 text-[10.5px] font-normal">MAY 22</span>
            <span className="text-white/25 mx-[6px]">·</span>
            Yankees news: New York sends down Spencer Jones, Yovanny Cruz
            <span className="text-white/25 mx-[6px]">—</span>
            <span className="text-white/55 text-[10.5px] font-normal">Yanks clear space for Cole and Cabrera; Grisham&apos;s knee intact after sliding awkwardly…</span>
            <span className="text-terracotta font-bold mx-2">{'//'}</span>
            <span className="text-terracotta text-[9.5px] font-extrabold uppercase tracking-[0.15em]">THE GUARDIAN</span>
            <span className="text-white/25 mx-[6px]">·</span>
            <span className="text-white/55 text-[10.5px] font-normal">MAY 22</span>
            <span className="text-white/25 mx-[6px]">·</span>
            AI token counter, now with model comparisons
            <span className="text-white/25 mx-[6px]">—</span>
            <span className="text-white/55 text-[10.5px] font-normal">Anthropic shipped a small utility that lets you compare tokenizer output across models…</span>
          </div>
        </div>
      </div>
    </section>
  );
}
