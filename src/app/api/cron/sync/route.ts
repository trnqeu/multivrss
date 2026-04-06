import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { syncFeed } from '@/lib/rss';


export async function GET(request: Request) {
    const results = { synced: 0, failed: 0};
    const secret = new URL(request.url).searchParams.get('secret');
    if (secret !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const allFeeds = await prisma.feedSource.findMany()

    for (const source of allFeeds) {
        try {
            await syncFeed(source.id);
            results.synced++;
        } catch (error) {
            console.error(`Failed to sync ${source.url}:`, error);
            results.failed++;
        }
        
    };

    return NextResponse.json( { synced: allFeeds.length});
}