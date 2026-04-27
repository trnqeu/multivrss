import SearchBar from "@/components/SearchBar";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { meili } from "@/lib/meili";

interface SearchPageProps {
    searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
    const { q } = await searchParams;
    const session = await getServerSession(authOptions);

    let hits: { id: string; link: string; title: string; pubDate: number | null; content?: string }[] = [];

    if (session && q) {
        const sources = await prisma.feedSource.findMany({
            where: { category: { userId: session.user.id } },
            select: { id: true },
        });
        const sourceIds = sources.map(s => s.id);

        if (sourceIds.length > 0) {
            const results = await meili.index("items").search(q, {
                limit: 50,
                filter: sourceIds.map(id => `sourceId = "${id}"`).join(" OR "),
                sort: ["pubDate:desc"],
            });
            hits = results.hits as typeof hits;
        }
    }

    return (

            <main className="flex-1 overflow-y-auto scroll-smooth bg-background">
                <header className="p-8 md:p-12 border-b-2 border-foreground sticky top-0 z-10 bg-background">
                    <h1 className="tracking-[0.2em] text-terracotta font-bold">
                        SEARCH // {q ? `"${q.toUpperCase()}"` : "ALL"}
                    </h1>
                    <p className="mt-1 text-foreground text-[11px] font-bold uppercase tracking-widest">
                        {hits.length} RESULT{hits.length !== 1 ? "S" : ""}
                    </p>
                </header>
                <SearchBar />
                <section className="p-8 md:p-12">
                    <p className="leading-relaxed text-sm text-foreground font-medium">
                        {hits.map((item: { id: string; link: string; title: string; pubDate: number | null; content?: string }, index: number) => (
                            <span key={item.id}>
                                <a
                                    href={item.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:text-terracotta transition-colors"
                                >
                                    <span className="text-foreground/50 text-xs">
                                        {item.pubDate
                                            ? new Date(item.pubDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                                            : '---'}
                                    </span>
                                    <span className="text-foreground/40 mx-2">·</span>
                                    <span>{item.title}</span>
                                    {item.content && (
                                        <>
                                            <span className="text-foreground/40 mx-2">—</span>
                                            <span className="text-foreground/50 text-xs font-normal">
                                                {item.content.replace(/<[^>]*>?/gm, '').slice(0, 120).trimEnd()}…
                                            </span>
                                        </>
                                    )}
                                </a>
                                {index < hits.length - 1 && (
                                    <span className="text-terracotta font-bold mx-3 select-none">`/ /`</span>
                                )}
                            </span>
                        ))}
                    </p>
                </section>

            </main>
    );
}
