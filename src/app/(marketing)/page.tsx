import MarketingHero from "@/components/marketing/MarketingHero";
import MarketingPillars from "@/components/marketing/MarketingPillars";
import MarketingLivePreview from "@/components/marketing/MarketingLivePreview";
import MarketingTips from "@/components/marketing/MarketingTips";
import MarketingPricing from "@/components/marketing/MarketingPricing";
import MarketingClosing from "@/components/marketing/MarketingClosing";

export default async function MarketingPage() {
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
