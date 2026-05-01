import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '@/lib/prisma';
import { meili } from '@/lib/meili';
import { searchFeedItemsForUser } from '@/lib/search';

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
}));

const mockedFindMany = vi.mocked(prisma.feedSource.findMany);
const mockedMeiliIndex = vi.mocked(meili.index);

describe('searchFeedItemsForUser', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns an empty result set when the user has no sources', async () => {
        mockedFindMany.mockResolvedValue([]);

        const hits = await searchFeedItemsForUser('user_1', 'rss');

        expect(hits).toEqual([]);
        expect(mockedFindMany).toHaveBeenCalledWith({
            where: { category: { userId: 'user_1' } },
            select: { id: true },
        });
        expect(mockedMeiliIndex).not.toHaveBeenCalled();
    });

    it('searches Meilisearch with only user-owned source IDs', async () => {
        const hits = [
            {
                id: 'item_1',
                link: 'https://example.com/post',
                title: 'Example post',
                pubDate: 1700000000000,
            },
        ];
        const search = vi.fn().mockResolvedValue({ hits });

        mockedFindMany.mockResolvedValue([{ id: 'source_1' }, { id: 'source_2' }]);
        mockedMeiliIndex.mockReturnValue({ search } as ReturnType<typeof meili.index>);

        const results = await searchFeedItemsForUser('user_1', 'rss');

        expect(mockedFindMany).toHaveBeenCalledWith({
            where: { category: { userId: 'user_1' } },
            select: { id: true },
        });
        expect(mockedMeiliIndex).toHaveBeenCalledWith('items');
        expect(search).toHaveBeenCalledWith('rss', {
            limit: 50,
            filter: 'sourceId = "source_1" OR sourceId = "source_2"',
            sort: ['pubDate:desc'],
        });
        expect(results).toEqual(hits);
    });
});
