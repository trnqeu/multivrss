import { createHash } from 'crypto'
import { prisma } from '@/lib/prisma'
import { redis } from '@/lib/redis'
import { savedEncounterQueue, type SavedEncounterJobData } from '@/lib/queue'
import { savedFadingMode } from '@/lib/fading-config'
import { recordSavedTouch, type SavedItemRef } from '@/lib/fading-touch'
import { urlKey } from '@/lib/url-key'

// Fading encounters: "only an encounter with someone else gives memories their
// weight back". When someone saves a URL, every other person with fading on
// who has the same URL saved gets an `encounter` touch on it.
//
// Behind SAVED_FADING_ENCOUNTERS=1 (off by default). Applied by the worker,
// never inside the save request. Never revealed: nothing in the UI or the API
// says why an item gained life, nor that anyone else saved it. Logs carry
// counts only, and Redis only ids or hashes, never URLs.

const TARGET_BATCH_SIZE = 500
const ENCOUNTER_COOLDOWN_SECONDS = 24 * 60 * 60
export const URL_KEY_BACKFILL_BATCH_SIZE = 1000

export function encountersEnabled(): boolean {
  return process.env.SAVED_FADING_ENCOUNTERS === '1' && savedFadingMode() !== 'off'
}

/**
 * Queues the encounter for a fresh save. Fire-and-forget: a failure is logged
 * and never fails the save. Not called for resaves (same person) nor imports
 * (a bulk file is not an encounter).
 */
export async function enqueueEncounter(saverUserId: string, ref: SavedItemRef): Promise<void> {
  if (!encountersEnabled()) return
  try {
    const data: SavedEncounterJobData = { saverUserId, kind: ref.kind, id: ref.id }
    await savedEncounterQueue.add('encounter', data, { jobId: `${ref.kind}-${ref.id}` })
  } catch (err) {
    console.error('Failed to queue a saved encounter:', err instanceof Error ? err.message : 'unknown error')
  }
}

async function claim(key: string): Promise<boolean> {
  return (await redis.set(key, '1', 'EX', ENCOUNTER_COOLDOWN_SECONDS, 'NX')) === 'OK'
}

function hashKey(key: string): string {
  return createHash('sha256').update(key).digest('hex').slice(0, 32)
}

/**
 * Worker side: gives an `encounter` touch to every other fading user's saved
 * copy of the saved item's URL. Each saver gives at most one encounter per URL
 * per day (saving, deleting and saving again does nothing more), and each item
 * receives at most one encounter per day. Returns the number of items touched.
 */
export async function applyEncounters({ saverUserId, kind, id }: SavedEncounterJobData): Promise<number> {
  if (!encountersEnabled()) return 0

  const key = kind === 'link'
    ? (await prisma.savedLink.findFirst({ where: { id, userId: saverUserId }, select: { urlKey: true } }))?.urlKey
    : (await prisma.feedItem.findFirst({
        where: { id, savedAt: { not: null }, source: { category: { userId: saverUserId } } },
        select: { saveUrlKey: true },
      }))?.saveUrlKey
  if (!key) return 0
  if (!await claim(`fading:enc-src:${saverUserId}:${hashKey(key)}`)) return 0

  let touched = 0
  const touch = async (ownerId: string, ref: SavedItemRef) => {
    if (!await claim(`fading:enc:${ref.kind}:${ref.id}`)) return
    if (await recordSavedTouch(ownerId, ref, 'encounter')) touched++
  }

  // Other people's saved links with the same key. A trace has no key left.
  let cursor: string | undefined
  for (;;) {
    const links = await prisma.savedLink.findMany({
      where: { urlKey: key, userId: { not: saverUserId }, user: { savedFading: true } },
      select: { id: true, userId: true },
      orderBy: { id: 'asc' },
      take: TARGET_BATCH_SIZE,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    })
    for (const link of links) await touch(link.userId, { kind: 'link', id: link.id })
    if (links.length < TARGET_BATCH_SIZE) break
    cursor = links[links.length - 1].id
  }

  // Other people's saved feed articles with the same key.
  cursor = undefined
  for (;;) {
    const items: { id: string; source: { category: { userId: string } } }[] = await prisma.feedItem.findMany({
      where: {
        saveUrlKey: key,
        savedAt: { not: null },
        source: { category: { userId: { not: saverUserId }, user: { savedFading: true } } },
      },
      select: { id: true, source: { select: { category: { select: { userId: true } } } } },
      orderBy: { id: 'asc' },
      take: TARGET_BATCH_SIZE,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    })
    for (const item of items) await touch(item.source.category.userId, { kind: 'article', id: item.id })
    if (items.length < TARGET_BATCH_SIZE) break
    cursor = items[items.length - 1].id
  }

  return touched
}

/**
 * Fills in missing URL keys: rows saved before encounters existed, or by a
 * path that doesn't set one. Traces are skipped (their key is gone on
 * purpose). Idempotent; a row whose URL can't be keyed stays NULL. One UPDATE
 * per batch. Returns the number of rows updated.
 */
export async function backfillUrlKeys(): Promise<number> {
  let updated = 0

  let linkCursor: string | undefined
  for (;;) {
    const links = await prisma.savedLink.findMany({
      where: { urlKey: null, stage: { not: 'TRACE' } },
      select: { id: true, url: true },
      orderBy: { id: 'asc' },
      take: URL_KEY_BACKFILL_BATCH_SIZE,
      ...(linkCursor ? { skip: 1, cursor: { id: linkCursor } } : {}),
    })
    const keyed = withKeys(links.map(l => ({ id: l.id, url: l.url })))
    if (keyed.ids.length > 0) {
      updated += await prisma.$executeRaw`
        UPDATE "SavedLink" sl SET "urlKey" = v.key
        FROM unnest(${keyed.ids}::text[], ${keyed.keys}::text[]) AS v(id, key)
        WHERE sl.id = v.id AND sl."urlKey" IS NULL`
    }
    if (links.length < URL_KEY_BACKFILL_BATCH_SIZE) break
    linkCursor = links[links.length - 1].id
  }

  let itemCursor: string | undefined
  for (;;) {
    const items = await prisma.feedItem.findMany({
      // `{ not: 'TRACE' }` alone would also drop NULL stages (articles saved before fading existed).
      where: { saveUrlKey: null, savedAt: { not: null }, OR: [{ saveStage: null }, { saveStage: { not: 'TRACE' } }] },
      select: { id: true, link: true },
      orderBy: { id: 'asc' },
      take: URL_KEY_BACKFILL_BATCH_SIZE,
      ...(itemCursor ? { skip: 1, cursor: { id: itemCursor } } : {}),
    })
    const keyed = withKeys(items.map(i => ({ id: i.id, url: i.link })))
    if (keyed.ids.length > 0) {
      updated += await prisma.$executeRaw`
        UPDATE "FeedItem" fi SET "saveUrlKey" = v.key
        FROM unnest(${keyed.ids}::text[], ${keyed.keys}::text[]) AS v(id, key)
        WHERE fi.id = v.id AND fi."saveUrlKey" IS NULL AND fi."savedAt" IS NOT NULL`
    }
    if (items.length < URL_KEY_BACKFILL_BATCH_SIZE) break
    itemCursor = items[items.length - 1].id
  }

  return updated
}

function withKeys(rows: { id: string; url: string }[]): { ids: string[]; keys: string[] } {
  const ids: string[] = []
  const keys: string[] = []
  for (const row of rows) {
    const key = urlKey(row.url)
    if (!key) continue
    ids.push(row.id)
    keys.push(key)
  }
  return { ids, keys }
}
