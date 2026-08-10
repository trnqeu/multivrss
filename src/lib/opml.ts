// Minimal, dependency-free OPML reader/writer for the RSS sources
// import/export cards (see src/app/u/[username]/settings/import-export).
//
// Deliberately does NOT use a general-purpose XML parser: OPML's <outline>
// structure is simple enough to scan with regex, and skipping real
// DOCTYPE/entity processing entirely means an uploaded file can never
// trigger XXE — no external entity or DTD is ever resolved (see the
// security-and-hardening skill's Injection guidance). This is narrower than
// the full OPML spec (no namespaces, no CDATA) but MultivRSS only needs
// text/title/xmlUrl on <outline> elements.

export interface ParsedOpmlFeed {
    url: string;
    title?: string;
    categoryName: string;
}

export interface ParsedOpml {
    feeds: ParsedOpmlFeed[];
    errors: string[];
}

// Bounds the work done on a single upload regardless of file size (the 5 MB
// cap enforced at the action layer already limits this in practice, but a
// pathological file — e.g. megabytes of empty outlines — shouldn't get a
// free pass just because it's small).
const MAX_OUTLINES = 2000;

function decodeXmlEntities(value: string): string {
    return value
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&amp;/g, '&');
}

// Linear-time attribute scan (no nested unbounded quantifiers, so no ReDoS
// risk) over a single already-isolated <outline ...> tag string.
function parseAttributes(tag: string): Record<string, string> {
    const attrs: Record<string, string> = {};
    const re = /([a-zA-Z:_][\w:.-]*)\s*=\s*"([^"]*)"|([a-zA-Z:_][\w:.-]*)\s*=\s*'([^']*)'/g;
    let match: RegExpExecArray | null;
    while ((match = re.exec(tag))) {
        const name = (match[1] ?? match[3]).toLowerCase();
        const value = decodeXmlEntities(match[2] ?? match[4] ?? '');
        attrs[name] = value;
    }
    return attrs;
}

export function parseOpml(xml: string): ParsedOpml {
    const errors: string[] = [];
    const bodyMatch = /<body[^>]*>([\s\S]*)<\/body>/i.exec(xml);
    if (!bodyMatch) {
        return { feeds: [], errors: ['No <body> element found — this does not look like an OPML file.'] };
    }
    const body = bodyMatch[1];

    const tagRe = /<outline\b[^>]*>|<\/outline\s*>/gi;
    const stack: string[] = [];
    const feeds: ParsedOpmlFeed[] = [];
    let count = 0;
    let match: RegExpExecArray | null;

    while ((match = tagRe.exec(body))) {
        if (++count > MAX_OUTLINES) {
            errors.push(`Stopped after ${MAX_OUTLINES} entries — split large OPML files into smaller ones.`);
            break;
        }

        const full = match[0];
        if (/^<\/outline/i.test(full)) {
            stack.pop();
            continue;
        }

        const isSelfClosing = /\/\s*>$/.test(full);
        const attrs = parseAttributes(full);
        const xmlUrl = attrs.xmlurl;
        const label = attrs.text || attrs.title;

        if (xmlUrl) {
            feeds.push({
                url: xmlUrl,
                title: label || undefined,
                categoryName: stack[stack.length - 1] || 'UNSORTED',
            });
            if (!isSelfClosing) stack.push(label || 'UNSORTED');
        } else if (!isSelfClosing) {
            stack.push(label || 'UNSORTED');
        }
    }

    return { feeds, errors };
}

export interface OpmlCategoryInput {
    name: string;
    feeds: { url: string; title: string | null }[];
}

export function buildOpml(categories: OpmlCategoryInput[]): string {
    const esc = (s: string) =>
        s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    const body = categories
        .map(cat => {
            const feeds = cat.feeds
                .map(f => {
                    const label = esc(f.title || f.url);
                    return `      <outline type="rss" text="${label}" title="${label}" xmlUrl="${esc(f.url)}" />`;
                })
                .join('\n');
            return `    <outline text="${esc(cat.name)}" title="${esc(cat.name)}">\n${feeds}\n    </outline>`;
        })
        .join('\n');

    return [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<opml version="2.0">',
        '  <head>',
        '    <title>MultivRSS feeds</title>',
        '  </head>',
        '  <body>',
        body,
        '  </body>',
        '</opml>',
        '',
    ].join('\n');
}
