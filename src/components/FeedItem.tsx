'use client';

import { markAsRead, saveFeedItem, unsaveFeedItem } from '@/app/actions';
import { useState } from 'react';
import { Bookmark } from '@/components/icons/Bookmark';

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
    };
    isLast: boolean;
}

export default function FeedItem( { item, isLast }: Props) {
    const [isRead, setIsRead] = useState(item.read);
    const [isSaved, setIsSaved] = useState(!!item.savedAt);
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
    return (
    <span className={`group/item ${isRead ? 'opacity-30' : ''}`}>
        <a
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-terracotta transition-colors"
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
            <span>{item.title}</span>
            {item.content && (
                <>
                    <span className="text-foreground/40 mx-2">—</span>
                    <span className="text-foreground/50 text-xs font-normal">
                        {item.content.replace(/<[^>]*>?/gm, '').slice(0, 120).trimEnd()}…
                    </span>
                </>
            )}
        </a>
        <button
            onClick={handleSave}
            title={isSaved ? 'Remove from saved' : 'Save'}
            className={`group/save bg-transparent border-0 px-0 py-0 cursor-pointer align-baseline ml-2 transition-opacity opacity-100`}
        >
            <Bookmark
                filled={isSaved}
                className={isSaved ? 'text-terracotta' : 'text-foreground/40 hover:text-terracotta'}
            />
        </button>
        {!isLast && (
            <span className="text-terracotta font-bold mx-3 select-none">{'/ /'}</span>
        )}
    </span>
);

}
