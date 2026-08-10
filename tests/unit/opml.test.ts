import { describe, expect, it } from 'vitest';
import { parseOpml, buildOpml } from '@/lib/opml';

describe('parseOpml', () => {
    it('reads nested category outlines as feed categories', () => {
        const xml = `<?xml version="1.0"?>
<opml version="2.0">
  <head><title>Feeds</title></head>
  <body>
    <outline text="NEWS">
      <outline type="rss" text="BBC" title="BBC" xmlUrl="https://bbc.com/rss.xml"/>
      <outline type="rss" text="Reuters" xmlUrl="https://reuters.com/rss.xml"/>
    </outline>
    <outline text="CULTURE">
      <outline type="rss" text="The Atlantic" xmlUrl="https://theatlantic.com/rss.xml"/>
    </outline>
  </body>
</opml>`;

        const { feeds, errors } = parseOpml(xml);

        expect(errors).toEqual([]);
        expect(feeds).toEqual([
            { url: 'https://bbc.com/rss.xml', title: 'BBC', categoryName: 'NEWS' },
            { url: 'https://reuters.com/rss.xml', title: 'Reuters', categoryName: 'NEWS' },
            { url: 'https://theatlantic.com/rss.xml', title: 'The Atlantic', categoryName: 'CULTURE' },
        ]);
    });

    it('buckets top-level flat feed outlines (no container) as UNSORTED', () => {
        const xml = `<opml><body>
          <outline type="rss" text="Standalone" xmlUrl="https://example.com/rss.xml" />
        </body></opml>`;

        const { feeds } = parseOpml(xml);

        expect(feeds).toEqual([
            { url: 'https://example.com/rss.xml', title: 'Standalone', categoryName: 'UNSORTED' },
        ]);
    });

    it('decodes XML entities in attribute values', () => {
        const xml = `<opml><body>
          <outline text="TECH &amp; SCIENCE">
            <outline type="rss" text="A &lt;B&gt; Blog" xmlUrl="https://example.com/a?x=1&amp;y=2" />
          </outline>
        </body></opml>`;

        const { feeds } = parseOpml(xml);

        expect(feeds).toEqual([
            { url: 'https://example.com/a?x=1&y=2', title: 'A <B> Blog', categoryName: 'TECH & SCIENCE' },
        ]);
    });

    it('falls back to the xmlUrl when no text/title attribute is present', () => {
        const xml = `<opml><body>
          <outline type="rss" xmlUrl="https://example.com/rss.xml" />
        </body></opml>`;

        const { feeds } = parseOpml(xml);

        expect(feeds[0].title).toBeUndefined();
        expect(feeds[0].url).toBe('https://example.com/rss.xml');
    });

    it('returns an error when there is no <body> element', () => {
        const { feeds, errors } = parseOpml('<opml><head><title>Feeds</title></head></opml>');

        expect(feeds).toEqual([]);
        expect(errors[0]).toMatch(/does not look like an OPML file/);
    });

    it('returns no feeds for an OPML file with only category folders and no xmlUrl entries', () => {
        const xml = `<opml><body><outline text="EMPTY"></outline></body></opml>`;

        const { feeds } = parseOpml(xml);

        expect(feeds).toEqual([]);
    });
});

describe('buildOpml', () => {
    it('serializes categories and feeds as nested outlines', () => {
        const xml = buildOpml([
            { name: 'NEWS', feeds: [{ url: 'https://bbc.com/rss.xml', title: 'BBC' }] },
        ]);

        expect(xml).toContain('<outline text="NEWS" title="NEWS">');
        expect(xml).toContain('<outline type="rss" text="BBC" title="BBC" xmlUrl="https://bbc.com/rss.xml" />');
    });

    it('escapes XML-sensitive characters', () => {
        const xml = buildOpml([
            { name: 'TECH & SCIENCE', feeds: [{ url: 'https://example.com/a?x=1&y=2', title: null }] },
        ]);

        expect(xml).toContain('text="TECH &amp; SCIENCE"');
        expect(xml).toContain('xmlUrl="https://example.com/a?x=1&amp;y=2"');
    });

    it('falls back to the URL as the label when a feed has no title', () => {
        const xml = buildOpml([{ name: 'NEWS', feeds: [{ url: 'https://example.com/rss.xml', title: null }] }]);

        expect(xml).toContain('text="https://example.com/rss.xml"');
    });

    it('round-trips through parseOpml', () => {
        const xml = buildOpml([
            { name: 'NEWS', feeds: [{ url: 'https://bbc.com/rss.xml', title: 'BBC' }] },
            { name: 'CULTURE', feeds: [{ url: 'https://theatlantic.com/rss.xml', title: null }] },
        ]);

        const { feeds, errors } = parseOpml(xml);

        expect(errors).toEqual([]);
        expect(feeds).toEqual([
            { url: 'https://bbc.com/rss.xml', title: 'BBC', categoryName: 'NEWS' },
            { url: 'https://theatlantic.com/rss.xml', title: 'https://theatlantic.com/rss.xml', categoryName: 'CULTURE' },
        ]);
    });
});
