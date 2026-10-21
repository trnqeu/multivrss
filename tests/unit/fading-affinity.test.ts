import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { affinityWeight, applyAssociativeTouch, applyTouch, extractKeywords, type FadingState } from '@/lib/fading';
import { findAffinities, propagateAssociativeTouch } from '@/lib/fading-affinity';
import { MIN_AFFINITY, MS_PER_DAY, S0_DAYS } from '@/lib/fading-params';

vi.mock('@/lib/redis', () => ({ redis: { set: vi.fn() } }));
vi.mock('@/lib/prisma', () => ({
    prisma: {
        savedLink: { findFirst: vi.fn(), updateMany: vi.fn() },
        feedItem: { findFirst: vi.fn(), updateMany: vi.fn() },
        $queryRaw: vi.fn(),
    },
}));

const NOW = new Date('2026-10-21T12:00:00Z');
const daysAgo = (d: number) => new Date(NOW.getTime() - d * MS_PER_DAY);
const state = (days: number): FadingState => ({ stability: S0_DAYS, lastTouchedAt: daysAgo(days) });

describe('affinityWeight', () => {
    it('does not count the same site alone as an affinity', () => {
        expect(affinityWeight({ sharedTags: 0, sameSite: true, textRank: 0 })).toBeLessThan(MIN_AFFINITY);
    });

    it('counts one shared tag, a strong word overlap, or site plus some overlap', () => {
        expect(affinityWeight({ sharedTags: 1, sameSite: false, textRank: 0 })).toBeGreaterThanOrEqual(MIN_AFFINITY);
        expect(affinityWeight({ sharedTags: 0, sameSite: false, textRank: 0.75 })).toBeGreaterThanOrEqual(MIN_AFFINITY);
        expect(affinityWeight({ sharedTags: 0, sameSite: true, textRank: 0.25 })).toBeGreaterThanOrEqual(MIN_AFFINITY);
    });

    it('stays within [0, 1]', () => {
        expect(affinityWeight({ sharedTags: 9, sameSite: true, textRank: 3 })).toBeCloseTo(1, 10);
        expect(affinityWeight({ sharedTags: -1, sameSite: false, textRank: -1 })).toBe(0);
    });
});

describe('applyAssociativeTouch', () => {
    it('grows stability without rewinding the clock', () => {
        const before = state(30);
        const after = applyAssociativeTouch(before, 'read', 1, NOW);
        expect(after.stability).toBeGreaterThan(before.stability);
        expect(after.lastTouchedAt).toEqual(before.lastTouchedAt);
    });

    it('is weaker than the direct touch it comes from', () => {
        const direct = applyTouch(state(30), 'read', NOW);
        const associative = applyAssociativeTouch(state(30), 'read', 1, NOW);
        expect(associative.stability).toBeLessThan(direct.stability);
    });

    it('scales with the affinity weight', () => {
        const weak = applyAssociativeTouch(state(30), 'read', 0.3, NOW);
        const strong = applyAssociativeTouch(state(30), 'read', 0.9, NOW);
        expect(strong.stability).toBeGreaterThan(weak.stability);
    });

    it('does nothing for events that do not propagate, or with no affinity', () => {
        expect(applyAssociativeTouch(state(30), 'open', 1, NOW)).toEqual(state(30));
        expect(applyAssociativeTouch(state(30), 'edit', 1, NOW)).toEqual(state(30));
        expect(applyAssociativeTouch(state(30), 'read', 0, NOW)).toEqual(state(30));
    });
});

describe('extractKeywords', () => {
    it('keeps distinct content words of at least four letters, lowercased', () => {
        expect(extractKeywords('The Climate crisis: what the climate data says about Rome'))
            .toEqual(['climate', 'crisis', 'data', 'says', 'rome']);
    });

    it('drops Italian stop words and keeps accented letters', () => {
        expect(extractKeywords('Perché la città della musica è più viva'))
            .toEqual(['perché', 'città', 'musica', 'viva']);
    });

    it('returns letters and digits only, never query syntax', () => {
        for (const word of extractKeywords("x' | ! & :* <-> (drop) 2026 table")) {
            expect(word).toMatch(/^[\p{L}\p{N}]+$/u);
        }
    });

    it('handles a missing title', () => {
        expect(extractKeywords(null)).toEqual([]);
    });
});

function row(kind: 'link' | 'article', id: string, extra: Partial<{ shared_tags: number; same_site: boolean; matched: number; days: number }>) {
    return {
        kind, id, stability: S0_DAYS, touched_at: daysAgo(extra.days ?? 10),
        shared_tags: BigInt(extra.shared_tags ?? 0), same_site: extra.same_site ?? false, matched: BigInt(extra.matched ?? 0),
    };
}

describe('findAffinities', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(prisma.savedLink.findFirst).mockResolvedValue({
            url: 'https://www.example.com/a', title: 'Climate crisis data', stage: 'VIVID', tags: [{ tagId: 't1' }],
        } as never);
    });

    it('returns nothing when the source is not an owned saved item', async () => {
        vi.mocked(prisma.savedLink.findFirst).mockResolvedValue(null);
        expect(await findAffinities('user-1', { kind: 'link', id: 'l1' }, 2, NOW)).toEqual([]);
        expect(prisma.$queryRaw).not.toHaveBeenCalled();
    });

    it('keeps the strongest affinities above the threshold, at most k', async () => {
        vi.mocked(prisma.$queryRaw).mockResolvedValue([
            row('link', 'weak', { matched: 1 }),
            row('link', 'tag', { shared_tags: 1 }),
            row('article', 'both', { shared_tags: 1, matched: 3 }),
            row('link', 'words', { matched: 2 }),
        ]);
        // Source keywords: climate, crisis, data. both = 0.4 + 0.4, tag = 0.4,
        // words = 0.4 * 2/3, weak = 0.4 * 1/3 (below MIN_AFFINITY).
        const result = await findAffinities('user-1', { kind: 'link', id: 'l1' }, 2, NOW);
        expect(result.map(a => a.ref.id)).toEqual(['both', 'tag']);
        const all = await findAffinities('user-1', { kind: 'link', id: 'l1' }, 10, NOW);
        expect(all.map(a => a.ref.id)).toEqual(['both', 'tag', 'words']);
    });

    it('breaks ties in favour of the item closer to fading', async () => {
        vi.mocked(prisma.$queryRaw).mockResolvedValue([
            row('link', 'fresh', { shared_tags: 1, days: 2 }),
            row('link', 'fading', { shared_tags: 1, days: 60 }),
        ]);
        const result = await findAffinities('user-1', { kind: 'link', id: 'l1' }, 1, NOW);
        expect(result.map(a => a.ref.id)).toEqual(['fading']);
    });

    it('uses no words for a TRACE source: only tags and site remain', async () => {
        vi.mocked(prisma.savedLink.findFirst).mockResolvedValue({
            url: 'https://example.com/', title: null, stage: 'TRACE', tags: [{ tagId: 't1' }],
        } as never);
        vi.mocked(prisma.$queryRaw).mockResolvedValue([row('link', 'words', { matched: 5 })]);
        expect(await findAffinities('user-1', { kind: 'link', id: 'l1' }, 2, NOW)).toEqual([]);
    });
});

describe('propagateAssociativeTouch', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(prisma.savedLink.findFirst).mockResolvedValue({
            url: 'https://example.com/a', title: 'Climate crisis data', stage: 'VIVID', tags: [{ tagId: 't1' }],
        } as never);
        vi.mocked(prisma.$queryRaw).mockResolvedValue([
            row('link', 'n1', { shared_tags: 1, days: 30 }),
            row('article', 'n2', { shared_tags: 1, days: 30 }),
            row('link', 'n3', { shared_tags: 1, days: 30 }),
        ]);
        vi.mocked(redis.set).mockResolvedValue('OK');
        vi.mocked(prisma.savedLink.updateMany).mockResolvedValue({ count: 1 });
        vi.mocked(prisma.feedItem.updateMany).mockResolvedValue({ count: 1 });
    });

    it('touches the two nearest neighbours, stability only, scoped to the user', async () => {
        expect(await propagateAssociativeTouch('user-1', { kind: 'link', id: 'l1' }, 'read', NOW)).toBe(2);

        const linkUpdate = vi.mocked(prisma.savedLink.updateMany).mock.calls[0][0];
        expect(linkUpdate.where).toEqual({ id: 'n1', userId: 'user-1', stability: S0_DAYS });
        expect(Object.keys(linkUpdate.data)).toEqual(['stability']);

        const articleUpdate = vi.mocked(prisma.feedItem.updateMany).mock.calls[0][0];
        expect(articleUpdate.where).toMatchObject({ id: 'n2', savedAt: { not: null }, source: { category: { userId: 'user-1' } } });
        expect(Object.keys(articleUpdate.data)).toEqual(['saveStability']);
    });

    it('is one hop: it looks up neighbours once and never touches their neighbours', async () => {
        await propagateAssociativeTouch('user-1', { kind: 'link', id: 'l1' }, 'read', NOW);
        expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
    });

    it('skips neighbours already boosted within the cooldown', async () => {
        vi.mocked(redis.set).mockResolvedValueOnce(null).mockResolvedValue('OK');
        expect(await propagateAssociativeTouch('user-1', { kind: 'link', id: 'l1' }, 'read', NOW)).toBe(1);
        expect(prisma.savedLink.updateMany).not.toHaveBeenCalled();
        expect(vi.mocked(redis.set).mock.calls[0]).toEqual(['fading:assoc:link:n1', '1', 'EX', 86400, 'NX']);
    });

    it('does nothing for weak events', async () => {
        expect(await propagateAssociativeTouch('user-1', { kind: 'link', id: 'l1' }, 'open', NOW)).toBe(0);
        expect(prisma.savedLink.findFirst).not.toHaveBeenCalled();
    });
});
