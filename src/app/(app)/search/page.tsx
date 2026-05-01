import SearchBar from "@/components/SearchBar";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { searchFeedItemsForUser, SearchHit } from "@/lib/search";

interface SearchPageProps {
    searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
    const { q } = await searchParams;
    const session = await getServerSession(authOptions);
    if (!session) {
        redirect("/login");
    }

    let hits: SearchHit[] = [];

    if (q) {
        hits = await searchFeedItemsForUser(session.user.id, q);
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
                    {hits.map((item, index) => (
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
