import Image from "next/image";

const FOOTER_COLS = [
  {
    title: "Product",
    links: [
      { label: "Reader", href: "#product" },
      { label: "Reading list", href: "#" },
      { label: "Public profile", href: "#" },
      { label: "Search", href: "#" },
      { label: "Chrome extension", href: "#" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Tips & tricks", href: "#tips" },
      { label: "REST API", href: "#" },
      { label: "RSSHub bridge", href: "#" },
      { label: "Changelog", href: "#" },
      { label: "Status", href: "#" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "Privacy", href: "#" },
      { label: "Terms", href: "#" },
      { label: "Contact", href: "#" },
      { label: "GitHub ↗", href: "https://github.com/anomalyco/multivrss" },
    ],
  },
];

export default function MarketingFooter() {
  return (
    <footer className="bg-paper border-t-2 border-black px-7 pt-9 pb-7">
      <div className="grid grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr] gap-6 items-start">
        <div className="col-span-2 lg:col-span-1">
          <div className="flex items-center gap-[14px] mb-[14px]">
            <Image src="/assets/multivrss-ico.png" alt="" width={28} height={28} className="w-[28px] h-[28px]" />
            <span className="text-[14px] font-extrabold tracking-[0.22em] text-terracotta uppercase">multivrss</span>
          </div>
          <p className="text-[12.5px] text-black/55 font-medium max-w-[280px]">
            An RSS aggregator, reading list, and public profile in one open-format dashboard. Built in the open with
            Next.js, Postgres &amp; Meilisearch.
          </p>
        </div>

        {FOOTER_COLS.map((col) => (
          <div key={col.title}>
            <h5 className="font-mono text-[10.5px] font-extrabold tracking-[0.2em] text-terracotta uppercase m-0 mb-3">
              {col.title}
            </h5>
            {col.links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="block text-[12.5px] text-black/55 font-medium leading-[1.9] hover:text-black transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center mt-8 pt-[18px] border-t border-black/10 font-mono text-[10px] tracking-[0.12em] text-black/55">
        <span>© 2026 MULTIVRSS · <b className="text-terracotta">NODE_alpha</b> · MADE IN TORINO</span>
        <span>v0.1.0 · BUILD 2026.05.23 · UPTIME <b className="text-terracotta">99.98%</b></span>
      </div>
    </footer>
  );
}
