---
name: RSS Parser
description: Instructions and patterns for parsing RSS feeds using rss-parser in MultivRSS (TypeScript)
---

# RSS Parser Skill

Use this skill to fetch and parse RSS feeds in the MultivRSS project. 

## Basic Usage (TypeScript)

The library has built-in types, so no `@types/rss-parser` is required.

```typescript
import Parser from 'rss-parser';

const parser = new Parser();

export async function fetchFeed(url: string) {
  try {
    const feed = await parser.parseURL(url);
    
    console.log("Feed Title:", feed.title);
    
    return feed.items.map(item => ({
      title: item.title,
      link: item.link,
      content: item.contentSnippet || item.content,
      pubDate: item.isoDate ? new Date(item.isoDate) : null,
      externalId: item.guid || item.link, // Fallback logic
    }));
  } catch (error) {
    console.error("Error parsing RSS feed:", error);
    throw error;
  }
}
```

## Custom Fields

If a feed uses non-standard tags, you can map them in the constructor.

```typescript
const parser = new Parser({
  customFields: {
    item: [
      ['media:content', 'mediaContent', { keepArray: true }],
      ['dc:creator', 'author'],
    ]
  }
});
```

## Common Output Fields

- `title`: The title of the article.
- `link`: The URL to the article.
- `pubDate`: The publication date (string).
- `isoDate`: The publication date in ISO format (recommended for `new Date()`).
- `content`: The full HTML content.
- `contentSnippet`: Plain text snippet (HTML tags stripped).
- `guid`: Unique identifier for the item.
