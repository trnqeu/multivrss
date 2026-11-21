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
            // Registration can be rejected by the environment (private mode,
            // WebViews, injected browser scripts). The app works without it,
            // so swallow the rejection instead of surfacing it as an error.
            navigator.serviceWorker.register("/sw.js").catch((error: unknown) => {
                console.warn("Service worker registration failed", error);
            });
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