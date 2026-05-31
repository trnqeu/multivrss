import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '@/lib/prisma';
import { meili } from '@/lib/meili';
import { searchFeedItemsForUser } from '@/lib/search';

vi.mock('next/cache', () => ({
    cacheLife: vi.fn(),
    cacheTag: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
    prisma: {
        feedSource: {
            findMany: vi.fn(),
        },
    },
}));

vi.mock('@/lib/meili', () => ({
    meili: {
        index: vi.fn(),
    },
    HIGHLIGHT_PRE: '<mark>',
    HIGHLIGHT_POST: '</mark>',
}));

const mockedFindMany = vi.mocked(prisma.feedSource.findMany);
const mockedMeiliIndex = vi.mocked(meili.index);

describe('searchFeedItemsForUser', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns an empty result set when the user has no sources', async () => {
        mockedFindMany.mockResolvedValue([]);

        const result = await searchFeedItemsForUser('user_1', 'rss');

        expect(result.hits).toEqual([]);
        expect(mockedFindMany).toHaveBeenCalledWith({
            where: { category: { userId: 'user_1' } },
            select: { id: true, category: { select: { name: true } } },
        });
        expect(mockedMeiliIndex).not.toHaveBeenCalled();
    });

    it('searches Meilisearch with only user-owned source IDs', async () => {
        const hits = [
            { id: 'item_1', link: 'https://example.com/post', title: 'Example post', pubDate: 1700000000000 },
        ];
        const search = vi.fn().mockResolvedValue({
            hits,
            estimatedTotalHits: 1,
            processingTimeMs: 5,
            facetDistribution: {},
        });

        mockedFindMany.mockResolvedValue([
            { id: 'source_1', category: { name: 'TECH' } },
            { id: 'source_2', category: { name: 'NEWS' } },
        ]);
        mockedMeiliIndex.mockReturnValue({ search } as ReturnType<typeof meili.index>);

        const result = await searchFeedItemsForUser('user_1', 'rss');

        expect(mockedFindMany).toHaveBeenCalledWith({
            where: { category: { userId: 'user_1' } },
            select: { id: true, category: { select: { name: true } } },
        });
        expect(mockedMeiliIndex).toHaveBeenCalledWith('items');
        expect(search).toHaveBeenCalledWith('rss', {
            limit: 30,
            offset: 0,
            filter: ['(sourceId = "source_1" OR sourceId = "source_2")'],
            sort: ['pubDate:desc'],
            facets: ['categoryName', 'sourceTitle'],
            attributesToHighlight: ['title', 'content'],
            attributesToCrop: ['content'],
            cropLength: 100,
            highlightPreTag: '<mark>',
            highlightPostTag: '</mark>',
        });
        expect(result.hits).toEqual(hits);
        expect(result.estimatedTotalHits).toBe(1);
    });

    it('filters by category when valid', async () => {
        mockedFindMany.mockResolvedValue([
            { id: 'source_1', category: { name: 'TECH' } },
            { id: 'source_2', category: { name: 'NEWS' } },
        ]);

        const search = vi.fn().mockResolvedValue({ hits: [], estimatedTotalHits: 0, processingTimeMs: 0, facetDistribution: null });
        mockedMeiliIndex.mockReturnValue({ search } as any);

        await searchFeedItemsForUser('user_1', 'rss', 'TECH');

        expect(search).toHaveBeenCalledWith('rss', expect.objectContaining({
            filter: ['(sourceId = "source_1" OR sourceId = "source_2")', 'categoryName = "TECH"'],
        }));
    });

    it('ignores invalid category name', async () => {
        mockedFindMany.mockResolvedValue([
            { id: 'source_1', category: { name: 'TECH' } },
        ]);

        const search = vi.fn().mockResolvedValue({ hits: [], estimatedTotalHits: 0, processingTimeMs: 0, facetDistribution: null });
        mockedMeiliIndex.mockReturnValue({ search } as any);

        await searchFeedItemsForUser('user_1', 'rss', 'INVALID');

        expect(search).toHaveBeenCalledWith('rss', expect.objectContaining({
            filter: ['(sourceId = "source_1")'],
        }));
    });

    it('filters by read status', async () => {
        mockedFindMany.mockResolvedValue([
            { id: 'source_1', category: { name: 'TECH' } },
        ]);

        const search = vi.fn().mockResolvedValue({ hits: [], estimatedTotalHits: 0, processingTimeMs: 0, facetDistribution: null });
        mockedMeiliIndex.mockReturnValue({ search } as any);

        await searchFeedItemsForUser('user_1', 'rss', undefined, undefined, 30, 0, undefined, 'unread');

        expect(search).toHaveBeenCalledWith('rss', expect.objectContaining({
            filter: ['(sourceId = "source_1")', 'read = false'],
        }));
    });
});
