import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getDictionary, isValidLang } from "@/lib/i18n";
import MarketingNav from "@/components/marketing/MarketingNav";
import MarketingFooter from "@/components/marketing/MarketingFooter";
import SystemStrip from "@/components/marketing/SystemStrip";

interface Props {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isValidLang(lang)) return {};
  const dict = getDictionary(lang);
  return {
    title: dict.meta.home.title,
    description: dict.meta.home.description,
  };
}

export default async function MarketingLayout({ children, params }: Props) {
  const { lang } = await params;
  if (!isValidLang(lang)) notFound();

  const dict = getDictionary(lang);

  return (
    <div className="bg-paper text-black font-sans min-h-screen flex flex-col">
      <SystemStrip />
      <MarketingNav lang={lang} dict={dict} />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <MarketingFooter lang={lang} dict={dict} />
    </div>
  );
}
