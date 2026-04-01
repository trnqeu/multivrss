import Sidebar from '@/components/Sidebar';

export default async function Home() {
  return (
    <div className="flex flex-1 overflow-hidden">
      <Sidebar />

      {/* Main Feed Content */}
      <main className="flex-1 overflow-y-auto p-[--grid] md:p-[calc(var(--grid)*4)]">
        <header className="mb-12">
          <h1 className="text-5xl md:text-7xl mb-2 text-accent">MultivRSS</h1>
          <p className="text-zinc-500 max-w-lg">
            A high-performance RSS aggregator built with Bauhaus precision and institutional monumentality.
          </p>
          <hr />
        </header>

        <section className="flex flex-col gap-12 max-w-4xl">
          <article className="border-l-4 border-[--accent] pl-6 py-2">
            <span className="text-xs uppercase tracking-widest text-zinc-400 mb-2 block">Technology — 2h ago</span>
            <h3 className="text-3xl mb-4 normal-case font-bold tracking-normal text-black">
              Introducing the Dissonant Harmony Design System
            </h3>
            <p className="text-zinc-600 line-clamp-3">
              Explore how we blended minimalist Bauhaus principles with the commanding presence of classical typography to create a unique reading experience.
            </p>
          </article>

          <article className="border-l-4 border-zinc-200 pl-6 py-2">
            <span className="text-xs uppercase tracking-widest text-zinc-400 mb-2 block">Design — 5h ago</span>
            <h3 className="text-3xl mb-4 normal-case font-bold tracking-normal">
              The Power of the 8-Point Grid
            </h3>
            <p className="text-zinc-600 line-clamp-3">
              Consistency is the foundation of digital experiences. Learn why we chose a strict grid system to manage complex data layouts.
            </p>
          </article>
        </section>
      </main>
    </div>
  );
}
