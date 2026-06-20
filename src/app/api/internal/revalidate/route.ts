import { revalidateTag } from 'next/cache'

export async function POST(request: Request) {
  const secret = request.headers.get('x-internal-secret')
  if (!secret || secret !== process.env.INTERNAL_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { userId } = await request.json() as { userId: string }
  if (!userId || typeof userId !== 'string') {
    return Response.json({ error: 'Invalid payload' }, { status: 400 })
  }

  revalidateTag(`feed:${userId}`, 'max')
  revalidateTag(`sidebar:${userId}`, 'max')

  return Response.json({ ok: true })
}
