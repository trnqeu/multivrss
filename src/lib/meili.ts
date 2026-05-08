import { MeiliSearch } from 'meilisearch';
import 'dotenv/config';

export const meili = new MeiliSearch({
  host: process.env.MEILI_HOST || 'http://localhost:7700',
  apiKey: process.env.MEILI_MASTER_KEY,
});

// Highlight delimiters used in every search call — safe, no dangerouslySetInnerHTML needed
export const HIGHLIGHT_PRE = '<<HL>>';
export const HIGHLIGHT_POST = '<</HL>>';

// Configure index settings — call this at runtime, not at import time
export async function configureMeiliIndex() {
    await meili.index('items').updateSettings({
        searchableAttributes: ['title', 'content'],
        filterableAttributes: ['sourceId', 'categoryId', 'sourceTitle', 'categoryName', 'pubDate'],
        sortableAttributes: ['pubDate'],
    });
}