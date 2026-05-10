
import { getCategories } from "@/app/actions";
import { connection } from 'next/server';
import SearchBar from "@/components/SearchBar";
import PageHeader from "@/components/PageHeader";
import MobileCategoryStrip from '@/components/MobileCategoryStrip';


export default async function Home() {
  await connection();
  const categories = await getCategories();

  return (
      <>
        <PageHeader title="YOUR MULTIVRSS" categories={categories} />
        <main className="flex-1 min-h-0 overflow-y-auto scroll-smooth bg-background">
          <MobileCategoryStrip categories={categories} />
          <SearchBar />
        </main>
      </>
  );
}
