import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import type { Lang, Dictionary } from "@/lib/i18n";
import MarketingNav from "./MarketingNav";

interface Props {
  lang: Lang;
  dict: Dictionary;
}

// Reads the session (a dynamic, request-scoped API) and renders the
// session-aware nav. Kept separate from MarketingLayout and wrapped in
// <Suspense> there so the static marketing shell (blog, faq, etc. — all
// built via generateStaticParams) stays cacheable; only this slice streams
// in per request.
export default async function MarketingNavAuth({ lang, dict }: Props) {
  const session = await getServerSession(authOptions);
  return <MarketingNav lang={lang} dict={dict} username={session?.user?.username} />;
}
