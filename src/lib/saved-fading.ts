import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { savedFadingMode } from '@/lib/fading-config'
import { FORGOTTEN_BELOW_R, GIST_BELOW_R, TRACE_BELOW_R } from '@/lib/fading-params'

// Nightly fading of saved items (see src/lib/fading.ts for the model).
//
// Only users with fading enabled. Three steps, in this order so an item lands
// on the right stage in a single run:
//   1. forget (R < 0.01): SavedLink rows are deleted (tags cascade); a saved
//      FeedItem loses its save (savedAt and fading fields cleared, its tags
//      deleted) and falls back under the 90-day retention in runFeedSyncScan().
//   2. trace  (R < 0.08): SavedLink title and description removed, URL reduced
//      to its origin. A FeedItem only changes stage: its content belongs to the
//      feed and is never removed by fading.
//   3. gist   (R < 0.30): SavedLink description removed.
// Each step also has a lower R bound and only takes rows not yet at its stage,
// so its rows are exactly those it changes: a second run in a row changes
// nothing, and a dry run counts the same rows a real run would change.
//
// Forgetting is irreversible by design: no soft delete, no history. Logs carry
// counts only, never titles or URLs.

export const SAVED_FADING_BATCH_SIZE = 1000

// Guards against a step that would never stop matching its own output.
const MAX_BATCHES_PER_STEP = 10_000

export interface SavedFadingCounts {
  /** Moved to GIST. */
  faded: number
  /** Moved to TRACE. */
  traced: number
  /** Deleted (links) or unsaved (articles). */
  forgotten: number
}

export interface SavedFadingResult extends SavedFadingCounts {
  /** Users with at least one change; empty on a dry run. */
  userIds: string[]
}

interface Step {
  count: keyof SavedFadingCounts
  /** SELECT id, "userId" of the rows this step changes, LIMIT `limit` (null = all). */
  candidates: (now: Date, limit: number | null) => Prisma.Sql
  /** Changes one batch (a CTE named `batch`); RETURNING the owner of each changed row. */
  apply: (batch: Prisma.Sql) => Prisma.Sql
}

// R in SQL, evaluated at one fixed `now` for the whole run.
function rSql(now: Date, touchedAt: Prisma.Sql, stability: Prisma.Sql): Prisma.Sql {
  return Prisma.sql`exp(-(extract(epoch from (${now}::timestamp - ${touchedAt})) / 86400.0) / ${stability})`
}

// R in [low, high): the rows a step owns.
function rBetween(r: Prisma.Sql, low: number, high: number): Prisma.Sql {
  return low > 0
    ? Prisma.sql`${r} < ${high} AND ${r} >= ${low}`
    : Prisma.sql`${r} < ${high}`
}

function linkCandidates(stageFilter: Prisma.Sql, low: number, high: number) {
  return (now: Date, limit: number | null) => {
    const r = rSql(now, Prisma.sql`sl."lastTouchedAt"`, Prisma.sql`sl.stability`)
    return Prisma.sql`
      SELECT sl.id, sl."userId" FROM "SavedLink" sl
      JOIN "User" u ON u.id = sl."userId"
      WHERE u."savedFading" = true AND ${stageFilter} AND ${rBetween(r, low, high)}
      LIMIT ${limit}`
  }
}

function articleCandidates(stageFilter: Prisma.Sql, low: number, high: number) {
  return (now: Date, limit: number | null) => {
    const r = rSql(now, Prisma.sql`fi."saveTouchedAt"`, Prisma.sql`fi."saveStability"`)
    return Prisma.sql`
      SELECT fi.id, c."userId" FROM "FeedItem" fi
      JOIN "FeedSource" fs ON fs.id = fi."sourceId"
      JOIN "Category" c ON c.id = fs."categoryId"
      JOIN "User" u ON u.id = c."userId"
      WHERE u."savedFading" = true
        AND fi."savedAt" IS NOT NULL AND fi."saveStability" IS NOT NULL AND fi."saveTouchedAt" IS NOT NULL
        AND ${stageFilter} AND ${rBetween(r, low, high)}
      LIMIT ${limit}`
  }
}

// Origin of a URL with an authority ("https://host/"), credentials dropped;
// otherwise just its scheme ("mailto:"), so no path ever survives a trace.
const TRACE_URL = Prisma.sql`CASE
  WHEN sl.url ~ '^[a-zA-Z][a-zA-Z0-9+.-]*://[^/?#]'
    THEN regexp_replace(sl.url, '^([a-zA-Z][a-zA-Z0-9+.-]*://)(?:[^/?#@]*@)?([^/?#]+).*$', '\\1\\2/')
  ELSE regexp_replace(sl.url, '^([a-zA-Z][a-zA-Z0-9+.-]*:).*$', '\\1')
END`

const ANY_STAGE = Prisma.sql`true`
const ARTICLE_STAGE = Prisma.sql`COALESCE(fi."saveStage", 'VIVID')`

const STEPS: Step[] = [
  {
    count: 'forgotten',
    candidates: linkCandidates(ANY_STAGE, 0, FORGOTTEN_BELOW_R),
    apply: batch => Prisma.sql`
      WITH batch AS (${batch})
      DELETE FROM "SavedLink" sl USING batch WHERE sl.id = batch.id
      RETURNING batch."userId"`,
  },
  {
    count: 'forgotten',
    candidates: articleCandidates(ANY_STAGE, 0, FORGOTTEN_BELOW_R),
    apply: batch => Prisma.sql`
      WITH batch AS (${batch}),
      tags AS (DELETE FROM "FeedItemTag" t USING batch WHERE t."feedItemId" = batch.id)
      UPDATE "FeedItem" fi
      SET "savedAt" = NULL, "saveStage" = NULL, "saveStability" = NULL, "saveTouchedAt" = NULL
      FROM batch WHERE fi.id = batch.id
      RETURNING batch."userId"`,
  },
  {
    count: 'traced',
    candidates: linkCandidates(Prisma.sql`sl.stage <> 'TRACE'`, FORGOTTEN_BELOW_R, TRACE_BELOW_R),
    apply: batch => Prisma.sql`
      WITH batch AS (${batch})
      UPDATE "SavedLink" sl
      SET stage = 'TRACE', title = NULL, description = NULL, url = ${TRACE_URL}
      FROM batch WHERE sl.id = batch.id
      RETURNING batch."userId"`,
  },
  {
    count: 'traced',
    candidates: articleCandidates(Prisma.sql`${ARTICLE_STAGE} <> 'TRACE'`, FORGOTTEN_BELOW_R, TRACE_BELOW_R),
    apply: batch => Prisma.sql`
      WITH batch AS (${batch})
      UPDATE "FeedItem" fi SET "saveStage" = 'TRACE'
      FROM batch WHERE fi.id = batch.id
      RETURNING batch."userId"`,
  },
  {
    count: 'faded',
    candidates: linkCandidates(Prisma.sql`sl.stage = 'VIVID'`, TRACE_BELOW_R, GIST_BELOW_R),
    apply: batch => Prisma.sql`
      WITH batch AS (${batch})
      UPDATE "SavedLink" sl SET stage = 'GIST', description = NULL
      FROM batch WHERE sl.id = batch.id
      RETURNING batch."userId"`,
  },
  {
    count: 'faded',
    candidates: articleCandidates(Prisma.sql`${ARTICLE_STAGE} = 'VIVID'`, TRACE_BELOW_R, GIST_BELOW_R),
    apply: batch => Prisma.sql`
      WITH batch AS (${batch})
      UPDATE "FeedItem" fi SET "saveStage" = 'GIST'
      FROM batch WHERE fi.id = batch.id
      RETURNING batch."userId"`,
  },
]

/** Runs one fading pass. Idempotent. With `dryRun`, only counts what would change. */
export async function runSavedFading(
  { dryRun = false, now = new Date() }: { dryRun?: boolean; now?: Date } = {},
): Promise<SavedFadingResult> {
  const counts: SavedFadingCounts = { faded: 0, traced: 0, forgotten: 0 }
  const userIds = new Set<string>()
  if (savedFadingMode() === 'off') return { ...counts, userIds: [] }

  for (const step of STEPS) {
    if (dryRun) {
      const [row] = await prisma.$queryRaw<{ count: bigint }[]>`
        SELECT count(*) AS count FROM (${step.candidates(now, null)}) candidates`
      counts[step.count] += Number(row?.count ?? 0)
      continue
    }

    for (let i = 0; i < MAX_BATCHES_PER_STEP; i++) {
      const changed = await prisma.$queryRaw<{ userId: string }[]>(
        step.apply(step.candidates(now, SAVED_FADING_BATCH_SIZE)),
      )
      counts[step.count] += changed.length
      for (const { userId } of changed) userIds.add(userId)
      if (changed.length < SAVED_FADING_BATCH_SIZE) break
    }
  }

  return { ...counts, userIds: [...userIds] }
}
