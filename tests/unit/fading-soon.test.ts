import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/rate-limit';
import { recordSavedTouch } from '@/lib/fading-touch';
import { fetchFadingSoon, FADING_SOON_LIMIT } from '@/lib/fading-soon';
import { keepSavedItem } from '@/app/actions/fading';
import { MS_PER_DAY } from '@/lib/fading-params';

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }));
vi.mock('@/lib/auth', () => ({ authOptions: {} }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn(), updateTag: vi.fn() }));
vi.mock('@/lib/rate-limit', () => ({ checkRateLimit: vi.fn() }));
vi.mock('@/lib/fading-touch', () => ({ recordSavedTouch: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
    prisma: {
        user: { findUnique: vi.fn() },
        savedLinkTag: { findMany: vi.fn() },
        feedItemTag: { findMany: vi.fn() },
        $queryRaw: vi.fn(),
    },
}));

const NOW = new Date('2026-10-21T12:00:00Z');

beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ savedFading: true } as never);
    vi.mocked(prisma.savedLinkTag.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.feedItemTag.findMany).mockResolvedValue([] as never);
    vi.mocked(checkRateLimit).mockResolvedValue(true);
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'user-1', username: 'alice' } });
});

describe('fetchFadingSoon', () => {
    it('is null when fading is off for the user or the instance', async () => {
        vi.mocked(prisma.user.findUnique).mockResolvedValue({ savedFading: false } as never);
        expect(await fetchFadingSoon('user-1', NOW)).toBeNull();
        vi.stubEnv('SAVED_FADING', 'off');
        expect(await fetchFadingSoon('user-1', NOW)).toBeNull();
        expect(prisma.$queryRaw).not.toHaveBeenCalled();
    });

    it('rounds days left up, never below zero, and attaches tags', async () => {
        vi.mocked(prisma.$queryRaw).mockResolvedValue([
            { kind: 'link', id: 'l1', title: 'A', url: 'https://a.example/', source_title: null, stage: 'VIVID', saved_at: NOW, due_at: new Date(NOW.getTime() + 1.2 * MS_PER_DAY) },
            { kind: 'article', id: 'a1', title: 'B', url: 'https://b.example/x', source_title: 'Feed', stage: 'TRACE', saved_at: NOW, due_at: new Date(NOW.getTime() - MS_PER_DAY) },
        ] as never);
        vi.mocked(prisma.savedLinkTag.findMany).mockResolvedValue([{ savedLinkId: 'l1', tag: { id: 't1', name: 'rss' } }] as never);

        const items = await fetchFadingSoon('user-1', NOW);
        expect(items?.map(i => i.daysLeft)).toEqual([2, 0]);
        expect(items?.[0].tags).toEqual([{ id: 't1', name: 'rss' }]);
        expect(items?.[1].tags).toEqual([]);
        expect(FADING_SOON_LIMIT).toBe(20);
    });
});

describe('keepSavedItem', () => {
    it('records a keep touch for the current user only', async () => {
        vi.mocked(recordSavedTouch).mockResolvedValue(true);
        expect(await keepSavedItem('link', 'clink1')).toEqual({ success: true });
        expect(recordSavedTouch).toHaveBeenCalledWith('user-1', { kind: 'link', id: 'clink1' }, 'keep');
    });

    it('rejects invalid input and unauthenticated calls', async () => {
        expect((await keepSavedItem('note' as never, 'x')).success).toBe(false);
        expect((await keepSavedItem('link', '../x')).success).toBe(false);
        vi.mocked(getServerSession).mockResolvedValueOnce(null);
        expect((await keepSavedItem('link', 'clink1')).success).toBe(false);
        expect(recordSavedTouch).not.toHaveBeenCalled();
    });

    it('reports failure when nothing was kept (not owned, not saved, fading off)', async () => {
        vi.mocked(recordSavedTouch).mockResolvedValue(false);
        expect((await keepSavedItem('article', 'cart1')).success).toBe(false);
    });

    it('is rate limited', async () => {
        vi.mocked(checkRateLimit).mockResolvedValueOnce(false);
        expect((await keepSavedItem('link', 'clink1')).success).toBe(false);
        expect(recordSavedTouch).not.toHaveBeenCalled();
    });
});
