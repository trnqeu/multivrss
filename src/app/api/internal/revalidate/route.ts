import { revalidateTag } from 'next/cache'
import { frontpageTag } from '@/app/actions/shared'

export async function POST(request: Request) {
  const secret = request.headers.get('x-internal-secret')
  if (!secret || secret !== process.env.INTERNAL_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { userId?: unknown }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { userId } = body
  if (!userId || typeof userId !== 'string') {
    return Response.json({ error: 'Invalid payload' }, { status: 400 })
  }

  revalidateTag(`feed:${userId}`, 'max')
  revalidateTag(`sidebar:${userId}`, 'max')
  revalidateTag(frontpageTag(userId), 'max')

  return Response.json({ ok: true })
}
