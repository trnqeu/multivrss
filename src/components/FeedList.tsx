import { searchFeedItemsForUser } from '@/lib/search';
import { dayBucket } from '@/lib/utils';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import FeedItem from '@/components/FeedItem';
import { Fragment } from 'react';
import { cacheLife, cacheTag } from 'next/cache';

interface FeedListProps {
    sourceId?: string;
    categoryName?: string;
}

async function CachedFeedContent({
    userId, sourceId, categoryName,
}: { userId: string; sourceId?: string; categoryName?: string }) {
    'use cache';
    cacheLife('seconds');
    cacheTag(`feed:${userId}`);

    const result = await searchFeedItemsForUser(
        userId,
        '',
        categoryName,
        undefined,
        100,
        0,
        sourceId,
    );

    const items = result.hits.map(hit => ({
        id: hit.id,
        title: hit.title,
        link: hit.link,
        content: hit.content ?? null,
        pubDate: hit.pubDate ? new Date(hit.pubDate) : null,
        read: false,
        source: { title: hit.sourceTitle ?? null },
    }));

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

export default async function FeedList({ sourceId, categoryName }: FeedListProps) {
    const session = await getServerSession(authOptions);
    if (!session) return null;
    return <CachedFeedContent
        userId={session.user.id}
        sourceId={sourceId}
        categoryName={categoryName}
    />;
}
