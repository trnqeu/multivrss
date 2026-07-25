'use client';

import { createContext, useContext, useRef, useCallback } from 'react';
import type { SavedLinkData } from '@/app/actions/saved-links';
import type { TagData } from '@/app/actions/tags';

type Listener = {
    onLinkSaved: (link: SavedLinkData) => void;
    onLinkDetailsSaved: (linkId: string, title: string | null, tags: TagData[]) => void;
};

type Ctx = {
    register: (listener: Listener | null) => void;
    notifyLinkSaved: (link: SavedLinkData) => void;
    notifyLinkDetailsSaved: (linkId: string, title: string | null, tags: TagData[]) => void;
};

const SavedLinksSyncCtx = createContext<Ctx>({
    register: () => {},
    notifyLinkSaved: () => {},
    notifyLinkDetailsSaved: () => {},
});

export function SavedLinksSyncProvider({ children }: { children: React.ReactNode }) {
    const listenerRef = useRef<Listener | null>(null);

    const register = useCallback((listener: Listener | null) => {
        listenerRef.current = listener;
    }, []);
    const notifyLinkSaved = useCallback((link: SavedLinkData) => {
        listenerRef.current?.onLinkSaved(link);
    }, []);
    const notifyLinkDetailsSaved = useCallback((linkId: string, title: string | null, tags: TagData[]) => {
        listenerRef.current?.onLinkDetailsSaved(linkId, title, tags);
    }, []);

    return (
        <SavedLinksSyncCtx.Provider value={{ register, notifyLinkSaved, notifyLinkDetailsSaved }}>
            {children}
        </SavedLinksSyncCtx.Provider>
    );
}

export function useSavedLinksSync() {
    return useContext(SavedLinksSyncCtx);
}
