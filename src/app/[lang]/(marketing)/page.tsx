import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getDictionary, isValidLang } from "@/lib/i18n";
import MarketingHero from "@/components/marketing/MarketingHero";
import MarketingBlog from "@/components/marketing/MarketingBlog";
import MarketingSourcesPreview from "@/components/marketing/MarketingSourcesPreview";
import MarketingClosing from "@/components/marketing/MarketingClosing";

interface Props {
  params: Promise<{ lang: string }>;
}

export default async function MarketingPage({ params }: Props) {
  const { lang } = await params;
  if (!isValidLang(lang)) notFound();

  const session = await getServerSession(authOptions);
  if (session?.user) redirect(`/u/${session.user.username}`);

  const dict = getDictionary(lang);

  return (
    <>
      <MarketingHero dict={dict} />
      <MarketingBlog lang={lang} dict={dict} />
      <MarketingSourcesPreview lang={lang} dict={dict} />
      <MarketingClosing lang={lang} dict={dict} />
    </>
  );
}
