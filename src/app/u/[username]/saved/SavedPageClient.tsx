'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import SavedView from './SavedView';
import type { ArticleVM, LinkVM, TagVM } from './SavedView';
import { Bookmark } from '@/components/icons/Bookmark';
import { deleteSavedLink } from '@/app/actions/saved-links';
import { unsaveFeedItem } from '@/app/actions/feed-items';
import { renameTag, deleteTag, getTags } from '@/app/actions/tags';
import { getMoreSavedItems } from '@/app/actions/saved-items';
import SavedTagPill from '@/components/SavedTagPill';
import { Search } from '@/components/icons/Search';
import { useSavedLinksSync } from '@/components/SavedLinksSyncContext';
import { useOnReshow } from '@/components/useOnReshow';

const TAG_PANEL_STORAGE_KEY = 'saved.tagPanelOpen';

interface SavedPageClientProps {
    username: string;
    initialArticles: ArticleVM[];
    initialLinks: LinkVM[];
    initialTags: TagVM[];
    initialFeedOffset: number;
    initialLinkOffset: number;
    initialHasMore: boolean;
}

export default function SavedPageClient({
    username, initialArticles, initialLinks, initialTags,
    initialFeedOffset, initialLinkOffset, initialHasMore,
}: SavedPageClientProps) {
    const [articles, setArticles] = useState(initialArticles);
    const [links, setLinks] = useState(initialLinks);
    const [tags, setTags] = useState(initialTags);
    const [tagsExpanded, setTagsExpanded] = useState(false);
    const [tagQuery, setTagQuery] = useState('');
    // The tag filter section (search + pills) is collapsed by default so it
    // doesn't dominate the header. The choice is remembered per-device.
    const [tagPanelOpen, setTagPanelOpen] = useState(false);
    const [feedOffset, setFeedOffset] = useState(initialFeedOffset);
    const [linkOffset, setLinkOffset] = useState(initialLinkOffset);
    const [hasMore, setHasMore] = useState(initialHasMore);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const searchParams = useSearchParams();
    const activeTag = searchParams.get('tag');
    const query = searchParams.get('q') ?? '';

    // Filtering by tag/query now happens server-side (fetchSavedItemsPage), so
    // `articles`/`links` already reflect the active filter — no client-side
    // .filter() here. Since data is paginated, filtering only the loaded
    // window would silently hide matches further down un-loaded pages.
    const handleLoadMore = useCallback(async () => {
        setIsLoadingMore(true);
        try {
            const result = await getMoreSavedItems({
                tag: activeTag ?? undefined,
                q: query || undefined,
                feedOffset,
                linkOffset,
            });
            if ('error' in result) return;
            setArticles(prev => [...prev, ...result.articles]);
            setLinks(prev => [...prev, ...result.links]);
            setFeedOffset(result.nextFeedOffset);
            setLinkOffset(result.nextLinkOffset);
            setHasMore(result.hasMore);
        } finally {
            setIsLoadingMore(false);
        }
    }, [activeTag, query, feedOffset, linkOffset]);

    // `cacheComponents` keeps this route mounted-but-hidden after the user
    // navigates away, so `articles`/`links`/`tags` (seeded once from server
    // props) go stale if an item is saved/tagged elsewhere in the meantime —
    // e.g. hitting the bookmark on the feed list, then coming back here. Refetch
    // the first page + tag list whenever the route becomes visible again. A
    // monotonic token drops a slow response that a newer refetch already
    // superseded.
    const refreshTokenRef = useRef(0);
    const refreshFromServer = useCallback(async () => {
        const token = ++refreshTokenRef.current;
        const [page, freshTags] = await Promise.all([
            getMoreSavedItems({
                tag: activeTag ?? undefined,
                q: query || undefined,
                feedOffset: 0,
                linkOffset: 0,
            }),
            getTags(),
        ]);
        if (token !== refreshTokenRef.current) return;
        if (!('error' in page)) {
            setArticles(page.articles);
            setLinks(page.links);
            setFeedOffset(page.nextFeedOffset);
            setLinkOffset(page.nextLinkOffset);
            setHasMore(page.hasMore);
        }
        setTags(freshTags);
    }, [activeTag, query]);
    useOnReshow(refreshFromServer);

    // Restore the remembered open/closed choice after mount (SSR renders closed,
    // so defer the setState past hydration — matching SidebarCategories).
    const tagPanelRestored = useRef(false);
    useEffect(() => {
        if (tagPanelRestored.current) return;
        tagPanelRestored.current = true;
        try {
            if (localStorage.getItem(TAG_PANEL_STORAGE_KEY) === '1') {
                requestAnimationFrame(() => setTagPanelOpen(true));
            }
        } catch { /* private mode / disabled storage */ }
    }, []);
    const toggleTagPanel = useCallback(() => {
        setTagPanelOpen(prev => {
            const next = !prev;
            try { localStorage.setItem(TAG_PANEL_STORAGE_KEY, next ? '1' : '0'); } catch { /* ignore */ }
            return next;
        });
    }, []);

    const handleLinkSaved = useCallback((newLink: { id: string; url: string; title: string | null; description: string | null; createdAt: Date }) => {
        setLinks(prev => [{ ...newLink, tags: [] }, ...prev]);
    }, []);

    // The filter-bar tag list is seeded once from the server at mount and only
    // mutated by rename/delete below — so a tag *created* while assigning it to
    // an item (in the edit modal here, or the header Add popover feeding the
    // sync context) never lands in it, even though the item shows the new chip.
    // Merge any unknown tags coming back from a details edit so the bar stays
    // complete without a full reload.
    const mergeNewTags = useCallback((incoming: TagVM[]) => {
        setTags(prev => {
            const seen = new Set(prev.map(t => t.id));
            const additions = incoming.filter(t => !seen.has(t.id));
            return additions.length > 0 ? [...prev, ...additions] : prev;
        });
    }, []);

    const handleSetLinkDetails = useCallback((linkId: string, title: string | null, newTags: TagVM[]) => {
        setLinks(prev => prev.map(l =>
            l.id === linkId ? { ...l, title, tags: newTags } : l
        ));
        mergeNewTags(newTags);
    }, [mergeNewTags]);

    const { register } = useSavedLinksSync();
    useEffect(() => {
        register({ onLinkSaved: handleLinkSaved, onLinkDetailsSaved: handleSetLinkDetails });
        return () => register(null);
    }, [register, handleLinkSaved, handleSetLinkDetails]);

    const handleRemoveArticle = useCallback(async (id: string) => {
        setArticles(prev => prev.filter(a => a.id !== id));
        await unsaveFeedItem(id);
    }, []);

    const handleRemoveLink = useCallback(async (id: string) => {
        setLinks(prev => prev.filter(l => l.id !== id));
        await deleteSavedLink(id);
    }, []);

    const handleSetArticleDetails = useCallback((articleId: string, title: string, tags: TagVM[]) => {
        setArticles(prev => prev.map(a =>
            a.id === articleId ? { ...a, title, tags } : a
        ));
        mergeNewTags(tags);
    }, [mergeNewTags]);

    const handleRenameTag = useCallback(async (tagId: string, newName: string) => {
        const trimmed = newName.trim();
        if (!trimmed) return;
        setTags(prev => prev.map(t => t.id === tagId ? { ...t, name: trimmed } : t));
        setArticles(prev => prev.map(a => ({ ...a, tags: a.tags.map(t => t.id === tagId ? { ...t, name: trimmed } : t) })));
        setLinks(prev => prev.map(l => ({ ...l, tags: l.tags.map(t => t.id === tagId ? { ...t, name: trimmed } : t) })));

        const result = await renameTag(tagId, trimmed);
        const survivorId = result.mergedIntoTagId;
        if (!survivorId || survivorId === tagId) return;

        const remap = (list: TagVM[]): TagVM[] => {
            const remapped = list.map(t => t.id === tagId ? { ...t, id: survivorId, name: trimmed } : t);
            const seen = new Set<string>();
            return remapped.filter(t => {
                if (seen.has(t.id)) return false;
                seen.add(t.id);
                return true;
            });
        };

        setTags(prev => remap(prev));
        setArticles(prev => prev.map(a => ({ ...a, tags: remap(a.tags) })));
        setLinks(prev => prev.map(l => ({ ...l, tags: remap(l.tags) })));
    }, []);

    const handleDeleteTag = useCallback(async (tagId: string) => {
        setTags(prev => prev.filter(t => t.id !== tagId));
        setArticles(prev => prev.map(a => ({ ...a, tags: a.tags.filter(t => t.id !== tagId) })));
        setLinks(prev => prev.map(l => ({ ...l, tags: l.tags.filter(t => t.id !== tagId) })));
        await deleteTag(tagId);
    }, []);

    const TAG_PREVIEW_COUNT = 8;
    const sortedTags = useMemo(
        () => [...tags].sort((a, b) => a.name.localeCompare(b.name)),
        [tags]
    );
    // The tag search narrows the *pill list*, never the item list — it is tag
    // navigation, not a second stream filter. With a query active the preview
    // cap of 8 does not apply, so a rare tag is found by typing.
    const matchedTags = useMemo(() => {
        const q = tagQuery.trim().toUpperCase();
        return q ? sortedTags.filter(t => t.name.toUpperCase().includes(q)) : sortedTags;
    }, [sortedTags, tagQuery]);
    const showAllTags = tagQuery.trim().length > 0 || tagsExpanded;
    const visibleTags = showAllTags ? matchedTags : matchedTags.slice(0, TAG_PREVIEW_COUNT);
    const hiddenTagCount = matchedTags.length - visibleTags.length;

    const total = articles.length + links.length;

    return (
        <main className="flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden relative scroll-smooth bg-background">
            <header className="p-8 md:p-12 border-b-2 border-foreground bg-background sticky top-0 z-10 flex flex-col gap-4">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                    <span className="inline-flex items-center gap-2.5">
                        <Bookmark filled className="text-terracotta" size={13} />
                        <span className="label-system text-terracotta text-xs">SAVED // {total}{hasMore ? '+' : ''} ITEMS</span>
                    </span>
                    {tags.length > 0 && !activeTag && (
                        <button
                            type="button"
                            onClick={toggleTagPanel}
                            aria-expanded={tagPanelOpen}
                            aria-controls={tagPanelOpen ? 'saved-tag-panel' : undefined}
                            className="inline-flex items-center gap-1.5 border border-foreground/25 bg-transparent px-2 py-1 text-[9.5px] font-bold uppercase tracking-[0.08em] text-foreground/55 transition-colors hover:border-terracotta hover:text-terracotta"
                        >
                            Tags · {tags.length}
                            <span aria-hidden="true" className={`text-[8px] transition-transform ${tagPanelOpen ? 'rotate-180' : ''}`}>▾</span>
                        </button>
                    )}
                </div>

                {/* Tag filter bar — collapsed by default (toggle above). The search
                    narrows the pill list (not the items) and lifts the preview cap of 8. */}
                {tags.length > 0 && !activeTag && tagPanelOpen && (
                    <div id="saved-tag-panel" className="flex flex-col gap-3 border-b border-foreground/12 pb-4 sm:flex-row sm:items-start">
                        <div className="relative shrink-0 sm:w-[178px]">
                            <label htmlFor="saved-tag-search" className="sr-only">Search tags</label>
                            <input
                                id="saved-tag-search"
                                value={tagQuery}
                                onChange={e => setTagQuery(e.target.value)}
                                placeholder="SEARCH TAGS…"
                                className="w-full border border-foreground/25 bg-background py-[7px] pl-6 pr-2.5 text-[9.5px] font-bold uppercase tracking-[0.06em] outline-none placeholder:font-semibold placeholder:text-foreground/40 focus:border-terracotta"
                            />
                            <Search
                                size={11}
                                className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-foreground/40"
                            />
                        </div>
                        <div className="flex min-w-0 flex-1 flex-wrap gap-[7px]">
                            {visibleTags.map(tag => (
                                <SavedTagPill
                                    key={tag.id}
                                    tag={tag}
                                    username={username}
                                    onRename={handleRenameTag}
                                    onDelete={handleDeleteTag}
                                />
                            ))}
                            {matchedTags.length === 0 && (
                                <span role="status" className="py-[7px] text-[9.5px] font-bold uppercase tracking-[0.06em] text-foreground/45">
                                    No tags match
                                </span>
                            )}
                            {!tagQuery && (hiddenTagCount > 0 || tagsExpanded) && (
                                <button
                                    type="button"
                                    onClick={() => setTagsExpanded(v => !v)}
                                    aria-expanded={tagsExpanded}
                                    className="inline-flex items-center gap-1.5 border border-dashed border-foreground/35 bg-transparent px-2.5 py-1.5 text-[9.5px] font-bold uppercase tracking-widest text-foreground/55 hover:border-terracotta hover:text-terracotta transition-colors"
                                >
                                    {tagsExpanded ? 'Show less' : `+${hiddenTagCount} more`}
                                    <span aria-hidden="true" className={`inline-block text-[8px] transition-transform ${tagsExpanded ? 'rotate-180' : ''}`}>▾</span>
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Active-filter context bar — the single way out of a tag filter. */}
                {activeTag && (
                    <div className="flex flex-wrap items-center gap-2.5 border-b border-foreground/12 pb-4 text-[9.5px] font-bold uppercase tracking-[0.08em] text-foreground/55">
                        <span>Filter: <span className="text-foreground">{activeTag}</span></span>
                        <span aria-hidden="true">·</span>
                        <span>{total}{hasMore ? '+' : ''} {total === 1 && !hasMore ? 'item' : 'items'}</span>
                        <Link
                            href={`/u/${username}/saved`}
                            className="border border-foreground/25 px-2 py-1 tracking-[0.06em] text-foreground/55 hover:border-terracotta hover:text-terracotta transition-colors"
                        >
                            Show all
                        </Link>
                    </div>
                )}
            </header>
            <SavedView
                username={username}
                articles={articles}
                links={links}
                activeQuery={query}
                allTags={tags}
                hasMore={hasMore}
                isLoadingMore={isLoadingMore}
                onLoadMore={handleLoadMore}
                onRemoveArticle={handleRemoveArticle}
                onRemoveLink={handleRemoveLink}
                onSetArticleDetails={handleSetArticleDetails}
                onSetLinkDetails={handleSetLinkDetails}
            />
        </main>
    );
}
