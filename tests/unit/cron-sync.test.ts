import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    feedSource: { findMany: vi.fn() },
    feedItem: { findMany: vi.fn(), deleteMany: vi.fn() },
  },
}))

vi.mock('@/lib/queue', () => ({
  feedSyncQueue: { addBulk: vi.fn().mockResolvedValue([]) },
}))

import { prisma } from '@/lib/prisma'
import { feedSyncQueue } from '@/lib/queue'
import { GET } from '@/app/api/cron/sync/route'

const mockedPrisma = vi.mocked(prisma)
const mockedQueue = vi.mocked(feedSyncQueue)

const SECRET = 'test-cron-secret'

function makeRequest(secret?: string) {
  return new NextRequest('https://app.test/api/cron/sync', {
    headers: secret ? { authorization: `Bearer ${secret}` } : {},
  })
}

describe('GET /api/cron/sync', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('CRON_SECRET', SECRET)
    mockedPrisma.feedSource.findMany.mockResolvedValue([])
    mockedPrisma.feedItem.findMany.mockResolvedValue([])
    mockedPrisma.feedItem.deleteMany.mockResolvedValue({ count: 0 })
  })

  it('returns 401 when authorization header is missing', async () => {
    const res = await GET(makeRequest())
    expect(res.status).toBe(401)
  })

  it('returns 401 when secret is wrong', async () => {
    const res = await GET(makeRequest('wrong'))
    expect(res.status).toBe(401)
  })

  it('enqueues stale feeds with sourceId, userId, url and jobId', async () => {
    mockedPrisma.feedSource.findMany.mockResolvedValue([
      { id: 'src_1', url: 'https://example.com/feed', lastSync: null, ttlMinutes: null, category: { userId: 'user_1' } },
      { id: 'src_2', url: 'https://other.com/feed', lastSync: null, ttlMinutes: null, category: { userId: 'user_2' } },
    ] as any)

    await GET(makeRequest(SECRET))

    expect(mockedQueue.addBulk).toHaveBeenCalledWith([
      { name: 'sync', data: { sourceId: 'src_1', userId: 'user_1', url: 'https://example.com/feed' }, opts: { jobId: 'src_1' } },
      { name: 'sync', data: { sourceId: 'src_2', userId: 'user_2', url: 'https://other.com/feed' }, opts: { jobId: 'src_2' } },
    ])
  })

  it('returns enqueued count in response', async () => {
    mockedPrisma.feedSource.findMany.mockResolvedValue([
      { id: 'src_1', url: 'https://example.com/feed', lastSync: null, ttlMinutes: null, category: { userId: 'user_1' } },
    ] as any)

    const res = await GET(makeRequest(SECRET))
    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toMatchObject({ enqueued: 1 })
  })

  it('returns enqueued: 0 when no stale feeds exist', async () => {
    const res = await GET(makeRequest(SECRET))
    await expect(res.json()).resolves.toMatchObject({ enqueued: 0 })
  })

  it('purges old items and reports count', async () => {
    mockedPrisma.feedItem.findMany.mockResolvedValue([{ id: 'item_1' }, { id: 'item_2' }] as any)
    mockedPrisma.feedItem.deleteMany.mockResolvedValue({ count: 2 })

    const res = await GET(makeRequest(SECRET))
    await expect(res.json()).resolves.toMatchObject({ purged: 2 })
  })

  it('reports purged: 0 when no items are stale', async () => {
    const res = await GET(makeRequest(SECRET))
    await expect(res.json()).resolves.toMatchObject({ purged: 0 })
  })
})
