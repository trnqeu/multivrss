import { Queue } from 'bullmq';

export interface FeedSyncJobData {
    sourceId: string
    userId: string
}

export const connection = {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: Number(process.env.REDIS_PORT ?? 6379),
}

export const feedSyncQueue = new Queue<FeedSyncJobData>('feed-sync', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: 100,
    removeOnFail: 500,
  },
})