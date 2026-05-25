export default function MarketingPillars() {
  return (
    <section id="product" className="grid grid-cols-1 md:grid-cols-3 border-b-2 border-black">
      <div className="p-10 md:p-[40px_32px_44px] border-r-0 md:border-r-2 border-black md:last:border-r-0 border-b-2 md:border-b-0 last:border-b-0">
        <p className="font-mono text-[11px] font-extrabold tracking-[0.2em] text-terracotta mb-[14px]">01 / READ</p>
        <h3 className="text-[28px] font-extrabold tracking-[-0.01em] leading-[1.15] mb-[14px]">One river,<br />every source.</h3>
        <p className="text-[14.5px] leading-[1.6] text-black/55">
          Subscribe to any RSS or Atom feed. <b className="text-black font-bold">Organize by category.</b> Read everything in a dense, horizontal &ldquo;river&rdquo; — typography-first, no thumbnails, no infinite scroll.
          Full-text search across every article you&apos;ve ever pulled, in <b className="text-black font-bold">5 ms</b>.
        </p>
        <span className="block font-mono text-[11px] tracking-[0.08em] text-terracotta mt-[18px]">multivrss.com/</span>
      </div>

      <div className="p-10 md:p-[40px_32px_44px] border-r-0 md:border-r-2 border-black md:last:border-r-0 border-b-2 md:border-b-0 last:border-b-0">
        <p className="font-mono text-[11px] font-extrabold tracking-[0.2em] text-terracotta mb-[14px]">02 / SAVE</p>
        <h3 className="text-[28px] font-extrabold tracking-[-0.01em] leading-[1.15] mb-[14px]">A reading list<br />that doesn&apos;t expire.</h3>
        <p className="text-[14.5px] leading-[1.6] text-black/55">
          Bookmark any feed item in one click. Paste any URL from anywhere on the web — title and description fetched automatically.
          Your private archive at <b className="text-black font-bold">/saved</b>. Like Instapaper or Pocket, but the data <b className="text-black font-bold">belongs to you</b>.
        </p>
        <span className="block font-mono text-[11px] tracking-[0.08em] text-terracotta mt-[18px]">multivrss.com/saved</span>
      </div>

      <div className="p-10 md:p-[40px_32px_44px] border-r-0 md:border-r-2 border-black md:last:border-r-0 border-b-2 md:border-b-0 last:border-b-0">
        <p className="font-mono text-[11px] font-extrabold tracking-[0.2em] text-terracotta mb-[14px]">03 / PUBLISH</p>
        <h3 className="text-[28px] font-extrabold tracking-[-0.01em] leading-[1.15] mb-[14px]">A public page<br />for your taste.</h3>
        <p className="text-[14.5px] leading-[1.6] text-black/55">
          Mark any saved link as public and it shows up on your profile — a curated <b className="text-black font-bold">&ldquo;best-of internet&rdquo;</b> at your own URL.
          Readable without login. Indexed by search engines. Owned by you.
        </p>
        <span className="block font-mono text-[11px] tracking-[0.08em] text-terracotta mt-[18px]">
          multivrss.com/<b className="text-terracotta">[username]</b>
        </span>
      </div>
    </section>
  );
}
