import Parser from 'rss-parser';
import { prisma } from './prisma';
import { meili } from './meili';
import dns from 'dns';
import { isPrivateIp } from './utils';
import { resolveYouTubeChannel, fetchYouTubeVideosAsFeed } from './youtube';

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

const FEED_PATHS = ['/feed', '/rss', '/rss.xml', '/atom.xml', '/feed.xml', '/index.xml'];

export type DiscoveryResult = { url: string; feed: ParsedFeed };

export async function discoverFeedUrl(rawUrl: string): Promise<DiscoveryResult> {
  try {
    const feed = await parser.parseURL(rawUrl);
    return { url: rawUrl, feed };
  } catch {
    // Not a feed — continue to discovery paths
  }

  const youtubeInfo = await resolveYouTubeChannel(rawUrl);
  if (youtubeInfo) {
    try {
      await validateFeedUrl(youtubeInfo.feedUrl);
      const feed = await parser.parseURL(youtubeInfo.feedUrl);
      return { url: youtubeInfo.feedUrl, feed };
    } catch {
      const fallback = await fetchYouTubeVideosAsFeed(youtubeInfo.channelId);
      if (fallback) {
        return { url: youtubeInfo.feedUrl, feed: fallback as ParsedFeed };
      }
    }
  }

  const base = new URL(rawUrl).origin;

  for (const path of FEED_PATHS) {
    const feedUrl = `${base}${path}`;
    await validateFeedUrl(feedUrl);
    try {
      const feed = await parser.parseURL(feedUrl);
      return { url: feedUrl, feed };
    } catch {
      continue;
    }
  }

  throw new Error('No RSS feed found at this URL.');
}

const parser = new Parser({
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MultivRSS/1.0)' },
});

export type ParsedFeed = Awaited<ReturnType<typeof parser.parseURL>>;

const UPSERT_CONCURRENCY = 10;

export async function syncFeed(sourceId: string, prefetchedFeed?: ParsedFeed) {
    // 1. Find source in the database (include category for Meili denormalization)
    const source = await prisma.feedSource.findUnique({
        where: { id: sourceId },
        include: { category: true },
    });

    if (!source) throw new Error('Source not found');

    // 2. Download RSS feed (skip if already fetched by the caller)
    const feed = prefetchedFeed ?? await parser.parseURL(source.url);

    // 3. Save articles (upsert) — batched to avoid saturating the DB connection pool
    const syncResults: Awaited<ReturnType<typeof prisma.feedItem.upsert>>[] = [];
    for (let i = 0; i < feed.items.length; i += UPSERT_CONCURRENCY) {
        const chunk = feed.items.slice(i, i + UPSERT_CONCURRENCY);
        const results = await Promise.all(
            chunk.map(async (item) => {
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
        syncResults.push(...results);
    }

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
            sourceTitle: source.title || '',
            categoryId: source.category.id,
            categoryName: source.category.name,
        })),
        { primaryKey: 'id' }
    );
    console.log(`✅ Meilisearch sync task submitted. Task UID: ${meiliTask.taskUid}`);

    // 5. Update the last sync date of the source
    await prisma.feedSource.update({
        where: { id: sourceId },
        data: {
            lastSync: new Date(),
            ...(feed.title ? { title: feed.title } : {}),
        },
    });

    return syncResults;
}
