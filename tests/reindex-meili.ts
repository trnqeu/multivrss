/// <reference types="node" />
import { MeiliSearch } from 'meilisearch';
import 'dotenv/config';
import { prisma } from '../src/lib/prisma';


const meili = new MeiliSearch({
    host: process.env.MEILI_HOST || 'http://localhost:7700',
    apiKey: process.env.MEILI_MASTER_KEY,
});

async function reindex() {
    console.log('🗑  Deleting existing index...');
    try {
        await meili.deleteIndex('items');
    } catch {
        console.log('   (index did not exist, skipping)');
    }

    console.log('⚙️  Applying index settings...');
    await meili.index('items').updateSettings({
        searchableAttributes: ['title', 'content'],
        filterableAttributes: ['sourceId', 'categoryId', 'sourceTitle', 'categoryName', 'pubDate'],
        sortableAttributes: ['pubDate'],
    });

    const items = await prisma.feedItem.findMany({
        include: { source: { include: { category: true } } },
    });

    console.log(`📦 Indexing ${items.length} items...`);
    const docs = items.map((item) => ({
        id: item.id,
        externalId: item.externalId,
        title: item.title,
        content: item.content,
        link: item.link,
        pubDate: item.pubDate ? item.pubDate.getTime() : null,
        sourceId: item.sourceId,
        sourceTitle: item.source.title || '',
        categoryId: item.source.category.id,
        categoryName: item.source.category.name,
    }));

    const task = await meili.index('items').addDocuments(docs, { primaryKey: 'id' });
    console.log(`✅ Task submitted: UID ${task.taskUid}. Meilisearch will index in background.`);

    await prisma.$disconnect();
}

reindex().catch((err) => {
    console.error(err);
    process.exit(1);
});
