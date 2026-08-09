'use client';

import { useEffect, useRef } from 'react';
import { markManyRead } from '@/app/actions/feed-items';

// Module-level singleton so every mounted component (FeedItem, FrontPageLink,
// FrontPageItemActions, SearchBar rows) shares one queue and one set of
// flush triggers, instead of one independent Server Action call per click.
// See docs/notes.md-adjacent investigation: per-click markAsRead calls were
// each invalidating the whole per-user front-page cache, turning N reads in
// a session into N full recomputations of /u/[username].
const pending = new Set<string>();
let flushTimer: ReturnType<typeof setInterval> | null = null;

const FLUSH_INTERVAL_MS = 5000;

// Enqueues an item locally — no network call. Exported as a plain function
// (not tied to the hook) so both components and tests can call it directly.
export function queueRead(itemId: string): void {
    pending.add(itemId);
}

// Sends every pending id as one batched markManyRead() call, then clears the
// queue. No-op when the queue is empty, so calling it from multiple
// listeners/components is always safe.
export function flushReadQueue(): void {
    if (pending.size === 0) return;
    const itemIds = Array.from(pending);
    pending.clear();
    void markManyRead(itemIds);
}

function handleVisibilityChange() {
    if (document.hidden) flushReadQueue();
}

// Registers the flush triggers (interval, tab-hide, page-hide) once and
// returns queueRead for convenience. The queue is flushed as a single
// batched call on a short interval, on tab-hide, or on page-hide/navigation-
// away.
export function useReadQueue() {
    const registered = useRef(false);

    useEffect(() => {
        if (!registered.current) {
            registered.current = true;
            if (!flushTimer) {
                flushTimer = setInterval(flushReadQueue, FLUSH_INTERVAL_MS);
            }
            document.addEventListener('visibilitychange', handleVisibilityChange);
            window.addEventListener('pagehide', flushReadQueue);
        }
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('pagehide', flushReadQueue);
        };
    }, []);

    return { queueRead };
}
