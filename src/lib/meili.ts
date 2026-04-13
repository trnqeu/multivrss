import { MeiliSearch } from 'meilisearch';
import 'dotenv/config';



export const meili = new MeiliSearch({
  host: process.env.MEILI_HOST || 'http://localhost:7700',
  apiKey: process.env.MEILI_MASTER_KEY,
});

// Configure index settings (idempotent — safe to run on every startup)
meili.index('items').updateSettings({
    searchableAttributes: ['title', 'content'],
    filterableAttributes: ['sourceId'],
    sortableAttributes: ['pubDate'],
});