// tests/test-rss.ts
import { prisma } from '../src/lib/prisma';
import { syncFeed } from '../src/lib/rss';

async function test() {
    console.log("🚀 Starting RSS integration test...");

    try {
        // 1. Create/Ensure a test category
        const category = await prisma.category.upsert({
            where: { name: 'Technology' },
            update: {},
            create: { name: 'Technology' },
        });

        // 2. Create/Ensure a test source (Vercel Blog)
        const source = await prisma.feedSource.upsert({
            where: { url: 'https://vercel.com/blog/feed' },
            update: {},
            create: {
                url: 'https://vercel.com/blog/feed',
                categories: { connect: { id: category.id } }
            },
        });

        console.log(`📡 Syncing feed from: ${source.url}`);

        // 3. Trigger the sync engine
        const results = await syncFeed(source.id);

        console.log(`✅ Success! Database updated with ${results.length} articles.`);

    } catch (error) {
        console.error("❌ Test failed:", error);
    }
}

test()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
