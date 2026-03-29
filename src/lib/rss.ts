import Parser from 'rss-parser';
import { prisma } from './prisma';

const parser = new Parser();

export async function syncFeed(sourceId: string) {
    // 1. Find source in the database
    const source = await prisma.feedSource.findUnique({
        where: { id: sourceId },
    });

    if (!source) throw new Error('Source not found');

    // 2. Download RSS feed
    const feed = await parser.parseURL(source.url);

    // 3. Save articles (upsert)
    const syncResults = await Promise.all(
        feed.items.map(async (item) => {
            const externalId = item.guid || item.link || '';

            return prisma.feedItem.upsert({
                where: { externalId },
                update: {
                    title: item.title || 'Untitled',
                    content: item.contentSnippet || item.content || '',
                },
                create: {
                    externalId,
                    title: item.title || 'Untitled',
                    link: item.link || '',
                    content: item.contentSnippet || item.content || '',
                    pubDate: item.isoDate ? new Date(item.isoDate) : null,
                    sourceId: source.id,
                },
            });
        })
    );

    // 4. Update the last sync date of the source
    await prisma.feedSource.update({
        where: { id: sourceId },
        data: {
            lastSync: new Date(),
            title: feed.title,
        },
    });

    return syncResults;
}
