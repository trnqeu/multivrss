import { createHash } from 'crypto';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export function hashApiKeyToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

async function getApiKeyUser(request: Request): Promise<{ id: string; username: string } | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) return null;

  const apiKey = await prisma.apiKey.findUnique({
    where: { keyHash: hashApiKeyToken(token) },
    include: { user: { select: { id: true, username: true } } },
  });

  if (!apiKey || apiKey.revokedAt) return null;

  await prisma.apiKey.update({
    where: { id: apiKey.id },
    data: { lastUsedAt: new Date() },
  });

  return apiKey.user;
}

export async function getAuthenticatedUser(request: Request): Promise<{ id: string; username: string } | null> {
  const session = await getServerSession(authOptions);
  if (session) return { id: session.user.id, username: session.user.username };

  return getApiKeyUser(request);
}
