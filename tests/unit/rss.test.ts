import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '@/lib/prisma';
import { meili } from '@/lib/meili';

vi.mock('@/lib/prisma', () => ({
    prisma: {
        feedSource: {
            findUnique: vi.fn(),
            update: vi.fn(),
        },
        feedItem: {
            findMany: vi.fn(),
            createManyAndReturn: vi.fn(),
            update: vi.fn(),
        },
    },
}));

vi.mock('@/lib/meili', () => ({
    meili: {
        index: vi.fn(),
    },
}));

const mockParseURL = vi.fn();
vi.mock('rss-parser', () => ({
    default: function() { return { parseURL: mockParseURL }; },
}));

const mockedFindUnique = vi.mocked(prisma.feedSource.findUnique);
const mockedUpdate = vi.mocked(prisma.feedSource.update);
const mockedFindMany = vi.mocked(prisma.feedItem.findMany);
const mockedCreateManyAndReturn = vi.mocked(prisma.feedItem.createManyAndReturn);
const mockedUpdateItem = vi.mocked(prisma.feedItem.update);
const mockedMeiliIndex = vi.mocked(meili.index);

describe('syncFeed', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('throws when source is not found', async () => {
        mockedFindUnique.mockResolvedValue(null);

        const { syncFeed } = await import('@/lib/rss');
        await expect(syncFeed('nonexistent')).rejects.toThrow('Source not found');
    });

    it('creates new items and syncs delta to Meilisearch', async () => {
        const source = { id: 'src_1', url: 'https://example.com/feed', title: 'Example', category: { id: 'cat_1', name: 'TECH' } };
        mockedFindUnique.mockResolvedValue(source);
        mockedFindMany.mockResolvedValue([]);

        mockParseURL.mockResolvedValue({
            title: 'Example',
            items: [
                { guid: 'ext_1', title: 'Post 1', link: 'https://example.com/1', contentSnippet: 'Content 1', isoDate: '2025-01-01T00:00:00Z' },
                { guid: 'ext_2', title: 'Post 2', link: 'https://example.com/2', contentSnippet: 'Content 2', isoDate: null },
            ],
        });

        const createdItems = [
            { id: 'item_1', externalId: 'ext_1', title: 'Post 1', content: 'Content 1', link: 'https://example.com/1', pubDate: new Date('2025-01-01T00:00:00Z'), sourceId: 'src_1' },
            { id: 'item_2', externalId: 'ext_2', title: 'Post 2', content: 'Content 2', link: 'https://example.com/2', pubDate: null, sourceId: 'src_1' },
        ];
        mockedCreateManyAndReturn.mockResolvedValue(createdItems);

        const addDocuments = vi.fn().mockResolvedValue({ taskUid: 42 });
        mockedMeiliIndex.mockReturnValue({ addDocuments } as any);

        const { syncFeed } = await import('@/lib/rss');
        const result = await syncFeed('src_1');

        expect(result).toEqual(createdItems);
        expect(mockedCreateManyAndReturn).toHaveBeenCalledWith({
            data: [
                expect.objectContaining({ externalId: 'ext_1', title: 'Post 1' }),
                expect.objectContaining({ externalId: 'ext_2', title: 'Post 2' }),
            ],
        });

        // Only new items sent to Meili (delta)
        expect(addDocuments).toHaveBeenCalledWith(
            [
                expect.objectContaining({ id: 'item_1', title: 'Post 1', read: false }),
                expect.objectContaining({ id: 'item_2', title: 'Post 2', read: false }),
            ],
            { primaryKey: 'id' }
        );

        expect(mockedUpdate).toHaveBeenCalledWith({
            where: { id: 'src_1' },
            data: expect.objectContaining({ lastSync: expect.any(Date), title: 'Example' }),
        });
    });

    it('does not send unchanged items to Meilisearch', async () => {
        const source = { id: 'src_1', url: 'https://example.com/feed', title: 'Example', category: { id: 'cat_1', name: 'TECH' } };
        mockedFindUnique.mockResolvedValue(source);

        const existingItem = { id: 'item_1', externalId: 'ext_1', title: 'Post 1', content: 'Content 1', link: 'https://example.com/1', pubDate: new Date('2025-01-01T00:00:00Z'), sourceId: 'src_1' };
        mockedFindMany.mockResolvedValue([existingItem]);

        mockParseURL.mockResolvedValue({
            title: 'Example',
            items: [
                { guid: 'ext_1', title: 'Post 1', link: 'https://example.com/1', contentSnippet: 'Content 1' },
            ],
        });

        const addDocuments = vi.fn().mockResolvedValue({ taskUid: 42 });
        mockedMeiliIndex.mockReturnValue({ addDocuments } as any);

        const { syncFeed } = await import('@/lib/rss');
        const result = await syncFeed('src_1');

        expect(result).toEqual([]);
        expect(mockedCreateManyAndReturn).not.toHaveBeenCalled();
        expect(addDocuments).not.toHaveBeenCalled();
    });

    it('updates items with changed title or content and syncs to Meili', async () => {
        const source = { id: 'src_1', url: 'https://example.com/feed', title: 'Example', category: { id: 'cat_1', name: 'TECH' } };
        mockedFindUnique.mockResolvedValue(source);

        const existingItem = { id: 'item_1', externalId: 'ext_1', title: 'Old Title', content: 'Old Content', link: 'https://example.com/1', pubDate: new Date('2025-01-01T00:00:00Z'), sourceId: 'src_1' };
        mockedFindMany.mockResolvedValue([existingItem]);

        mockParseURL.mockResolvedValue({
            title: 'Example',
            items: [
                { guid: 'ext_1', title: 'New Title', link: 'https://example.com/1', contentSnippet: 'New Content' },
            ],
        });

        const addDocuments = vi.fn().mockResolvedValue({ taskUid: 42 });
        mockedMeiliIndex.mockReturnValue({ addDocuments } as any);

        const { syncFeed } = await import('@/lib/rss');
        const result = await syncFeed('src_1');

        expect(result).toEqual([]);
        expect(mockedUpdateItem).toHaveBeenCalledWith({
            where: { sourceId_externalId: { sourceId: 'src_1', externalId: 'ext_1' } },
            data: { title: 'New Title', content: 'New Content' },
        });

        // Updated items sent to Meili
        expect(addDocuments).toHaveBeenCalledWith(
            [expect.objectContaining({ id: 'item_1', title: 'New Title', content: 'New Content' })],
            { primaryKey: 'id' }
        );
    });

    it('uses prefetched feed when provided', async () => {
        const source = { id: 'src_1', url: 'https://example.com/feed', title: 'Example', category: { id: 'cat_1', name: 'TECH' } };
        mockedFindUnique.mockResolvedValue(source);
        mockedFindMany.mockResolvedValue([]);

        const prefetched = {
            title: 'Example',
            items: [
                { guid: 'ext_1', title: 'Post 1', link: 'https://example.com/1', contentSnippet: 'Content 1', isoDate: '2025-01-01T00:00:00Z' },
            ],
        };

        const createdItems = [{ id: 'item_1', externalId: 'ext_1', title: 'Post 1', content: 'Content 1', link: 'https://example.com/1', pubDate: new Date('2025-01-01T00:00:00Z'), sourceId: 'src_1' }];
        mockedCreateManyAndReturn.mockResolvedValue(createdItems);

        const addDocuments = vi.fn().mockResolvedValue({ taskUid: 42 });
        mockedMeiliIndex.mockReturnValue({ addDocuments } as any);

        const { syncFeed } = await import('@/lib/rss');
        await syncFeed('src_1', prefetched);

        expect(mockParseURL).not.toHaveBeenCalled();
    });
});
