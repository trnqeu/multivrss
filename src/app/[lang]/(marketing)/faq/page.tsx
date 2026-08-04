import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getDictionary, isValidLang } from "@/lib/i18n";
import MarketingClosing from "@/components/marketing/MarketingClosing";

interface Props {
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isValidLang(lang)) return {};
  const dict = getDictionary(lang);
  return {
    title: `${dict.faqPage.h1} · MultivRSS`,
    description: dict.faqPage.introBody,
  };
}

export default async function FaqPage({ params }: Props) {
  const { lang } = await params;
  if (!isValidLang(lang)) notFound();

  const dict = getDictionary(lang);
  const t = dict.faqPage;

  return (
    <>
      <header className="px-[34px] pt-[80px] pb-[46px] max-[920px]:px-[22px] max-[920px]:pt-14 max-[920px]:pb-9">
        <div className="max-w-[900px] mx-auto">
          <p className="font-mono text-[10.5px] font-bold tracking-[0.18em] text-terracotta uppercase mb-[22px]">
            {"//"} {t.kicker}
          </p>
          <h1 className="normal-case font-black text-[clamp(48px,6vw,104px)] leading-[0.95] tracking-[-0.035em] mb-[26px]">
            {t.h1}
          </h1>
          <p className="text-[17px] leading-[1.6] text-black/55 m-0 max-w-[560px]">
            {t.introBody}
          </p>
          <p className="font-mono text-[11px] tracking-[0.04em] text-black/40 m-0 mt-5 max-w-[560px]">
            {t.aiDisclaimer}
          </p>
        </div>
      </header>

      <div className="px-[34px] pb-[100px] max-[920px]:px-[22px]">
        <div className="max-w-[900px] mx-auto">
          {t.categories.map((category) => (
            <section
              key={category.id}
              id={`faq-${category.id}`}
              aria-labelledby={`faq-${category.id}-heading`}
              className="border-t-2 border-black scroll-mt-6"
            >
              <h2
                id={`faq-${category.id}-heading`}
                className="normal-case font-black text-[clamp(28px,3.4vw,44px)] tracking-[-0.02em] leading-[1.05] m-0 py-8"
              >
                {category.title}
              </h2>
              <div className="flex flex-col pb-4">
                {category.items.map((item, i) => (
                  <details key={i} name={`faq-${category.id}`} className="group border-t border-black/12">
                    <summary className="marker:content-none [&::-webkit-details-marker]:hidden cursor-pointer flex items-center justify-between gap-4 py-5">
                      <h3 className="normal-case font-bold text-[17px] leading-[1.3] m-0">
                        {item.question}
                      </h3>
                      <span
                        aria-hidden="true"
                        className="shrink-0 font-mono text-terracotta text-[18px] leading-none transition-transform duration-150 group-open:rotate-45"
                      >
                        +
                      </span>
                    </summary>
                    <p className="text-[15px] leading-[1.65] text-black/55 m-0 pb-6 pr-8 max-w-[680px]">
                      {item.answer}
                    </p>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>

      <MarketingClosing lang={lang} dict={dict} />
    </>
  );
}
