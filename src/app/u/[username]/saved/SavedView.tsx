'use client';

import { useState, useCallback, Fragment } from 'react';
import { dayBucket, getHost } from '@/lib/utils';
import AssignTagsModal from '@/components/AssignTagsModal';
import { useCloseOnNavigate } from '@/components/useCloseOnNavigate';
import { updateFeedItemDetails } from '@/app/actions/feed-items';
import { updateSavedLinkDetails } from '@/app/actions/saved-links';
import EmptyStream from '@/components/EmptyStream';
import SavedItemRow, { type SavedRowItem } from './SavedItemRow';

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
    hasMore: boolean;
    isLoadingMore: boolean;
    onLoadMore: () => void;
    onRemoveArticle: (id: string) => void;
    onRemoveLink: (id: string) => void;
    onSetArticleDetails: (articleId: string, title: string, tags: TagVM[]) => void;
    onSetLinkDetails: (linkId: string, title: string | null, tags: TagVM[]) => void;
}

interface ModalItem {
    id: string;
    tags: TagVM[];
    isExternal: boolean;
}

export default function SavedView({
    username, articles, links, activeQuery, allTags,
    hasMore, isLoadingMore, onLoadMore,
    onRemoveArticle, onRemoveLink,
    onSetArticleDetails, onSetLinkDetails,
}: Props) {
    const allItems: SavedRowItem[] = [
        ...articles.map(a => ({
            id: a.id,
            title: a.title,
            url: a.link,
            content: a.content,
            savedAt: a.savedAt,
            sourceLabel: (a.sourceTitle ?? getHost(a.link)).toUpperCase(),
            isExternal: false as const,
            tags: a.tags,
        })),
        ...links.map(l => ({
            id: l.id,
            title: l.title ?? getHost(l.url),
            url: l.url,
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

    function handleRemove(item: SavedRowItem) {
        if (item.isExternal) onRemoveLink(item.id);
        else onRemoveArticle(item.id);
    }

    function handleEditTags(item: SavedRowItem) {
        setModalItem({ id: item.id, tags: item.tags, isExternal: item.isExternal });
        setTitleDraft(item.title);
    }

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
