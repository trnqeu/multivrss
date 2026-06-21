import { prisma } from '@/lib/prisma';
import { meili } from '@/lib/meili';
import type { SearchHit } from '@/lib/meili';
import { cacheLife, cacheTag } from 'next/cache';

export type FrontPageItem = SearchHit & {
    categoryName: string;
    reason: string;
    reasonType: 'source' | 'similar';
    affinity: number;
};

export type FrontPage = {
    forYou: FrontPageItem[];
    sections: { category: string; items: FrontPageItem[] }[];
    stats: { read: number; saved: number; categories: number };
};

const RECO_LOOKBACK_DAYS = 30;
const SEED_LIMIT = 12;
const PER_CATEGORY = 5;
const FORYOU_COUNT = 4;

async function getSourcesForUser(userId: string) {
    'use cache';
    cacheLife('minutes');
    cacheTag(`sources:${userId}`);
    return prisma.feedSource.findMany({
        where: { category: { userId } },
        select: { id: true, title: true, category: { select: { name: true } } },
    });
}

export async function getFrontPage(userId: string): Promise<FrontPage> {
    'use cache';
    cacheLife('days');
    const dateKey = new Date().toISOString().split('T')[0];
    cacheTag(`frontpage:${userId}:${dateKey}`);

    const sources = await getSourcesForUser(userId);
    if (sources.length === 0) {
        return { forYou: [], sections: [], stats: { read: 0, saved: 0, categories: 0 } };
    }

    const sourceIds = sources.map(s => s.id);
    const sourceName = new Map(sources.map(s => [s.id, s.title ?? '']));
    const sourceCat = new Map(sources.map(s => [s.id, s.category.name]));
    const ownershipFilter = sourceIds.map(id => `sourceId = "${id}"`).join(' OR ');
    const since = Date.now() - RECO_LOOKBACK_DAYS * 86_400_000;

    const [recentSaved, recentRead, readCount, savedCount] = await Promise.all([
        prisma.feedItem.findMany({
            where: { source: { id: { in: sourceIds } }, savedAt: { not: null } },
            orderBy: { savedAt: 'desc' }, take: SEED_LIMIT,
            select: { id: true, title: true, sourceId: true },
        }),
        prisma.feedItem.findMany({
            where: { source: { id: { in: sourceIds } }, read: true },
            orderBy: { updatedAt: 'desc' }, take: SEED_LIMIT,
            select: { id: true, title: true, sourceId: true },
        }),
        prisma.feedItem.count({ where: { source: { id: { in: sourceIds } }, read: true } }),
        prisma.feedItem.count({ where: { source: { id: { in: sourceIds } }, savedAt: { not: null } } }),
    ]);

    const seen = new Set([...recentSaved, ...recentRead].map(i => i.id));
    const pick = new Map<string, FrontPageItem>();

    // ── ENGINE A: SOURCE AFFINITY ──
    // Rank sources by interaction frequency, then fetch their freshest unread items in parallel.
    const affinityBySource = new Map<string, number>();
    for (const i of recentSaved) affinityBySource.set(i.sourceId, (affinityBySource.get(i.sourceId) ?? 0) + 2);
    for (const i of recentRead)  affinityBySource.set(i.sourceId, (affinityBySource.get(i.sourceId) ?? 0) + 1);
    const topSources = [...affinityBySource.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
    const maxAff = topSources[0]?.[1] ?? 1;

    const freshBySource = await Promise.all(
        topSources.map(([sid]) =>
            prisma.feedItem.findMany({
                where: { sourceId: sid, read: false, savedAt: null, pubDate: { gte: new Date(since) } },
                orderBy: { pubDate: 'desc' }, take: 2,
                select: { id: true, title: true, link: true, content: true, pubDate: true },
            })
        )
    );

    for (let i = 0; i < topSources.length; i++) {
        const [sid, score] = topSources[i];
        const savedFromSrc = recentSaved.filter(r => r.sourceId === sid).length;
        for (const f of freshBySource[i]) {
            if (seen.has(f.id) || pick.has(f.id)) continue;
            pick.set(f.id, {
                id: f.id, link: f.link, title: f.title, content: f.content ?? undefined,
                pubDate: f.pubDate ? f.pubDate.getTime() : null,
                sourceTitle: sourceName.get(sid) ?? undefined, categoryName: sourceCat.get(sid) ?? '—',
                read: false, savedAt: null,
                reasonType: 'source',
                reason: savedFromSrc > 0
                    ? `You saved ${savedFromSrc} from ${sourceName.get(sid)}`
                    : `From ${sourceName.get(sid)}, which you read often`,
                affinity: Math.round(55 + 40 * (score / maxAff)),
            });
        }
    }

    // ── ENGINE B: MEILISEARCH SIMILARITY ──
    // Batch all seed queries into a single multiSearch round-trip.
    const seeds = [...recentSaved, ...recentRead].slice(0, SEED_LIMIT);
    const savedIds = new Set(recentSaved.map(i => i.id));

    if (seeds.length > 0) {
        try {
            const multiResult = await meili.multiSearch({
                queries: seeds.map(seed => ({
                    indexUid: 'items',
                    q: seed.title,
                    limit: 4,
                    filter: [`(${ownershipFilter})`, 'read = false', 'savedAt IS NULL'],
                    showRankingScore: true,
                    attributesToRetrieve: ['id', 'link', 'title', 'content', 'pubDate', 'sourceTitle', 'categoryName'],
                })),
            });

            for (let i = 0; i < seeds.length; i++) {
                const seed = seeds[i];
                const hits = multiResult.results[i].hits as (SearchHit & { _rankingScore?: number })[];
                for (const hit of hits) {
                    if (seen.has(hit.id) || pick.has(hit.id)) continue;
                    const score = hit._rankingScore ?? 0;
                    if (score < 0.4) continue;
                    pick.set(hit.id, {
                        ...hit,
                        categoryName: hit.categoryName ?? '—',
                        read: false, savedAt: null,
                        reasonType: 'similar',
                        reason: `Similar to "${truncate(seed.title)}" you ${savedIds.has(seed.id) ? 'saved' : 'read'}`,
                        affinity: Math.round(score * 100),
                    });
                }
            }
        } catch {
            // Meili unavailable — skip similarity engine
        }
    }

    // ── MERGE → RANK → GROUP ──
    const all = [...pick.values()].sort(byAffinity);

    // forYou: top N globals (highest affinity across all categories)
    const forYou = all.slice(0, FORYOU_COUNT);
    const forYouIds = new Set(forYou.map(i => i.id));
    // Track all picked IDs to avoid duplicates in the random fill
    const shownIds = new Set(all.map(i => i.id));

    // Group remaining by category (exclude forYou items to prevent duplicates)
    const byCat = new Map<string, FrontPageItem[]>();
    for (const it of all) {
        if (forYouIds.has(it.id)) continue;
        const arr = byCat.get(it.categoryName) ?? [];
        arr.push(it);
        byCat.set(it.categoryName, arr);
    }

    // Build category → sourceIds map covering ALL user categories, not just those with picks
    const catSourceIds = new Map<string, string[]>();
    for (const s of sources) {
        const arr = catSourceIds.get(s.category.name) ?? [];
        arr.push(s.id);
        catSourceIds.set(s.category.name, arr);
    }
    // Ensure every category appears in byCat even if it has no affinity/similarity picks
    for (const cat of catSourceIds.keys()) {
        if (!byCat.has(cat)) byCat.set(cat, []);
    }

    // Fill each category up to PER_CATEGORY with random unread items
    const categoriesNeedingFill = [...byCat.entries()].filter(([, items]) => items.length < PER_CATEGORY);
    if (categoriesNeedingFill.length > 0) {
        const fillResults = await Promise.all(
            categoriesNeedingFill.map(async ([cat, existing]) => {
                const needed = PER_CATEGORY - existing.length;
                const sids = catSourceIds.get(cat) ?? [];
                const candidates = await prisma.feedItem.findMany({
                    where: {
                        sourceId: { in: sids },
                        read: false,
                        savedAt: null,
                        id: { notIn: [...shownIds] },
                    },
                    take: needed * 4,
                    orderBy: { pubDate: 'desc' },
                    select: { id: true, title: true, link: true, content: true, pubDate: true, sourceId: true },
                });
                return { cat, existing, needed, candidates };
            })
        );

        for (const { cat, existing, needed, candidates } of fillResults) {
            // Shuffle for daily variety, take only what's needed
            const shuffled = candidates.sort(() => Math.random() - 0.5).slice(0, needed);
            for (const f of shuffled) {
                shownIds.add(f.id);
                existing.push({
                    id: f.id, link: f.link, title: f.title, content: f.content ?? undefined,
                    pubDate: f.pubDate ? f.pubDate.getTime() : null,
                    sourceTitle: sourceName.get(f.sourceId) ?? undefined,
                    categoryName: cat,
                    read: false, savedAt: null,
                    reasonType: 'source',
                    reason: `Fresh from ${sourceName.get(f.sourceId) ?? 'your feed'}`,
                    affinity: 40,
                });
            }
        }
    }

    const sections = [...byCat.entries()]
        .map(([category, items]) => ({ category, items }))
        .filter(s => s.items.length > 0)
        .sort((a, b) => b.items[0].affinity - a.items[0].affinity);

    return {
        forYou,
        sections,
        stats: { read: readCount, saved: savedCount, categories: sections.length },
    };
}

const byAffinity = (a: FrontPageItem, b: FrontPageItem) => b.affinity - a.affinity;
const truncate = (s: string, n = 40) => (s.length > n ? s.slice(0, n - 1) + '…' : s);
