import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EventEmitter } from 'events';
import { prisma } from '@/lib/prisma';

const mockTransaction = vi.hoisted(() => vi.fn((updates: any) => Promise.all(updates)));

vi.mock('@/lib/prisma', () => ({
    prisma: {
        $transaction: mockTransaction,
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

// syncFeed fetches the feed body over HTTP(S) itself (via safeFetchText, the
// SSRF-guarded fetcher) and only hands the raw XML to rss-parser's
// parseString() — so parseString is the seam to mock, and the network layer
// (https.get) needs a fake transport so tests never hit the real network.
const mockParseString = vi.fn();
vi.mock('rss-parser', () => ({
    default: function() { return { parseString: mockParseString }; },
}));

function fakeHttpsGet(_url: unknown, _options: unknown, callback: (res: EventEmitter & { statusCode: number; headers: Record<string, string>; setEncoding: () => void }) => void) {
    const res = Object.assign(new EventEmitter(), {
        statusCode: 200,
        headers: { 'content-type': 'application/rss+xml' },
        setEncoding: () => {},
    });
    const req = Object.assign(new EventEmitter(), { destroy: vi.fn() });
    queueMicrotask(() => {
        callback(res);
        queueMicrotask(() => {
            res.emit('data', '<rss version="2.0"><channel></channel></rss>');
            res.emit('end');
        });
    });
    return req;
}

vi.mock('https', () => ({
    default: { get: vi.fn(fakeHttpsGet) },
}));

const mockedFindUnique = vi.mocked(prisma.feedSource.findUnique);
const mockedUpdate = vi.mocked(prisma.feedSource.update);
const mockedFindMany = vi.mocked(prisma.feedItem.findMany);
const mockedCreateManyAndReturn = vi.mocked(prisma.feedItem.createManyAndReturn);
const mockedUpdateItem = vi.mocked(prisma.feedItem.update);

describe('syncFeed', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('throws when source is not found', async () => {
        mockedFindUnique.mockResolvedValue(null);

        const { syncFeed } = await import('@/lib/rss');
        await expect(syncFeed('nonexistent')).rejects.toThrow('Source not found');
    });

    it('creates new items from the parsed feed', async () => {
        const source = { id: 'src_1', url: 'https://example.com/feed', title: 'Example' };
        mockedFindUnique.mockResolvedValue(source);
        mockedFindMany.mockResolvedValue([]);

        mockParseString.mockResolvedValue({
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

        const { syncFeed } = await import('@/lib/rss');
        const result = await syncFeed('src_1');

        expect(result).toEqual(createdItems);
        expect(mockedCreateManyAndReturn).toHaveBeenCalledWith({
            data: [
                expect.objectContaining({ externalId: 'ext_1', title: 'Post 1' }),
                expect.objectContaining({ externalId: 'ext_2', title: 'Post 2' }),
            ],
        });

        // Title is never overwritten by a sync — set once at discovery/creation
        // and preserved across re-syncs so manual renames don't get clobbered.
        expect(mockedUpdate).toHaveBeenCalledWith({
            where: { id: 'src_1' },
            data: { lastSync: expect.any(Date) },
        });
    });

    it('does not create or update anything for unchanged items', async () => {
        const source = { id: 'src_1', url: 'https://example.com/feed', title: 'Example' };
        mockedFindUnique.mockResolvedValue(source);

        const existingItem = { id: 'item_1', externalId: 'ext_1', title: 'Post 1', content: 'Content 1', link: 'https://example.com/1', pubDate: new Date('2025-01-01T00:00:00Z'), sourceId: 'src_1' };
        mockedFindMany.mockResolvedValue([existingItem]);

        mockParseString.mockResolvedValue({
            title: 'Example',
            items: [
                { guid: 'ext_1', title: 'Post 1', link: 'https://example.com/1', contentSnippet: 'Content 1' },
            ],
        });

        const { syncFeed } = await import('@/lib/rss');
        const result = await syncFeed('src_1');

        expect(result).toEqual([]);
        expect(mockedCreateManyAndReturn).not.toHaveBeenCalled();
        expect(mockedUpdateItem).not.toHaveBeenCalled();
    });

    it('updates items with changed title or content', async () => {
        const source = { id: 'src_1', url: 'https://example.com/feed', title: 'Example' };
        mockedFindUnique.mockResolvedValue(source);

        const existingItem = { id: 'item_1', externalId: 'ext_1', title: 'Old Title', content: 'Old Content', link: 'https://example.com/1', pubDate: new Date('2025-01-01T00:00:00Z'), sourceId: 'src_1' };
        mockedFindMany.mockResolvedValue([existingItem]);

        mockParseString.mockResolvedValue({
            title: 'Example',
            items: [
                { guid: 'ext_1', title: 'New Title', link: 'https://example.com/1', contentSnippet: 'New Content' },
            ],
        });

        const { syncFeed } = await import('@/lib/rss');
        const result = await syncFeed('src_1');

        expect(result).toEqual([]);
        expect(mockedUpdateItem).toHaveBeenCalledWith({
            where: { id: 'item_1' },
            data: { title: 'New Title', content: 'New Content' },
        });
    });

    it('uses prefetched feed when provided', async () => {
        const source = { id: 'src_1', url: 'https://example.com/feed', title: 'Example' };
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

        const { syncFeed } = await import('@/lib/rss');
        await syncFeed('src_1', prefetched);

        expect(mockParseString).not.toHaveBeenCalled();
    });
});
