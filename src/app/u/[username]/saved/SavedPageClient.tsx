'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import SaveLinkBar from '@/components/SaveLinkBar';
import SavedView from './SavedView';
import type { ArticleVM, LinkVM } from './SavedView';
import { Bookmark } from '@/components/icons/Bookmark';
import { deleteSavedLink, unsaveFeedItem } from '@/app/actions';

interface SavedPageClientProps {
    username: string;
    initialArticles: ArticleVM[];
    initialLinks: LinkVM[];
}

export default function SavedPageClient({ username, initialArticles, initialLinks }: SavedPageClientProps) {
    const [articles, setArticles] = useState(initialArticles);
    const [links, setLinks] = useState(initialLinks);

    const handleLinkSaved = useCallback((newLink: LinkVM) => {
        setLinks(prev => [newLink, ...prev]);
    }, []);

    const handleRemoveArticle = useCallback(async (id: string) => {
        setArticles(prev => prev.filter(a => a.id !== id));
        await unsaveFeedItem(id);
    }, []);

    const handleRemoveLink = useCallback(async (id: string) => {
        setLinks(prev => prev.filter(l => l.id !== id));
        await deleteSavedLink(id);
    }, []);

    const total = articles.length + links.length;

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
                </div>
                <SaveLinkBar onSaved={handleLinkSaved} />
            </header>
            <SavedView
                articles={articles}
                links={links}
                onRemoveArticle={handleRemoveArticle}
                onRemoveLink={handleRemoveLink}
            />
        </main>
    );
}
