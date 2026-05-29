import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { syncFeed } from '@/lib/rss';
import { revalidateTag, revalidatePath } from 'next/cache';


export async function GET(request: Request) {
    const results = { synced: 0, failed: 0};
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const allFeeds = await prisma.feedSource.findMany({
        include: { category: { select: { userId: true } } },
    });

    const affectedUserIds = new Set<string>();

    const CONCURRENCY = 15;

    for (let i = 0; i < allFeeds.length; i += CONCURRENCY) {
        const chunk = allFeeds.slice(i, i + CONCURRENCY);
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