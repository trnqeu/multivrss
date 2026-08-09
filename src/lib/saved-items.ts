import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import type { ArticleVM, LinkVM } from "@/app/u/[username]/saved/SavedView";

export const SAVED_PAGE_SIZE = 50;

export interface SavedItemsPage {
    articles: ArticleVM[];
    links: LinkVM[];
    nextFeedOffset: number;
    nextLinkOffset: number;
    hasMore: boolean;
}

interface FetchSavedItemsOptions {
    tag?: string;
    q?: string;
    feedOffset?: number;
    linkOffset?: number;
    limit?: number;
}

// Merges two independently-paginated, date-sorted Prisma queries (FeedItem.savedAt,
// SavedLink.createdAt) into one chronological page. Fetching `limit` not-yet-returned
// candidates from EACH source is always enough to produce a correct top-`limit` merged
// result (standard k-way merge argument), so this stays on plain Prisma findMany/skip/take
// — no raw SQL UNION needed. Advancing each source's offset by only what it actually
// contributed (not by `limit`) keeps this correct across repeated calls.
export async function fetchSavedItemsPage(userId: string, opts: FetchSavedItemsOptions = {}): Promise<SavedItemsPage> {
    const limit = opts.limit ?? SAVED_PAGE_SIZE;
    const feedOffset = opts.feedOffset ?? 0;
    const linkOffset = opts.linkOffset ?? 0;
    const tag = opts.tag?.trim() || undefined;
    const q = opts.q?.trim() || undefined;

    const feedWhere: Prisma.FeedItemWhereInput = {
        savedAt: { not: null },
        source: { category: { userId } },
        ...(tag ? { tags: { some: { tag: { name: tag } } } } : {}),
        ...(q ? {
            OR: [
                { title: { contains: q, mode: 'insensitive' } },
                { content: { contains: q, mode: 'insensitive' } },
            ],
        } : {}),
    };

    const linkWhere: Prisma.SavedLinkWhereInput = {
        userId,
        ...(tag ? { tags: { some: { tag: { name: tag } } } } : {}),
        ...(q ? {
            OR: [
                { title: { contains: q, mode: 'insensitive' } },
                { description: { contains: q, mode: 'insensitive' } },
            ],
        } : {}),
    };

    const [feedCandidates, linkCandidates] = await Promise.all([
        prisma.feedItem.findMany({
            where: feedWhere,
            include: {
                source: { select: { title: true } },
                tags: { include: { tag: { select: { id: true, name: true } } } },
            },
            orderBy: { savedAt: 'desc' },
            skip: feedOffset,
            take: limit,
        }),
        prisma.savedLink.findMany({
            where: linkWhere,
            include: { tags: { include: { tag: { select: { id: true, name: true } } } } },
            orderBy: { createdAt: 'desc' },
            skip: linkOffset,
            take: limit,
        }),
    ]);

    type Candidate =
        | { kind: 'article'; date: Date; data: (typeof feedCandidates)[number] }
        | { kind: 'link'; date: Date; data: (typeof linkCandidates)[number] };

    const merged: Candidate[] = [
        ...feedCandidates.map(f => ({ kind: 'article' as const, date: f.savedAt!, data: f })),
        ...linkCandidates.map(l => ({ kind: 'link' as const, date: l.createdAt, data: l })),
    ]
        .sort((a, b) => b.date.getTime() - a.date.getTime())
        .slice(0, limit);

    const consumedFeed = merged.filter(m => m.kind === 'article').length;
    const consumedLink = merged.filter(m => m.kind === 'link').length;

    const feedExhausted = feedCandidates.length < limit;
    const linkExhausted = linkCandidates.length < limit;
    const feedLeftoverInBatch = feedCandidates.length > consumedFeed;
    const linkLeftoverInBatch = linkCandidates.length > consumedLink;
    const hasMore = feedLeftoverInBatch || linkLeftoverInBatch || !feedExhausted || !linkExhausted;

    const articles: ArticleVM[] = merged
        .filter((m): m is Extract<Candidate, { kind: 'article' }> => m.kind === 'article')
        .map(({ data }) => ({
            id: data.id,
            title: data.title,
            link: data.link,
            content: data.content,
            savedAt: data.savedAt!,
            sourceTitle: data.source.title,
            tags: data.tags.map(jt => ({ id: jt.tag.id, name: jt.tag.name })),
        }));

    const links: LinkVM[] = merged
        .filter((m): m is Extract<Candidate, { kind: 'link' }> => m.kind === 'link')
        .map(({ data }) => ({
            id: data.id,
            title: data.title,
            url: data.url,
            description: data.description,
            createdAt: data.createdAt,
            tags: data.tags.map(jt => ({ id: jt.tag.id, name: jt.tag.name })),
        }));

    return {
        articles,
        links,
        nextFeedOffset: feedOffset + consumedFeed,
        nextLinkOffset: linkOffset + consumedLink,
        hasMore,
    };
}
