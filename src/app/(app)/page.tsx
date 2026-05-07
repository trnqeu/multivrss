
import { getCategories } from "@/app/actions";
import AddFeedForm from "@/components/AddFeedForm";
import { connection } from 'next/server';
import SearchBar from "@/components/SearchBar";
import SyncButton from "@/components/SyncButton";



export default async function Home() {
  await connection();
  const categories = await getCategories();

  return (

      <main className="flex-1 overflow-y-auto relative scroll-smooth bg-background">
        {/* Minimalist Header */}
        <header className="p-8 md:p-12 border-b-2 border-foreground bg-background sticky top-0 z-10">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="tracking-[0.2em] text-terracotta font-bold">
                MULTIVRSS
              </h1>
              <p className="mt-2 text-foreground max-w-xl text-[11px] font-bold leading-relaxed uppercase tracking-widest">
                RSS Aggregator// v0.1.0
              </p>
            </div>
            <SyncButton />
          </div>
        </header>

        <SearchBar />

        <AddFeedForm categories={categories} />
      </main>
  );
}
