import { prisma } from '@/lib/prisma'
import { feedSyncQueue } from '@/lib/queue'

export interface FeedSyncScanResult {
  enqueued: number
  purged: number
}

// Finds feed sources past their ttlMinutes and enqueues a sync job for each,
// then purges unsaved items that have dropped off their source feed for good.
// Invoked on a repeating BullMQ scheduler (src/workers/feed-sync.ts) and by the
// manual/backup /api/cron/sync endpoint.
//
// Retention is keyed on `lastSeenAt` — the last sync in which the item still
// appeared in the feed XML (bumped by syncFeed). An item is kept as long as
// it's in the feed, plus a 90-day grace period after it drops off. Keying on
// `pubDate` (publication date) or `createdAt` (ingest date) instead would
// purge items that are still being served — a fiction serial on hiatus or an
// evergreen/curated feed whose items are all older than 90 days would have its
// whole contents deleted and re-created on a loop. `{ lt: cutoff }` never
// matches SQL NULL, so a row whose source has not re-synced since the column
// was added is retained until that sync stamps its lastSeenAt.
export async function runFeedSyncScan(): Promise<FeedSyncScanResult> {
  const allFeeds = await prisma.feedSource.findMany({
    select: {
      id: true,
      url: true,
      lastSync: true,
      ttlMinutes: true,
      category: { select: { userId: true } },
    },
    orderBy: { lastSync: { sort: 'asc', nulls: 'first' } },
  })

  const now = Date.now()
  const staleFeeds = allFeeds.filter((source) => {
    const ttlMs = (source.ttlMinutes ?? 30) * 60 * 1000
    return !source.lastSync || now - source.lastSync.getTime() > ttlMs
  })

  await feedSyncQueue.addBulk(
    staleFeeds.map((source) => ({
      name: 'sync',
      data: { sourceId: source.id, userId: source.category.userId, url: source.url },
      opts: { jobId: source.id },
    }))
  )

  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
  const staleItems = await prisma.feedItem.findMany({
    where: { savedAt: null, lastSeenAt: { lt: cutoff } },
    select: { id: true },
  })
  const staleIds = staleItems.map((i) => i.id)
  let purged = 0
  if (staleIds.length > 0) {
    const { count } = await prisma.feedItem.deleteMany({ where: { id: { in: staleIds } } })
    purged = count
  }

  return { enqueued: staleFeeds.length, purged }
}
