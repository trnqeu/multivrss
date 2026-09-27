import type { Dictionary } from "@/lib/i18n";

const REPO_URL = "https://github.com/trnqeu/multivrss";
const SELF_HOSTING_URL = `${REPO_URL}/blob/main/SELF_HOSTING.md`;

interface Props {
  dict: Dictionary;
}

export default function MarketingOpenSource({ dict }: Props) {
  const t = dict.openSource;

  return (
    <section
      id="open-source"
      className="px-[34px] py-[88px] border-t-2 border-black max-[920px]:px-[26px] max-[920px]:py-16"
    >
      <div className="max-w-[1200px] mx-auto grid grid-cols-1 min-[920px]:grid-cols-2 gap-x-14 gap-y-10 items-start">
        <div>
          <p className="font-mono text-[11px] font-extrabold tracking-[0.22em] text-terracotta uppercase mb-4">
            {"//"} {t.kicker}
          </p>
          <h2 className="normal-case font-black text-[clamp(34px,4.4vw,60px)] tracking-[-0.025em] leading-[1]">
            {t.title}
          </h2>
          <p className="text-[15px] text-black/55 leading-[1.55] max-w-[460px] mt-[14px]">
            {t.body}
          </p>
          <div className="flex gap-[14px] flex-wrap mt-8">
            <a
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-black text-paper border-2 border-black px-[20px] py-[14px] font-mono text-[11.5px] font-extrabold tracking-[0.2em] uppercase hover:bg-paper hover:text-black transition-colors"
            >
              {t.githubCta}
              <span className="sr-only"> {t.newTabHint}</span>
            </a>
            <a
              href={SELF_HOSTING_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="border-2 border-black px-[20px] py-[14px] font-mono text-[11.5px] font-extrabold tracking-[0.2em] uppercase hover:text-terracotta hover:border-terracotta transition-colors"
            >
              {t.selfHostCta}
              <span className="sr-only"> {t.newTabHint}</span>
            </a>
          </div>
        </div>

        <dl className="border-t-2 border-black">
          {t.facts.map((fact) => (
            <div
              key={fact.label}
              className="flex items-baseline gap-3 py-4 border-b border-black/7"
            >
              <dt className="font-mono text-[9.5px] font-extrabold tracking-[0.14em] uppercase text-terracotta w-[78px] shrink-0">
                {fact.label}
              </dt>
              <dd className="text-[16.5px] font-bold tracking-[-0.005em]">
                {fact.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
