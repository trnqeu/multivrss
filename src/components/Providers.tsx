"use client";

import { useEffect } from "react";
import { SessionProvider } from "next-auth/react";
import { SyncProvider } from "./SyncProvider";
import SyncOverlay from "./SyncOverlay";

export function Providers({ children }: {
    children: React.ReactNode
}) {
    useEffect(() => {
        if ("serviceWorker" in navigator) {
            navigator.serviceWorker.register("/sw.js");
        }
    }, []);

    return (
        <SessionProvider>
            <SyncProvider>
                {children}
                <SyncOverlay />
            </SyncProvider>
        </SessionProvider>
    );
}