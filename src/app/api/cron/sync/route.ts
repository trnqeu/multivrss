import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { syncFeed } from '@/lib/rss';
import { revalidateTag } from 'next/cache';


export async function GET(request: Request) {
    const results = { synced: 0, failed: 0};
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const staleFeeds = await prisma.feedSource.findMany({
        where: {
            OR: [
                { lastSync: null },
                { lastSync: { lt: new Date(Date.now() - 30 * 60 * 1000) } }
            ]
        },
        include: { category: { select: { userId: true } } },
    });

    const affectedUserIds = new Set<string>();

    const CONCURRENCY = 15;

    for (let i = 0; i < staleFeeds.length; i += CONCURRENCY) {
        const chunk = staleFeeds.slice(i, i + CONCURRENCY);
        const chunkResults = await Promise.all(
            chunk.map(async (source) => {
                try {
                    await syncFeed(source.id);
                    affectedUserIds.add(source.category.userId);
                    return 'synced' as const;
                } catch (error) {
                    console.error(`Failed to sync ${source.url}:`, error);
                    return 'failed' as const;
                }
            })
        );
        for (const r of chunkResults) {
            if (r === 'synced') results.synced++;
            else results.failed++;
        }
    }

    for (const userId of affectedUserIds) {
        revalidateTag(`feed:${userId}`, 'max');
        revalidateTag(`sidebar:${userId}`, 'max');
    }

    return NextResponse.json(results);
}