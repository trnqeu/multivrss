---
name: Meilisearch
description: Instructions and patterns for using Meilisearch for full-text search in MultivRSS (TypeScript)
---

# Meilisearch Skill

Use this skill to index and search RSS items in the MultivRSS project.

## Installation

```bash
npm install meilisearch
```

## Initialization (src/lib/meili.ts)

Always use environment variables for `host` and `apiKey`.

```typescript
import { MeiliSearch } from 'meilisearch';

export const meili = new MeiliSearch({
  host: process.env.MEILI_HOST || 'http://localhost:7700',
  apiKey: process.env.MEILI_MASTER_KEY,
});
```

## Indexing Documents

When adding documents, Meilisearch handles upserts automatically if an `id` is provided.

```typescript
export async function syncToMeili(indexName: string, documents: any[]) {
  const index = meili.index(indexName);
  return await index.addDocuments(documents);
}
```

## Configuring Indexes

Set filterable and sortable attributes for better search experience.

```typescript
await meili.index('items').updateSettings({
  searchableAttributes: ['title', 'content'],
  filterableAttributes: ['sourceId', 'read'],
  sortableAttributes: ['pubDate'],
});
```

## Basic Search

```typescript
const results = await meili.index('items').search('query', {
  limit: 20,
  filter: 'read = false',
});
```
