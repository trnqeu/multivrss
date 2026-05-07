import { prisma } from "@/lib/prisma";
import { meili, HIGHLIGHT_PRE, HIGHLIGHT_POST } from "@/lib/meili";

export { HIGHLIGHT_PRE, HIGHLIGHT_POST };

export type SearchHit = {
    id: string;
    link: string;
    title: string;
    pubDate: number | null;
    content?: string;
    sourceTitle?: string;
    categoryId?: string;
    categoryName?: string;
    _formatted?: {
        title?: string;
        content?: string;
    };
};

export type SearchResult = {
    hits: SearchHit[];
    estimatedTotalHits: number;
    processingTimeMs: number;
    facetDistribution: Record<string, Record<string, number>> | null;
};

export async function searchFeedItemsForUser(
    userId: string,
    query: string,
    cat?: string,
    limit = 30,
): Promise<SearchResult> {
    const sources = await prisma.feedSource.findMany({
        where: { category: { userId } },
        select: { id: true, category: { select: { name: true } } },
    });

    if (sources.length === 0) {
        return { hits: [], estimatedTotalHits: 0, processingTimeMs: 0, facetDistribution: null };
    }

    // Validate cat against user's actual categories to prevent filter injection
    const validCategoryNames = new Set(sources.map(s => s.category.name));
    const resolvedCat = (cat && validCategoryNames.has(cat)) ? cat : undefined;

    const ownershipFilter = sources.map((s) => `sourceId = "${s.id}"`).join(" OR ");
    const filter: string[] = [`(${ownershipFilter})`];
    if (resolvedCat) {
        filter.push(`categoryName = "${resolvedCat}"`);
    }

    const results = await meili.index("items").search(query, {
        limit: Math.min(limit, 200),
        filter,
        sort: ["pubDate:desc"],
        facets: ["categoryName"],
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
