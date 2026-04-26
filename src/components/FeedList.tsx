import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import FeedItem from '@/components/FeedItem';


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
        orderBy: { pubDate: { sort: 'desc', nulls: 'last' } },
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
                    <FeedItem key={item.id} item={item} isLast={index === items.length - 1} />
                ))}

            </p>
        </section>
    );
}
