import Parser from 'rss-parser';
import { Prisma } from '@prisma/client';
import { prisma } from './prisma';
import dns from 'dns';
import net from 'net';
import http from 'http';
import https from 'https';
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

// ── SSRF guard for the actual network layer ──
// validateFeedUrl() above is a fast, user-facing pre-check on the URL the
// user typed. It is NOT sufficient on its own: a feed/page can 302-redirect
// to a private/internal address after the check passes, and a malicious DNS
// server can resolve the same hostname to a different (private) IP between
// the check and the real connection (DNS rebinding). safeLookup() below is
// wired into every outbound HTTP(S) request this module makes (including
// every hop of a redirect chain, via rss-parser's requestOptions.lookup and
// safeFetchText()) so the address actually connected to is always re-checked
// at connect time, not just once up front.
function safeLookup(
  hostname: string,
  options: dns.LookupOptions,
  callback: (err: NodeJS.ErrnoException | null, address: string | dns.LookupAddress[], family?: number) => void,
): void {
  dns.lookup(hostname, options, (err, address, family) => {
    if (err) return callback(err, address, family);
    const results = Array.isArray(address) ? address : [{ address, family }];
    const blocked = results.find(r => isPrivateIp(r.address));
    if (blocked) {
      return callback(new Error(`Refusing to connect: "${hostname}" resolves to a private or reserved IP address.`), address, family);
    }
    callback(null, address, family);
  });
}

const MAX_REDIRECTS = 5;
const MAX_BODY_BYTES = 2_000_000;

// ── SSRF-safe GET with manual, re-validated redirect following ──
// Used anywhere we fetch arbitrary user-supplied URLs outside of rss-parser
// (which gets the same guard via its requestOptions.lookup, see `parser` below).
export async function safeFetchText(
  targetUrl: string,
  opts: { headers?: Record<string, string>; timeoutMs?: number } = {},
): Promise<{ status: number; contentType: string; body: string; finalUrl: string }> {
  let current = targetUrl;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const parsed = new URL(current);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('Only http and https URLs are allowed.');
    }
    // Node's http/https clients skip the custom `lookup` hook entirely when the
    // host is already a literal IP (no DNS resolution needed) — so a redirect
    // straight to e.g. http://169.254.169.254/... would otherwise sail through
    // safeLookup untouched. Catch that case explicitly, on every hop.
    const bareHost = parsed.hostname.replace(/^\[|\]$/g, '');
    if (net.isIP(bareHost) && isPrivateIp(bareHost)) {
      throw new Error(`Refusing to connect: "${bareHost}" is a private or reserved IP address.`);
    }
    const client = parsed.protocol === 'https:' ? https : http;

    const result = await new Promise<{ redirectTo: string } | { status: number; contentType: string; body: string; finalUrl: string }>((resolve, reject) => {
      const req = client.get(
        current,
        {
          lookup: safeLookup,
          timeout: opts.timeoutMs ?? 10_000,
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MultivRSS/1.0)', ...opts.headers },
        },
        (res) => {
          const status = res.statusCode ?? 0;
          if (status >= 300 && status < 400 && res.headers.location) {
            res.resume();
            return resolve({ redirectTo: new URL(res.headers.location, current).href });
          }
          if (status >= 300) {
            res.resume();
            return reject(new Error(`Request failed with status ${status}`));
          }
          let body = '';
          let bytes = 0;
          res.setEncoding('utf8');
          res.on('data', (chunk: string) => {
            bytes += Buffer.byteLength(chunk);
            if (bytes > MAX_BODY_BYTES) {
              req.destroy(new Error('Response too large'));
              return;
            }
            body += chunk;
          });
          res.on('end', () => resolve({ status, contentType: res.headers['content-type'] ?? '', body, finalUrl: current }));
        },
      );
      req.on('timeout', () => req.destroy(new Error('Request timed out')));
      req.on('error', reject);
    });

    if ('redirectTo' in result) {
      current = result.redirectTo;
      continue;
    }
    return result;
  }
  throw new Error('Too many redirects');
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
  try {
    const res = await safeFetchText(rawUrl, { timeoutMs: 10000 });
    const html = res.body;

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
        const feed = await fetchAndParseFeed(absoluteUrl);
        return { url: absoluteUrl, feed };
      } catch {
        continue;
      }
    }
    return null;
  } catch {
    return null;
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
    const feed = await fetchAndParseFeed(rawUrl);
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
      const feed = await fetchAndParseFeed(youtubeInfo.feedUrl);
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
      const feed = await fetchAndParseFeed(feedUrl);
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
      const feed = await fetchAndParseFeed(feedUrl);
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
  // Defense in depth only — actual fetching goes through fetchAndParseFeed()
  // below, never parser.parseURL(), so this hook mostly guards against
  // future code accidentally calling parseURL() directly.
  requestOptions: { lookup: safeLookup },
});

export type ParsedFeed = Awaited<ReturnType<typeof parser.parseString>>;

// Fetches a feed URL through the SSRF-safe safeFetchText() (which re-validates
// every redirect hop, including literal-IP targets) and only hands the final,
// already-fetched body to rss-parser for XML parsing — rss-parser's own
// parseURL() must never be called on a raw user/feed-supplied URL, since its
// built-in redirect-following has no SSRF guard at all.
async function fetchAndParseFeed(feedUrl: string): Promise<ParsedFeed> {
  const res = await safeFetchText(feedUrl, {
    timeoutMs: 10000,
    headers: { Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*' },
  });
  return parser.parseString(res.body);
}

export async function syncFeed(sourceId: string, prefetchedFeed?: ParsedFeed) {
    // 1. Find source in the database
    const source = await prisma.feedSource.findUnique({
        where: { id: sourceId },
    });

    if (!source) throw new Error('Source not found');

    // 2. Download RSS feed (skip if already fetched by the caller)
    const feed = prefetchedFeed ?? await fetchAndParseFeed(source.url);

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
        frontPageShownAt: Date | null;
    }> = [];

    // Every externalId still present in the feed XML this sync — used to stamp
    // lastSeenAt below. Items with neither guid nor link collapse to '' (and
    // collide on @@unique([sourceId, externalId])); exclude that degenerate row.
    const seenExternalIds = new Set<string>();

    for (const item of feed.items) {
        const externalId = item.guid || item.link || '';
        const title = decodeHtmlEntities(item.title || 'Untitled');
        const rawContent = item.contentSnippet || stripHtml(item.summary || item.content || '');
        const content = decodeHtmlEntities(rawContent);

        if (externalId !== '') seenExternalIds.add(externalId);

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
                frontPageShownAt: existing.frontPageShownAt,
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

    // 4. Stamp lastSeenAt for every item still in the feed (new + existing).
    // This is retention's heartbeat: runFeedSyncScan() only purges unsaved
    // items whose lastSeenAt is 90+ days old, i.e. items that actually dropped
    // off the source feed — never items still being served. Raw UPDATE (not
    // prisma.updateMany) so it doesn't bump the client-emulated @updatedAt,
    // which getFrontPage()'s "recently read" ordering depends on.
    if (seenExternalIds.size > 0) {
        await prisma.$executeRaw`
            UPDATE "FeedItem"
            SET "lastSeenAt" = ${new Date()}
            WHERE "sourceId" = ${source.id}
              AND "externalId" IN (${Prisma.join([...seenExternalIds])})
        `;
    }

    // 5. Update the last sync date of the source. Title is intentionally
    // not touched here — it's set once when the source is created/discovered
    // and must not be clobbered by the feed's own title on later syncs,
    // otherwise manual renames and custom names would keep reverting.
    await prisma.feedSource.update({
        where: { id: sourceId },
        data: {
            lastSync: new Date(),
            ...(feed.ttl ? { ttlMinutes: parseInt(feed.ttl, 10) || null } : {}),
        },
    });

    return created;
}
