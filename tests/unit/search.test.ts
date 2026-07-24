import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '@/lib/prisma';
import { searchAllForUser } from '@/lib/search';

vi.mock('@/lib/prisma', () => ({
    prisma: {
        $queryRaw: vi.fn(),
    },
}));

const mockedQueryRaw = vi.mocked(prisma.$queryRaw);

function row(overrides: Record<string, unknown> = {}) {
    return {
        id: 'item_1',
        type: 'feedItem',
        link: 'https://example.com/post',
        title: 'Example post',
        title_hl: null,
        content: 'Some content',
        content_hl: null,
        description: null,
        description_hl: null,
        source_title: 'Example Source',
        category_name: 'TECH',
        source_id: 'source_1',
        read: false,
        saved_at: null,
        pub_date: new Date('2026-01-01T00:00:00Z'),
        total_count: 1,
        ...overrides,
    };
}

describe('searchAllForUser', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('runs a browse-mode query (no tsquery/rank/UNION) when the search term is empty', async () => {
        mockedQueryRaw.mockResolvedValue([]);

        const result = await searchAllForUser('user_1', '');

        expect(mockedQueryRaw).toHaveBeenCalledTimes(1);
        const sqlArg = mockedQueryRaw.mock.calls[0][0] as unknown as { sql: string; values: unknown[] };
        expect(sqlArg.sql).not.toContain('websearch_to_tsquery');
        expect(sqlArg.sql).not.toContain('UNION ALL');
        expect(sqlArg.sql).toContain('ORDER BY pub_date DESC');
        expect(result.hits).toEqual([]);
        expect(result.estimatedTotalHits).toBe(0);
    });

    it('runs a ranked full-text query and unions in saved links when requested', async () => {
        mockedQueryRaw.mockResolvedValue([row()]);

        const result = await searchAllForUser('user_1', 'rss', { includeSavedLinks: true });

        const sqlArg = mockedQueryRaw.mock.calls[0][0] as unknown as { sql: string; values: unknown[] };
        expect(sqlArg.sql).toContain('websearch_to_tsquery');
        expect(sqlArg.sql).toContain('UNION ALL');
        expect(sqlArg.sql).toContain('ts_rank_cd');
        expect(sqlArg.sql).toContain('ORDER BY rank DESC');
        expect(sqlArg.values).toContain('user_1');
        expect(sqlArg.values).toContain('rss');
        expect(result.hits).toHaveLength(1);
        expect(result.estimatedTotalHits).toBe(1);
    });

    it('does not union saved links when a category/source/read filter is active, even if requested', async () => {
        mockedQueryRaw.mockResolvedValue([]);

        await searchAllForUser('user_1', 'rss', { includeSavedLinks: true, cat: 'TECH' });

        const sqlArg = mockedQueryRaw.mock.calls[0][0] as unknown as { sql: string; values: unknown[] };
        expect(sqlArg.sql).not.toContain('UNION ALL');
        expect(sqlArg.sql).toContain('category_name = ');
        expect(sqlArg.values).toContain('TECH');
    });

    it('applies the read filter as a bound boolean parameter', async () => {
        mockedQueryRaw.mockResolvedValue([]);

        await searchAllForUser('user_1', '', { read: 'unread' });

        const sqlArg = mockedQueryRaw.mock.calls[0][0] as unknown as { sql: string; values: unknown[] };
        expect(sqlArg.sql).toContain('read = ');
        expect(sqlArg.values).toContain(false);
    });

    it('still returns results for a user with saved links but no feed sources (no early short-circuit)', async () => {
        mockedQueryRaw.mockResolvedValue([
            row({ id: 'link_1', type: 'savedLink', link: 'https://foo.dev', title: 'Foo', source_id: null, category_name: null, source_title: null, read: null, total_count: 1 }),
        ]);

        const result = await searchAllForUser('user_1', 'foo', { includeSavedLinks: true });

        expect(result.hits).toHaveLength(1);
        expect(result.hits[0].type).toBe('savedLink');
    });

    it('falls back to a hostname-derived title for untitled saved links', async () => {
        mockedQueryRaw.mockResolvedValue([
            row({ id: 'link_1', type: 'savedLink', link: 'https://www.example.dev/foo', title: '', title_hl: null, source_id: null }),
        ]);

        const result = await searchAllForUser('user_1', 'foo', { includeSavedLinks: true });

        expect(result.hits[0].title).toBe('example.dev');
    });

    it('extracts the total count from the count(*) OVER() window column', async () => {
        mockedQueryRaw.mockResolvedValue([row({ total_count: 42 }), row({ id: 'item_2', total_count: 42 })]);

        const result = await searchAllForUser('user_1', 'rss');

        expect(result.estimatedTotalHits).toBe(42);
        expect(result.hits).toHaveLength(2);
    });

    it('clamps limit to [1, 200] and offset to >= 0', async () => {
        mockedQueryRaw.mockResolvedValue([]);

        await searchAllForUser('user_1', '', { limit: 9999, offset: -5 });

        const sqlArg = mockedQueryRaw.mock.calls[0][0] as unknown as { sql: string; values: unknown[] };
        expect(sqlArg.values).toContain(200);
        expect(sqlArg.values).toContain(0);
    });
});
