import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/api-auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { fetchSavedItemsPage } from '@/lib/saved-items';
import { GET } from '@/app/api/saved/route';
import { MS_PER_DAY } from '@/lib/fading-params';

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }));
vi.mock('@/lib/auth', () => ({ authOptions: {} }));
vi.mock('next/cache', () => ({ updateTag: vi.fn() }));
vi.mock('@/lib/cors', () => ({ corsHeaders: () => ({}) }));
vi.mock('@/lib/api-auth', () => ({ getAuthenticatedUser: vi.fn() }));
vi.mock('@/lib/rate-limit', () => ({ checkRateLimit: vi.fn() }));
vi.mock('@/lib/saved-items', () => ({ fetchSavedItemsPage: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
    prisma: {
        user: { findUnique: vi.fn() },
        savedLink: { findMany: vi.fn() },
        feedItem: { findMany: vi.fn() },
    },
}));

const NOW = new Date('2026-10-22T08:00:00Z');
const page = {
    links: [
        { id: 'l1', url: 'https://a.example/x', title: 'Vivid', description: 'Desc', createdAt: NOW, tags: [{ id: 't', name: 'rss' }], stage: 'VIVID' },
        { id: 'l2', url: 'https://b.example/', title: null, description: null, createdAt: new Date(NOW.getTime() - MS_PER_DAY), tags: [], stage: 'TRACE' },
    ],
    articles: [
        { id: 'a1', title: 'Secret title', link: 'https://news.example/deep/path', content: 'body', savedAt: new Date(NOW.getTime() - 2 * MS_PER_DAY), sourceTitle: 'HN', tags: [], stage: 'TRACE' },
    ],
    nextFeedOffset: 1, nextLinkOffset: 2, hasMore: false,
};
const get = (query = '') => GET(new Request(`http://localhost/api/saved${query}`));

beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    vi.mocked(getAuthenticatedUser).mockResolvedValue({ id: 'user-1', username: 'alice' });
    vi.mocked(checkRateLimit).mockResolvedValue(true);
    vi.mocked(fetchSavedItemsPage).mockResolvedValue(page as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ savedFading: true } as never);
    vi.mocked(prisma.savedLink.findMany).mockResolvedValue([
        { id: 'l1', stability: 60, lastTouchedAt: NOW },
        { id: 'l2', stability: 60, lastTouchedAt: NOW },
    ] as never);
    vi.mocked(prisma.feedItem.findMany).mockResolvedValue([{ id: 'a1', saveStability: 60, saveTouchedAt: NOW }] as never);
});

describe('GET /api/saved', () => {
    it('rejects unauthenticated and rate-limited requests', async () => {
        vi.mocked(getAuthenticatedUser).mockResolvedValueOnce(null);
        expect((await get()).status).toBe(401);
        vi.mocked(checkRateLimit).mockResolvedValueOnce(false);
        expect((await get()).status).toBe(429);
        expect(fetchSavedItemsPage).not.toHaveBeenCalled();
    });

    it('rejects invalid pagination and long filters', async () => {
        expect((await get('?limit=0')).status).toBe(400);
        expect((await get('?feedOffset=-1')).status).toBe(400);
        expect((await get('?linkOffset=abc')).status).toBe(400);
        expect((await get(`?q=${'x'.repeat(201)}`)).status).toBe(400);
    });

    it('caps the limit and scopes everything to the user', async () => {
        await get('?limit=500&tag=rss');
        expect(fetchSavedItemsPage).toHaveBeenCalledWith('user-1', { tag: 'rss', q: undefined, feedOffset: 0, linkOffset: 0, limit: 100 });
        expect(vi.mocked(prisma.savedLink.findMany).mock.calls[0][0]?.where).toMatchObject({ userId: 'user-1' });
        expect(vi.mocked(prisma.feedItem.findMany).mock.calls[0][0]?.where).toMatchObject({ source: { category: { userId: 'user-1' } } });
    });

    it('returns items newest first, with traces showing only their origin', async () => {
        const body = await (await get()).json();
        expect(body.items.map((i: { id: string }) => i.id)).toEqual(['l1', 'l2', 'a1']);
        const article = body.items[2];
        expect(article).toMatchObject({ type: 'article', title: null, url: 'https://news.example/', stage: 'TRACE', sourceTitle: 'HN' });
        expect(body.items[0]).toMatchObject({ title: 'Vivid', description: 'Desc', tags: ['rss'], stage: 'VIVID' });
        expect(new Date(body.items[0].fadesAt).getTime()).toBeGreaterThan(NOW.getTime());
        expect(body).toMatchObject({ nextFeedOffset: 1, nextLinkOffset: 2, hasMore: false });
    });

    it('reports fadesAt as null when the account has fading off', async () => {
        vi.mocked(prisma.user.findUnique).mockResolvedValue({ savedFading: false } as never);
        const body = await (await get()).json();
        expect(body.items.every((i: { fadesAt: unknown }) => i.fadesAt === null)).toBe(true);
        expect(prisma.savedLink.findMany).not.toHaveBeenCalled();
    });
});
