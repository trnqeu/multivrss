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
    // Epoch ms of the source's last successful sync, or null if never synced.
    // Only the single-source view passes it — lets the empty state say "synced,
    // nothing here" instead of the misleading "SYNC_REQUIRED".
    sourceLastSync?: number | null;
}

async function CachedFeedContent({
    userId, username, sourceId, categoryName, sourceLastSync,
}: { userId: string; username: string; sourceId?: string; categoryName?: string; sourceLastSync?: number | null }) {
    'use cache';
    cacheLife('seconds');
    cacheTag(`feed:${userId}`);

    const result = await searchAllForUser(userId, '', {
        cat: categoryName,
        limit: 100,
        sourceId,
        // FeedList never reads estimatedTotalHits — skip the count(*) OVER()
        // window, which otherwise forces Postgres to aggregate every feed
        // item the user owns before it can sort + LIMIT.
        includeTotalCount: false,
    });

    const items = result.hits.map(hit => ({
        id: hit.id,
        title: hit.title,
        link: hit.link,
        content: hit.content ?? null,
        pubDate: hit.pubDate ? new Date(hit.pubDate) : null,
        read: hit.read ?? false,
        savedAt: hit.savedAt ? new Date(hit.savedAt) : null,
        source: { title: hit.sourceTitle ?? null, slug: hit.sourceSlug ?? null },
    }));

    if (items.length === 0) {
        const synced = sourceId != null && sourceLastSync != null;
        return (
            <section className="p-8">
                <p className="label-system italic text-foreground">
                    {synced ? 'NULL_SET // NOTHING HERE RIGHT NOW' : 'NULL_SET // SYNC_REQUIRED'}
                </p>
                {synced && (
                    <p className="label-system not-italic text-foreground/55 mt-2">
                        Unsaved items drop off ~90 days after they leave the source feed. Save anything you want to keep.
                    </p>
                )}
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
                                username={username}
                            />
                        </Fragment>
                    );
                })}
            </div>
        </section>
    );
}

export default async function FeedList({ sourceId, categoryName, sourceLastSync }: FeedListProps) {
    const session = await getServerSession(authOptions);
    if (!session) return null;
    return <CachedFeedContent
        userId={session.user.id}
        username={session.user.username}
        sourceId={sourceId}
        categoryName={categoryName}
        sourceLastSync={sourceLastSync}
    />;
}
