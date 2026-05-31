import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { searchFeedItemsForUser } from '@/lib/search';
import { GET } from '@/app/api/search/route';

vi.mock('next-auth', () => ({
    getServerSession: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
    authOptions: {},
}));

vi.mock('@/lib/search', () => ({
    searchFeedItemsForUser: vi.fn(),
}));

vi.mock('@/lib/meili', () => ({
    configureMeiliIndex: vi.fn().mockResolvedValue(undefined),
}));

const mockedGetServerSession = vi.mocked(getServerSession);
const mockedSearchFeedItemsForUser = vi.mocked(searchFeedItemsForUser);

describe('GET /api/search', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns 401 for unauthenticated requests', async () => {
        mockedGetServerSession.mockResolvedValue(null);

        const response = await GET(new NextRequest('https://multivrss.test/api/search?q=rss'));

        expect(response.status).toBe(401);
        await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' });
    });

    it('delegates searches to the shared user-scoped search helper', async () => {
        const hits = [
            {
                id: 'item_1',
                link: 'https://example.com/post',
                title: 'Example post',
                pubDate: 1700000000000,
            },
        ];

        mockedGetServerSession.mockResolvedValue({
            user: { id: 'user_1' },
            expires: new Date(Date.now() + 1000).toISOString(),
        });
        mockedSearchFeedItemsForUser.mockResolvedValue({ hits, estimatedTotalHits: 1, processingTimeMs: 5, facetDistribution: null });

        const response = await GET(new NextRequest('https://multivrss.test/api/search?q=rss'));

        expect(mockedSearchFeedItemsForUser).toHaveBeenCalledWith('user_1', 'rss', undefined, undefined, 30, 0, undefined, undefined);
        expect(response.status).toBe(200);
        await expect(response.json()).resolves.toEqual({ hits, estimatedTotalHits: 1, processingTimeMs: 5, facetDistribution: null });
    });

    it('passes an empty query when q is missing', async () => {
        mockedGetServerSession.mockResolvedValue({
            user: { id: 'user_1' },
            expires: new Date(Date.now() + 1000).toISOString(),
        });
        mockedSearchFeedItemsForUser.mockResolvedValue({ hits: [], estimatedTotalHits: 0, processingTimeMs: 0, facetDistribution: null });

        const response = await GET(new NextRequest('https://multivrss.test/api/search'));

        expect(mockedSearchFeedItemsForUser).toHaveBeenCalledWith('user_1', '', undefined, undefined, 30, 0, undefined, undefined);
        expect(response.status).toBe(200);
        await expect(response.json()).resolves.toEqual({ hits: [], estimatedTotalHits: 0, processingTimeMs: 0, facetDistribution: null });
    });
});
