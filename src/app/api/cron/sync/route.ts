import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { syncFeed } from '@/lib/rss';


export async function GET(request: Request) {
    const results = { synced: 0, failed: 0};
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const allFeeds = await prisma.feedSource.findMany()

    const CONCURRENCY = 5;

    for (let i = 0; i < allFeeds.length; i += CONCURRENCY) {
        const chunk = allFeeds.slice(i, i + CONCURRENCY);
        const chunkResults = await Promise.all(
            chunk.map(async (source) => {
                try {
                    await syncFeed(source.id);
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

    return NextResponse.json(results);
}