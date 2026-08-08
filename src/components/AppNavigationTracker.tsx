'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { recordAppNavigation } from '@/lib/appNavigation';

// Mounted once in the root layout. Records every client-side route change
// after the first, so SmartBackLink can tell a real in-app previous page
// apart from history the tab accumulated before landing on this app.
// Renders nothing.
export default function AppNavigationTracker() {
    const pathname = usePathname();
    const isFirstRender = useRef(true);

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        recordAppNavigation();
    }, [pathname]);

    return null;
}
