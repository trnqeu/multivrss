'use client';

import { useState, useCallback, Fragment } from 'react';
import Link from 'next/link';
import { Bookmark } from '@/components/icons/Bookmark';
import { Reader } from '@/components/icons/Reader';
import { Pencil } from '@/components/icons/Pencil';
import { dayBucket } from '@/lib/utils';
import AssignTagsModal from '@/components/AssignTagsModal';
import { useCloseOnNavigate } from '@/components/useCloseOnNavigate';
import { updateFeedItemDetails } from '@/app/actions/feed-items';
import { updateSavedLinkDetails } from '@/app/actions/saved-links';
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
    username: string;
    articles: ArticleVM[];
    links: LinkVM[];
    activeQuery?: string;
    allTags: TagVM[];
    onRemoveArticle: (id: string) => void;
    onRemoveLink: (id: string) => void;
    onRemoveTagFromArticle: (articleId: string, tagId: string) => void;
    onRemoveTagFromLink: (linkId: string, tagId: string) => void;
    onSetArticleDetails: (articleId: string, title: string, tags: TagVM[]) => void;
    onSetLinkDetails: (linkId: string, title: string | null, tags: TagVM[]) => void;
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

interface ModalItem {
    id: string;
    tags: TagVM[];
    isExternal: boolean;
}

export default function SavedView({
    username, articles, links, activeQuery, allTags,
    onRemoveArticle, onRemoveLink,
    onRemoveTagFromArticle, onRemoveTagFromLink,
    onSetArticleDetails, onSetLinkDetails,
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

    const [modalItem, setModalItem] = useState<ModalItem | null>(null);
    const [titleDraft, setTitleDraft] = useState('');
    useCloseOnNavigate(() => setModalItem(null));

    const handleModalSave = useCallback(async (id: string, tagIds: string[], title?: string) => {
        if (!modalItem) return { success: false };
        return modalItem.isExternal
            ? updateSavedLinkDetails(id, title ?? '', tagIds)
            : updateFeedItemDetails(id, title ?? '', tagIds);
    }, [modalItem]);

    const total = allItems.length;

    return (
        <section className="p-8 md:p-12">
            {total === 0 ? (
                activeQuery
                    ? <EmptyStream variant="no-results" contextLabel={activeQuery} />
                    : <EmptyStream variant="no-saved" />
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
                                    {/* Read in-app (Reader Mode is only available for feed items, not external links) */}
                                    {!item.isExternal && (
                                        <Link
                                            href={`/u/${username}/read/${item.id}`}
                                            aria-label="Read"
                                            title="Read"
                                            className="ml-2 inline-flex items-center align-baseline bg-terracotta text-background px-2 py-1.5 leading-none"
                                        >
                                            <Reader size={13} />
                                        </Link>
                                    )}
                                    {/* Edit title / tags button */}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setModalItem({ id: item.id, tags: item.tags, isExternal: item.isExternal });
                                            setTitleDraft(item.title);
                                        }}
                                        aria-label="Edit title or tags"
                                        title="Edit"
                                        className="bg-transparent border-0 px-0 py-0 cursor-pointer align-baseline ml-1.5 text-foreground/40 hover:text-terracotta transition-colors"
                                    >
                                        <Pencil size={13} />
                                    </button>
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
            {modalItem && (
                <AssignTagsModal
                    open={true}
                    onClose={() => setModalItem(null)}
                    itemId={modalItem.id}
                    initialTags={modalItem.tags}
                    allTags={allTags}
                    heading="EDIT_ITEM"
                    titleField={{ value: titleDraft, onChange: setTitleDraft }}
                    onSave={handleModalSave}
                    onTagsApplied={(id, newTags) => {
                        if (modalItem.isExternal) {
                            onSetLinkDetails(id, titleDraft.trim() || null, newTags);
                        } else {
                            onSetArticleDetails(id, titleDraft.trim(), newTags);
                        }
                    }}
                />
            )}
        </section>
    );
}
