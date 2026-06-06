'use client';

import { unsaveFeedItem, deleteSavedLink } from '@/app/actions';
import { Bookmark } from '@/components/icons/Bookmark';
import { dayBucket } from '@/lib/utils';
import { Fragment, useState } from 'react';
import EmptyStream from '@/components/EmptyStream';

export interface ArticleVM {
    id: string;
    title: string;
    link: string;
    content: string | null;
    savedAt: Date;
    sourceTitle: string | null;
}

export interface LinkVM {
    id: string;
    title: string | null;
    url: string;
    description: string | null;
    createdAt: Date;
}

interface Props {
    articles: ArticleVM[];
    links: LinkVM[];
}

function getHost(url: string): string {
    try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; }
}

export default function SavedView({ articles, links }: Props) {
    const [localArticles, setLocalArticles] = useState(articles);
    const [localLinks, setLocalLinks] = useState(links);

    const allItems = [
        ...localArticles.map(a => ({
            id: a.id,
            title: a.title,
            link: a.link,
            content: a.content,
            savedAt: a.savedAt,
            sourceLabel: a.sourceTitle?.toUpperCase() ?? null,
            isExternal: false as const,
        })),
        ...localLinks.map(l => ({
            id: l.id,
            title: l.title ?? getHost(l.url),
            link: l.url,
            content: l.description,
            savedAt: l.createdAt,
            sourceLabel: getHost(l.url).toUpperCase(),
            isExternal: true as const,
        })),
    ].sort((a, b) => b.savedAt.getTime() - a.savedAt.getTime());

    const total = allItems.length;

    async function handleRemove(item: typeof allItems[number]) {
        if (item.isExternal) {
            setLocalLinks(prev => prev.filter(l => l.id !== item.id));
            await deleteSavedLink(item.id);
        } else {
            setLocalArticles(prev => prev.filter(a => a.id !== item.id));
            await unsaveFeedItem(item.id);
        }
    }

    return (
        <section className="p-8 md:p-12">
            {total === 0 ? (
                <EmptyStream variant="no-saved" />
            ) : (
                <div className="leading-relaxed text-sm text-foreground font-medium">
                    {allItems.map((item, index) => {
                        const currentDay = dayBucket(item.savedAt);
                        const prevDay = index > 0 ? dayBucket(allItems[index - 1].savedAt) : null;
                        const nextDay = index < allItems.length - 1 ? dayBucket(allItems[index + 1].savedAt) : null;
                        const isNewDay = currentDay !== prevDay;
                        const suppressSeparator = index === allItems.length - 1 || currentDay !== nextDay;

                        return (
                            <Fragment key={`${item.isExternal ? 'ext' : 'feed'}-${item.id}`}>
                                {isNewDay && currentDay && (
                                    <div className={`flex items-center gap-3 mb-[22px] ${index === 0 ? 'mt-4' : 'mt-8'}`}>
                                        <span className="text-[9.5px] font-extrabold tracking-[0.32em] text-terracotta shrink-0">
                                            — {currentDay}
                                        </span>
                                        <span className="flex-1 h-px bg-terracotta/35" />
                                        <span className="text-[9px] text-white/35">→</span>
                                    </div>
                                )}
                                <span className="group/item">
                                    <span className="text-terracotta text-[10px] font-bold uppercase tracking-widest">
                                        {item.sourceLabel}
                                    </span>
                                    <span className="text-foreground/40 mx-2">·</span>
                                    <span className="text-foreground/50 text-xs">
                                        {new Date(item.savedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </span>
                                    <span className="text-foreground/40 mx-2">·</span>
                                    <a
                                        href={item.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="hover:text-terracotta transition-colors"
                                    >
                                        {item.title}
                                    </a>
                                    {item.content && (
                                        <>
                                            <span className="text-foreground/40 mx-2">—</span>
                                            <span className="text-foreground/50 text-xs font-normal">
                                                {item.content.replace(/<[^>]*>?/gm, '').slice(0, 120).trimEnd()}…
                                            </span>
                                        </>
                                    )}
                                    <button
                                        onClick={() => handleRemove(item)}
                                        title="Remove from saved"
                                        className="group/save bg-transparent border-0 px-0 py-0 cursor-pointer align-baseline ml-2 opacity-0 group-hover/item:opacity-100 transition-opacity"
                                    >
                                        <Bookmark filled className="text-terracotta" />
                                    </button>
                                    {!suppressSeparator && (
                                        <span className="text-terracotta font-bold mx-3 select-none">{'/ /'}</span>
                                    )}
                                </span>
                            </Fragment>
                        );
                    })}
                </div>
            )}
        </section>
    );
}
