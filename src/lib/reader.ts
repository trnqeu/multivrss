import { createHash } from 'crypto';
import { parseHTML } from 'linkedom';
import { Readability } from '@mozilla/readability';
import sanitizeHtml from 'sanitize-html';
import { redis } from '@/lib/redis';
import { validateFeedUrl, safeFetchText } from '@/lib/rss';

const SUCCESS_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days — bounds cache size to a rolling window
const FAILURE_TTL_SECONDS = 60 * 10; // 10 minutes — avoids hammering a currently-broken source
const MIN_EXTRACTED_CHARS = 250;

export interface ExtractedArticle {
    title: string | null;
    byline: string | null;
    contentHtml: string;
    textLength: number;
    extractedAt: number;
}

export type ReaderFailureReason = 'ssrf-blocked' | 'fetch-failed' | 'not-html' | 'extraction-empty';

export type ReaderResult =
    | { ok: true; article: ExtractedArticle; fromCache: boolean }
    | { ok: false; reason: ReaderFailureReason };

function cacheKey(link: string): string {
    return `reader:v1:${createHash('sha256').update(link).digest('hex')}`;
}

function failureCacheKey(link: string): string {
    return `reader:v1:fail:${createHash('sha256').update(link).digest('hex')}`;
}

function resolveUrl(raw: string, base: string): string | undefined {
    try {
        return new URL(raw, base).href;
    } catch {
        return undefined;
    }
}

function sanitizeOptions(baseUrl: string): sanitizeHtml.IOptions {
    return {
        allowedTags: [
            'p', 'br', 'hr', 'blockquote', 'pre', 'code',
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            'ul', 'ol', 'li',
            'strong', 'b', 'em', 'i', 'u', 's', 'sub', 'sup', 'mark',
            'a', 'img', 'figure', 'figcaption',
            'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
            'div', 'span',
        ],
        allowedAttributes: {
            // target/rel/loading are added here (not just in transformTags) because
            // sanitize-html re-filters transformed attributes against this allowlist —
            // setting them only in transformTags below would get them stripped again.
            a: ['href', 'name', 'title', 'target', 'rel'],
            img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
            '*': [],
        },
        allowedSchemes: ['http', 'https'],
        disallowedTagsMode: 'discard',
        transformTags: {
            a: (tagName, attribs) => ({
                tagName: 'a',
                attribs: {
                    ...(attribs.href ? { href: resolveUrl(attribs.href, baseUrl) ?? '' } : {}),
                    target: '_blank',
                    rel: 'noopener noreferrer nofollow ugc',
                },
            }),
            img: (tagName, attribs) => ({
                tagName: 'img',
                attribs: {
                    ...(attribs.src ? { src: resolveUrl(attribs.src, baseUrl) ?? '' } : {}),
                    // Guarantees every <img> has an alt per the a11y checklist — best-effort
                    // empty string (treated as decorative) when the source markup had none.
                    alt: attribs.alt || '',
                    loading: 'lazy',
                },
            }),
            // Demote extracted headings by one level so the reader page's own <h1>
            // (the article title, rendered separately) stays the only h1 on the page.
            h1: 'h2', h2: 'h3', h3: 'h4', h4: 'h5', h5: 'h6', h6: 'h6',
        },
    };
}

async function readCache(link: string): Promise<ReaderResult | null> {
    try {
        const [success, failure] = await Promise.all([
            redis.get(cacheKey(link)),
            redis.get(failureCacheKey(link)),
        ]);
        if (success) return { ok: true, article: JSON.parse(success) as ExtractedArticle, fromCache: true };
        if (failure) return { ok: false, reason: failure as ReaderFailureReason };
    } catch (err) {
        console.error('reader: cache read failed', err);
    }
    return null;
}

async function writeSuccessCache(link: string, article: ExtractedArticle): Promise<void> {
    try {
        await redis.set(cacheKey(link), JSON.stringify(article), 'EX', SUCCESS_TTL_SECONDS);
    } catch (err) {
        console.error('reader: cache write failed', err);
    }
}

async function writeFailureCache(link: string, reason: ReaderFailureReason): Promise<void> {
    try {
        await redis.set(failureCacheKey(link), reason, 'EX', FAILURE_TTL_SECONDS);
    } catch (err) {
        console.error('reader: failure cache write failed', err);
    }
}

// Extracts a clean, readable version of a third-party article page, caching
// the result in Redis. Never throws — every expected failure mode (SSRF,
// network error, non-HTML response, thin/empty extraction) is returned as
// data so callers can render a fallback instead of an error page. Caching is
// a pure optimization: a Redis outage degrades to a live extraction on every
// call, it never breaks the feature.
export async function getReadableArticle(link: string): Promise<ReaderResult> {
    const cached = await readCache(link);
    if (cached) return cached;

    async function fail(reason: ReaderFailureReason): Promise<ReaderResult> {
        await writeFailureCache(link, reason);
        return { ok: false, reason };
    }

    try {
        await validateFeedUrl(link);
    } catch {
        return fail('ssrf-blocked');
    }

    let fetched: Awaited<ReturnType<typeof safeFetchText>>;
    try {
        fetched = await safeFetchText(link, {
            timeoutMs: 8000,
            headers: { 'user-agent': 'Mozilla/5.0 (compatible; MultivRSS-Reader/1.0)', accept: 'text/html' },
        });
    } catch (err) {
        console.error('reader: fetch failed', link, err);
        return fail('fetch-failed');
    }

    if (!fetched.contentType.includes('text/html')) {
        return fail('not-html');
    }

    const { document } = parseHTML(fetched.body);
    // linkedom's Document is structurally compatible with Readability's expected
    // DOM shape but is not the same nominal type as the ambient lib.dom `Document`
    // Readability's own types are written against — a deliberate, narrow cast at
    // the one boundary where a lightweight DOM shim meets a jsdom-typed library.
    const parsed = new Readability(document as unknown as Document, { charThreshold: MIN_EXTRACTED_CHARS }).parse();

    const textContent = parsed?.textContent?.trim() ?? '';
    if (!parsed || !parsed.content || textContent.length < MIN_EXTRACTED_CHARS) {
        return fail('extraction-empty');
    }

    const article: ExtractedArticle = {
        title: parsed.title ?? null,
        byline: parsed.byline ?? null,
        contentHtml: sanitizeHtml(parsed.content, sanitizeOptions(fetched.finalUrl)),
        textLength: textContent.length,
        extractedAt: Date.now(),
    };

    await writeSuccessCache(link, article);
    return { ok: true, article, fromCache: false };
}
