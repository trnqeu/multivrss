import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '@/lib/prisma';
import { runSavedFading, SAVED_FADING_BATCH_SIZE } from '@/lib/saved-fading';

vi.mock('@/lib/prisma', () => ({ prisma: { $queryRaw: vi.fn() } }));

// The SQL itself is checked against a real database by hand (see
// scripts/fading-time-travel.ts); these tests cover the orchestration.
const owners = (n: number, userId = 'user-1') => Array.from({ length: n }, () => ({ userId }));

beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
});

describe('runSavedFading', () => {
    it('does nothing when the instance has fading off', async () => {
        vi.stubEnv('SAVED_FADING', 'off');
        expect(await runSavedFading()).toEqual({ faded: 0, traced: 0, forgotten: 0, userIds: [] });
        expect(prisma.$queryRaw).not.toHaveBeenCalled();
    });

    it('runs forget, then trace, then gist, links before articles', async () => {
        vi.mocked(prisma.$queryRaw)
            .mockResolvedValueOnce(owners(1) as never)            // forget links
            .mockResolvedValueOnce(owners(2) as never)            // forget articles
            .mockResolvedValueOnce(owners(3) as never)            // trace links
            .mockResolvedValueOnce(owners(4) as never)            // trace articles
            .mockResolvedValueOnce(owners(5) as never)            // gist links
            .mockResolvedValueOnce(owners(6, 'user-2') as never); // gist articles
        const result = await runSavedFading();
        expect(result).toEqual({ forgotten: 3, traced: 7, faded: 11, userIds: ['user-1', 'user-2'] });
        expect(prisma.$queryRaw).toHaveBeenCalledTimes(6);

        const sql = vi.mocked(prisma.$queryRaw).mock.calls.map(([q]) => (q as unknown as { sql: string }).sql);
        expect(sql[0]).toContain('DELETE FROM "SavedLink"');
        expect(sql[1]).toContain('DELETE FROM "FeedItemTag"');
        expect(sql[2]).toContain("stage = 'TRACE'");
        expect(sql[3]).toContain(`"saveStage" = 'TRACE'`);
        expect(sql[4]).toContain("stage = 'GIST'");
        expect(sql[5]).toContain(`"saveStage" = 'GIST'`);
    });

    it('keeps taking batches while a full batch comes back', async () => {
        vi.mocked(prisma.$queryRaw)
            .mockResolvedValueOnce(owners(SAVED_FADING_BATCH_SIZE) as never)
            .mockResolvedValueOnce(owners(SAVED_FADING_BATCH_SIZE) as never)
            .mockResolvedValueOnce(owners(7) as never)
            .mockResolvedValue([] as never);
        const result = await runSavedFading();
        expect(result.forgotten).toBe(2 * SAVED_FADING_BATCH_SIZE + 7);
        expect(prisma.$queryRaw).toHaveBeenCalledTimes(3 + 5);
    });

    it('only counts on a dry run, and reports no users', async () => {
        vi.mocked(prisma.$queryRaw).mockResolvedValue([{ count: BigInt(4) }] as never);
        const result = await runSavedFading({ dryRun: true });
        expect(result).toEqual({ forgotten: 8, traced: 8, faded: 8, userIds: [] });
        for (const [query] of vi.mocked(prisma.$queryRaw).mock.calls) {
            const text = (query as unknown as { sql: string }).sql ?? (query as unknown as string[]).join('?');
            expect(text).not.toMatch(/DELETE|UPDATE/);
        }
    });
});
