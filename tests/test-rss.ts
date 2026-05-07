// tests/test-rss.ts
import { prisma } from '../src/lib/prisma';
import { syncFeed } from '../src/lib/rss';

async function test() {
    console.log("🚀 Starting RSS integration test...");

    try {
        // 0. Find a real user to scope test data under
        const user = await prisma.user.findFirst();
        if (!user) throw new Error('No users in database — create an account first.');
        console.log(`👤 Using user: ${user.email}`);

        // 1. Create/Ensure a test category (unique by userId + name)
        const category = await prisma.category.upsert({
            where: { userId_name: { userId: user.id, name: 'Technology' } },
            update: {},
            create: { name: 'Technology', userId: user.id },
        });

        // 2. Create/Ensure a test source (unique by categoryId + url)
        const source = await prisma.feedSource.upsert({
            where: { categoryId_url: { categoryId: category.id, url: 'https://news.ycombinator.com/rss' } },
            update: {},
            create: {
                url: 'https://news.ycombinator.com/rss',
                slug: 'hacker_news_test',
                categoryId: category.id,
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
