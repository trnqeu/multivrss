import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { feedSyncQueue } from '@/lib/queue'
import { meili } from '@/lib/meili'

type StaleSource = { id: string; url: string; userId: string }

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const staleFeeds = await prisma.$queryRaw<StaleSource[]>`
    SELECT fs.id, fs.url, c."userId"
    FROM "FeedSource" fs
    JOIN "Category" c ON fs."categoryId" = c.id
    WHERE fs."lastSync" IS NULL
       OR fs."lastSync" < NOW() - (COALESCE(fs."ttlMinutes", 30) * INTERVAL '1 minute')
    ORDER BY fs."lastSync" ASC NULLS FIRST
  `

  await feedSyncQueue.addBulk(
    staleFeeds.map((source) => ({
      name: 'sync',
      data: { sourceId: source.id, userId: source.userId, url: source.url },
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
