import Parser from 'rss-parser';
import { prisma } from './prisma';
import { meili } from './meili';
import dns from 'dns';
import { isPrivateIp, decodeHtmlEntities, stripHtml } from './utils';
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

  const dnsTimeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('DNS lookup timed out.')), 5_000)
  );
  const { address } = await Promise.race([dns.promises.lookup(parsed.hostname), dnsTimeout]);

  if (isPrivateIp(address)) {
    throw new Error('URL resolves to a private or reserved IP address.');
  }
}

const FEED_PATHS = ['/feed', '/rss', '/rss.xml', '/atom.xml', '/feed.xml', '/index.xml'];

// Additional feed paths for deeper discovery (less common).
const DEEP_FEED_PATHS = ['/feeds/', '/feeds', '/rss/feed', '/rss/', '/atom/'];

const FEED_EXTENSIONS = ['.xml', '.rss', '.atom', '.json'];

function looksLikeDirectFeedUrl(rawUrl: string): boolean {
  try {
    const { pathname } = new URL(rawUrl);
    const lower = pathname.toLowerCase();
    return (
      FEED_EXTENSIONS.some(ext => lower.endsWith(ext)) ||
      FEED_PATHS.some(p => lower === p || lower === p + '/') ||
      DEEP_FEED_PATHS.some(p => lower === p || lower === p + '/')
    );
  } catch {
    return false;
  }
}

export type DiscoveryResult = { url: string; feed: ParsedFeed };

async function discoverFromHtmlAutolink(rawUrl: string): Promise<DiscoveryResult | null> {
  const ac = new AbortController();
  const id = setTimeout(() => ac.abort(), 10000);
  try {
    const res = await fetch(rawUrl, {
      signal: ac.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MultivRSS/1.0)' },
    });
    const html = await res.text();

    const candidates: string[] = [];
    const linkRe = /<link[^>]*>/gi;
    let m: RegExpExecArray | null;
    while ((m = linkRe.exec(html)) !== null) {
      const tag = m[0];
      const rel = tag.match(/rel\s*=\s*["']([^"']*)["']/i)?.[1];
      const type = tag.match(/type\s*=\s*["']([^"']*)["']/i)?.[1];
      const href = tag.match(/href\s*=\s*["']([^"']*)["']/i)?.[1];
      if (!href || rel?.toLowerCase() !== 'alternate') continue;
      if (type === 'application/rss+xml' || type === 'application/atom+xml') {
        candidates.push(href);
      }
    }

    if (candidates.length === 0) return null;

    const base = new URL(rawUrl);
    for (const candidate of candidates) {
      const absoluteUrl = new URL(candidate, base).href;
      try {
        await validateFeedUrl(absoluteUrl);
        const feed = await parser.parseURL(absoluteUrl);
        return { url: absoluteUrl, feed };
      } catch {
        continue;
      }
    }
    return null;
  } catch {
    return null;
  } finally {
    clearTimeout(id);
  }
}

export async function discoverFeedUrl(rawUrl: string): Promise<DiscoveryResult> {
  const TOTAL_TIMEOUT_MS = 30_000;
  const deadline = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Feed discovery timed out. The server may be slow or unreachable.')), TOTAL_TIMEOUT_MS)
  );
  return Promise.race([_discoverFeedUrl(rawUrl), deadline]);
}

async function _discoverFeedUrl(rawUrl: string): Promise<DiscoveryResult> {
  // 1. Try the URL directly as a feed.
  try {
    const feed = await parser.parseURL(rawUrl);
    return { url: rawUrl, feed };
  } catch (err) {
    // If the URL already looks like a direct feed (e.g. ends in .xml), don't
    // waste time on HTML discovery or well-known path fallbacks — fail fast.
    if (looksLikeDirectFeedUrl(rawUrl)) {
      const reason = err instanceof Error ? err.message : String(err);
      throw new Error(`Could not fetch feed at this URL: ${reason}`);
    }
  }

  // 2. YouTube channel resolution.
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

  // 3. Parse the HTML looking for <link rel="alternate" type="application/*+xml">.
  const fromHtml = await discoverFromHtmlAutolink(rawUrl);
  if (fromHtml) return fromHtml;

  // 4. Try well-known feed paths (shallow).
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

  // 5. Try deeper feed paths (less common).
  for (const path of DEEP_FEED_PATHS) {
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
  timeout: 10000,
  headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MultivRSS/1.0)' },
});

export type ParsedFeed = Awaited<ReturnType<typeof parser.parseURL>>;

export async function syncFeed(sourceId: string, prefetchedFeed?: ParsedFeed) {
    // 1. Find source in the database (include category for Meili denormalization)
    const source = await prisma.feedSource.findUnique({
        where: { id: sourceId },
        include: { category: true },
    });

    if (!source) throw new Error('Source not found');

    // 2. Download RSS feed (skip if already fetched by the caller)
    const feed = prefetchedFeed ?? await parser.parseURL(source.url);

    // 3. Save articles — batch insert new items, update changed ones
    const existingItems = await prisma.feedItem.findMany({
        where: { sourceId: source.id },
    });
    const existingByExtId = new Map(existingItems.map(i => [i.externalId, i]));

    const toCreate: Array<{
        externalId: string; title: string; link: string;
        content: string; pubDate: Date | null; sourceId: string;
    }> = [];

    const toUpdate: Array<{
        id: string; externalId: string; title: string; content: string;
        link: string; pubDate: Date | null; sourceId: string; savedAt: Date | null;
    }> = [];

    for (const item of feed.items) {
        const externalId = item.guid || item.link || '';
        const title = decodeHtmlEntities(item.title || 'Untitled');
        const rawContent = item.contentSnippet || stripHtml(item.summary || item.content || '');
        const content = decodeHtmlEntities(rawContent);

        const existing = existingByExtId.get(externalId);
        if (!existing) {
            toCreate.push({
                externalId, title, link: item.link || '', content,
                pubDate: item.isoDate ? new Date(item.isoDate) : null,
                sourceId: source.id,
            });
        } else if (existing.title !== title || existing.content !== content) {
            toUpdate.push({
                id: existing.id, externalId, title, content,
                link: item.link || '', pubDate: existing.pubDate,
                sourceId: source.id, savedAt: existing.savedAt,
            });
        }
    }

    if (toUpdate.length > 0) {
        await prisma.$transaction(
            toUpdate.map(u =>
                prisma.feedItem.update({
                    where: { id: u.id },
                    data: { title: u.title, content: u.content },
                })
            )
        );
    }

    let created: typeof existingItems = [];
    if (toCreate.length > 0) {
        created = await prisma.feedItem.createManyAndReturn({ data: toCreate });
    }

    const meiliItems = [...created, ...toUpdate];

    // 4. Sync to Meilisearch — fire-and-forget, non bloccante
    if (meiliItems.length > 0) {
        meili.index('items').addDocuments(
            meiliItems.map((item) => ({
                id: item.id,
                externalId: item.externalId,
                title: item.title,
                content: item.content,
                link: item.link,
                pubDate: item.pubDate ? (item.pubDate instanceof Date ? item.pubDate.getTime() : item.pubDate) : null,
                sourceId: item.sourceId,
                sourceTitle: source.title || '',
                categoryId: source.category.id,
                categoryName: source.category.name,
                read: false,
                savedAt: item.savedAt ? (item.savedAt instanceof Date ? item.savedAt.getTime() : item.savedAt) : null,
            })),
            { primaryKey: 'id' }
        ).catch((error: unknown) => {
            console.error(`Meilisearch sync failed for source ${sourceId}:`, error);
        });
    }

    // 5. Update the last sync date of the source
    await prisma.feedSource.update({
        where: { id: sourceId },
        data: {
            lastSync: new Date(),
            ...(feed.title ? { title: feed.title } : {}),
            ...(feed.ttl ? { ttlMinutes: parseInt(feed.ttl, 10) || null } : {}),
        },
    });

    return created;
}
