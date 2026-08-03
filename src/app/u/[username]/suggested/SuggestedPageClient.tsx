"use client";

import SuggestedFeedsBrowser from "@/components/SuggestedFeedsBrowser";
import type { SuggestedCategory } from "@/lib/suggested-feeds";

interface Props {
  suggested: SuggestedCategory[];
}

export default function SuggestedPageClient({ suggested }: Props) {
  return (
    <main className="flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden relative scroll-smooth bg-background">
      <SuggestedFeedsBrowser suggested={suggested} />
    </main>
  );
}
