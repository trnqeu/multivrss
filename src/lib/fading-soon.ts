import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { savedFadingMode } from '@/lib/fading-config'
import {
  FADING_SOON_DAYS,
  FORGOTTEN_BELOW_R,
  GIST_BELOW_R,
  MS_PER_DAY,
  TRACE_BELOW_R,
} from '@/lib/fading-params'
import type { SavedItemKind } from '@/lib/fading-touch'
import type { SavedStageVM, TagVM } from '@/app/u/[username]/saved/SavedView'

/** At most this many items in "Fading soon": keeping is one at a time, not a backlog. */
export const FADING_SOON_LIMIT = 20

export interface FadingSoonItem {
  kind: SavedItemKind
  id: string
  /** Null for a link whose title is gone or was never set. */
  title: string | null
  url: string
  sourceTitle: string | null
  stage: SavedStageVM
  savedAt: Date
  /** When the next stage transition happens (may be past if the nightly job hasn't run yet). */
  dueAt: Date
  /** Whole days until dueAt, rounded up; 0 when due today or overdue. Computed on the server so it can't differ between render and hydration. */
  daysLeft: number
  tags: TagVM[]
}

interface Row {
  kind: SavedItemKind
  id: string
  title: string | null
  url: string
  source_title: string | null
  stage: SavedStageVM
  saved_at: Date
  due_at: Date
}

// Days from the last touch to the next transition, per stage, in units of stability:
// nextStageAt() in src/lib/fading.ts, written as SQL.
function dueSql(stage: Prisma.Sql, touchedAt: Prisma.Sql, stability: Prisma.Sql): Prisma.Sql {
  return Prisma.sql`${touchedAt} + make_interval(secs => ${stability} * 86400 * CASE ${stage}
    WHEN 'VIVID' THEN ${-Math.log(GIST_BELOW_R)}::float8
    WHEN 'GIST' THEN ${-Math.log(TRACE_BELOW_R)}::float8
    ELSE ${-Math.log(FORGOTTEN_BELOW_R)}::float8
  END)`
}

/**
 * The user's saved items whose next transition falls within FADING_SOON_DAYS,
 * soonest first, at most FADING_SOON_LIMIT. Null when fading is off for the
 * instance or the user (the section is not shown at all).
 */
export async function fetchFadingSoon(userId: string, now: Date = new Date()): Promise<FadingSoonItem[] | null> {
  if (savedFadingMode() === 'off') return null
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { savedFading: true } })
  if (!user?.savedFading) return null

  const horizon = new Date(now.getTime() + FADING_SOON_DAYS * MS_PER_DAY)
  const linkDue = dueSql(Prisma.sql`sl.stage::text`, Prisma.sql`sl."lastTouchedAt"`, Prisma.sql`sl.stability`)
  const articleDue = dueSql(
    Prisma.sql`COALESCE(fi."saveStage"::text, 'VIVID')`, Prisma.sql`fi."saveTouchedAt"`, Prisma.sql`fi."saveStability"`,
  )

  const rows = await prisma.$queryRaw<Row[]>`
    SELECT * FROM (
      SELECT 'link'::text AS kind, sl.id, sl.title, sl.url, NULL::text AS source_title,
        sl.stage::text AS stage, sl."createdAt" AS saved_at, ${linkDue} AS due_at
      FROM "SavedLink" sl
      WHERE sl."userId" = ${userId}
      UNION ALL
      SELECT 'article'::text AS kind, fi.id, fi.title, fi.link AS url, fs.title AS source_title,
        COALESCE(fi."saveStage"::text, 'VIVID') AS stage, fi."savedAt" AS saved_at, ${articleDue} AS due_at
      FROM "FeedItem" fi
      JOIN "FeedSource" fs ON fs.id = fi."sourceId"
      JOIN "Category" c ON c.id = fs."categoryId"
      WHERE c."userId" = ${userId} AND fi."savedAt" IS NOT NULL
        AND fi."saveStability" IS NOT NULL AND fi."saveTouchedAt" IS NOT NULL
    ) items
    WHERE due_at <= ${horizon}::timestamp
    ORDER BY due_at ASC
    LIMIT ${FADING_SOON_LIMIT}
  `
  if (rows.length === 0) return []

  const linkIds = rows.filter(r => r.kind === 'link').map(r => r.id)
  const articleIds = rows.filter(r => r.kind === 'article').map(r => r.id)
  const [linkTags, articleTags] = await Promise.all([
    linkIds.length > 0
      ? prisma.savedLinkTag.findMany({ where: { savedLinkId: { in: linkIds } }, select: { savedLinkId: true, tag: { select: { id: true, name: true } } } })
      : [],
    articleIds.length > 0
      ? prisma.feedItemTag.findMany({ where: { feedItemId: { in: articleIds } }, select: { feedItemId: true, tag: { select: { id: true, name: true } } } })
      : [],
  ])
  const tagsOf = new Map<string, TagVM[]>()
  const add = (key: string, tag: TagVM) => tagsOf.set(key, [...(tagsOf.get(key) ?? []), tag])
  for (const t of linkTags) add(`link:${t.savedLinkId}`, t.tag)
  for (const t of articleTags) add(`article:${t.feedItemId}`, t.tag)

  return rows.map(row => ({
    kind: row.kind,
    id: row.id,
    title: row.title,
    url: row.url,
    sourceTitle: row.source_title,
    stage: row.stage,
    savedAt: row.saved_at,
    dueAt: row.due_at,
    daysLeft: Math.max(0, Math.ceil((row.due_at.getTime() - now.getTime()) / MS_PER_DAY)),
    tags: tagsOf.get(`${row.kind}:${row.id}`) ?? [],
  }))
}
