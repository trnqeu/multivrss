import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/redis', () => ({
  redis: {
    pipeline: vi.fn(),
  },
}))

import { redis } from '@/lib/redis'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

const mockedRedis = vi.mocked(redis)

function mockPipeline(count: number) {
  const pipeline = {
    incr: vi.fn().mockReturnThis(),
    expire: vi.fn().mockReturnThis(),
    exec: vi.fn().mockResolvedValue([[null, count], [null, 1]]),
  }
  mockedRedis.pipeline.mockReturnValue(pipeline as any)
  return pipeline
}

describe('checkRateLimit', () => {
  beforeEach(() => vi.clearAllMocks())

  it('allows request when count is below the limit', async () => {
    mockPipeline(1)
    expect(await checkRateLimit('test:ip', { maxRequests: 3, windowMs: 60_000 })).toBe(true)
  })

  it('allows request when count equals the limit', async () => {
    mockPipeline(3)
    expect(await checkRateLimit('test:ip', { maxRequests: 3, windowMs: 60_000 })).toBe(true)
  })

  it('blocks request when count exceeds the limit', async () => {
    mockPipeline(4)
    expect(await checkRateLimit('test:ip', { maxRequests: 3, windowMs: 60_000 })).toBe(false)
  })

  it('converts windowMs to seconds for EXPIRE', async () => {
    const pipeline = mockPipeline(1)
    await checkRateLimit('test:ip', { maxRequests: 3, windowMs: 90_000 })
    expect(pipeline.expire).toHaveBeenCalledWith('test:ip', 90, 'NX')
  })

  it('uses INCR on the provided key', async () => {
    const pipeline = mockPipeline(1)
    await checkRateLimit('login:1.2.3.4', { maxRequests: 10, windowMs: 60_000 })
    expect(pipeline.incr).toHaveBeenCalledWith('login:1.2.3.4')
  })

  it('fails open (allows) when pipeline returns null', async () => {
    const pipeline = {
      incr: vi.fn().mockReturnThis(),
      expire: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue(null),
    }
    mockedRedis.pipeline.mockReturnValue(pipeline as any)
    expect(await checkRateLimit('test:ip', { maxRequests: 3, windowMs: 60_000 })).toBe(true)
  })
})

describe('getClientIp', () => {
  it('extracts the first IP from x-forwarded-for', () => {
    const headers = new Headers({ 'x-forwarded-for': '1.2.3.4, 5.6.7.8' })
    expect(getClientIp(headers)).toBe('1.2.3.4')
  })

  it('falls back to x-real-ip when x-forwarded-for is absent', () => {
    const headers = new Headers({ 'x-real-ip': '9.9.9.9' })
    expect(getClientIp(headers)).toBe('9.9.9.9')
  })

  it('returns unknown when no IP headers are present', () => {
    expect(getClientIp(new Headers())).toBe('unknown')
  })

  it('returns unknown when called with no arguments', () => {
    expect(getClientIp()).toBe('unknown')
  })
})
