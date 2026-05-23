"use client";

import { SessionProvider } from "next-auth/react";
import { SyncProvider } from "./SyncProvider";
import SyncOverlay from "./SyncOverlay";

export function Providers({ children }: {
    children: React.ReactNode
}) {
    return (
        <SessionProvider>
            <SyncProvider>
                {children}
                <SyncOverlay />
            </SyncProvider>
        </SessionProvider>
    );
}