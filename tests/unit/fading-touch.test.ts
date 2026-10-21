import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/rate-limit';
import { recordSavedTouch } from '@/lib/fading-touch';
import { POST } from '@/app/api/saved/touch/route';
import { saveExternalLink } from '@/app/actions/saved-links';
import { MS_PER_DAY, S0_DAYS } from '@/lib/fading-params';

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }));
vi.mock('@/lib/auth', () => ({ authOptions: {} }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn(), updateTag: vi.fn() }));
vi.mock('@/lib/rate-limit', () => ({ checkRateLimit: vi.fn() }));
vi.mock('@/lib/rss', () => ({ validateFeedUrl: vi.fn(), safeFetchText: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
    prisma: {
        user: { findUnique: vi.fn() },
        savedLink: { findFirst: vi.fn(), updateMany: vi.fn(), create: vi.fn() },
        feedItem: { findFirst: vi.fn(), updateMany: vi.fn() },
    },
}));

const NOW = new Date('2026-10-21T12:00:00Z');
const daysAgo = (d: number) => new Date(NOW.getTime() - d * MS_PER_DAY);

beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ savedFading: true } as never);
    vi.mocked(prisma.savedLink.updateMany).mockResolvedValue({ count: 1 });
    vi.mocked(prisma.feedItem.updateMany).mockResolvedValue({ count: 1 });
    vi.mocked(checkRateLimit).mockResolvedValue(true);
});

describe('recordSavedTouch', () => {
    it('updates stability and lastTouchedAt of an owned link, never the stage', async () => {
        vi.mocked(prisma.savedLink.findFirst).mockResolvedValue({ stability: S0_DAYS, lastTouchedAt: daysAgo(40) } as never);

        expect(await recordSavedTouch('user-1', { kind: 'link', id: 'l1' }, 'read', NOW)).toBe(true);

        expect(vi.mocked(prisma.savedLink.findFirst).mock.calls[0][0]?.where).toEqual({ id: 'l1', userId: 'user-1' });
        const update = vi.mocked(prisma.savedLink.updateMany).mock.calls[0][0];
        expect(update.where).toEqual({ id: 'l1', userId: 'user-1', lastTouchedAt: daysAgo(40) });
        expect(update.data.stability).toBeGreaterThan(S0_DAYS);
        expect(update.data).not.toHaveProperty('stage');
    });

    it("is a no-op for another user's link (ownership scoped in the query)", async () => {
        vi.mocked(prisma.savedLink.findFirst).mockResolvedValue(null);
        expect(await recordSavedTouch('user-2', { kind: 'link', id: 'l1' }, 'open', NOW)).toBe(false);
        expect(vi.mocked(prisma.savedLink.findFirst).mock.calls[0][0]?.where).toMatchObject({ userId: 'user-2' });
        expect(prisma.savedLink.updateMany).not.toHaveBeenCalled();
    });

    it('is a no-op when the user has fading disabled', async () => {
        vi.mocked(prisma.user.findUnique).mockResolvedValue({ savedFading: false } as never);
        expect(await recordSavedTouch('user-1', { kind: 'link', id: 'l1' }, 'read', NOW)).toBe(false);
        expect(prisma.savedLink.findFirst).not.toHaveBeenCalled();
    });

    it('is a no-op when the instance has fading off', async () => {
        vi.stubEnv('SAVED_FADING', 'off');
        expect(await recordSavedTouch('user-1', { kind: 'link', id: 'l1' }, 'read', NOW)).toBe(false);
        expect(prisma.user.findUnique).not.toHaveBeenCalled();
    });

    it('only touches articles that are saved and owned', async () => {
        vi.mocked(prisma.feedItem.findFirst).mockResolvedValue(null);
        expect(await recordSavedTouch('user-1', { kind: 'article', id: 'a1' }, 'open', NOW)).toBe(false);
        expect(vi.mocked(prisma.feedItem.findFirst).mock.calls[0][0]?.where).toEqual({
            id: 'a1', savedAt: { not: null }, source: { category: { userId: 'user-1' } },
        });
        expect(prisma.feedItem.updateMany).not.toHaveBeenCalled();
    });

    it('drops a concurrent touch that lost the compare-and-set', async () => {
        vi.mocked(prisma.savedLink.findFirst).mockResolvedValue({ stability: S0_DAYS, lastTouchedAt: daysAgo(3) } as never);
        vi.mocked(prisma.savedLink.updateMany).mockResolvedValue({ count: 0 });
        expect(await recordSavedTouch('user-1', { kind: 'link', id: 'l1' }, 'open', NOW)).toBe(false);
    });
});

function touchRequest(body: unknown, headers: Record<string, string> = { 'sec-fetch-site': 'same-origin' }) {
    return new Request('http://localhost/api/saved/touch', {
        method: 'POST',
        headers,
        body: typeof body === 'string' ? body : JSON.stringify(body),
    });
}

describe('POST /api/saved/touch', () => {
    beforeEach(() => {
        vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'user-1', username: 'alice' } });
        vi.mocked(prisma.savedLink.findFirst).mockResolvedValue({ stability: S0_DAYS, lastTouchedAt: daysAgo(10) } as never);
    });

    it('records a client event', async () => {
        const res = await POST(touchRequest({ kind: 'link', id: 'clink123', event: 'open' }));
        expect(res.status).toBe(204);
        expect(prisma.savedLink.updateMany).toHaveBeenCalledTimes(1);
    });

    it.each(['resave', 'encounter', 'nonsense'])('rejects the %s event', async (event) => {
        const res = await POST(touchRequest({ kind: 'link', id: 'clink123', event }));
        expect(res.status).toBe(400);
        expect(prisma.savedLink.updateMany).not.toHaveBeenCalled();
    });

    it('rejects malformed input', async () => {
        expect((await POST(touchRequest('not json'))).status).toBe(400);
        expect((await POST(touchRequest({ kind: 'note', id: 'x', event: 'open' }))).status).toBe(400);
        expect((await POST(touchRequest({ kind: 'link', id: '../etc', event: 'open' }))).status).toBe(400);
    });

    it('rejects unauthenticated, cross-site and rate-limited requests', async () => {
        const valid = { kind: 'link', id: 'clink123', event: 'open' };
        expect((await POST(touchRequest(valid, { 'sec-fetch-site': 'cross-site' }))).status).toBe(403);
        vi.mocked(checkRateLimit).mockResolvedValueOnce(false);
        expect((await POST(touchRequest(valid))).status).toBe(429);
        vi.mocked(getServerSession).mockResolvedValueOnce(null);
        expect((await POST(touchRequest(valid))).status).toBe(401);
        expect(prisma.savedLink.updateMany).not.toHaveBeenCalled();
    });
});

describe('resave', () => {
    const existing = {
        id: 'l1', url: 'https://example.com/a', title: 'A', description: null,
        createdAt: daysAgo(100), stability: S0_DAYS, lastTouchedAt: daysAgo(50),
    };

    function form(url: string) {
        const fd = new FormData();
        fd.set('url', url);
        fd.set('title', 'A');
        return fd;
    }

    beforeEach(() => {
        vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'user-1', username: 'alice' } });
    });

    it('touches the existing link instead of creating a duplicate', async () => {
        vi.mocked(prisma.savedLink.findFirst).mockResolvedValue(existing as never);
        const result = await saveExternalLink(null, form(existing.url));
        expect(result.success).toBe(true);
        expect(result.link?.id).toBe('l1');
        expect(prisma.savedLink.create).not.toHaveBeenCalled();
        expect(prisma.savedLink.updateMany).toHaveBeenCalledTimes(1);
    });

    it('creates a new link as before when fading is disabled', async () => {
        vi.mocked(prisma.user.findUnique).mockResolvedValue({ savedFading: false } as never);
        vi.mocked(prisma.savedLink.create).mockResolvedValue(existing as never);
        await saveExternalLink(null, form(existing.url));
        expect(prisma.savedLink.create).toHaveBeenCalledTimes(1);
        expect(prisma.savedLink.findFirst).not.toHaveBeenCalled();
    });
});
