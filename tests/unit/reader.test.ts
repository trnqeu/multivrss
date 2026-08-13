import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGet = vi.hoisted(() => vi.fn());
const mockSet = vi.hoisted(() => vi.fn());
vi.mock('@/lib/redis', () => ({
    redis: { get: mockGet, set: mockSet },
}));

const mockValidateFeedUrl = vi.hoisted(() => vi.fn());
const mockSafeFetchText = vi.hoisted(() => vi.fn());
vi.mock('@/lib/rss', () => ({
    validateFeedUrl: mockValidateFeedUrl,
    safeFetchText: mockSafeFetchText,
}));

import { getReadableArticle, type ExtractedArticle } from '@/lib/reader';

const LINK = 'https://example.com/articles/page';
// Real fixture, run through the real Readability + linkedom + sanitize-html
// pipeline (only the I/O boundaries — Redis and the network fetch — are
// mocked) — these are load-bearing assertions, not mocks-testing-mocks.
const ARTICLE_HTML = `<!doctype html><html><head><title>Test</title></head><body>
<nav>Site Nav Home About Contact</nav>
<article>
<h1>The Rise of Article Extraction</h1>
<p>Article extraction has become an important part of modern reading apps. It lets users read the full text of a page without navigating away from the tool they already trust, and without the surrounding clutter of ads and navigation chrome that most publishers ship today.</p>
<h2>Why It Matters</h2>
<p onclick="alert(1)">This paragraph has plenty of real content describing how Readability walks the DOM tree, scores candidate nodes by link density and text length, and then picks the best one as the main content container for the page.</p>
<script>alert('xss')</script>
<p>Beyond the algorithm itself, a production implementation also needs to worry about relative URLs. <a href="/relative-link">This link</a> and <img src="/relative-image.jpg" onerror="alert(2)"> both need to be resolved against the final, post-redirect URL of the page, not the original one the user clicked.</p>
<p>Finally, sanitization matters just as much as extraction. Arbitrary third-party HTML can never be trusted directly, so every tag and attribute must be checked against an explicit allowlist before it is ever rendered inside the application via dangerouslySetInnerHTML.</p>
</article>
<footer>Copyright 2026</footer>
</body></html>`;

const THIN_HTML = '<html><body><p>hi</p></body></html>';

// Reproduces a real-world failure mode: Next.js's PPR/dynamic-resume streaming
// delivers a resolved-but-postponed subtree wrapped in a `hidden` container
// (e.g. `<div hidden id="S:2">…</div>`) meant to be revealed by client-side JS.
// Readability's own `_isProbablyVisible()` check (Readability.js) explicitly
// strips any `hidden`-attributed node before scoring candidates, so on a page
// like this the *only* thing left to score is the tiny always-visible loading
// placeholder — even though the real article sits right there in the DOM.
const HIDDEN_RESUME_HTML = `<!doctype html><html><head><title>Field Notes: A Small Utility</title></head><body>
<div>
  <span>MultivRSS</span>
  <span>Initializing_Data_Stream // 0xAF4</span>
</div>
<div hidden id="S:2">
  <main id="main-content">
    <h1>Field Notes: A Small Utility</h1>
    <p>This week I spent a few afternoons building a tiny utility that nobody asked for, mostly because I wanted an excuse to sit with a problem long enough to understand its edges properly this time around.</p>
    <p>I started from a blank file and a rough idea, then let the shape of the thing emerge as I ran into the first few real constraints one after another, adjusting course each time something didn't quite fit.</p>
    <p>What stuck with me afterwards was less the code itself and more the sequence of small decisions that led to it, each one obvious only in hindsight, which is usually how these side projects go.</p>
  </main>
</div>
</body></html>`;

function mockSuccessfulFetch(html: string, finalUrl = LINK) {
    mockSafeFetchText.mockResolvedValue({ status: 200, contentType: 'text/html; charset=utf-8', body: html, finalUrl });
}

describe('getReadableArticle', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockGet.mockResolvedValue(null);
        mockSet.mockResolvedValue('OK');
        mockValidateFeedUrl.mockResolvedValue(undefined);
    });

    it('returns the cached article without fetching when a success entry exists', async () => {
        const cached: ExtractedArticle = {
            title: 'Cached', byline: null, contentHtml: '<p>cached</p>', markdown: '# Cached\n\ncached', textLength: 6, extractedAt: 1,
        };
        mockGet.mockImplementation((key: string) => Promise.resolve(key.includes(':fail:') ? null : JSON.stringify(cached)));

        const result = await getReadableArticle(LINK);

        expect(result).toEqual({ ok: true, article: cached, fromCache: true });
        expect(mockSafeFetchText).not.toHaveBeenCalled();
    });

    it('returns the cached failure reason without fetching when a negative entry exists', async () => {
        mockGet.mockImplementation((key: string) => Promise.resolve(key.includes(':fail:') ? 'not-html' : null));

        const result = await getReadableArticle(LINK);

        expect(result).toEqual({ ok: false, reason: 'not-html' });
        expect(mockSafeFetchText).not.toHaveBeenCalled();
    });

    it('blocks SSRF-unsafe URLs before fetching and negative-caches the result', async () => {
        mockValidateFeedUrl.mockRejectedValue(new Error('private IP'));

        const result = await getReadableArticle(LINK);

        expect(result).toEqual({ ok: false, reason: 'ssrf-blocked' });
        expect(mockSafeFetchText).not.toHaveBeenCalled();
        expect(mockSet).toHaveBeenCalledWith(expect.stringContaining(':fail:'), 'ssrf-blocked', 'EX', 600);
    });

    it('rejects non-HTML content types', async () => {
        mockSuccessfulFetch('{}', LINK);
        mockSafeFetchText.mockResolvedValue({ status: 200, contentType: 'application/json', body: '{}', finalUrl: LINK });

        const result = await getReadableArticle(LINK);

        expect(result).toEqual({ ok: false, reason: 'not-html' });
    });

    it('reports extraction-empty for pages with too little extractable content', async () => {
        mockSuccessfulFetch(THIN_HTML);

        const result = await getReadableArticle(LINK);

        expect(result).toEqual({ ok: false, reason: 'extraction-empty' });
    });

    it('treats a fetch failure as fetch-failed without leaking the raw error', async () => {
        mockSafeFetchText.mockRejectedValue(new Error('socket hang up'));

        const result = await getReadableArticle(LINK);

        expect(result).toEqual({ ok: false, reason: 'fetch-failed' });
    });

    it('extracts, sanitizes, and caches a real article', async () => {
        mockSuccessfulFetch(ARTICLE_HTML);

        const result = await getReadableArticle(LINK);

        expect(result.ok).toBe(true);
        if (!result.ok) throw new Error('expected ok result');

        expect(result.article.title).toBe('The Rise of Article Extraction');
        expect(result.fromCache).toBe(false);

        // Script tags and inline event handlers must never survive sanitization.
        expect(result.article.contentHtml).not.toContain('<script');
        expect(result.article.contentHtml).not.toContain('onclick');
        expect(result.article.contentHtml).not.toContain('onerror');

        // Headings inside the body are demoted one level so the page's own <h1>
        // (rendered separately from article.title) stays the only h1.
        expect(result.article.contentHtml).toContain('<h3>Why It Matters</h3>');
        expect(result.article.contentHtml).not.toMatch(/<h1|<h2/);

        // Relative URLs must resolve against the final (post-redirect) URL.
        expect(result.article.contentHtml).toContain('href="https://example.com/relative-link"');
        expect(result.article.contentHtml).toContain('src="https://example.com/relative-image.jpg"');

        // Outbound links get safe target/rel regardless of source markup.
        expect(result.article.contentHtml).toContain('target="_blank"');
        expect(result.article.contentHtml).toContain('rel="noopener noreferrer nofollow ugc"');

        // Every image gets an alt attribute even when the source had none.
        expect(result.article.contentHtml).toMatch(/<img[^>]*alt="/);

        // The Markdown export is built from the sanitized HTML: title as a heading,
        // the source link, and the body converted to Markdown (no leftover HTML tags).
        expect(result.article.markdown).toContain('# The Rise of Article Extraction');
        expect(result.article.markdown).toContain(`Source: <${LINK}>`);
        expect(result.article.markdown).toContain('### Why It Matters');
        expect(result.article.markdown).not.toContain('<p>');

        expect(mockSet).toHaveBeenCalledWith(
            expect.not.stringContaining(':fail:'),
            expect.any(String),
            'EX',
            604_800,
        );
    });

    it('retries scoped to <main> when full-page extraction is defeated by a hidden resume container', async () => {
        mockSuccessfulFetch(HIDDEN_RESUME_HTML);

        const result = await getReadableArticle(LINK);

        expect(result.ok).toBe(true);
        if (!result.ok) throw new Error('expected ok result');
        expect(result.article.title).toBe('Field Notes: A Small Utility');
        expect(result.article.contentHtml).toContain('a blank file and a rough idea');
    });

    it('still returns a result when the Redis cache is unavailable', async () => {
        mockGet.mockRejectedValue(new Error('ECONNREFUSED'));
        mockSet.mockRejectedValue(new Error('ECONNREFUSED'));
        mockSuccessfulFetch(ARTICLE_HTML);

        const result = await getReadableArticle(LINK);

        expect(result.ok).toBe(true);
    });
});
