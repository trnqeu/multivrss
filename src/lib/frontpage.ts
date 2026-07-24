import { prisma } from '@/lib/prisma';
import { cacheLife, cacheTag } from 'next/cache';

type FrontPageBaseItem = {
    id: string;
    link: string;
    title: string;
    pubDate: number | null;
    content?: string;
    sourceTitle?: string;
};

export type FrontPageItem = FrontPageBaseItem & {
    categoryName: string;
    read: boolean;
    savedAt: number | null;
    reason: string;
    // 'similar' (Meilisearch-based Engine B) is disabled, not removed
    // conceptually — restore if a Postgres-based similarity engine replaces it.
    reasonType: 'source';
    affinity: number;
};

export type FrontPage = {
    forYouPool: FrontPageItem[];
    sections: { category: string; items: FrontPageItem[]; totalCount: number }[];
    stats: { read: number; saved: number; categories: number; updatedAt: number | null; dateLabel: string };
};

const RECO_LOOKBACK_DAYS = 30;
const SEED_LIMIT = 12;
const PER_CATEGORY = 5;
const FORYOU_POOL_SIZE = 12;

async function getSourcesForUser(userId: string) {
    'use cache';
    cacheLife('minutes');
    cacheTag(`sources:${userId}`);
    return prisma.feedSource.findMany({
        where: { category: { userId } },
        select: { id: true, title: true, lastSync: true, category: { select: { name: true } } },
    });
}

export async function getFrontPage(userId: string): Promise<FrontPage> {
    'use cache';
    cacheLife('days');
    const now = new Date();
    const dateKey = now.toISOString().split('T')[0];
    cacheTag(`frontpage:${userId}:${dateKey}`);
    const dateLabel = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

    const sources = await getSourcesForUser(userId);
    if (sources.length === 0) {
        return { forYouPool: [], sections: [], stats: { read: 0, saved: 0, categories: 0, updatedAt: null, dateLabel } };
    }
    const updatedAt = sources.reduce<number | null>((latest, s) => {
        if (!s.lastSync) return latest;
        const t = s.lastSync.getTime();
        return latest === null || t > latest ? t : latest;
    }, null);

    const sourceIds = sources.map(s => s.id);
    const sourceName = new Map(sources.map(s => [s.id, s.title ?? '']));
    const sourceCat = new Map(sources.map(s => [s.id, s.category.name]));
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
                where: { sourceId: sid, read: false, savedAt: null, frontPageShownAt: null, pubDate: { gte: new Date(since) } },
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

    // ── MERGE → RANK → GROUP ──
    // Engine B ("similar items", previously Meilisearch multiSearch-based) is
    // temporarily disabled — see FrontPageItem.reasonType. Engine A above is
    // the sole contributor to `pick` for now.
    const all = [...pick.values()].sort(byAffinity);

    // forYouPool: top N globals (highest affinity across all categories), pre-shuffled server-side
    const forYouPool = all.slice(0, FORYOU_POOL_SIZE).sort(() => Math.random() - 0.5);
    const forYouIds = new Set(forYouPool.map(i => i.id));
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
                        frontPageShownAt: null,
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

    const categoryCounts = await prisma.feedItem.groupBy({
        by: ['sourceId'],
        where: { sourceId: { in: sourceIds } },
        _count: { _all: true },
    });
    const catTotal = new Map<string, number>();
    for (const row of categoryCounts) {
        const cat = sourceCat.get(row.sourceId) ?? '—';
        catTotal.set(cat, (catTotal.get(cat) ?? 0) + row._count._all);
    }

    const maxAffinityByCat = new Map([...byCat.entries()].map(([category, items]) => [category, Math.max(...items.map(i => i.affinity))]));
    const sections = [...byCat.entries()]
        .map(([category, items]) => ({
            category,
            items: [...items].sort((a, b) => (b.pubDate ?? 0) - (a.pubDate ?? 0)),
            totalCount: catTotal.get(category) ?? items.length,
        }))
        .filter(s => s.items.length > 0)
        .sort((a, b) => (maxAffinityByCat.get(b.category) ?? 0) - (maxAffinityByCat.get(a.category) ?? 0));

    return {
        forYouPool,
        sections,
        stats: { read: readCount, saved: savedCount, categories: sections.length, updatedAt, dateLabel },
    };
}

const byAffinity = (a: FrontPageItem, b: FrontPageItem) => b.affinity - a.affinity;
