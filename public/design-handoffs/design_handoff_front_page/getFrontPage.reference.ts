import { prisma } from '@/lib/prisma';
import { meili } from '@/lib/meili';
import type { SearchHit } from '@/lib/meili';
import { cacheLife, cacheTag } from 'next/cache';

/**
 * REFERENCE — server-side data for the personalized FRONT PAGE.
 * ─────────────────────────────────────────────────────────────
 * Design-reference code for the existing Next.js 16 / React 19 codebase.
 * Drop near src/lib/frontpage.ts and call from the dashboard server component
 * (or expose as a server action in src/app/actions.ts).
 *
 * TWO ENGINES feed the page (exactly the two the product owner specified):
 *   (A) SOURCE affinity   — items from feeds the user reads/saves from a lot.
 *   (B) SIMILARITY (Meili) — take the user's most recent read/saved items,
 *                            use them as queries against Meilisearch, drop
 *                            anything already read or saved, keep the most
 *                            relevant. Reuses the same index + ownership
 *                            filter as src/lib/search.ts.
 *
 * Every returned item is tagged `reasonType: 'source' | 'similar'` and a
 * `reason` string + `affinity` 0–100 so the UI can render the "why".
 */

export type FrontPageItem = SearchHit & {
  categoryName: string;
  reason: string;
  reasonType: 'source' | 'similar';
  affinity: number;          // 0–100
};

export type FrontPage = {
  forYou: FrontPageItem[];                       // top picks across all categories
  sections: { category: string; items: FrontPageItem[] }[];
  stats: { read: number; saved: number; categories: number };
};

const RECO_LOOKBACK_DAYS = 30;
const SEED_LIMIT = 12;        // how many recent read/saved items seed the similarity engine
const PER_CATEGORY = 5;       // items shown per category section
const FORYOU_COUNT = 4;       // hero + secondary picks

// ── ownership filter, same shape as lib/search.ts ──
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
  const sources = await getSourcesForUser(userId);
  if (sources.length === 0) return { forYou: [], sections: [], stats: { read: 0, saved: 0, categories: 0 } };

  const sourceIds = sources.map(s => s.id);
  const sourceName = new Map(sources.map(s => [s.id, s.title]));
  const sourceCat  = new Map(sources.map(s => [s.id, s.category.name]));
  const ownershipFilter = sourceIds.map(id => `sourceId = "${id}"`).join(' OR ');
  const since = Date.now() - RECO_LOOKBACK_DAYS * 86_400_000;

  // The user's interaction history (used to BUILD recommendations and to EXCLUDE seen items).
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
  const pick = new Map<string, FrontPageItem>(); // id → item (dedupe across engines)

  // ════════ ENGINE A — SOURCE AFFINITY ════════
  // Rank sources by how often the user reads/saves from them, then pull each
  // source's freshest UNREAD + UNSAVED items.
  const affinityBySource = new Map<string, number>();
  for (const i of recentSaved) affinityBySource.set(i.sourceId, (affinityBySource.get(i.sourceId) ?? 0) + 2); // a save weighs more
  for (const i of recentRead)  affinityBySource.set(i.sourceId, (affinityBySource.get(i.sourceId) ?? 0) + 1);
  const topSources = [...affinityBySource.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  const maxAff = topSources[0]?.[1] ?? 1;

  for (const [sid, score] of topSources) {
    const fresh = await prisma.feedItem.findMany({
      where: { sourceId: sid, read: false, savedAt: null, pubDate: { gte: new Date(since) } },
      orderBy: { pubDate: 'desc' }, take: 2,
      select: { id: true, title: true, link: true, content: true, pubDate: true },
    });
    const savedFromSrc = recentSaved.filter(i => i.sourceId === sid).length;
    for (const f of fresh) {
      if (seen.has(f.id) || pick.has(f.id)) continue;
      pick.set(f.id, {
        id: f.id, link: f.link, title: f.title, content: f.content ?? undefined,
        pubDate: f.pubDate ? f.pubDate.getTime() : null,
        sourceTitle: sourceName.get(sid), categoryName: sourceCat.get(sid) ?? '—',
        read: false, savedAt: null,
        reasonType: 'source',
        reason: savedFromSrc > 0
          ? `You saved ${savedFromSrc} from ${sourceName.get(sid)}`
          : `From ${sourceName.get(sid)}, which you read often`,
        affinity: Math.round(55 + 40 * (score / maxAff)), // 55–95 band
      });
    }
  }

  // ════════ ENGINE B — MEILISEARCH SIMILARITY ════════
  // Each recent saved/read title becomes a query. Filter to the user's own
  // sources, exclude read & saved, ask Meili for a ranking score.
  const seeds = [...recentSaved, ...recentRead].slice(0, SEED_LIMIT);
  for (const seed of seeds) {
    const res = await meili.index('items').search(seed.title, {
      limit: 4,
      filter: [`(${ownershipFilter})`, 'read = false', 'savedAt IS NULL'],
      showRankingScore: true,                 // gives hit._rankingScore ∈ [0,1]
      attributesToRetrieve: ['id', 'link', 'title', 'content', 'pubDate', 'sourceTitle', 'categoryName'],
    });
    for (const hit of res.hits as (SearchHit & { _rankingScore?: number })[]) {
      if (seen.has(hit.id) || pick.has(hit.id)) continue;
      const score = hit._rankingScore ?? 0;
      if (score < 0.4) continue;              // relevance floor — avoid weak matches
      pick.set(hit.id, {
        ...hit,
        categoryName: hit.categoryName ?? '—',
        read: false, savedAt: null,
        reasonType: 'similar',
        reason: `Similar to “${truncate(seed.title)}” you ${recentSaved.includes(seed) ? 'saved' : 'read'}`,
        affinity: Math.round(score * 100),
      });
    }
  }

  // ════════ MERGE → GROUP → RANK ════════
  const all = [...pick.values()];
  const byCat = new Map<string, FrontPageItem[]>();
  for (const it of all) {
    const arr = byCat.get(it.categoryName) ?? [];
    arr.push(it); byCat.set(it.categoryName, arr);
  }
  const sections = [...byCat.entries()]
    .map(([category, items]) => ({ category, items: items.sort(byAffinity).slice(0, PER_CATEGORY) }))
    .filter(s => s.items.length > 0)
    .sort((a, b) => b.items[0].affinity - a.items[0].affinity);

  const forYou = all.sort(byAffinity).slice(0, FORYOU_COUNT);

  return {
    forYou,
    sections,
    stats: { read: readCount, saved: savedCount, categories: sections.length },
  };
}

const byAffinity = (a: FrontPageItem, b: FrontPageItem) => b.affinity - a.affinity;
const truncate = (s: string, n = 40) => (s.length > n ? s.slice(0, n - 1) + '…' : s);

/*
NOTES / DECISIONS FOR THE IMPLEMENTER
─────────────────────────────────────
• Index settings already declare `read` and `savedAt` as filterable
  (see lib/meili.ts → configureMeiliIndex). `savedAt IS NULL` requires
  Meilisearch ≥ 1.2; if your version differs, store a boolean `saved`
  flag in the index instead and filter `saved = false`.
• `showRankingScore` must be enabled per-query (done above). The 0.4 floor
  is a starting point — tune against real data.
• This runs several Meili calls (one per seed). For SEED_LIMIT≈12 that's fine
  on a warm index; if it gets heavy, use `meili.multiSearch({ queries: [...] })`
  to batch them in one round-trip.
• Cache the whole result per user with `cacheLife('minutes')` +
  `cacheTag('frontpage:${userId}')`, and bust it from markAsRead / saveFeedItem /
  syncAllFeeds the same way the sidebar cache is busted.
• Empty state: if `forYou` and `sections` are both empty (new user, no history),
  fall back to newest-per-category so the page is never blank.
*/
