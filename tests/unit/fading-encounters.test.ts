import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { savedEncounterQueue } from '@/lib/queue';
import { recordSavedTouch } from '@/lib/fading-touch';
import { applyEncounters, backfillUrlKeys, encountersEnabled, enqueueEncounter } from '@/lib/fading-encounters';

vi.mock('@/lib/redis', () => ({ redis: { set: vi.fn() } }));
vi.mock('@/lib/queue', () => ({ savedEncounterQueue: { add: vi.fn() } }));
vi.mock('@/lib/fading-touch', () => ({ recordSavedTouch: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
    prisma: {
        savedLink: { findFirst: vi.fn(), findMany: vi.fn(), updateMany: vi.fn() },
        feedItem: { findFirst: vi.fn(), findMany: vi.fn(), updateMany: vi.fn() },
        $executeRaw: vi.fn(),
    },
}));

beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    vi.stubEnv('SAVED_FADING_ENCOUNTERS', '1');
    vi.mocked(redis.set).mockResolvedValue('OK');
    vi.mocked(recordSavedTouch).mockResolvedValue(true);
    vi.mocked(prisma.savedLink.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.feedItem.findMany).mockResolvedValue([] as never);
});

describe('encountersEnabled', () => {
    it('needs SAVED_FADING_ENCOUNTERS=1 and fading not off', () => {
        expect(encountersEnabled()).toBe(true);
        vi.stubEnv('SAVED_FADING', 'off');
        expect(encountersEnabled()).toBe(false);
        vi.stubEnv('SAVED_FADING', 'optin');
        vi.stubEnv('SAVED_FADING_ENCOUNTERS', '');
        expect(encountersEnabled()).toBe(false);
    });
});

describe('enqueueEncounter', () => {
    it('queues ids only, deduplicated per item', async () => {
        await enqueueEncounter('saver', { kind: 'link', id: 'l1' });
        expect(savedEncounterQueue.add).toHaveBeenCalledWith(
            'encounter', { saverUserId: 'saver', kind: 'link', id: 'l1' }, { jobId: 'link-l1' },
        );
    });

    it('does nothing when encounters are off', async () => {
        vi.stubEnv('SAVED_FADING_ENCOUNTERS', '0');
        await enqueueEncounter('saver', { kind: 'link', id: 'l1' });
        expect(savedEncounterQueue.add).not.toHaveBeenCalled();
    });

    it('never fails the save when the queue is down', async () => {
        vi.mocked(savedEncounterQueue.add).mockRejectedValue(new Error('redis down'));
        vi.spyOn(console, 'error').mockImplementation(() => {});
        await expect(enqueueEncounter('saver', { kind: 'link', id: 'l1' })).resolves.toBeUndefined();
    });
});

describe('applyEncounters', () => {
    beforeEach(() => {
        vi.mocked(prisma.savedLink.findFirst).mockResolvedValue({ urlKey: 'example.com/a' } as never);
    });

    it("touches other fading users' copies of the same page, never the saver's", async () => {
        vi.mocked(prisma.savedLink.findMany).mockResolvedValue([{ id: 'l2', userId: 'bob' }] as never);
        vi.mocked(prisma.feedItem.findMany).mockResolvedValue([{ id: 'a9', source: { category: { userId: 'cara' } } }] as never);

        expect(await applyEncounters({ saverUserId: 'saver', kind: 'link', id: 'l1' })).toBe(2);
        expect(vi.mocked(prisma.savedLink.findFirst).mock.calls[0][0]?.where).toEqual({ id: 'l1', userId: 'saver' });
        expect(vi.mocked(prisma.savedLink.findMany).mock.calls[0][0]?.where).toEqual({
            urlKey: 'example.com/a', userId: { not: 'saver' }, user: { savedFading: true },
        });
        expect(vi.mocked(prisma.feedItem.findMany).mock.calls[0][0]?.where).toMatchObject({
            saveUrlKey: 'example.com/a', source: { category: { userId: { not: 'saver' }, user: { savedFading: true } } },
        });
        expect(recordSavedTouch).toHaveBeenCalledWith('bob', { kind: 'link', id: 'l2' }, 'encounter');
        expect(recordSavedTouch).toHaveBeenCalledWith('cara', { kind: 'article', id: 'a9' }, 'encounter');
    });

    it('keeps URLs out of Redis', async () => {
        vi.mocked(prisma.savedLink.findMany).mockResolvedValue([{ id: 'l2', userId: 'bob' }] as never);
        await applyEncounters({ saverUserId: 'saver', kind: 'link', id: 'l1' });
        for (const [key] of vi.mocked(redis.set).mock.calls) expect(String(key)).not.toContain('example.com');
    });

    it('gives one encounter per saver and page per day', async () => {
        vi.mocked(redis.set).mockResolvedValueOnce(null as never);
        expect(await applyEncounters({ saverUserId: 'saver', kind: 'link', id: 'l1' })).toBe(0);
        expect(prisma.savedLink.findMany).not.toHaveBeenCalled();
    });

    it('gives each item at most one encounter per day', async () => {
        vi.mocked(prisma.savedLink.findMany).mockResolvedValue([{ id: 'l2', userId: 'bob' }, { id: 'l3', userId: 'dan' }] as never);
        vi.mocked(redis.set).mockResolvedValueOnce('OK').mockResolvedValueOnce(null as never).mockResolvedValue('OK');
        expect(await applyEncounters({ saverUserId: 'saver', kind: 'link', id: 'l1' })).toBe(1);
        expect(recordSavedTouch).toHaveBeenCalledTimes(1);
        expect(recordSavedTouch).toHaveBeenCalledWith('dan', { kind: 'link', id: 'l3' }, 'encounter');
    });

    it('does nothing for an item without a key (a trace) or not owned by the saver', async () => {
        vi.mocked(prisma.savedLink.findFirst).mockResolvedValue(null);
        expect(await applyEncounters({ saverUserId: 'saver', kind: 'link', id: 'l1' })).toBe(0);
        vi.mocked(prisma.feedItem.findFirst).mockResolvedValue({ saveUrlKey: null } as never);
        expect(await applyEncounters({ saverUserId: 'saver', kind: 'article', id: 'a1' })).toBe(0);
        expect(redis.set).not.toHaveBeenCalled();
    });

    it('does nothing when encounters are off', async () => {
        vi.stubEnv('SAVED_FADING_ENCOUNTERS', '0');
        expect(await applyEncounters({ saverUserId: 'saver', kind: 'link', id: 'l1' })).toBe(0);
        expect(prisma.savedLink.findFirst).not.toHaveBeenCalled();
    });
});

describe('backfillUrlKeys', () => {
    it('keys the rows that can be keyed, one UPDATE per batch', async () => {
        vi.mocked(prisma.savedLink.findMany).mockResolvedValueOnce([
            { id: 'l1', url: 'https://Example.com/a/?utm_source=x' },
            { id: 'l2', url: 'mailto:x@example.com' },
        ] as never);
        vi.mocked(prisma.feedItem.findMany).mockResolvedValueOnce([{ id: 'a1', link: 'http://news.example.com/p#c' }] as never);
        vi.mocked(prisma.$executeRaw).mockResolvedValueOnce(1 as never).mockResolvedValueOnce(1 as never);

        expect(await backfillUrlKeys()).toBe(2);
        expect(prisma.$executeRaw).toHaveBeenCalledTimes(2);
        const [, linkIds, linkKeys] = vi.mocked(prisma.$executeRaw).mock.calls[0];
        expect(linkIds).toEqual(['l1']);
        expect(linkKeys).toEqual(['example.com/a']);
        const [, itemIds, itemKeys] = vi.mocked(prisma.$executeRaw).mock.calls[1];
        expect(itemIds).toEqual(['a1']);
        expect(itemKeys).toEqual(['news.example.com/p']);
        expect(vi.mocked(prisma.savedLink.findMany).mock.calls[0][0]?.where).toEqual({ urlKey: null, stage: { not: 'TRACE' } });
    });

    it('skips the UPDATE when nothing in the batch can be keyed', async () => {
        vi.mocked(prisma.savedLink.findMany).mockResolvedValueOnce([{ id: 'l2', url: 'mailto:x@example.com' }] as never);
        expect(await backfillUrlKeys()).toBe(0);
        expect(prisma.$executeRaw).not.toHaveBeenCalled();
    });
});
