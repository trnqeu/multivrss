import { Worker } from 'bullmq'
import { connection, feedScanQueue, savedFadingQueue, type FeedSyncJobData } from '@/lib/queue'
import { syncFeed } from '@/lib/rss'
import { DomainGate } from '@/lib/domain-gate'
import { triggerRevalidate } from '@/lib/revalidate'
import { runFeedSyncScan } from '@/lib/feed-sync-scheduler'
import { runSavedFading } from '@/lib/saved-fading'

const gate = new DomainGate(2)

const SCAN_INTERVAL_MS = 5 * 60 * 1000

const worker = new Worker<FeedSyncJobData>(
  'feed-sync',
  async (job) => {
    const { sourceId, userId, url } = job.data
    await gate.run(url, () => syncFeed(sourceId))
    await triggerRevalidate(userId)
  },
  {
    connection,
    concurrency: 10,
  }
)

const scanWorker = new Worker(
  'feed-scan',
  async () => {
    const { enqueued, purged } = await runFeedSyncScan()
    console.log(`Feed scan: enqueued ${enqueued} sync jobs, purged ${purged} old items`)
  },
  { connection }
)

// Nightly saved-item fading. SAVED_FADING_DRY_RUN=1 counts without writing:
// run it that way on staging first.
const fadingWorker = new Worker(
  'saved-fading',
  async () => {
    const dryRun = process.env.SAVED_FADING_DRY_RUN === '1'
    const { faded, traced, forgotten, userIds } = await runSavedFading({ dryRun })
    console.log(
      `Saved fading${dryRun ? ' (dry run)' : ''}: faded ${faded}, traced ${traced}, forgotten ${forgotten}, users ${userIds.length}`,
    )
    for (const userId of userIds) await triggerRevalidate(userId)
  },
  { connection }
)

const shutdown = async () => {
  await worker.close()
  await scanWorker.close()
  await fadingWorker.close()
  process.exit(0)
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)

Promise.all([
  feedScanQueue.upsertJobScheduler('stale-feed-scan', { every: SCAN_INTERVAL_MS }),
  savedFadingQueue.upsertJobScheduler('saved-fading-daily', { pattern: '30 4 * * *' }),
])
  .then(() => console.log('Feed sync worker started'))
  .catch((err: unknown) => {
    console.error('Failed to register job schedulers:', err)
    process.exit(1)
  })
