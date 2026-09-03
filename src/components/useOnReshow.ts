'use client';

import { useEffect, useRef } from 'react';

// With `cacheComponents: true`, Next.js keeps up to 3 recently-visited routes
// mounted under React's `<Activity mode="hidden">` instead of unmounting them,
// so their `useState` and DOM state survive a navigation away and back
// (see node_modules/next/dist/docs/01-app/02-guides/preserving-ui-state.md).
// React runs effect cleanups when a route is hidden and re-runs the effects
// when it becomes visible again.
//
// A page that seeds server data into `useState` therefore shows a stale list
// after the user navigates away, mutates that data elsewhere, and comes back —
// the preserved state never re-read its props. Call this hook with a *stable*
// (useCallback) refetch callback: it fires on every hidden→visible transition
// but skips the initial mount, where the seeded props are already fresh.
export function useOnReshow(callback: () => void) {
    const mountedRef = useRef(false);

    useEffect(() => {
        if (!mountedRef.current) {
            mountedRef.current = true;
            return;
        }
        callback();
    }, [callback]);
}
