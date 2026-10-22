import { Queue } from 'bullmq'

export interface FeedSyncJobData {
  sourceId: string
  userId: string
  url: string
}

// Saved item whose save may give life to the same link saved by others
// (src/lib/fading-encounters.ts). Ids only: no URL ever goes into Redis.
export interface SavedEncounterJobData {
  saverUserId: string
  kind: 'link' | 'article'
  id: string
}

export const connection = {
  host: process.env.REDIS_HOST ?? 'localhost',
  port: Number(process.env.REDIS_PORT ?? 6379),
}

const globalForQueue = global as unknown as {
  feedSyncQueue: Queue<FeedSyncJobData>
  feedScanQueue: Queue<Record<string, never>>
  savedFadingQueue: Queue<Record<string, never>>
  savedEncounterQueue: Queue<SavedEncounterJobData>
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

// Drives the nightly saved-item fading pass. See src/lib/saved-fading.ts.
export const savedFadingQueue =
  globalForQueue.savedFadingQueue ??
  new Queue<Record<string, never>>('saved-fading', {
    connection,
    defaultJobOptions: {
      removeOnComplete: 30,
      removeOnFail: 50,
    },
  })

// Applies fading encounters in the background, never inside the save request.
export const savedEncounterQueue =
  globalForQueue.savedEncounterQueue ??
  new Queue<SavedEncounterJobData>('saved-encounters', {
    connection,
    defaultJobOptions: {
      attempts: 2,
      backoff: { type: 'exponential', delay: 10_000 },
      removeOnComplete: true,
      removeOnFail: 100,
    },
  })

if (process.env.NODE_ENV !== 'production') {
  globalForQueue.feedSyncQueue = feedSyncQueue
  globalForQueue.feedScanQueue = feedScanQueue
  globalForQueue.savedFadingQueue = savedFadingQueue
  globalForQueue.savedEncounterQueue = savedEncounterQueue
}