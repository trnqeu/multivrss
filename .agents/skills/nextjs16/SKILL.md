# Next.js 16 Development (App Router)

This skill provides the mandatory patterns and best practices for developing web applications using Next.js 16.1.6 and the App Router.

## Core Principles

- **App Router first**: All routing logic must reside in the `app/` directory.
- **Server-First Architecture**: Components are Server Components by default. Fetch data on the server whenever possible.
- **Selective Interactivity**: Use `'use client'` only in files that require browser APIs (state, effects, event handlers).
- **Secure by Default**: Never prefix secrets with `NEXT_PUBLIC_`. Keep DB credentials and private keys unprefixed.
- **Route Handlers**: Use `app/api/**/route.ts` for JSON endpoints and webhooks.

## Project Structure

- `app/layout.tsx`: Root layout (required).
- `app/page.tsx`: Route entry point.
- `app/api/**/route.ts`: API endpoints.
- `components/`: UI components (Server or Client).

## Advanced Caching (Next.js 16.2+)

Enable **Cache Components** in `next.config.ts` to use modern caching directives:

```typescript
// next.config.ts
const nextConfig = {
  cacheComponents: true,
}
```

### The `"use cache"` Directive
This directive caches the return value of async functions and components.

- **Data-level caching**: Add `"use cache"` inside an async function. Use `cacheLife('hours')` to define duration.
- **UI-level caching**: Add `"use cache"` top-level in a component. The entire rendered output is stored in the static shell.
- **Cache Keys**: Arguments and closed-over values automatically become part of the cache key.

### Caching Strategies & Revalidation
- **`cacheLife(profile)`**: Sets the TTL (e.g., 'minutes', 'hours', 'days').
- **`cacheTag(tag)`**: Assigns a tag for on-demand invalidation.
- **`updateTag(tag)`**: Invalidates all cache entries with that tag (used in Server Actions).

### Handling Runtime Data
Components accessing `cookies()`, `headers()`, or `searchParams` at request time **must** be wrapped in `<Suspense>`.
Next.js 16 uses **Partial Prerendering (PPR)** by default:
- Static parts (and `"use cache"` components) are sent in the initial shell.
- Dynamic parts (wrapped in `<Suspense>`) are streamed as they resolve.

## Reference Documentation
- Full guide: `.agents/skills/nextjs16/docs.md/DOC.md`
- Cache Strategies: (Included in this skill for quick reference)
