/**
 * One-shot script: decode HTML entities in all FeedItem titles and content.
 * Run with: npx ts-node --project tsconfig.test.json tests/decode-titles.ts
 */
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import 'dotenv/config';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);

function decodeHtmlEntities(str: string): string {
    return str
        .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
        .replace(/&#x([0-9a-fA-F]+);/g, (_, hex: string) => String.fromCharCode(parseInt(hex, 16)))
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&nbsp;/g, ' ');
}

async function main() {
    const items = await prisma.feedItem.findMany({
        select: { id: true, title: true, content: true },
    });

    const dirty = items.filter(i =>
        i.title.includes('&#') || i.content.includes('&#') ||
        i.title.includes('&amp;') || i.content.includes('&amp;')
    );

    console.log(`Found ${dirty.length} items with encoded entities (out of ${items.length} total)`);

    let updated = 0;
    for (const item of dirty) {
        const newTitle = decodeHtmlEntities(item.title);
        const newContent = decodeHtmlEntities(item.content);
        if (newTitle !== item.title || newContent !== item.content) {
            await prisma.feedItem.update({
                where: { id: item.id },
                data: { title: newTitle, content: newContent },
            });
            updated++;
        }
    }

    console.log(`Updated ${updated} items`);
    await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
