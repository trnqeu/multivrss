import { searchAllForUser } from '@/lib/search';
import { dayBucket } from '@/lib/utils';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import FeedItem from '@/components/FeedItem';
import { Fragment } from 'react';
import { cacheLife, cacheTag } from 'next/cache';
import { prisma } from "@/lib/prisma";

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

    const result = await searchAllForUser(userId, '', {
        cat: categoryName,
        limit: 100,
        sourceId,
    });

    const items = result.hits.map(hit => ({
        id: hit.id,
        title: hit.title,
        link: hit.link,
        content: hit.content ?? null,
        pubDate: hit.pubDate ? new Date(hit.pubDate) : null,
        read: hit.read ?? false,
        savedAt: hit.savedAt ? new Date(hit.savedAt) : null,
        source: { title: hit.sourceTitle ?? null },
    }));

    if (items.length === 0) {
        return (
            <section className="p-8">
                <p className="label-system italic text-foreground">NULL_SET // SYNC_REQUIRED</p>
            </section>
        );
    }

    const itemIds = items.map(i => i.id);
    const [userTags, itemTagAssocs] = await Promise.all([
        prisma.tag.findMany({
            where: { userId },
            orderBy: { name: 'asc' },
            select: { id: true, name: true },
        }),
        prisma.feedItemTag.findMany({
            where: { feedItemId: { in: itemIds } },
            include: { tag: { select: { id: true, name: true } } },
        }),
    ]);

    const tagsByItemId = new Map<string, { id: string; name: string }[]>();
    for (const assoc of itemTagAssocs) {
        const existing = tagsByItemId.get(assoc.feedItemId) ?? [];
        existing.push(assoc.tag);
        tagsByItemId.set(assoc.feedItemId, existing);
    }

    const allTags = userTags.map(t => ({ id: t.id, name: t.name }));

    return (
        <section className="p-8 md:p-12">
            <div role="list" className="leading-relaxed text-sm text-foreground font-medium">
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
                            <FeedItem
                                item={{ ...item, tags: tagsByItemId.get(item.id) ?? [] }}
                                isLast={suppressSeparator}
                                allTags={allTags}
                            />
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
