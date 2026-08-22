'use server';

import { prisma } from "@/lib/prisma";
import { revalidatePath, updateTag } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import type { FrontPageItem } from "@/lib/frontpage";
import type { ActionState } from "./types";
import { frontpageTag } from "./shared";
import { getReadableArticle, type ReaderResult } from "@/lib/reader";
import { checkRateLimit } from "@/lib/rate-limit";
import { getHost } from "@/lib/utils";

export async function markAsRead(itemId: string): Promise<ActionState> {
    const session = await getServerSession(authOptions);
    if (!session) return { success: false, message: "Unauthorized" };
    try {
        await prisma.feedItem.update({
            where: {
                id: itemId,
                source: { category: { userId: session.user.id } }
            },
            data: { read: true }
        });
        updateTag(`feed:${session.user.id}`);
        updateTag(frontpageTag(session.user.id));
        return { success: true, message: "Marked as read." }
    } catch {
        return { success: false, message: "Failed to mark as read." }
    }
}

export async function markAsUnread(itemId: string): Promise<ActionState> {
    const session = await getServerSession(authOptions);
    if (!session) return { success: false, message: "Unauthorized" };
    try {
        await prisma.feedItem.update({
            where: {
                id: itemId,
                source: { category: { userId: session.user.id } }
            },
            data: { read: false }
        });
        updateTag(`feed:${session.user.id}`);
        updateTag(frontpageTag(session.user.id));
        return { success: true, message: "Marked as unread." }
    } catch {
        return { success: false, message: "Failed to mark as unread." }
    }
}

export async function saveFeedItem(itemId: string): Promise<ActionState> {
    const session = await getServerSession(authOptions);
    if (!session) return { success: false, message: "Unauthorized" };

    try {
        const now = new Date();
        await prisma.feedItem.update({
            where: {
                id: itemId,
                source: { category: { userId: session.user.id } }
            },
            data: { savedAt: now }
        });
        updateTag(`feed:${session.user.id}`);
        updateTag(frontpageTag(session.user.id));
        revalidatePath(`/u/${session.user.username}/saved`);
        return { success: true };
    } catch {
        return { success: false, message: "Failed to save item." };
    }
}

export async function unsaveFeedItem(itemId: string): Promise<ActionState> {
    const session = await getServerSession(authOptions);
    if (!session) return { success: false, message: "Unauthorized" };

    try {
        await prisma.feedItem.update({
            where: {
                id: itemId,
                source: { category: { userId: session.user.id } }
            },
            data: { savedAt: null }
        });
        updateTag(`feed:${session.user.id}`);
        updateTag(frontpageTag(session.user.id));
        revalidatePath(`/u/${session.user.username}/saved`);
        return { success: true };
    } catch {
        return { success: false, message: "Failed to unsave item." };
    }
}

export async function updateFeedItemDetails(itemId: string, title: string, tagIds: string[]): Promise<ActionState> {
    const session = await getServerSession(authOptions);
    if (!session) return { success: false, message: "Unauthorized" };

    const trimmedTitle = title.trim();
    if (!trimmedTitle || trimmedTitle.length > 300) {
        return { success: false, message: "Title must be 1-300 characters." };
    }

    try {
        const item = await prisma.feedItem.findFirst({
            where: { id: itemId, source: { category: { userId: session.user.id } } },
            select: { id: true },
        });
        if (!item) return { success: false, message: "Item not found." };

        const validTags = tagIds.length > 0
            ? await prisma.tag.findMany({
                where: { id: { in: tagIds }, userId: session.user.id },
                select: { id: true },
            })
            : [];
        const validTagIds = validTags.map(t => t.id);

        await prisma.$transaction(async (tx) => {
            await tx.feedItem.update({ where: { id: itemId }, data: { title: trimmedTitle } });
            await tx.feedItemTag.deleteMany({ where: { feedItemId: itemId } });
            if (validTagIds.length > 0) {
                await tx.feedItemTag.createMany({
                    data: validTagIds.map(tagId => ({ feedItemId: itemId, tagId })),
                });
            }
        });

        updateTag(`feed:${session.user.id}`);
        revalidatePath(`/u/${session.user.username}/saved`);
        return { success: true };
    } catch {
        return { success: false, message: "Failed to update item." };
    }
}

// Stamps items as shown so getFrontPage()'s selection queries exclude them
// from future days — keeps the "shown" write out of the cached data-fetch path.
async function stampFrontPageShown(itemIds: string[], userId: string) {
    if (itemIds.length === 0) return;
    const now = new Date();
    await prisma.feedItem.updateMany({
        where: { id: { in: itemIds }, source: { category: { userId } } },
        data: { frontPageShownAt: now },
    });
}

export async function markFrontPageShown(itemIds: string[]): Promise<ActionState> {
    const session = await getServerSession(authOptions);
    if (!session) return { success: false, message: "Unauthorized" };
    try {
        await stampFrontPageShown(itemIds, session.user.id);
        return { success: true };
    } catch {
        return { success: false, message: "Failed to update front page state." };
    }
}

// Batched counterpart to markAsRead, used by useReadQueue to collapse many
// per-item reads into one DB write + one cache invalidation per flush.
// Intentionally skips updateTag(`feed:${userId}`): that cache already has a
// short cacheLife('seconds') and the client shows read state optimistically,
// so eager invalidation there is redundant. frontpageTag still needs eager
// invalidation since it has cacheLife('days').
export async function markManyRead(itemIds: string[]): Promise<ActionState> {
    const session = await getServerSession(authOptions);
    if (!session) return { success: false, message: "Unauthorized" };
    if (itemIds.length === 0) return { success: true };
    try {
        await prisma.feedItem.updateMany({
            where: { id: { in: itemIds }, source: { category: { userId: session.user.id } } },
            data: { read: true },
        });
        updateTag(frontpageTag(session.user.id));
        return { success: true, message: "Marked as read." };
    } catch {
        return { success: false, message: "Failed to mark as read." };
    }
}

export async function dismissFrontPageItem(
    itemId: string,
    categoryName: string,
    excludeIds: string[],
): Promise<{ success: boolean; replacement?: FrontPageItem }> {
    const session = await getServerSession(authOptions);
    if (!session) return { success: false };

    try {
        await prisma.feedItem.update({
            where: { id: itemId, source: { category: { userId: session.user.id } } },
            data: { read: true },
        });
        updateTag(`feed:${session.user.id}`);
        updateTag(frontpageTag(session.user.id));

        const sources = await prisma.feedSource.findMany({
            where: { category: { userId: session.user.id, name: categoryName } },
            select: { id: true, title: true },
        });
        const sourceIds = sources.map(s => s.id);
        if (sourceIds.length === 0) return { success: true };

        const excluded = [...new Set([...excludeIds, itemId])];
        const candidates = await prisma.feedItem.findMany({
            where: {
                sourceId: { in: sourceIds },
                read: false,
                savedAt: null,
                id: { notIn: excluded },
            },
            take: 10,
            orderBy: { pubDate: 'desc' },
            select: { id: true, title: true, link: true, content: true, pubDate: true, sourceId: true },
        });

        if (candidates.length === 0) return { success: true };

        const pick = candidates[Math.floor(Math.random() * candidates.length)];
        const sourceTitle = sources.find(s => s.id === pick.sourceId)?.title ?? '';
        await stampFrontPageShown([pick.id], session.user.id);

        const replacement: FrontPageItem = {
            id: pick.id,
            link: pick.link,
            title: pick.title,
            content: pick.content ?? undefined,
            pubDate: pick.pubDate ? pick.pubDate.getTime() : null,
            sourceTitle: sourceTitle || undefined,
            categoryName,
            read: false,
            savedAt: null,
            reasonType: 'source',
            reason: `Fresh from ${sourceTitle}`,
            affinity: 40,
        };

        return { success: true, replacement };
    } catch {
        return { success: false };
    }
}

// Loads the next batch of a category's unread items directly into the Front
// Page section (in-place "load more" — see Section in FrontPage.tsx).
// Deliberately mirrors dismissFrontPageItem's candidate query (read:false,
// savedAt:null, id notIn excludeIds, orderBy pubDate desc) rather than Engine
// A's "fresh" fill query in getFrontPage(): load-more's job is to exhaust the
// category's true remaining unread pool (matching River semantics for that
// category), not stay within algorithmically-fresh bounds — so no
// frontPageShownAt filter and no shuffle, unlike the daily fill step.
//
// Does NOT call updateTag(frontpageTag(userId)): today's cached edition is
// meant to stay fixed once generated (see getFrontPage's cacheLife('days')).
// Invalidating here would force a recompute on the user's next reload,
// re-running Engine A/the fill-shuffle and changing which items make up
// "today's edition" mid-day. Contrast with dismissFrontPageItem, which DOES
// invalidate — a dismiss genuinely swaps that item's slot and should be
// reflected on reload.
export async function expandFrontPageSection(
    categoryName: string,
    excludeIds: string[],
    batchSize: number,
): Promise<{ success: boolean; items: FrontPageItem[]; remaining: number }> {
    const session = await getServerSession(authOptions);
    if (!session) return { success: false, items: [], remaining: 0 };

    const take = Math.min(Math.max(Math.trunc(batchSize) || 0, 0), 50);

    try {
        const sources = await prisma.feedSource.findMany({
            where: { category: { userId: session.user.id, name: categoryName } },
            select: { id: true, title: true, slug: true },
        });
        const sourceIds = sources.map(s => s.id);
        if (sourceIds.length === 0) return { success: true, items: [], remaining: 0 };

        const candidates = await prisma.feedItem.findMany({
            where: {
                sourceId: { in: sourceIds },
                read: false,
                savedAt: null,
                id: { notIn: excludeIds },
            },
            orderBy: { pubDate: 'desc' },
            take,
            select: { id: true, title: true, link: true, content: true, pubDate: true, sourceId: true },
        });

        if (candidates.length > 0) {
            await stampFrontPageShown(candidates.map(c => c.id), session.user.id);
        }

        const sourceTitle = new Map(sources.map(s => [s.id, s.title ?? '']));
        const sourceSlug = new Map(sources.map(s => [s.id, s.slug]));
        const items: FrontPageItem[] = candidates.map(c => ({
            id: c.id,
            link: c.link,
            title: c.title,
            content: c.content ?? undefined,
            pubDate: c.pubDate ? c.pubDate.getTime() : null,
            sourceTitle: sourceTitle.get(c.sourceId) || undefined,
            sourceSlug: sourceSlug.get(c.sourceId),
            categoryName,
            read: false,
            savedAt: null,
            reasonType: 'source',
            reason: `Fresh from ${sourceTitle.get(c.sourceId) || 'your feed'}`,
            affinity: 40,
        }));

        const remaining = await prisma.feedItem.count({
            where: {
                sourceId: { in: sourceIds },
                read: false,
                savedAt: null,
                id: { notIn: [...excludeIds, ...items.map(i => i.id)] },
            },
        });

        return { success: true, items, remaining };
    } catch {
        return { success: false, items: [], remaining: 0 };
    }
}

export type ReaderItemKind = 'feedItem' | 'savedLink';

export interface ReaderPageItem {
    id: string;
    title: string;
    link: string;
    sourceTitle: string | null;
    savedAt: Date | null;
    tags: { id: string; name: string }[];
    kind: ReaderItemKind;
}

export type ReaderPageData =
    | { status: 'not-found' }
    | { status: 'rate-limited'; item: ReaderPageItem }
    | { status: 'ready'; item: ReaderPageItem; result: ReaderResult };

// Called directly from the read/[itemId] Server Component (navigation triggers
// it, not a client event), same shape as getCategories() in categories.ts.
// `kind` distinguishes a feed-sourced FeedItem from a manually-saved SavedLink
// (e.g. saved from mobile via the share target) — both can use Reader Mode,
// but they live in different tables with different ownership chains.
export async function getReaderArticle(itemId: string, kind: ReaderItemKind = 'feedItem'): Promise<ReaderPageData> {
    const session = await getServerSession(authOptions);
    if (!session) return { status: 'not-found' };

    if (kind === 'savedLink') {
        const link = await prisma.savedLink.findFirst({
            where: { id: itemId, userId: session.user.id },
            select: {
                id: true,
                title: true,
                url: true,
                createdAt: true,
                tags: { select: { tag: { select: { id: true, name: true } } } },
            },
        });
        if (!link) return { status: 'not-found' };

        const pageItem: ReaderPageItem = {
            id: link.id,
            title: link.title ?? getHost(link.url),
            link: link.url,
            sourceTitle: getHost(link.url),
            savedAt: link.createdAt,
            tags: link.tags.map(t => t.tag),
            kind: 'savedLink',
        };

        const withinLimit = await checkRateLimit(`reader:${session.user.id}`, { maxRequests: 20, windowMs: 60_000 });
        if (!withinLimit) return { status: 'rate-limited', item: pageItem };

        return { status: 'ready', item: pageItem, result: await getReadableArticle(link.url) };
    }

    const item = await prisma.feedItem.findFirst({
        where: { id: itemId, source: { category: { userId: session.user.id } } },
        select: {
            id: true,
            title: true,
            link: true,
            savedAt: true,
            source: { select: { title: true } },
            tags: { select: { tag: { select: { id: true, name: true } } } },
        },
    });
    if (!item) return { status: 'not-found' };

    const pageItem: ReaderPageItem = {
        id: item.id,
        title: item.title,
        link: item.link,
        sourceTitle: item.source.title,
        savedAt: item.savedAt,
        tags: item.tags.map(t => t.tag),
        kind: 'feedItem',
    };

    const withinLimit = await checkRateLimit(`reader:${session.user.id}`, { maxRequests: 20, windowMs: 60_000 });
    if (!withinLimit) return { status: 'rate-limited', item: pageItem };

    return { status: 'ready', item: pageItem, result: await getReadableArticle(item.link) };
}
