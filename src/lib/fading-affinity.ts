import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { redis } from '@/lib/redis'
import { affinityWeight, applyAssociativeTouch, extractKeywords, retrievability } from '@/lib/fading'
import {
  ASSOCIATIVE_COOLDOWN_SECONDS,
  ASSOCIATIVE_EVENTS,
  ASSOCIATIVE_NEIGHBORS,
  MIN_AFFINITY,
  type FadingEvent,
} from '@/lib/fading-params'
import type { SavedItemKind, SavedItemRef } from '@/lib/fading-touch'
import { getHost } from '@/lib/utils'

/** Upper bound on candidate rows scored in JS for one touch. */
const MAX_CANDIDATES = 200

export interface Affinity {
  ref: SavedItemRef
  weight: number
  stability: number
  lastTouchedAt: Date
}

interface SourceItem {
  host: string
  sourceId: string | null
  keywords: string[]
  tagIds: string[]
}

interface CandidateRow {
  kind: SavedItemKind
  id: string
  stability: number
  touched_at: Date
  shared_tags: bigint | number
  same_site: boolean
  matched: bigint | number
}

// Host of a URL in SQL, matching getHost(): no scheme, credentials, port or leading "www.".
const hostSql = (column: Prisma.Sql) => Prisma.sql`
  lower(regexp_replace(substring(${column} from '^[a-zA-Z][a-zA-Z0-9+.-]*://(?:[^/?#@]*@)?([^/?#:]+)'), '^www\\.', ''))`

// Number of keywords found in a tsvector. Keywords are letters and digits
// only (extractKeywords) and are bound parameters, never SQL text.
const matchedSql = (vector: Prisma.Sql, keywords: string[]) => keywords.length === 0
  ? Prisma.sql`0`
  : Prisma.sql`(SELECT count(*) FROM unnest(${keywords}::text[]) AS w WHERE ${vector} @@ plainto_tsquery('simple', w))`

/**
 * What still exists of the touched item. Affinity is computed from the text
 * the item has left, so a fading item loses its associations too: a TRACE has
 * no words, only tags and site.
 */
async function loadSource(userId: string, ref: SavedItemRef): Promise<SourceItem | null> {
  if (ref.kind === 'link') {
    const link = await prisma.savedLink.findFirst({
      where: { id: ref.id, userId },
      select: { url: true, title: true, stage: true, tags: { select: { tagId: true } } },
    })
    if (!link) return null
    return {
      host: getHost(link.url),
      sourceId: null,
      keywords: link.stage === 'TRACE' ? [] : extractKeywords(link.title),
      tagIds: link.tags.map(t => t.tagId),
    }
  }
  const item = await prisma.feedItem.findFirst({
    where: { id: ref.id, savedAt: { not: null }, source: { category: { userId } } },
    select: { link: true, title: true, saveStage: true, sourceId: true, tags: { select: { tagId: true } } },
  })
  if (!item) return null
  return {
    host: getHost(item.link),
    sourceId: item.sourceId,
    keywords: item.saveStage === 'TRACE' ? [] : extractKeywords(item.title),
    tagIds: item.tags.map(t => t.tagId),
  }
}

/**
 * The user's saved items most related to `ref`, strongest first, at most `k`.
 * Only owned, still-saved items; never `ref` itself. Ties go to the item that
 * is closer to fading.
 */
export async function findAffinities(
  userId: string,
  ref: SavedItemRef,
  k: number,
  now: Date,
): Promise<Affinity[]> {
  const source = await loadSource(userId, ref)
  if (!source) return []

  const { host, sourceId, keywords, tagIds } = source
  const excludeLink = ref.kind === 'link' ? ref.id : ''
  const excludeArticle = ref.kind === 'article' ? ref.id : ''

  // Articles: VIVID matches on title and content, GIST on the title only (what
  // the saved list still shows), TRACE on nothing.
  const articleMatched = keywords.length === 0
    ? Prisma.sql`0`
    : Prisma.sql`CASE fi."saveStage"
        WHEN 'TRACE' THEN 0
        WHEN 'GIST' THEN ${matchedSql(Prisma.sql`to_tsvector('simple', fi.title)`, keywords)}
        ELSE ${matchedSql(Prisma.sql`fi."searchVector"`, keywords)}
      END`

  const rows = await prisma.$queryRaw<CandidateRow[]>`
    SELECT * FROM (
      SELECT 'link'::text AS kind, sl.id, sl.stability, sl."lastTouchedAt" AS touched_at,
        (SELECT count(*) FROM "SavedLinkTag" t
          WHERE t."savedLinkId" = sl.id AND t."tagId" = ANY(${tagIds}::text[])) AS shared_tags,
        (${hostSql(Prisma.sql`sl.url`)} = ${host}) AS same_site,
        ${matchedSql(Prisma.sql`sl."searchVector"`, keywords)} AS matched
      FROM "SavedLink" sl
      WHERE sl."userId" = ${userId} AND sl.id <> ${excludeLink}
      UNION ALL
      SELECT 'article'::text AS kind, fi.id, fi."saveStability" AS stability, fi."saveTouchedAt" AS touched_at,
        (SELECT count(*) FROM "FeedItemTag" t
          WHERE t."feedItemId" = fi.id AND t."tagId" = ANY(${tagIds}::text[])) AS shared_tags,
        (${hostSql(Prisma.sql`fi.link`)} = ${host} OR fi."sourceId" = ${sourceId ?? ''}) AS same_site,
        ${articleMatched} AS matched
      FROM "FeedItem" fi
      JOIN "FeedSource" fs ON fs.id = fi."sourceId"
      JOIN "Category" c ON c.id = fs."categoryId"
      WHERE c."userId" = ${userId} AND fi."savedAt" IS NOT NULL
        AND fi."saveStability" IS NOT NULL AND fi."saveTouchedAt" IS NOT NULL
        AND fi.id <> ${excludeArticle}
    ) candidates
    WHERE shared_tags > 0 OR matched > 0
    LIMIT ${MAX_CANDIDATES}
  `

  const affinities: Affinity[] = rows.map(row => ({
    ref: { kind: row.kind, id: row.id },
    weight: affinityWeight({
      sharedTags: Number(row.shared_tags),
      sameSite: row.same_site,
      textRank: keywords.length > 0 ? Number(row.matched) / keywords.length : 0,
    }),
    stability: row.stability,
    lastTouchedAt: row.touched_at,
  }))

  return affinities
    .filter(a => a.weight >= MIN_AFFINITY)
    .sort((a, b) => b.weight - a.weight || retrievability(a, now) - retrievability(b, now))
    .slice(0, k)
}

/**
 * After a strong touch on `ref`, gives its most related saved items a weaker
 * associative touch (stability only, see applyAssociativeTouch). One hop: this
 * never calls recordSavedTouch, so associations don't cascade. Each item gets
 * at most one associative touch per ASSOCIATIVE_COOLDOWN_SECONDS, so a generic
 * "hub" item can't be kept alive forever by its neighbours. Never reveals why
 * an item gained life. Returns the number of items touched.
 */
export async function propagateAssociativeTouch(
  userId: string,
  ref: SavedItemRef,
  event: FadingEvent,
  now: Date,
): Promise<number> {
  if (!ASSOCIATIVE_EVENTS.includes(event)) return 0

  const neighbours = await findAffinities(userId, ref, ASSOCIATIVE_NEIGHBORS, now)
  let touched = 0
  for (const neighbour of neighbours) {
    const claimed = await redis.set(
      `fading:assoc:${neighbour.ref.kind}:${neighbour.ref.id}`, '1', 'EX', ASSOCIATIVE_COOLDOWN_SECONDS, 'NX',
    )
    if (claimed !== 'OK') continue

    const next = applyAssociativeTouch(neighbour, event, neighbour.weight, now)
    if (next.stability === neighbour.stability) continue

    // Compare-and-set on the stability read, like recordSavedTouch.
    const { count } = neighbour.ref.kind === 'link'
      ? await prisma.savedLink.updateMany({
          where: { id: neighbour.ref.id, userId, stability: neighbour.stability },
          data: { stability: next.stability },
        })
      : await prisma.feedItem.updateMany({
          where: {
            id: neighbour.ref.id,
            savedAt: { not: null },
            source: { category: { userId } },
            saveStability: neighbour.stability,
          },
          data: { saveStability: next.stability },
        })
    touched += count
  }
  return touched
}
