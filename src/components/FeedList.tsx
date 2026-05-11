import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import FeedItem from '@/components/FeedItem';
import { Fragment } from 'react';


interface FeedListProps {
    sourceId?: string;
    categoryId?: string;
}

function dayBucket(date: Date | null): string {
    if (!date) return '';
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        timeZone: 'Europe/Rome',
    }).format(date).toUpperCase();
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
            <div className="leading-relaxed text-sm text-foreground font-medium">
                {items.map((item, index) => {
                    const currentDay = dayBucket(item.pubDate);
                    const prevDay   = index > 0 ? dayBucket(items[index - 1].pubDate) : null;
                    const nextDay   = index < items.length - 1 ? dayBucket(items[index + 1].pubDate) : null;
                    const isNewDay  = currentDay !== prevDay;
                    const suppressSeparator = index === items.length - 1 || currentDay !== nextDay;

                    return (
                        <Fragment key={item.id}>
                            {isNewDay && currentDay && (
                                <div className={`flex items-center gap-3 mb-[22px] ${index === 0 ? 'mt-4' : 'mt-8'}`}>
                                    <span className="text-[9.5px] font-extrabold tracking-[0.32em] text-terracotta shrink-0">
                                        — {currentDay}
                                    </span>
                                    <span className="flex-1 h-px bg-terracotta/35" />
                                    <span className="text-[9px] text-white/35">→</span>
                                </div>
                            )}
                            <FeedItem item={item} isLast={suppressSeparator} />
                        </Fragment>
                    );
                })}
            </div>
        </section>
    );
}
