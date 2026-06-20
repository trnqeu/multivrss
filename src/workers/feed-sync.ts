import 'dotenv/config'
import { Worker } from 'bullmq'
import { connection, type FeedSyncJobData } from '@/lib/queue'
import { syncFeed } from '@/lib/rss'

new Worker<FeedSyncJobData>(
  'feed-sync',
  async (job) => {
    const { sourceId, userId } = job.data
    await syncFeed(sourceId)
    await fetch(`${process.env.NEXTAUTH_URL}/api/internal/revalidate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-secret': process.env.INTERNAL_SECRET ?? '',
      },
      body: JSON.stringify({ userId }),
    })
  },
  {
    connection,
    concurrency: 10,
  }
)

console.log('Feed sync worker started')
