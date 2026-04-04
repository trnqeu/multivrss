import Sidebar from '@/components/Sidebar';
import { prisma } from '@/lib/prisma'
import { getCategories } from "@/app/actions";
import AddFeedForm from "@/components/AddFeedForm";
import { connection } from 'next/server';

export default async function Home() {
  await connection();
  const items = await prisma.feedItem.findMany({
    take: 30,
    orderBy: { pubDate: 'desc' },
    include: { source: true }
  })
  const categories = await getCategories();

  return (
    <div className="flex flex-1 overflow-hidden h-screen">
      <Sidebar />

      {/* Main Feed Content */}
      <main className="flex-1 overflow-y-auto relative scroll-smooth bg-[#050505]">
        {/* Minimalist Header */}
        <header className="p-8 md:p-12 border-b border-accent/10 bg-[#050505]/95 backdrop-blur-md sticky top-0 z-10">
          <h1 className="tracking-[0.2em]">
            MULTIVRSS
          </h1>
          <p className="mt-2 text-zinc-500 max-w-xl text-[11px] font-medium leading-relaxed uppercase tracking-widest opacity-60">
            RSS Aggregator// v0.1.0
          </p>
        </header>

        <AddFeedForm categories={categories} />

        {/* Feed List */}
        <section className="p-6 md:p-8 flex flex-col gap-8 max-w-5xl">
          {items.map((item) => (
            <article key={item.id} className="relative group pl-6 border-l border-zinc-800 hover:border-accent/40 transition-all duration-200">
              {/* Vertical accent bar on hover */}
              <div className="absolute left-0 top-0 w-[1px] h-0 bg-accent group-hover:h-full transition-all duration-300"></div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-3">
                  <span className="label-system text-accent/70 text-[9px]">
                    {item.source.title}
                  </span>
                  <span className="h-px w-4 bg-zinc-800"></span>
                  <span className="label-system !text-zinc-600 text-[9px]">
                    {item.pubDate ? new Date(item.pubDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '---'}
                  </span>
                </div>

                <a
                  href={item.link}
                  target="_blank"
                  className="block"
                >
                  <h3 className="text-zinc-200 group-hover:text-white transition-colors !normal-case !font-semibold !text-base leading-tight">
                    {item.title}
                  </h3>
                </a>

                {item.content && (
                  <p className="text-zinc-500 line-clamp-2 leading-relaxed text-xs max-w-3xl font-medium mt-0.5">
                    {item.content.replace(/<[^>]*>?/gm, '')}
                  </p>
                )}

                <div className="mt-1 opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <a href={item.link} target="_blank" className="label-system text-[8px] hover:text-accent flex items-center gap-1.5 grayscale group-hover:grayscale-0">
                    OPEN_TRANSIT <span className="text-[10px]">→</span>
                  </a>
                </div>
              </div>
            </article>
          ))}

          {items.length === 0 && (
            <div className="py-8 border border-dashed border-zinc-900 text-center">
              <p className="label-system opacity-20 italic">NULL_SET // SYNC_REQUIRED</p>
            </div>
          )}

          {/* End of Feed Sentinel */}
          <div className="pt-8 pb-16 flex flex-col items-center">
            <div className="h-px w-full bg-accent/5 relative">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 bg-[#050505] label-system !text-[8px] opacity-10">
                SYSTEM_END
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
