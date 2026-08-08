import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getDictionary, isValidLang, localizedAlternates } from "@/lib/i18n";
import { getSuggestedByCategory } from "@/lib/suggested-feeds";
import MarketingSourcesFinder from "@/components/marketing/MarketingSourcesFinder";

interface Props {
  params: Promise<{ lang: string }>;
}

// Same underlying list as the in-app "Suggested" directory (src/lib/suggested-feeds.ts),
// so both stay in sync from one source of truth. Language-agnostic (category
// names and feed metadata are never translated), so this stays module-level.
const GROUPS = getSuggestedByCategory().map((group) => ({
  name: group.name,
  sources: group.feeds.map((feed) => ({
    name: feed.name,
    domain: feed.domain,
    url: feed.url,
    description: feed.description,
  })),
}));

const TOTAL = GROUPS.reduce((n, g) => n + g.sources.length, 0);

export async function generateStaticParams() {
  return [{ lang: "en" }, { lang: "it" }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isValidLang(lang)) return {};
  const dict = getDictionary(lang);
  return {
    title: `${dict.sourcesPage.h1} · MultivRSS`,
    description: dict.sourcesPage.introBody,
    alternates: localizedAlternates(lang, "/sources"),
  };
}

export default async function SourcesPage({ params }: Props) {
  const { lang } = await params;
  if (!isValidLang(lang)) notFound();

  const dict = getDictionary(lang);
  const t = dict.sourcesPage;

  return (
    <>
      {/* Page header */}
      <header className="px-[34px] pt-[80px] pb-[46px] max-[920px]:px-[22px] max-[920px]:pt-14 max-[920px]:pb-9">
        <div className="max-w-[1200px] mx-auto">
          <p className="font-mono text-[10.5px] font-bold tracking-[0.18em] text-terracotta uppercase mb-[22px]">
            {"//"} {t.kicker}
          </p>
          <h1 className="normal-case font-black text-[clamp(48px,6vw,104px)] leading-[0.95] tracking-[-0.035em] mb-[26px]">
            {t.h1}
          </h1>
          <div className="grid grid-cols-1 min-[920px]:grid-cols-[1.3fr_1fr] gap-12 items-end">
            <p className="text-[17px] leading-[1.6] text-black/55 m-0 max-w-[560px]">
              {t.introBody}
            </p>
            <div className="font-mono text-[11px] tracking-[0.14em] text-black/30 uppercase leading-[1.7] min-[920px]:text-right">
              <b className="text-black">
                {TOTAL} {t.statsSourcesLabel}
              </b>
              <br />
              <span>
                {GROUPS.length} {t.statsCategoriesLabel}
              </span>
            </div>
          </div>
        </div>
      </header>

      <MarketingSourcesFinder groups={GROUPS} dict={t} addLabel={dict.sources.add} />

      {/* Closing CTA */}
      <section className="px-[34px] py-24 bg-black text-paper border-t-2 border-black text-center max-[920px]:px-[22px] max-[920px]:py-[72px]">
        <p className="font-mono text-[11px] font-extrabold tracking-[0.24em] text-terracotta mb-[18px]">
          {"//"} {t.closingKicker}
        </p>
        <h2 className="normal-case font-black text-[clamp(34px,4.6vw,68px)] tracking-[-0.03em] leading-[1] m-0 mb-5">
          {t.closingHeadlinePre}
          <em className="not-italic text-terracotta">{t.closingHeadlineAccent}</em>
          {t.closingHeadlineSuffix}
        </h2>
        <p className="text-[15.5px] text-white/55 max-w-[520px] mx-auto mb-8 leading-[1.6]">
          {t.closingBody}
        </p>
        <Link
          href="/register"
          className="inline-block bg-terracotta text-black border-2 border-terracotta px-[20px] py-[14px] font-mono text-[11.5px] font-extrabold tracking-[0.2em] uppercase hover:bg-black hover:text-terracotta hover:border-black transition-colors"
        >
          {t.closingCta}
        </Link>
      </section>
    </>
  );
}
