'use client';

import { useState, useTransition } from 'react';
import { markAsRead, saveFeedItem } from '@/app/actions';

type Props = {
    itemId: string;
};

export default function FrontPageItemActions({ itemId }: Props) {
    const [read, setRead] = useState(false);
    const [saved, setSaved] = useState(false);
    const [isPending, startTransition] = useTransition();

    function handleRead() {
        if (read) return;
        setRead(true);
        startTransition(async () => {
            await markAsRead(itemId);
        });
    }

    function handleSave() {
        if (saved) return;
        setSaved(true);
        startTransition(async () => {
            await saveFeedItem(itemId);
        });
    }

    return (
        <div className="flex items-center gap-1">
            <button
                onClick={handleRead}
                disabled={read || isPending}
                aria-label={read ? 'Marked as read' : 'Mark as read'}
                title={read ? 'Marked as read' : 'Mark as read'}
                className={`text-[10px] leading-none transition-colors bg-transparent border-none p-0.5 ${
                    read ? 'text-terracotta' : 'text-foreground/20 hover:text-foreground/60'
                } disabled:cursor-default`}
            >
                ●
            </button>
            <button
                onClick={handleSave}
                disabled={saved || isPending}
                aria-label={saved ? 'Saved' : 'Save'}
                title={saved ? 'Saved' : 'Save'}
                className={`text-[10px] leading-none transition-colors bg-transparent border-none p-0.5 ${
                    saved ? 'text-terracotta' : 'text-foreground/20 hover:text-foreground/60'
                } disabled:cursor-default`}
            >
                ◇
            </button>
        </div>
    );
}
