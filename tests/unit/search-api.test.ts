import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { searchAllForUser } from '@/lib/search';
import { GET } from '@/app/api/search/route';

vi.mock('next-auth', () => ({
    getServerSession: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
    authOptions: {},
}));

vi.mock('@/lib/search', () => ({
    searchAllForUser: vi.fn(),
}));

const mockedGetServerSession = vi.mocked(getServerSession);
const mockedSearchAllForUser = vi.mocked(searchAllForUser);

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

    it('delegates searches to the shared user-scoped search helper, including saved links', async () => {
        const hits = [
            {
                id: 'item_1',
                type: 'feedItem' as const,
                link: 'https://example.com/post',
                title: 'Example post',
                pubDate: 1700000000000,
            },
        ];

        mockedGetServerSession.mockResolvedValue({
            user: { id: 'user_1' },
            expires: new Date(Date.now() + 1000).toISOString(),
        });
        mockedSearchAllForUser.mockResolvedValue({ hits, estimatedTotalHits: 1, processingTimeMs: 5 });

        const response = await GET(new NextRequest('https://multivrss.test/api/search?q=rss'));

        expect(mockedSearchAllForUser).toHaveBeenCalledWith('user_1', 'rss', {
            cat: undefined, since: undefined, sourceId: undefined, read: undefined,
            limit: 30, offset: 0, includeSavedLinks: true,
        });
        expect(response.status).toBe(200);
        await expect(response.json()).resolves.toEqual({ hits, estimatedTotalHits: 1, processingTimeMs: 5 });
    });

    it('passes an empty query when q is missing', async () => {
        mockedGetServerSession.mockResolvedValue({
            user: { id: 'user_1' },
            expires: new Date(Date.now() + 1000).toISOString(),
        });
        mockedSearchAllForUser.mockResolvedValue({ hits: [], estimatedTotalHits: 0, processingTimeMs: 0 });

        const response = await GET(new NextRequest('https://multivrss.test/api/search'));

        expect(mockedSearchAllForUser).toHaveBeenCalledWith('user_1', '', {
            cat: undefined, since: undefined, sourceId: undefined, read: undefined,
            limit: 30, offset: 0, includeSavedLinks: true,
        });
        expect(response.status).toBe(200);
        await expect(response.json()).resolves.toEqual({ hits: [], estimatedTotalHits: 0, processingTimeMs: 0 });
    });

    it('returns 503 when the search backend throws', async () => {
        mockedGetServerSession.mockResolvedValue({
            user: { id: 'user_1' },
            expires: new Date(Date.now() + 1000).toISOString(),
        });
        mockedSearchAllForUser.mockRejectedValue(new Error('db down'));

        const response = await GET(new NextRequest('https://multivrss.test/api/search?q=rss'));

        expect(response.status).toBe(503);
        await expect(response.json()).resolves.toEqual({ error: 'Search unavailable' });
    });
});
