'use client';

import { markAsRead } from '@/app/actions';
import { useState } from 'react';

interface Props {
    item: {
        id: string;
        title: string;
        link: string;
        content: string | null;
        pubDate: Date | null;
        read: boolean;
        source: { title: string | null };
    };
    isLast: boolean;
}

export default function FeedItem( { item, isLast }: Props) {
    const [isRead, setIsRead] = useState(item.read);
    async function handleClick() {
        if (isRead) return;
        setIsRead(true);
        await markAsRead(item.id);
    }
    return (
    <span className={isRead ? 'opacity-30' : ''}>
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
        {!isLast && (
            <span className="text-terracotta font-bold mx-3 select-none">{'/ /'}</span>
        )}
    </span>
);

}

