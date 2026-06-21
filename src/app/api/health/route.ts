import { NextResponse } from 'next/server';
import { connection } from 'next/server';
import { prisma } from '@/lib/prisma';
import { meili } from '@/lib/meili';
import { redis } from '@/lib/redis';

export async function GET() {
  await connection();
  const [dbResult, meiliResult, redisResult] = await Promise.allSettled([
    prisma.$queryRaw`SELECT 1`,
    meili.health(),
    redis.ping(),
  ]);

  const db = dbResult.status === 'fulfilled' ? 'ok' : 'error';
  const meiliStatus = meiliResult.status === 'fulfilled' ? 'ok' : 'error';
  const redisStatus = redisResult.status === 'fulfilled' ? 'ok' : 'error';
  const allOk = db === 'ok' && meiliStatus === 'ok' && redisStatus === 'ok';

  return NextResponse.json(
    { status: allOk ? 'ok' : 'degraded', db, meili: meiliStatus, redis: redisStatus },
    { status: allOk ? 200 : 503 }
  );
}
