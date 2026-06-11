'use client';

import { useState } from 'react';
import { Bookmark } from '@/components/icons/Bookmark';
import { dayBucket } from '@/lib/utils';
import { Fragment } from 'react';
import EmptyStream from '@/components/EmptyStream';

export interface TagVM {
    id: string;
    name: string;
}

export interface ArticleVM {
    id: string;
    title: string;
    link: string;
    content: string | null;
    savedAt: Date;
    sourceTitle: string | null;
    tags: TagVM[];
}

export interface LinkVM {
    id: string;
    title: string | null;
    url: string;
    description: string | null;
    createdAt: Date;
    tags: TagVM[];
}

interface Props {
    articles: ArticleVM[];
    links: LinkVM[];
    allTags: TagVM[];
    onRemoveArticle: (id: string) => void;
    onRemoveLink: (id: string) => void;
    onAddTagToArticle: (articleId: string, tagId: string) => void;
    onRemoveTagFromArticle: (articleId: string, tagId: string) => void;
    onAddTagToLink: (linkId: string, tagId: string) => void;
    onRemoveTagFromLink: (linkId: string, tagId: string) => void;
}

function getHost(url: string): string {
    try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; }
}

function TagChip({ tag, onRemove }: { tag: TagVM; onRemove?: () => void }) {
    return (
        <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-widest font-bold px-1.5 py-0.5 border border-terracotta/40 text-terracotta">
            {tag.name}
            {onRemove && (
                <button
                    type="button"
                    onClick={onRemove}
                    className="bg-transparent border-0 p-0 cursor-pointer text-terracotta/60 hover:text-terracotta leading-none"
                >
                    ✕
                </button>
            )}
        </span>
    );
}

function TagPicker({ itemId, allTags, itemTags, onAdd }: {
    itemId: string;
    allTags: TagVM[];
    itemTags: TagVM[];
    onAdd: (itemId: string, tagId: string) => void;
}) {
    const [open, setOpen] = useState(false);
    const available = allTags.filter(t => !itemTags.some(lt => lt.id === t.id));

    return (
        <span className="inline-flex">
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="bg-transparent border border-foreground/30 px-1.5 py-0.5 text-[9px] uppercase tracking-widest cursor-pointer text-foreground/50 hover:text-foreground hover:border-foreground transition-colors"
            >
                + TAG
            </button>
            {open && available.length > 0 && (
                <span className="inline-flex flex-wrap gap-1 ml-1">
                    {available.map(tag => (
                        <button
                            key={tag.id}
                            type="button"
                            onClick={() => { onAdd(itemId, tag.id); setOpen(false); }}
                            className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 border border-foreground/30 bg-background cursor-pointer text-foreground/60 hover:text-foreground hover:border-foreground transition-colors"
                        >
                            + {tag.name}
                        </button>
                    ))}
                </span>
            )}
            {open && available.length === 0 && (
                <span className="text-[9px] text-foreground/30 ml-1">no more tags</span>
            )}
        </span>
    );
}

export default function SavedView({
    articles, links, allTags,
    onRemoveArticle, onRemoveLink,
    onAddTagToArticle, onRemoveTagFromArticle,
    onAddTagToLink, onRemoveTagFromLink,
}: Props) {
    const allItems = [
        ...articles.map(a => ({
            id: a.id,
            title: a.title,
            link: a.link,
            content: a.content,
            savedAt: a.savedAt,
            sourceLabel: a.sourceTitle?.toUpperCase() ?? null,
            isExternal: false as const,
            tags: a.tags,
        })),
        ...links.map(l => ({
            id: l.id,
            title: l.title ?? getHost(l.url),
            link: l.url,
            content: l.description,
            savedAt: l.createdAt,
            sourceLabel: getHost(l.url).toUpperCase(),
            isExternal: true as const,
            tags: l.tags,
        })),
    ].sort((a, b) => b.savedAt.getTime() - a.savedAt.getTime());

    const total = allItems.length;

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
                                <span className="group/item block">
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
                                    {/* Tags */}
                                    {item.tags.length > 0 && (
                                        <span className="ml-2 inline-flex gap-1">
                                            {item.tags.map(tag => (
                                                <TagChip
                                                    key={tag.id}
                                                    tag={tag}
                                                    onRemove={() =>
                                                        item.isExternal
                                                            ? onRemoveTagFromLink(item.id, tag.id)
                                                            : onRemoveTagFromArticle(item.id, tag.id)
                                                    }
                                                />
                                            ))}
                                        </span>
                                    )}
                                    {/* Tag picker */}
                                    {allTags.length > 0 && (
                                        <span className="ml-1">
                                            <TagPicker
                                                itemId={item.id}
                                                allTags={allTags}
                                                itemTags={item.tags}
                                                onAdd={item.isExternal ? onAddTagToLink : onAddTagToArticle}
                                            />
                                        </span>
                                    )}
                                    <button
                                        onClick={() => item.isExternal ? onRemoveLink(item.id) : onRemoveArticle(item.id)}
                                        title="Remove from saved"
                                        className="bg-transparent border-0 px-0 py-0 cursor-pointer align-baseline ml-2 opacity-40 hover:opacity-100 transition-opacity"
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
