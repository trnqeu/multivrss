'use server';

import { prisma } from "@/lib/prisma";
import { meili } from "@/lib/meili";
import { revalidatePath, updateTag } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import type { FrontPageItem } from "@/lib/frontpage";
import type { ActionState } from "./types";
import { frontpageTag } from "./shared";

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
        await meili.index('items').updateDocuments([{ id: itemId, read: true }]);
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
        await meili.index('items').updateDocuments([{ id: itemId, read: false }]);
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
        await meili.index('items').updateDocuments([{ id: itemId, savedAt: now.getTime() }]);
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
        await meili.index('items').updateDocuments([{ id: itemId, savedAt: null }]);
        updateTag(`feed:${session.user.id}`);
        updateTag(frontpageTag(session.user.id));
        revalidatePath(`/u/${session.user.username}/saved`);
        return { success: true };
    } catch {
        return { success: false, message: "Failed to unsave item." };
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
        const dismissed = await prisma.feedItem.update({
            where: { id: itemId, source: { category: { userId: session.user.id } } },
            data: { read: true },
            select: { id: true, sourceId: true },
        });
        await meili.index('items').updateDocuments([{ id: dismissed.id, read: true }]);
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
