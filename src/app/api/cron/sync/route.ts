import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { feedSyncQueue } from '@/lib/queue'
import { meili } from '@/lib/meili'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

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
    where: { savedAt: null, pubDate: { lt: cutoff } },
    select: { id: true },
  })
  const staleIds = staleItems.map((i) => i.id)
  let purged = 0
  if (staleIds.length > 0) {
    const { count } = await prisma.feedItem.deleteMany({ where: { id: { in: staleIds } } })
    purged = count
    meili.index('items').deleteDocuments(staleIds).catch((err: unknown) => {
      console.error('Meili purge failed:', err)
    })
  }

  return NextResponse.json({ enqueued: staleFeeds.length, purged })
}
