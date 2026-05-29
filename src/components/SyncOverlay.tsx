"use client";

import { useSync } from "./SyncProvider";

export default function SyncOverlay() {
    const { isSyncing, progress } = useSync();

    if (!isSyncing) return null;

    return (
        <div
            className="fixed bottom-0 left-0 right-0 z-40 border-t-2 border-foreground bg-background px-6 py-2 flex items-center gap-3"
            role="status"
            aria-live="polite"
        >
            <span className="label-system text-terracotta animate-pulse">SYNCING</span>
            {progress && (
                <span className="text-[10px] font-bold uppercase tracking-widest text-foreground/60">
                    <span className="text-terracotta">{progress.current}</span> / {progress.total} SOURCES
                    {progress.currentSource && <> · {progress.currentSource.toUpperCase()}</>}
                </span>
            )}
        </div>
    );
}
