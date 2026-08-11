import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';

vi.mock('@/lib/prisma', () => ({
    prisma: {
        feedItem: { findMany: vi.fn() },
        savedLink: { findMany: vi.fn() },
    },
}));

vi.mock('next-auth', () => ({
    getServerSession: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
    authOptions: {},
}));

const mockedPrisma = vi.mocked(prisma);
const mockedSession = vi.mocked(getServerSession);

function mockFeedItem(id: string, date: string, overrides: Record<string, unknown> = {}) {
    return {
        id,
        title: `Article ${id}`,
        link: `https://example.com/${id}`,
        content: null,
        savedAt: new Date(date),
        source: { title: 'Some Source' },
        tags: [],
        ...overrides,
    };
}

function mockSavedLink(id: string, date: string, overrides: Record<string, unknown> = {}) {
    return {
        id,
        title: `Link ${id}`,
        url: `https://example.com/${id}`,
        description: null,
        createdAt: new Date(date),
        tags: [],
        ...overrides,
    };
}

beforeEach(() => {
    vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// fetchSavedItemsPage
// ---------------------------------------------------------------------------
describe('fetchSavedItemsPage', () => {
    it('merges two date-sorted sources and advances each offset only by what it contributed', async () => {
        mockedPrisma.feedItem.findMany.mockResolvedValue([
            mockFeedItem('f1', '2026-08-10'),
            mockFeedItem('f2', '2026-08-08'),
            mockFeedItem('f3', '2026-08-05'),
        ] as any);
        mockedPrisma.savedLink.findMany.mockResolvedValue([
            mockSavedLink('l1', '2026-08-09'),
            mockSavedLink('l2', '2026-08-07'),
            mockSavedLink('l3', '2026-08-04'),
        ] as any);

        const { fetchSavedItemsPage } = await import('@/lib/saved-items');
        const result = await fetchSavedItemsPage('user_1', { limit: 3 });

        // Merged desc order: f1(10), l1(9), f2(8), l2(7), f3(5), l3(4) -> top 3: f1, l1, f2
        expect(result.articles.map(a => a.id)).toEqual(['f1', 'f2']);
        expect(result.links.map(l => l.id)).toEqual(['l1']);
        expect(result.nextFeedOffset).toBe(2);
        expect(result.nextLinkOffset).toBe(1);
        expect(result.hasMore).toBe(true);
    });

    it('passes the given offsets through to skip on each query', async () => {
        mockedPrisma.feedItem.findMany.mockResolvedValue([] as any);
        mockedPrisma.savedLink.findMany.mockResolvedValue([] as any);

        const { fetchSavedItemsPage } = await import('@/lib/saved-items');
        await fetchSavedItemsPage('user_1', { feedOffset: 5, linkOffset: 3, limit: 10 });

        expect(mockedPrisma.feedItem.findMany).toHaveBeenCalledWith(
            expect.objectContaining({ skip: 5, take: 10 })
        );
        expect(mockedPrisma.savedLink.findMany).toHaveBeenCalledWith(
            expect.objectContaining({ skip: 3, take: 10 })
        );
    });

    it('hasMore is false once both sources are exhausted with nothing left over', async () => {
        mockedPrisma.feedItem.findMany.mockResolvedValue([mockFeedItem('f1', '2026-08-10')] as any);
        mockedPrisma.savedLink.findMany.mockResolvedValue([] as any);

        const { fetchSavedItemsPage } = await import('@/lib/saved-items');
        const result = await fetchSavedItemsPage('user_1', { limit: 5 });

        expect(result.hasMore).toBe(false);
    });

    it('hasMore is true when a source returns a full page, even if fully consumed', async () => {
        mockedPrisma.feedItem.findMany.mockResolvedValue([
            mockFeedItem('f1', '2026-08-10'),
            mockFeedItem('f2', '2026-08-09'),
        ] as any);
        mockedPrisma.savedLink.findMany.mockResolvedValue([] as any);

        const { fetchSavedItemsPage } = await import('@/lib/saved-items');
        const result = await fetchSavedItemsPage('user_1', { limit: 2 });

        expect(result.articles).toHaveLength(2);
        expect(result.hasMore).toBe(true);
    });

    it('applies tag and text-query filters to both queries', async () => {
        mockedPrisma.feedItem.findMany.mockResolvedValue([] as any);
        mockedPrisma.savedLink.findMany.mockResolvedValue([] as any);

        const { fetchSavedItemsPage } = await import('@/lib/saved-items');
        await fetchSavedItemsPage('user_1', { tag: 'Biology', q: 'rust' });

        expect(mockedPrisma.feedItem.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    tags: { some: { tag: { name: 'Biology' } } },
                    OR: [
                        { title: { contains: 'rust', mode: 'insensitive' } },
                        { content: { contains: 'rust', mode: 'insensitive' } },
                    ],
                }),
            })
        );
        expect(mockedPrisma.savedLink.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    tags: { some: { tag: { name: 'Biology' } } },
                    OR: [
                        { title: { contains: 'rust', mode: 'insensitive' } },
                        { description: { contains: 'rust', mode: 'insensitive' } },
                    ],
                }),
            })
        );
    });
});

// ---------------------------------------------------------------------------
// getMoreSavedItems
// ---------------------------------------------------------------------------
describe('getMoreSavedItems', () => {
    it('returns an error without a session, without querying prisma', async () => {
        mockedSession.mockResolvedValue(null);

        const { getMoreSavedItems } = await import('@/app/actions/saved-items');
        const result = await getMoreSavedItems({ feedOffset: 0, linkOffset: 0 });

        expect(result).toEqual({ error: 'Unauthorized' });
        expect(mockedPrisma.feedItem.findMany).not.toHaveBeenCalled();
    });

    it('delegates to fetchSavedItemsPage scoped to the session user', async () => {
        mockedSession.mockResolvedValue({
            user: { id: 'user_1', username: 'testuser' },
            expires: new Date(Date.now() + 1000).toISOString(),
        } as any);
        mockedPrisma.feedItem.findMany.mockResolvedValue([] as any);
        mockedPrisma.savedLink.findMany.mockResolvedValue([] as any);

        const { getMoreSavedItems } = await import('@/app/actions/saved-items');
        const result = await getMoreSavedItems({ feedOffset: 2, linkOffset: 1 });

        expect('error' in result).toBe(false);
        expect(mockedPrisma.feedItem.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 2 }));
        expect(mockedPrisma.savedLink.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 1 }));
    });
});
