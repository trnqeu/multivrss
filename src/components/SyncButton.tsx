'use client';

import { useTransition, useState } from 'react';
import { syncAllFeeds } from '@/app/actions';

export default function SyncButton() {
    const [isPending, startTransition] = useTransition();
    const [message, setMessage] = useState<string | null>(null);

    function handleClick() {
        startTransition(async () => {
            const result = await syncAllFeeds();
            setMessage(result.message ?? null);
        });
    }

    return  (
        <div className="flex flex-col gap-1">
            <button
                onClick={handleClick}
                disabled={isPending}
                className="label-system text-foreground border-2 border-foreground px-3 py-1 hover:bg-foreground hover:text-background transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
                {isPending ? 'SYNCING...' : 'SYNC FEEDS'}
            </button>
            {message && (
                <span className="label-system text-[9px] opacity-60">{message}</span>
            )}
        </div>
    )

}