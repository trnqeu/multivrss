import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
}))

import { revalidateTag } from 'next/cache'
import { POST } from '@/app/api/internal/revalidate/route'

const mockedRevalidateTag = vi.mocked(revalidateTag)
const SECRET = 'test-internal-secret'

function makeRequest(body: unknown, secret?: string) {
  return new Request('https://app.test/api/internal/revalidate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(secret ? { 'x-internal-secret': secret } : {}),
    },
    body: JSON.stringify(body),
  })
}

describe('POST /api/internal/revalidate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('INTERNAL_SECRET', SECRET)
  })

  it('returns 401 when secret header is missing', async () => {
    const res = await POST(makeRequest({ userId: 'user_1' }))
    expect(res.status).toBe(401)
  })

  it('returns 401 when secret is wrong', async () => {
    const res = await POST(makeRequest({ userId: 'user_1' }, 'wrong'))
    expect(res.status).toBe(401)
  })

  it('returns 400 when body is invalid JSON', async () => {
    const req = new Request('https://app.test/api/internal/revalidate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-internal-secret': SECRET },
      body: 'not-json',
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 when userId is missing', async () => {
    const res = await POST(makeRequest({}, SECRET))
    expect(res.status).toBe(400)
  })

  it('returns 400 when userId is not a string', async () => {
    const res = await POST(makeRequest({ userId: 42 }, SECRET))
    expect(res.status).toBe(400)
  })

  it('calls revalidateTag for feed and sidebar on valid request', async () => {
    await POST(makeRequest({ userId: 'user_1' }, SECRET))
    expect(mockedRevalidateTag).toHaveBeenCalledWith('feed:user_1', 'max')
    expect(mockedRevalidateTag).toHaveBeenCalledWith('sidebar:user_1', 'max')
  })

  it('returns ok: true on success', async () => {
    const res = await POST(makeRequest({ userId: 'user_1' }, SECRET))
    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({ ok: true })
  })
})
