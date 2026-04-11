import Parser from 'rss-parser';
import { prisma } from './prisma';
import { meili } from './meili';
import dns from 'dns';

function isPrivateIp(ip: string): boolean {
  // IPv6 loopback
  if (ip === '::1') return true;

  // Normalize IPv6-mapped IPv4 (e.g. "::ffff:127.0.0.1")
  const ipv4 = ip.startsWith('::ffff:') ? ip.slice(7) : ip;

  const parts = ipv4.split('.').map(Number);
  if (parts.length !== 4) return false; // pure IPv6, block it to be safe

  const [a, b] = parts;
  return (
    a === 127 ||                        // 127.0.0.0/8
    a === 10 ||                         // 10.0.0.0/8
    a === 169 && b === 254 ||           // 169.254.0.0/16
    a === 172 && b >= 16 && b <= 31 ||  // 172.16.0.0/12
    a === 192 && b === 168              // 192.168.0.0/16
  );
}

export async function validateFeedUrl(rawUrl: string): Promise<void> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error('Invalid URL.');
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Only http and https URLs are allowed.');
  }

  const { address } = await dns.promises.lookup(parsed.hostname);

  if (isPrivateIp(address)) {
    throw new Error('URL resolves to a private or reserved IP address.');
  }
}

const parser = new Parser();

export type ParsedFeed = Awaited<ReturnType<typeof parser.parseURL>>;

export async function syncFeed(sourceId: string, prefetchedFeed?: ParsedFeed) {
    // 1. Find source in the database
    const source = await prisma.feedSource.findUnique({
        where: { id: sourceId },
    });

    if (!source) throw new Error('Source not found');

    // 2. Download RSS feed (skip if already fetched by the caller)
    const feed = prefetchedFeed ?? await parser.parseURL(source.url);

    // 3. Save articles (upsert)
    const syncResults = await Promise.all(
        feed.items.map(async (item) => {
            const externalId = item.guid || item.link || '';

            return prisma.feedItem.upsert({
                where: { sourceId_externalId: { sourceId: source.id, externalId } },
                update: {
                    title: item.title || 'Untitled',
                    content: item.contentSnippet || item.summary || item.content || '',
                },
                create: {
                    externalId,
                    title: item.title || 'Untitled',
                    link: item.link || '',
                    content: item.contentSnippet || item.summary || item.content || '',
                    pubDate: item.isoDate ? new Date(item.isoDate) : null,
                    sourceId: source.id,
                },
            });
        })
    );

    // 4. Sync to Meilisearch
    // We send only the necessary data for searching
    console.log(`📡 Syncing ${syncResults.length} items to Meilisearch...`);
    const meiliTask = await meili.index('items').addDocuments(
        syncResults.map((item) => ({
            id: item.id,
            externalId: item.externalId,
            title: item.title,
            content: item.content,
            link: item.link,
            pubDate: item.pubDate ? item.pubDate.getTime() : null,
            sourceId: item.sourceId,
        }))
    );
    console.log(`✅ Meilisearch sync task submitted. Task UID: ${meiliTask.taskUid}`);

    // 5. Update the last sync date of the source
    await prisma.feedSource.update({
        where: { id: sourceId },
        data: {
            lastSync: new Date(),
            title: feed.title,
        },
    });

    return syncResults;
}
