"use client";

import { useEffect } from "react";
import { useSync } from "./SyncProvider";

export default function SyncOverlay() {
    const { isSyncing, progress } = useSync();

    useEffect(() => {
        if (!isSyncing) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = prev; };
    }, [isSyncing]);

    if (!isSyncing) return null;

    return (
        <div
            className="fixed inset-0 z-50 bg-background/95 flex flex-col items-center justify-center gap-7 p-10"
            role="status"
            aria-live="polite"
            aria-label="Syncing sources"
        >
            <div className="relative w-[200px] h-[200px]">
                <img
                    src="/logo/multivrss-ico.png"
                    alt=""
                    className="w-full h-full object-contain animate-[spin_8s_linear_infinite]"
                />
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-terracotta to-transparent animate-scan" />
                </div>
            </div>

            <div className="text-center">
                <div className="label-system text-terracotta mb-1.5 animate-pulse">
                    SYNCING SOURCES
                </div>
                {progress && (
                    <div className="font-mono text-[11px] text-foreground/55 tracking-[0.08em] leading-relaxed">
                        {progress.currentSource && (
                            <>FETCHING {progress.currentSource.toUpperCase()} · </>
                        )}
                        <span className="text-terracotta">{progress.current}</span> / {progress.total} SOURCES
                    </div>
                )}
            </div>
        </div>
    );
}
