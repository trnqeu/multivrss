import 'dotenv/config'
import { Worker } from 'bullmq'
import { connection, type FeedSyncJobData } from '@/lib/queue'
import { syncFeed } from '@/lib/rss'

const worker = new Worker<FeedSyncJobData>(
  'feed-sync',
  async (job) => {
    const { sourceId, userId } = job.data
    await syncFeed(sourceId)
    const res = await fetch(`${process.env.NEXTAUTH_URL}/api/internal/revalidate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-secret': process.env.INTERNAL_SECRET ?? '',
      },
      body: JSON.stringify({ userId }),
    })
    if (!res.ok) {
      console.error(`Revalidation failed for userId ${userId}: ${res.status}`)
    }
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
