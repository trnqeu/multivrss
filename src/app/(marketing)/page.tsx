import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import MarketingHero from "@/components/marketing/MarketingHero";
import MarketingBlog from "@/components/marketing/MarketingBlog";
import MarketingSourcesPreview from "@/components/marketing/MarketingSourcesPreview";
import MarketingClosing from "@/components/marketing/MarketingClosing";

export default async function MarketingPage() {
  const session = await getServerSession(authOptions);
  if (session?.user) redirect(`/u/${session.user.username}`);

  return (
    <>
      <MarketingHero />
      <MarketingBlog />
      <MarketingSourcesPreview />
      <MarketingClosing />
    </>
  );
}
