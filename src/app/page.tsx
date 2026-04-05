import Sidebar from '@/components/Sidebar';
import { getCategories } from "@/app/actions";
import AddFeedForm from "@/components/AddFeedForm";
import FeedList from "@/components/FeedList";
import { connection } from 'next/server';

export default async function Home() {
  await connection();
  const categories = await getCategories();

  return (
    <div className="flex flex-1 overflow-hidden h-screen bg-background text-foreground">
      <Sidebar />

      {/* Main Feed Content */}
      <main className="flex-1 overflow-y-auto relative scroll-smooth bg-background">
        {/* Minimalist Header */}
        <header className="p-8 md:p-12 border-b-2 border-foreground bg-background sticky top-0 z-10">
          <h1 className="tracking-[0.2em] text-terracotta font-bold">
            MULTIVRSS
          </h1>
          <p className="mt-2 text-foreground max-w-xl text-[11px] font-bold leading-relaxed uppercase tracking-widest">
            RSS Aggregator// v0.1.0
          </p>
        </header>

        <AddFeedForm categories={categories} />

        {/* Feed List Section */}
        <FeedList />
      </main>
    </div>
  );
}
