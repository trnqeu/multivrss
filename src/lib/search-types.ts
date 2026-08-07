// Client-safe search types/constants — no server-only imports (no `prisma`).
// Split out of search.ts so client components (e.g. SearchBar.tsx) don't pull
// the `pg`/Prisma module graph into the browser bundle.

// Highlight delimiters — SearchBar.tsx's Highlight component parses these verbatim.
export const HIGHLIGHT_PRE = '<<HL>>';
export const HIGHLIGHT_POST = '<</HL>>';

export type SearchHitType = 'feedItem' | 'savedLink';

export type SearchHit = {
    id: string;
    type: SearchHitType;
    link: string;
    title: string;
    pubDate: number | null;
    content?: string | null;
    description?: string | null;
    sourceTitle?: string;
    sourceSlug?: string;
    categoryName?: string;
    read?: boolean;
    savedAt?: number | null;
    _formatted?: { title?: string; content?: string; description?: string };
};

export type SearchResult = {
    hits: SearchHit[];
    estimatedTotalHits: number;
    processingTimeMs: number;
};
