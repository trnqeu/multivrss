'use client';

import { saveFeedItem, unsaveFeedItem, updateFeedItemDetails } from '@/app/actions/feed-items';
import { useState, useCallback } from 'react';
import Link from 'next/link';
import { Bookmark } from '@/components/icons/Bookmark';
import { TagIcon } from '@/components/icons/Tag';
import { Reader } from '@/components/icons/Reader';
import AssignTagsModal from '@/components/AssignTagsModal';
import { useCloseOnNavigate } from '@/components/useCloseOnNavigate';
import { useReadQueue } from '@/lib/useReadQueue';

interface Props {
    item: {
        id: string;
        title: string;
        link: string;
        content: string | null;
        pubDate: Date | null;
        read: boolean;
        savedAt: Date | null;
        source: { title: string | null; slug: string | null };
        tags: { id: string; name: string }[];
    };
    isLast: boolean;
    allTags: { id: string; name: string }[];
    username: string;
}

export default function FeedItem( { item, isLast, allTags, username }: Props) {
    const [isRead, setIsRead] = useState(item.read);
    const [isSaved, setIsSaved] = useState(!!item.savedAt);
    const [tags, setTags] = useState(item.tags);
    const [title, setTitle] = useState(item.title);
    const [titleDraft, setTitleDraft] = useState(item.title);
    const [modalOpen, setModalOpen] = useState(false);
    useCloseOnNavigate(() => setModalOpen(false));
    const { queueRead } = useReadQueue();
    function handleClick() {
        if (isRead) return;
        setIsRead(true);
        queueRead(item.id);
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
        {!isRead && (
            <span className="text-terracotta mr-1.5 select-none">●</span>
        )}
        {item.source.slug ? (
            <Link
                href={`/u/${username}/source/${item.source.slug}`}
                prefetch={false}
                className={`text-terracotta text-[10px] font-bold uppercase tracking-widest hover:underline ${isRead ? 'opacity-30' : ''}`}
            >
                {item.source.title}
            </Link>
        ) : (
            <span className={`text-terracotta text-[10px] font-bold uppercase tracking-widest ${isRead ? 'opacity-30' : ''}`}>
                {item.source.title}
            </span>
        )}
        <span className={`text-foreground/40 mx-2 ${isRead ? 'opacity-30' : ''}`}>·</span>
        <a
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className={`hover:text-terracotta transition-colors ${isRead ? 'opacity-30' : ''}`}
            onClick={handleClick}
        >
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
            title={isSaved ? 'Remove from saved' : 'Save'}
            className="bg-transparent border-0 px-0 py-0 cursor-pointer align-baseline ml-2"
        >
            <Bookmark
                filled={isSaved}
                size={13}
                className={isSaved ? 'text-terracotta' : 'text-foreground/40 hover:text-terracotta'}
            />
        </button>
        <button
            type="button"
            onClick={openModal}
            aria-label="Assign tags"
            title="+ TAG"
            className="bg-transparent border-0 px-0 py-0 cursor-pointer align-baseline ml-1.5"
        >
            <TagIcon size={13} className="text-foreground/40 hover:text-terracotta" />
        </button>
        <Link
            href={`/u/${username}/read/${item.id}`}
            prefetch={false}
            onClick={handleClick}
            aria-label="Read"
            title="Read"
            className="ml-1.5 inline-flex items-center align-baseline bg-terracotta text-background px-2 py-1.5 leading-none"
        >
            <Reader size={13} />
        </Link>
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
