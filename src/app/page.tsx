import Sidebar from '@/components/Sidebar';
import { prisma } from '@/lib/prisma'

export default async function Home() {
  const items = await prisma.feedItem.findMany({
    take: 30,
    orderBy: { pubDate: 'desc' },
    include: { source: true }
  })

  return (
    <div className="flex flex-1 overflow-hidden">
      <Sidebar />

      {/* Main Feed Content */}
      <main className="flex-1 overflow-y-auto p-[--grid] md:p-[calc(var(--grid)*4)]">
        <header className="mb-12">
          <h1 className="text-5xl md:text-7xl mb-2 text-accent">MultivRSS</h1>
          <p className="text-zinc-500 max-w-lg">
            A high-performance future-proof RSS aggregator.
          </p>
          <hr />
        </header>

        <section className="flex flex-col gap-12 max-w-4xl">
          {items.map((item) => (
            <article key={item.id} className="border-l-4 border-accent pl-6 py-2 group">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs uppercase tracking-widest text-accent font-bold">
                  {item.source.title}
                </span>
                <span className="text-xs text-zinc-400">
                  — {item.pubDate ? new Date(item.pubDate).toLocaleDateString() : 'No date'}
                </span>
              </div>
              <a
                href={item.link}
                target="_blank"
                className="hover:underline decoration-accent decoration-2 underline-offset-4"
              >
                <h3 className="text-xl mb-2 font-bold text-zinc-100 tracking-tight leading-snug">
                  {item.title}
                </h3>
              </a>
              <p className="text-zinc-600 line-clamp-3 leading-relaxed">
                {item.content}
              </p>
            </article>
          ))}

          {items.length === 0 && (
            <p className="text-zinc-400 italic">No articles found. Try syncing a feed!</p>
          )}
        </section>
      </main>
    </div>
  );
}
