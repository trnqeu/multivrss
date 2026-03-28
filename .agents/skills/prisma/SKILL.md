---
name: Prisma ORM
description: Instructions and patterns for using Prisma ORM in MultivRSS (TypeScript)
---

# Prisma ORM Skill

Use this skill to perform database operations with Prisma in the MultivRSS project. 

## Client Initialization

Always use the singleton pattern for the Prisma client in Next.js to avoid exhausted database connections.

```typescript
// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['query'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

## Core Operations

### 1. Upserting (Important for Ingestion)
Use `upsert` to prevent duplicate entries when fetching RSS items.

```typescript
await prisma.feedItem.upsert({
  where: { externalId: item.id },
  update: {
    title: item.title,
    content: item.content,
  },
  create: {
    externalId: item.id,
    title: item.title,
    link: item.link,
    content: item.content,
    pubDate: item.pubDate,
    sourceId: sourceId,
  },
})
```

### 2. Fetching with Relations
Use `include` to fetch related models.

```typescript
const categories = await prisma.category.findMany({
  include: {
    sources: {
      include: {
        _count: {
          select: { items: true }
        }
      }
    }
  }
})
```

### 3. Pagination (Infinite Scroll)
Use `take` and `cursor`.

```typescript
const items = await prisma.feedItem.findMany({
  take: 20,
  skip: 1, // Skip the cursor
  cursor: { id: lastItemId },
  orderBy: { pubDate: 'desc' },
})
```

## CLI Commands

- **Migrate**: `npx prisma migrate dev --name name_here`
- **Studio**: `npx prisma studio` (UI for database)
- **Generate**: `npx prisma generate` (After schema changes)
