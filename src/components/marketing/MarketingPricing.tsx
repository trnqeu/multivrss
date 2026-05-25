const FEATURES_FREE = [
  { text: "Up to <b>20 feeds</b> across <b>5 categories</b>", enabled: true },
  { text: "Reading list — unlimited saved links", enabled: true },
  { text: "Public profile at <span class=\"font-mono\">/[username]</span>", enabled: true },
  { text: "90-day item retention", enabled: true },
  { text: "No full-text search", enabled: false },
  { text: "No CSV export · no public API", enabled: false },
  { text: "No reader mode (full-article extraction)", enabled: false },
];

const FEATURES_PRO = [
  { text: "<b>Unlimited</b> feeds &amp; categories", enabled: true },
  { text: "<b>Meilisearch</b> full-text search across every article", enabled: true },
  { text: "CSV export &amp; public REST API", enabled: true },
  { text: "Reader mode (Mozilla Readability)", enabled: true },
  { text: "Indefinite item retention", enabled: true },
  { text: "Priority sync · custom RSS generator", enabled: true },
  { text: "Chrome extension &amp; RSSHub integration", enabled: true },
];

function PlanCard({
  name,
  price,
  features,
  cta,
  variant,
}: {
  name: string;
  price: string;
  features: typeof FEATURES_FREE;
  cta: string;
  variant: "free" | "pro";
}) {
  const isPro = variant === "pro";
  return (
    <div className={`p-8 pb-9 ${isPro ? "bg-black text-paper" : "bg-paper text-black"} border-r-0 lg:last:border-r-0`}>
      <div className="flex items-baseline justify-between pb-[22px] border-b-2 border-current mb-[22px]">
        <div className={`text-[28px] font-extrabold tracking-[0.04em] uppercase ${isPro ? "text-terracotta" : ""}`}>
          {name}
        </div>
        <div className={`font-['JetBrains_Mono',_monospace] text-[40px] tracking-[0.02em] ${isPro ? "text-terracotta" : ""}`}>
          {price}<small className="font-mono text-[12px] font-bold tracking-[0.1em] opacity-60">/MO</small>
        </div>
      </div>
      <ul className="flex flex-col gap-3 m-0 p-0 list-none">
        {features.map((f, i) => (
          <li key={i} className={`grid grid-cols-[18px_1fr] gap-[10px] text-[13.5px] leading-[1.5] ${f.enabled ? "" : "opacity-45"}`}>
            <span className={`font-mono font-extrabold ${f.enabled ? "text-terracotta" : ""}`}>
              {f.enabled ? "+" : "—"}
            </span>
            <span dangerouslySetInnerHTML={{ __html: f.text }} />
          </li>
        ))}
      </ul>
      <div className="mt-7">
        {isPro ? (
          <button className="w-full text-center bg-terracotta text-black border-2 border-terracotta px-[18px] py-[13px] font-mono text-[11.5px] font-extrabold tracking-[0.2em] uppercase hover:bg-black hover:text-terracotta hover:border-black transition-colors">
            {cta}
          </button>
        ) : (
          <button className="w-full text-center border-2 border-black px-[14px] py-[9px] font-mono text-[10.5px] font-extrabold tracking-[0.18em] uppercase hover:bg-black hover:text-paper transition-colors">
            {cta}
          </button>
        )}
      </div>
    </div>
  );
}

export default function MarketingPricing() {
  return (
    <section id="pricing" className="px-7 py-20 border-t-2 border-black">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 mb-8">
        <div>
          <p className="font-mono text-[11px] font-extrabold tracking-[0.22em] text-terracotta mb-3">
            {'//'} PRICING — 02 TIERS
          </p>
          <h2 className="font-sans font-black text-[clamp(36px,4.4vw,64px)] tracking-[-0.025em] leading-none m-0">
            Two plans.<br />No middle.
          </h2>
        </div>
        <p className="font-mono text-[11px] tracking-[0.12em] text-black/55 max-w-[280px] text-right leading-[1.6]">
          THE FREE TIER IS NOT A TRIAL. IT&apos;S A REAL TOOL — KEPT INTENTIONALLY SLIM. PRO ADDS THE THINGS POWER USERS
          ACTUALLY NEED.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 border-2 border-black">
        <PlanCard name="Free" price="€0" features={FEATURES_FREE} cta="START FREE" variant="free" />
        <PlanCard name="Pro" price="€5" features={FEATURES_PRO} cta="→ GO PRO" variant="pro" />
      </div>
    </section>
  );
}
