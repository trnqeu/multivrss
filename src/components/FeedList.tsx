import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

interface FeedListProps {
    sourceId?: string;
    categoryId?: string;
}

export default async function FeedList({ sourceId, categoryId }: FeedListProps) {
    const session = await getServerSession(authOptions);
    const userId = session?.user.id;
    const items = await prisma.feedItem.findMany({
        where: sourceId
            ? { sourceId, source: { category: { userId } } }
            : categoryId
                ? { source: { categoryId, category: { userId } } }
                : { source: { category: { userId } } },
        take: 100,
        orderBy: { pubDate: 'desc' },
        include: { source: true }
    });

    if (items.length === 0) {
        return (
            <section className="p-8">
                <p className="label-system italic text-foreground">NULL_SET // SYNC_REQUIRED</p>
            </section>
        );
    }

    return (
        <section className="p-8 md:p-12">
            <p className="leading-relaxed text-sm text-foreground font-medium">
                {items.map((item, index) => (
                    <span key={item.id}>
                        <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-terracotta transition-colors"
                        >
                            <span className="text-terracotta text-[10px] font-bold uppercase tracking-widest">
                                {item.source.title}
                            </span>
                            <span className="text-foreground/40 mx-2">·</span>
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
                        {index < items.length - 1 && (
                            <span className="text-terracotta font-bold mx-3 select-none">{'/ /'}</span>
                        )}
                    </span>
                ))}
            </p>
        </section>
    );
}
