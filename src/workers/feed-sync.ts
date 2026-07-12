import { Worker } from 'bullmq'
import { connection, feedScanQueue, type FeedSyncJobData } from '@/lib/queue'
import { syncFeed } from '@/lib/rss'
import { DomainGate } from '@/lib/domain-gate'
import { triggerRevalidate } from '@/lib/revalidate'
import { runFeedSyncScan } from '@/lib/feed-sync-scheduler'

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

const shutdown = async () => {
  await worker.close()
  await scanWorker.close()
  process.exit(0)
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)

feedScanQueue
  .upsertJobScheduler('stale-feed-scan', { every: SCAN_INTERVAL_MS })
  .then(() => console.log('Feed sync worker started'))
  .catch((err: unknown) => {
    console.error('Failed to register feed scan scheduler:', err)
    process.exit(1)
  })
