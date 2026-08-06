'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

// Next.js reuses a route segment's cached client render on browser/router
// back-forward navigation (to preserve scroll position — see the staleTimes
// docs), which can resurrect transient UI state — like "this modal is
// open" — from before the user navigated away. Call this in any component
// that owns modal/popover visibility state so it force-closes whenever the
// route actually changes underneath it.
export function useCloseOnNavigate(close: () => void) {
    const pathname = usePathname();
    useEffect(() => {
        close();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathname]);
}
