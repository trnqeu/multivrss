import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { HIGHLIGHT_PRE, HIGHLIGHT_POST, type SearchHit, type SearchResult, type SearchHitType } from "@/lib/search-types";

export { HIGHLIGHT_PRE, HIGHLIGHT_POST };
export type { SearchHit, SearchResult, SearchHitType };

const HEADLINE_OPTIONS = `StartSel=${HIGHLIGHT_PRE}, StopSel=${HIGHLIGHT_POST}, MaxWords=35, MinWords=15`;

type SearchOptions = {
    cat?: string;
    since?: string;
    limit?: number;
    offset?: number;
    sourceId?: string;
    read?: string; // 'read' | 'unread'
    includeSavedLinks?: boolean;
    // count(*) OVER() forces Postgres to aggregate the full matching set before
    // it can sort + LIMIT, which is expensive for users with many feed items.
    // Callers that don't render a total (e.g. FeedList) should opt out.
    includeTotalCount?: boolean;
};

type RawRow = {
    id: string;
    type: SearchHitType;
    link: string;
    title: string | null;
    title_hl: string | null;
    content: string | null;
    content_hl: string | null;
    description: string | null;
    description_hl: string | null;
    source_title: string | null;
    source_slug: string | null;
    category_name: string | null;
    source_id: string | null;
    read: boolean | null;
    saved_at: Date | null;
    pub_date: Date | null;
    total_count?: number;
};

function sinceToDate(since?: string): Date | undefined {
    if (!since) return undefined;
    const now = new Date();
    if (since === '24h') return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    if (since === '7d') return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    if (since === 'today') { const d = new Date(now); d.setHours(0, 0, 0, 0); return d; }
    return undefined;
}

function hostnameLabel(url: string): string {
    try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; }
}

function feedItemBranch(userId: string, query: string): Prisma.Sql {
    const hasQuery = query !== '';
    return Prisma.sql`
        SELECT
            fi.id, 'feedItem'::text AS type, fi.link, fi.title,
            ${hasQuery
                ? Prisma.sql`ts_headline('simple', fi.title, websearch_to_tsquery('simple', ${query}), ${HEADLINE_OPTIONS})`
                : Prisma.sql`NULL::text`} AS title_hl,
            fi.content,
            ${hasQuery
                ? Prisma.sql`ts_headline('simple', COALESCE(fi.content, ''), websearch_to_tsquery('simple', ${query}), ${HEADLINE_OPTIONS})`
                : Prisma.sql`NULL::text`} AS content_hl,
            NULL::text AS description, NULL::text AS description_hl,
            fs.title AS source_title, fs.slug AS source_slug, c.name AS category_name, fi."sourceId" AS source_id,
            fi.read, fi."savedAt" AS saved_at, fi."pubDate" AS pub_date,
            ${hasQuery
                ? Prisma.sql`ts_rank_cd(fi."searchVector", websearch_to_tsquery('simple', ${query}))`
                : Prisma.sql`0::real`} AS rank
        FROM "FeedItem" fi
        JOIN "FeedSource" fs ON fs.id = fi."sourceId"
        JOIN "Category" c ON c.id = fs."categoryId"
        WHERE c."userId" = ${userId}
        ${hasQuery
            ? Prisma.sql`AND fi."searchVector" @@ websearch_to_tsquery('simple', ${query})`
            : Prisma.empty}
    `;
}

function savedLinkBranch(userId: string, query: string): Prisma.Sql {
    const hasQuery = query !== '';
    return Prisma.sql`
        SELECT
            sl.id, 'savedLink'::text AS type, sl.url AS link, sl.title,
            ${hasQuery
                ? Prisma.sql`ts_headline('simple', COALESCE(sl.title, ''), websearch_to_tsquery('simple', ${query}), ${HEADLINE_OPTIONS})`
                : Prisma.sql`NULL::text`} AS title_hl,
            NULL::text AS content, NULL::text AS content_hl,
            sl.description,
            ${hasQuery
                ? Prisma.sql`ts_headline('simple', COALESCE(sl.description, ''), websearch_to_tsquery('simple', ${query}), ${HEADLINE_OPTIONS})`
                : Prisma.sql`NULL::text`} AS description_hl,
            NULL::text AS source_title, NULL::text AS source_slug, NULL::text AS category_name, NULL::text AS source_id,
            NULL::boolean AS read, sl."createdAt" AS saved_at, sl."createdAt" AS pub_date,
            ${hasQuery
                ? Prisma.sql`ts_rank_cd(sl."searchVector", websearch_to_tsquery('simple', ${query}))`
                : Prisma.sql`0::real`} AS rank
        FROM "SavedLink" sl
        WHERE sl."userId" = ${userId}
        ${hasQuery
            ? Prisma.sql`AND sl."searchVector" @@ websearch_to_tsquery('simple', ${query})`
            : Prisma.empty}
    `;
}

export async function searchAllForUser(
    userId: string,
    query: string,
    options: SearchOptions = {},
): Promise<SearchResult> {
    const start = performance.now();
    const { cat, since, sourceId, read, limit = 30, offset = 0, includeSavedLinks = false, includeTotalCount = true } = options;

    const cappedLimit = Math.min(Math.max(limit, 1), 200);
    const cappedOffset = Math.max(offset, 0);
    const hasQuery = query !== '';
    const sinceDate = sinceToDate(since);
    const readBool = read === 'read' ? true : read === 'unread' ? false : undefined;

    // A category/source/read filter can never match a SavedLink row (those
    // columns are NULL for that branch) — skip the branch outright rather
    // than union it in only to have it filtered back out.
    const savedLinksApplicable = includeSavedLinks && !cat && !sourceId && readBool === undefined;

    const branches = [feedItemBranch(userId, query)];
    if (savedLinksApplicable) branches.push(savedLinkBranch(userId, query));
    const combined = Prisma.join(branches, ' UNION ALL ');

    const filters: Prisma.Sql[] = [];
    if (cat) filters.push(Prisma.sql`category_name = ${cat}`);
    if (sourceId) filters.push(Prisma.sql`source_id = ${sourceId}`);
    if (readBool !== undefined) filters.push(Prisma.sql`read = ${readBool}`);
    if (sinceDate) filters.push(Prisma.sql`pub_date >= ${sinceDate}`);
    const whereClause = filters.length > 0 ? Prisma.sql`WHERE ${Prisma.join(filters, ' AND ')}` : Prisma.empty;

    const orderBy = hasQuery
        ? Prisma.sql`ORDER BY rank DESC, pub_date DESC NULLS LAST`
        : Prisma.sql`ORDER BY pub_date DESC NULLS LAST`;

    const totalCountSelect = includeTotalCount
        ? Prisma.sql`, count(*) OVER()::int AS total_count`
        : Prisma.empty;

    const finalQuery = Prisma.sql`
        WITH combined AS (${combined})
        SELECT *${totalCountSelect}
        FROM combined
        ${whereClause}
        ${orderBy}
        LIMIT ${cappedLimit} OFFSET ${cappedOffset}
    `;

    const rows = await prisma.$queryRaw<RawRow[]>(finalQuery);

    const hits: SearchHit[] = rows.map(row => {
        const isSavedLink = row.type === 'savedLink';
        const title = row.title && row.title.length > 0
            ? row.title
            : (isSavedLink ? hostnameLabel(row.link) : (row.title ?? ''));
        return {
            id: row.id,
            type: row.type,
            link: row.link,
            title,
            pubDate: row.pub_date ? row.pub_date.getTime() : null,
            content: row.content,
            description: row.description,
            sourceTitle: row.source_title ?? undefined,
            sourceSlug: row.source_slug ?? undefined,
            categoryName: row.category_name ?? undefined,
            read: row.read ?? undefined,
            savedAt: row.saved_at ? row.saved_at.getTime() : null,
            _formatted: {
                title: row.title_hl || undefined,
                content: row.content_hl || undefined,
                description: row.description_hl || undefined,
            },
        };
    });

    return {
        hits,
        estimatedTotalHits: includeTotalCount ? (rows[0]?.total_count ?? 0) : 0,
        processingTimeMs: Math.round(performance.now() - start),
    };
}
