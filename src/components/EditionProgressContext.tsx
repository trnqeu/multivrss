'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

type Ctx = {
    readCount: number;
    total: number;
    notifyOpened: (itemId: string) => void;
};

const EditionProgressCtx = createContext<Ctx>({
    readCount: 0,
    total: 0,
    notifyOpened: () => {},
});

// Drives the masthead's live "edition progress" bar. `editionIds` is the
// exact, already-fixed set of items in today's cached edition (see
// FrontPage.stats.edition in src/lib/frontpage.ts) — notifyOpened no-ops for
// any id outside that set, which is what keeps items appended later via
// "load more" from moving the bar. This context only drives the live
// display; the actual read-state DB write still flows through the existing
// batched useReadQueue, unchanged.
export function EditionProgressProvider({
    editionIds,
    initialReadCount,
    children,
}: {
    editionIds: string[];
    initialReadCount: number;
    children: ReactNode;
}) {
    const editionIdSet = useMemo(() => new Set(editionIds), [editionIds]);
    const [openedIds, setOpenedIds] = useState<Set<string>>(() => new Set());

    const notifyOpened = useCallback((itemId: string) => {
        if (!editionIdSet.has(itemId)) return;
        setOpenedIds(prev => (prev.has(itemId) ? prev : new Set(prev).add(itemId)));
    }, [editionIdSet]);

    // Clamp: readAtLoad is normally 0 (every item getFrontPage() picks is
    // unread at generation time) but can be >0 if the cache was regenerated
    // after some of these exact items were already read earlier the same
    // day — the clamp just guards against double-counting that overlap.
    const readCount = Math.min(initialReadCount + openedIds.size, editionIdSet.size);

    const value = useMemo(
        () => ({ readCount, total: editionIdSet.size, notifyOpened }),
        [readCount, editionIdSet, notifyOpened],
    );

    return <EditionProgressCtx.Provider value={value}>{children}</EditionProgressCtx.Provider>;
}

export function useEditionProgress() {
    return useContext(EditionProgressCtx);
}
