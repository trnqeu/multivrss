import { redis } from '@/lib/redis'

export interface RateLimitConfig {
  maxRequests: number
  windowMs: number
}

export async function checkRateLimit(key: string, config: RateLimitConfig): Promise<boolean> {
  const ttl = Math.ceil(config.windowMs / 1000)
  const pipeline = redis.pipeline()
  pipeline.incr(key)
  pipeline.expire(key, ttl, 'NX')
  const results = await pipeline.exec()
  const count = (results?.[0]?.[1] as number) ?? 1
  return count <= config.maxRequests
}

export function getClientIp(reqHeaders?: Headers): string {
  if (reqHeaders) {
    return reqHeaders.get('x-forwarded-for')?.split(',')[0]?.trim()
      ?? reqHeaders.get('x-real-ip')
      ?? 'unknown'
  }
  return 'unknown'
}
