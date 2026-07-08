import { Worker } from 'bullmq'
import { connection, type FeedSyncJobData } from '@/lib/queue'
import { syncFeed } from '@/lib/rss'
import { DomainGate } from '@/lib/domain-gate'
import { triggerRevalidate } from '@/lib/revalidate'

const gate = new DomainGate(2)

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

const shutdown = async () => {
  await worker.close()
  process.exit(0)
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)

console.log('Feed sync worker started')
