import { NextResponse } from 'next/server'
import { runFeedSyncScan } from '@/lib/feed-sync-scheduler'

// Manual/backup trigger. The primary schedule is a BullMQ repeatable job
// registered by the worker process (src/workers/feed-sync.ts) so freshness
// doesn't depend on an external host cron surviving redeploys.
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await runFeedSyncScan()
  return NextResponse.json(result)
}
