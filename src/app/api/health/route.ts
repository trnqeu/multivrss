import { NextResponse } from 'next/server';
import { connection } from 'next/server';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';

export async function GET() {
  await connection();
  const [dbResult, redisResult] = await Promise.allSettled([
    prisma.$queryRaw`SELECT 1`,
    redis.ping(),
  ]);

  const db = dbResult.status === 'fulfilled' ? 'ok' : 'error';
  const redisStatus = redisResult.status === 'fulfilled' ? 'ok' : 'error';
  const allOk = db === 'ok' && redisStatus === 'ok';

  return NextResponse.json(
    { status: allOk ? 'ok' : 'degraded', db, redis: redisStatus },
    { status: allOk ? 200 : 503 }
  );
}
