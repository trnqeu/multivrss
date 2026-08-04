import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getChangelog } from "@/lib/changelog";
import { renderMarkdown } from "@/lib/blog";
import { isValidLang } from "@/lib/i18n";

interface Props {
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isValidLang(lang)) return {};
  const doc = getChangelog(lang);
  if (!doc) return {};
  return { title: `${doc.title} · MultivRSS` };
}

export default async function ChangelogPage({ params }: Props) {
  const { lang } = await params;
  if (!isValidLang(lang)) notFound();

  const doc = getChangelog(lang);
  if (!doc) notFound();

  const html = renderMarkdown(doc.content);

  return (
    <div className="px-[34px] py-[88px] max-[920px]:px-[26px] max-[920px]:py-16">
      <div className="max-w-[720px] mx-auto">
        <header className="border-t-2 border-black pt-[22px] mb-12">
          <h1 className="normal-case font-black text-[clamp(28px,4vw,52px)] tracking-[-0.025em] leading-[1.05] mt-4 mb-6">
            {doc.title}
          </h1>
          <span className="font-mono text-[10px] font-semibold tracking-[0.1em] text-black/30 uppercase">
            {lang === "it" ? "Ultimo aggiornamento" : "Last updated"}: {doc.updated}
          </span>
          <p className="font-mono text-[11px] tracking-[0.04em] text-black/40 m-0 mt-4">
            {lang === "it"
              ? "Questa pagina è scritta e mantenuta con l'aiuto dell'IA."
              : "This page is written and maintained with the help of AI."}
          </p>
        </header>

        <div className="prose" dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </div>
  );
}
