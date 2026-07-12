import { Queue } from 'bullmq'

export interface FeedSyncJobData {
  sourceId: string
  userId: string
  url: string
}

export const connection = {
  host: process.env.REDIS_HOST ?? 'localhost',
  port: Number(process.env.REDIS_PORT ?? 6379),
}

const globalForQueue = global as unknown as {
  feedSyncQueue: Queue<FeedSyncJobData>
  feedScanQueue: Queue<Record<string, never>>
}

export const feedSyncQueue =
  globalForQueue.feedSyncQueue ??
  new Queue<FeedSyncJobData>('feed-sync', {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: 100,
      removeOnFail: 500,
    },
  })

// Drives the repeating scan that finds stale feed sources and enqueues
// `feedSyncQueue` jobs for them. See src/lib/feed-sync-scheduler.ts.
export const feedScanQueue =
  globalForQueue.feedScanQueue ??
  new Queue<Record<string, never>>('feed-scan', {
    connection,
    defaultJobOptions: {
      removeOnComplete: 10,
      removeOnFail: 50,
    },
  })

if (process.env.NODE_ENV !== 'production') {
  globalForQueue.feedSyncQueue = feedSyncQueue
  globalForQueue.feedScanQueue = feedScanQueue
}