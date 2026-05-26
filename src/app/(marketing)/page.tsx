import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import MarketingHero from "@/components/marketing/MarketingHero";
import MarketingPillars from "@/components/marketing/MarketingPillars";
import MarketingLivePreview from "@/components/marketing/MarketingLivePreview";
import MarketingTips from "@/components/marketing/MarketingTips";
import MarketingPricing from "@/components/marketing/MarketingPricing";
import MarketingClosing from "@/components/marketing/MarketingClosing";

export default async function MarketingPage() {
  const session = await getServerSession(authOptions);

  if (session?.user) {
    redirect(`/u/${session.user.username}`);
  }

  return (
    <>
      <MarketingHero />
      <MarketingPillars />
      <MarketingLivePreview />
      <MarketingTips />
      <MarketingPricing />
      <MarketingClosing />
    </>
  );
}
