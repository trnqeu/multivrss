import { NextResponse } from 'next/server';
import { meili } from '@/lib/meili';
import { prisma } from '@/lib/prisma';

const BATCH_SIZE = 1000;

export async function GET(request: Request) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const index = meili.index('items');
    let offset = 0;
    let totalOrphans = 0;

    while (true) {
        const { results } = await index.getDocuments<{ id: string }>({
            fields: ['id'],
            limit: BATCH_SIZE,
            offset,
        });

        if (results.length === 0) break;

        const meiliIds = results.map(r => r.id);

        const existing = await prisma.feedItem.findMany({
            where: { id: { in: meiliIds } },
            select: { id: true },
        });
        const existingSet = new Set(existing.map(e => e.id));
        const orphans = meiliIds.filter(id => !existingSet.has(id));

        if (orphans.length > 0) {
            await index.deleteDocuments(orphans);
            totalOrphans += orphans.length;
        }

        if (results.length < BATCH_SIZE) break;
        offset += BATCH_SIZE;
    }

    console.log(`[reconcile] removed ${totalOrphans} orphaned Meilisearch documents`);
    return NextResponse.json({ ok: true, orphansRemoved: totalOrphans });
}
