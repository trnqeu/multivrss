import { Suspense } from "react";
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

export async function generateStaticParams() {
  return [{ lang: "en" }, { lang: "it" }];
}

// Isolated in its own Suspense boundary so the session check (a dynamic API,
// no static shell possible) doesn't drag the whole static page content into
// a full dynamic bailout — same pattern as MarketingNavAuth in layout.tsx.
// Renders nothing; its only job is the logged-in redirect.
async function AuthRedirect() {
  const session = await getServerSession(authOptions);
  if (session?.user) redirect(`/u/${session.user.username}`);
  return null;
}

export default async function MarketingPage({ params }: Props) {
  const { lang } = await params;
  if (!isValidLang(lang)) notFound();

  const dict = getDictionary(lang);

  return (
    <>
      <Suspense fallback={null}>
        <AuthRedirect />
      </Suspense>
      <MarketingHero dict={dict} />
      <MarketingBlog lang={lang} dict={dict} />
      <MarketingSourcesPreview lang={lang} dict={dict} />
      <MarketingClosing lang={lang} dict={dict} />
    </>
  );
}
