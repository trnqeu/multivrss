import { prisma } from "@/lib/prisma";
import { meili, HIGHLIGHT_PRE, HIGHLIGHT_POST, type SearchHit, type SearchResult } from "@/lib/meili";
import { cacheLife, cacheTag } from 'next/cache';

async function getSourcesForUser(userId: string) {
    'use cache';
    cacheLife('minutes');
    cacheTag(`sources:${userId}`);
    return prisma.feedSource.findMany({
        where: { category: { userId } },
        select: { id: true, category: { select: { name: true } } },
    });
}

export { HIGHLIGHT_PRE, HIGHLIGHT_POST };
export type { SearchHit, SearchResult };

export async function searchFeedItemsForUser(
    userId: string,
    query: string,
    cat?: string,
    since?: string,
    limit = 30,
    offset = 0,
    sourceId?: string,
): Promise<SearchResult> {
    const sources = await getSourcesForUser(userId);

    if (sources.length === 0) {
        return { hits: [], estimatedTotalHits: 0, processingTimeMs: 0, facetDistribution: null };
    }

    // Validate cat against user's actual categories to prevent filter injection
    const validCategoryNames = new Set(sources.map(s => s.category.name));
    const resolvedCat = (cat && validCategoryNames.has(cat)) ? cat : undefined;

    const ownershipFilter = sources.map((s) => `sourceId = "${s.id}"`).join(" OR ");
    const filter: string[] = [`(${ownershipFilter})`];

    if (since) {
        const now = Date.now();
        const sinceMap: Record<string, number> = {
            '24h': now - 24 * 60 * 60 * 1000,
            '7d': now - 7 * 24 * 60 * 60 * 1000,
            'today': new Date().setHours(0, 0, 0, 0),
        };
        const epoch = sinceMap[since];
        if (epoch !== undefined) filter.push(`pubDate > ${epoch}`);
    }

    if (resolvedCat) {
        filter.push(`categoryName = "${resolvedCat}"`);
    }

    if (sourceId) {
        filter.push(`sourceId = "${sourceId}"`);
    }

    const results = await meili.index("items").search(query, {
        limit: Math.min(limit, 200),
        offset,
        filter,
        sort: ["pubDate:desc"],
        facets: ["categoryName", "sourceTitle"],
        attributesToHighlight: ["title", "content"],
        attributesToCrop: ["content"],
        cropLength: 100,
        highlightPreTag: HIGHLIGHT_PRE,
        highlightPostTag: HIGHLIGHT_POST,
    });

    return {
        hits: results.hits as SearchHit[],
        estimatedTotalHits: results.estimatedTotalHits ?? 0,
        processingTimeMs: results.processingTimeMs,
        facetDistribution: results.facetDistribution ?? null,
    };
}
