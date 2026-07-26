'use client';

import { markAsRead, saveFeedItem, unsaveFeedItem, updateFeedItemDetails } from '@/app/actions/feed-items';
import { useState, useCallback } from 'react';
import { Bookmark } from '@/components/icons/Bookmark';
import AssignTagsModal from '@/components/AssignTagsModal';

interface Props {
    item: {
        id: string;
        title: string;
        link: string;
        content: string | null;
        pubDate: Date | null;
        read: boolean;
        savedAt: Date | null;
        source: { title: string | null };
        tags: { id: string; name: string }[];
    };
    isLast: boolean;
    allTags: { id: string; name: string }[];
}

export default function FeedItem( { item, isLast, allTags }: Props) {
    const [isRead, setIsRead] = useState(item.read);
    const [isSaved, setIsSaved] = useState(!!item.savedAt);
    const [tags, setTags] = useState(item.tags);
    const [title, setTitle] = useState(item.title);
    const [titleDraft, setTitleDraft] = useState(item.title);
    const [modalOpen, setModalOpen] = useState(false);
    async function handleClick() {
        if (isRead) return;
        setIsRead(true);
        await markAsRead(item.id);
    }
    async function handleSave(e: React.MouseEvent) {
        e.preventDefault();
        e.stopPropagation();
        if (isSaved) {
            setIsSaved(false);
            await unsaveFeedItem(item.id);
        } else {
            setIsSaved(true);
            await saveFeedItem(item.id);
        }
    }
    const handleTagsApplied = useCallback((_itemId: string, newTags: { id: string; name: string }[]) => {
        setTags(newTags);
        setTitle(titleDraft.trim() || item.title);
    }, [titleDraft, item.title]);
    function openModal() {
        setTitleDraft(title);
        setModalOpen(true);
    }
    return (
    <span role="listitem" className="group/item">
        <a
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className={`hover:text-terracotta transition-colors ${isRead ? 'opacity-30' : ''}`}
            onClick={handleClick}
        >
            {!isRead && (
                <span className="text-terracotta mr-1.5 select-none">●</span>
            )}
            <span className="text-terracotta text-[10px] font-bold uppercase tracking-widest">
                {item.source.title}
            </span>
            <span className="text-foreground/40 mx-2">·</span>
            <span className="text-foreground/50 text-xs">
                {item.pubDate
                    ? new Date(item.pubDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    : '---'}
            </span>
            <span className="text-foreground/40 mx-2">·</span>
            <span>{title}</span>
            {item.content && (
                <>
                    <span className="text-foreground/40 mx-2">—</span>
                    <span className="text-foreground/50 text-xs font-normal">
                        {item.content.replace(/<[^>]*>?/gm, '').slice(0, 120).trimEnd()}…
                    </span>
                </>
            )}
        </a>
        {tags.length > 0 && (
            <span className="ml-2 inline-flex gap-1">
                {tags.map(tag => (
                    <span
                        key={tag.id}
                        className="font-mono text-[10px] uppercase border border-current text-terracotta px-1.5 py-0.5 leading-none"
                    >
                        #{tag.name}
                    </span>
                ))}
            </span>
        )}
        <button
            onClick={handleSave}
            aria-label={isSaved ? 'Remove from saved' : 'Save'}
            className="bg-transparent border-0 px-0 py-0 cursor-pointer align-baseline ml-2"
        >
            <Bookmark
                filled={isSaved}
                className={isSaved ? 'text-terracotta' : 'text-foreground/40 hover:text-terracotta'}
            />
        </button>
        <button
            type="button"
            onClick={openModal}
            className="ml-1 bg-transparent border border-current font-mono text-[10px] font-bold uppercase text-foreground/40 hover:text-foreground px-1.5 py-0.5 cursor-pointer leading-none transition-colors"
        >
            + TAG
        </button>
        {modalOpen && (
            <AssignTagsModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                itemId={item.id}
                initialTags={tags}
                allTags={allTags}
                titleField={{ value: titleDraft, onChange: setTitleDraft }}
                onSave={(id, tagIds, draftTitle) => updateFeedItemDetails(id, draftTitle ?? '', tagIds)}
                onTagsApplied={handleTagsApplied}
            />
        )}
        {!isLast && (
            <span className="text-terracotta font-bold mx-3 select-none">{'/ /'}</span>
        )}
    </span>
);

}
