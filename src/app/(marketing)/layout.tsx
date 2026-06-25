import type { Metadata } from "next";
import SystemStrip from "@/components/marketing/SystemStrip";
import MarketingNav from "@/components/marketing/MarketingNav";
import MarketingFooter from "@/components/marketing/MarketingFooter";

export const metadata: Metadata = {
  title: "MultivRSS — Read the open web. Save what matters.",
  description:
    "Your Internet Reading Room. All your RSS feeds and bookmarks in one calm, ad-free, open-format dashboard.",
};

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-paper text-black font-sans min-h-screen flex flex-col">
      <SystemStrip />
      <MarketingNav />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <MarketingFooter />
    </div>
  );
}
