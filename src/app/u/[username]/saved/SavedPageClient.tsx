'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import SaveLinkBar from '@/components/SaveLinkBar';
import SavedView from './SavedView';
import type { ArticleVM, LinkVM, TagVM } from './SavedView';
import { Bookmark } from '@/components/icons/Bookmark';
import { deleteSavedLink, unsaveFeedItem, removeTagFromLink, removeTagFromFeedItem, renameTag, deleteTag } from '@/app/actions';
import SavedTagPill from '@/components/SavedTagPill';

interface SavedPageClientProps {
    username: string;
    initialArticles: ArticleVM[];
    initialLinks: LinkVM[];
    initialTags: TagVM[];
}

export default function SavedPageClient({ username, initialArticles, initialLinks, initialTags }: SavedPageClientProps) {
    const [articles, setArticles] = useState(initialArticles);
    const [links, setLinks] = useState(initialLinks);
    const [tags, setTags] = useState(initialTags);
    const searchParams = useSearchParams();
    const activeTag = searchParams.get('tag');

    const filteredLinks = activeTag
        ? links.filter(l => l.tags.some(t => t.name === activeTag))
        : links;

    const filteredArticles = activeTag
        ? articles.filter(a => a.tags.some(t => t.name === activeTag))
        : articles;

    const handleLinkSaved = useCallback((newLink: { id: string; url: string; title: string | null; description: string | null; createdAt: Date }) => {
        setLinks(prev => [{ ...newLink, tags: [] }, ...prev]);
    }, []);

    const handleRemoveArticle = useCallback(async (id: string) => {
        setArticles(prev => prev.filter(a => a.id !== id));
        await unsaveFeedItem(id);
    }, []);

    const handleRemoveLink = useCallback(async (id: string) => {
        setLinks(prev => prev.filter(l => l.id !== id));
        await deleteSavedLink(id);
    }, []);

    const handleSetArticleTags = useCallback((articleId: string, tags: TagVM[]) => {
        setArticles(prev => prev.map(a =>
            a.id === articleId ? { ...a, tags } : a
        ));
    }, []);

    const handleRemoveTagFromArticle = useCallback(async (articleId: string, tagId: string) => {
        setArticles(prev => prev.map(a =>
            a.id === articleId
                ? { ...a, tags: a.tags.filter(t => t.id !== tagId) }
                : a
        ));
        await removeTagFromFeedItem(articleId, tagId);
    }, []);

    const handleSetLinkTags = useCallback((linkId: string, tags: TagVM[]) => {
        setLinks(prev => prev.map(l =>
            l.id === linkId ? { ...l, tags } : l
        ));
    }, []);

    const handleRemoveTagFromLink = useCallback(async (linkId: string, tagId: string) => {
        setLinks(prev => prev.map(l =>
            l.id === linkId
                ? { ...l, tags: l.tags.filter(t => t.id !== tagId) }
                : l
        ));
        await removeTagFromLink(linkId, tagId);
    }, []);

    const handleRenameTag = useCallback(async (tagId: string, newName: string) => {
        const trimmed = newName.trim();
        if (!trimmed) return;
        setTags(prev => prev.map(t => t.id === tagId ? { ...t, name: trimmed } : t));
        setArticles(prev => prev.map(a => ({ ...a, tags: a.tags.map(t => t.id === tagId ? { ...t, name: trimmed } : t) })));
        setLinks(prev => prev.map(l => ({ ...l, tags: l.tags.map(t => t.id === tagId ? { ...t, name: trimmed } : t) })));
        await renameTag(tagId, trimmed);
    }, []);

    const handleDeleteTag = useCallback(async (tagId: string) => {
        setTags(prev => prev.filter(t => t.id !== tagId));
        setArticles(prev => prev.map(a => ({ ...a, tags: a.tags.filter(t => t.id !== tagId) })));
        setLinks(prev => prev.map(l => ({ ...l, tags: l.tags.filter(t => t.id !== tagId) })));
        await deleteTag(tagId);
    }, []);

    const total = filteredArticles.length + filteredLinks.length;

    return (
        <main className="flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden relative scroll-smooth bg-background">
            <header className="p-8 md:p-12 border-b-2 border-foreground bg-background sticky top-0 z-10 flex flex-col gap-4">
                <Link
                    href={`/u/${username}`}
                    className="label-system text-[10px] hover:bg-foreground hover:text-background w-fit px-1 transition-all border border-foreground font-bold"
                >
                    ← BACK_TO_ALL
                </Link>
                <div className="flex items-center gap-2.5">
                    <Bookmark filled className="text-terracotta" size={13} />
                    <span className="label-system text-terracotta text-xs">SAVED // {total} ITEMS</span>
                    {activeTag && (
                        <Link
                            href={`/u/${username}/saved`}
                            className="ml-2 text-[10px] uppercase tracking-widest border border-terracotta px-2 py-0.5 text-terracotta hover:bg-terracotta hover:text-background transition-colors"
                        >
                            ✕ {activeTag}
                        </Link>
                    )}
                </div>
                {/* Tag filter bar */}
                {tags.length > 0 && !activeTag && (
                    <div className="flex flex-wrap gap-1.5">
                        {tags.map(tag => (
                            <SavedTagPill
                                key={tag.id}
                                tag={tag}
                                username={username}
                                onRename={handleRenameTag}
                                onDelete={handleDeleteTag}
                            />
                        ))}
                    </div>
                )}
                <SaveLinkBar onSaved={handleLinkSaved} />
            </header>
            <SavedView
                articles={filteredArticles}
                links={filteredLinks}
                allTags={tags}
                onRemoveArticle={handleRemoveArticle}
                onRemoveLink={handleRemoveLink}
                onRemoveTagFromArticle={handleRemoveTagFromArticle}
                onRemoveTagFromLink={handleRemoveTagFromLink}
                onSetArticleTags={handleSetArticleTags}
                onSetLinkTags={handleSetLinkTags}
            />
        </main>
    );
}
