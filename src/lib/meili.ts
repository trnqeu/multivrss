import { MeiliSearch } from 'meilisearch';
import 'dotenv/config';

export const meili = new MeiliSearch({
  host: process.env.MEILI_HOST || 'http://localhost:7700',
  apiKey: process.env.MEILI_MASTER_KEY,
});

// Highlight delimiters used in every search call — safe, no dangerouslySetInnerHTML needed
export const HIGHLIGHT_PRE = '<<HL>>';
export const HIGHLIGHT_POST = '<</HL>>';

export type SearchHit = {
    id: string;
    link: string;
    title: string;
    pubDate: number | null;
    content?: string;
    sourceTitle?: string;
    categoryName?: string;
    read?: boolean;
    _formatted?: { title?: string; content?: string };
};

export type SearchResult = {
    hits: SearchHit[];
    estimatedTotalHits: number;
    processingTimeMs: number;
    facetDistribution: Record<string, Record<string, number>> | null;
};

let _meiliConfigured = false;

// Configure index settings — runs at most once (idempotent after first call)
export async function configureMeiliIndex() {
    if (_meiliConfigured) return;
    _meiliConfigured = true;
    try {
        await meili.index('items').updateSettings({
            searchableAttributes: ['title', 'content'],
            filterableAttributes: ['sourceId', 'categoryId', 'sourceTitle', 'categoryName', 'pubDate', 'read'],
            sortableAttributes: ['pubDate'],
        });
    } catch {
        _meiliConfigured = false;
    }
}