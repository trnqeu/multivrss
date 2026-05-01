import { prisma } from "@/lib/prisma";
import { meili } from "@/lib/meili";

export type SearchHit = {
    id: string;
    link: string;
    title: string;
    pubDate: number | null;
    content?: string;
};

export async function searchFeedItemsForUser(userId: string, query: string): Promise<SearchHit[]> {
    const sources = await prisma.feedSource.findMany({
        where: { category: { userId } },
        select: { id: true },
    });

    if (sources.length === 0) {
        return [];
    }

    const filter = sources.map((source) => `sourceId = "${source.id}"`).join(" OR ");

    const results = await meili.index("items").search(query, {
        limit: 50,
        filter,
        sort: ["pubDate:desc"],
    });

    return results.hits as SearchHit[];
}
