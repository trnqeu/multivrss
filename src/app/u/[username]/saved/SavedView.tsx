'use client';

import { useState, useCallback, Fragment } from 'react';
import { dayBucket, getHost } from '@/lib/utils';
import AssignTagsModal from '@/components/AssignTagsModal';
import { useCloseOnNavigate } from '@/components/useCloseOnNavigate';
import { updateFeedItemDetails } from '@/app/actions/feed-items';
import { updateSavedLinkDetails } from '@/app/actions/saved-links';
import { setFeedItemTags, setSavedLinkTags } from '@/app/actions/tags';
import EmptyStream from '@/components/EmptyStream';
import SavedItemRow, { type SavedRowItem } from './SavedItemRow';

export interface TagVM {
    id: string;
    name: string;
}

/** Fading stage of a saved item; VIVID for everyone with fading off. */
export type SavedStageVM = 'VIVID' | 'GIST' | 'TRACE';

export interface ArticleVM {
    id: string;
    title: string;
    link: string;
    content: string | null;
    savedAt: Date;
    sourceTitle: string | null;
    tags: TagVM[];
    stage: SavedStageVM;
}

export interface LinkVM {
    id: string;
    title: string | null;
    url: string;
    description: string | null;
    createdAt: Date;
    tags: TagVM[];
    stage: SavedStageVM;
}

interface Props {
    username: string;
    articles: ArticleVM[];
    links: LinkVM[];
    activeQuery?: string;
    allTags: TagVM[];
    hasMore: boolean;
    isLoadingMore: boolean;
    onLoadMore: () => void;
    onRemoveArticle: (id: string) => void;
    onRemoveLink: (id: string) => void;
    /** `title` is null when only the tags changed (a trace). */
    onSetArticleDetails: (articleId: string, title: string | null, tags: TagVM[]) => void;
    onSetLinkDetails: (linkId: string, title: string | null, tags: TagVM[]) => void;
}

interface ModalItem {
    id: string;
    tags: TagVM[];
    isExternal: boolean;
    /** A trace has no title left to edit: its modal edits tags only. */
    isTrace: boolean;
}

function savedMonth(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function originOf(url: string): string {
    try { return `${new URL(url).origin}/`; } catch { return url; }
}

export default function SavedView({
    username, articles, links, activeQuery, allTags,
    hasMore, isLoadingMore, onLoadMore,
    onRemoveArticle, onRemoveLink,
    onSetArticleDetails, onSetLinkDetails,
}: Props) {
    // Fading by subtraction: a GIST shows no excerpt, a TRACE only says where
    // it came from and when (see src/lib/saved-fading.ts). A saved article
    // keeps its content in the feed, so the saved list hides it here.
    const allItems: SavedRowItem[] = [
        ...articles.map(a => ({
            id: a.id,
            title: a.stage === 'TRACE'
                ? `An article from ${a.sourceTitle ?? getHost(a.link)}, saved ${savedMonth(a.savedAt)}`
                : a.title,
            url: a.stage === 'TRACE' ? originOf(a.link) : a.link,
            content: a.stage === 'VIVID' ? a.content : null,
            savedAt: a.savedAt,
            sourceLabel: (a.sourceTitle ?? getHost(a.link)).toUpperCase(),
            isExternal: false as const,
            tags: a.tags,
            stage: a.stage,
        })),
        ...links.map(l => ({
            id: l.id,
            title: l.stage === 'TRACE'
                ? `A link from ${getHost(l.url)}, saved ${savedMonth(l.createdAt)}`
                : l.title ?? getHost(l.url),
            url: l.url,
            content: l.stage === 'VIVID' ? l.description : null,
            savedAt: l.createdAt,
            sourceLabel: getHost(l.url).toUpperCase(),
            isExternal: true as const,
            tags: l.tags,
            stage: l.stage,
        })),
    ].sort((a, b) => b.savedAt.getTime() - a.savedAt.getTime());

    const [modalItem, setModalItem] = useState<ModalItem | null>(null);
    const [titleDraft, setTitleDraft] = useState('');
    useCloseOnNavigate(() => setModalItem(null));

    function handleRemove(item: SavedRowItem) {
        if (item.isExternal) onRemoveLink(item.id);
        else onRemoveArticle(item.id);
    }

    function handleEditTags(item: SavedRowItem) {
        setModalItem({ id: item.id, tags: item.tags, isExternal: item.isExternal, isTrace: item.stage === 'TRACE' });
        setTitleDraft(item.title);
    }

    const handleModalSave = useCallback(async (id: string, tagIds: string[], title?: string) => {
        if (!modalItem) return { success: false };
        if (modalItem.isTrace) {
            return modalItem.isExternal ? setSavedLinkTags(id, tagIds) : setFeedItemTags(id, tagIds);
        }
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
                <div>
                    {allItems.map((item, index) => {
                        const currentDay = dayBucket(item.savedAt);
                        const prevDay = index > 0 ? dayBucket(allItems[index - 1].savedAt) : null;
                        const isNewDay = currentDay !== prevDay;

                        return (
                            <Fragment key={`${item.isExternal ? 'ext' : 'feed'}-${item.id}`}>
                                {isNewDay && currentDay && (
                                    <div className={`flex items-center gap-3 mb-1.5 ${index === 0 ? 'mt-1' : 'mt-7'}`}>
                                        <span className="text-[9.5px] font-extrabold uppercase tracking-[0.16em] text-terracotta shrink-0">
                                            {currentDay}
                                        </span>
                                        <span aria-hidden="true" className="flex-1 h-px bg-foreground/12" />
                                    </div>
                                )}
                                <SavedItemRow
                                    item={item}
                                    username={username}
                                    onRemove={handleRemove}
                                    onEditTags={handleEditTags}
                                    touchEvent={activeQuery ? 'search' : 'open'}
                                />
                            </Fragment>
                        );
                    })}
                </div>
            )}
            {hasMore && (
                <div className="mt-8 pt-6 border-t border-foreground/20">
                    <button
                        onClick={onLoadMore}
                        disabled={isLoadingMore}
                        className="bg-background label-system text-foreground/60 hover:text-foreground disabled:opacity-30 border border-foreground/30 px-4 py-2 hover:border-foreground transition-colors"
                    >
                        <span role="status" aria-live="polite">
                            {isLoadingMore ? 'LOADING...' : 'LOAD MORE'}
                        </span>
                    </button>
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
                    titleField={modalItem.isTrace ? undefined : { value: titleDraft, onChange: setTitleDraft }}
                    onSave={handleModalSave}
                    onTagsApplied={(id, newTags) => {
                        if (modalItem.isTrace) {
                            if (modalItem.isExternal) onSetLinkDetails(id, null, newTags);
                            else onSetArticleDetails(id, null, newTags);
                        } else if (modalItem.isExternal) {
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
