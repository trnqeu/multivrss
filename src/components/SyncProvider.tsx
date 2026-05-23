"use client";

import { createContext, useCallback, useContext, useState } from "react";

type SyncProgress = { current: number; total: number; currentSource?: string };

type SyncContextValue = {
    isSyncing: boolean;
    progress: SyncProgress | null;
    startSync: (work: (setProgress: (p: SyncProgress) => void) => Promise<void>) => Promise<void>;
};

const SyncContext = createContext<SyncContextValue | null>(null);

const MIN_DISPLAY_MS = 1200;

export function SyncProvider({ children }: { children: React.ReactNode }) {
    const [isSyncing, setIsSyncing] = useState(false);
    const [progress, setProgress] = useState<SyncProgress | null>(null);

    const startSync = useCallback(async (work: (setP: (p: SyncProgress) => void) => Promise<void>) => {
        setIsSyncing(true);
        setProgress(null);
        const started = Date.now();
        try {
            await work(setProgress);
        } finally {
            const elapsed = Date.now() - started;
            const remaining = Math.max(0, MIN_DISPLAY_MS - elapsed);
            if (remaining > 0) await new Promise((r) => setTimeout(r, remaining));
            setIsSyncing(false);
            setProgress(null);
        }
    }, []);

    return (
        <SyncContext.Provider value={{ isSyncing, progress, startSync }}>
            {children}
        </SyncContext.Provider>
    );
}

export function useSync() {
    const ctx = useContext(SyncContext);
    if (!ctx) throw new Error("useSync must be used inside SyncProvider");
    return ctx;
}
