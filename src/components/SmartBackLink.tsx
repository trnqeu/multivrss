'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { MouseEvent, ReactNode } from 'react';
import { hasInAppHistory } from '@/lib/appNavigation';

interface SmartBackLinkProps {
    fallbackHref: string;
    className?: string;
    children: ReactNode;
}

// A back link for standalone PWA windows, which have no browser back/forward
// chrome. Behaves like a normal <Link> (real href, keyboard-operable,
// ctrl/cmd/middle-click still opens fallbackHref in a new tab), but on a
// plain left-click it returns to the actual previous page via router.back()
// when in-app history exists, instead of always jumping to a fixed
// destination. Falls back to fallbackHref when there's no history to return
// to (e.g. a deep link opened cold).
//
// Deliberately checks hasInAppHistory() (AppNavigationTracker), not
// window.history.length: history.length counts the tab's whole joint
// session history, including pages visited before the user ever reached
// this app (an external referrer, a previous site in the same tab) — it
// stays > 1 even with no in-app page to return to, which sent router.back()
// straight out of the app to whatever came before. hasInAppHistory() only
// turns true after a real client-side navigation inside this app.
export default function SmartBackLink({ fallbackHref, className, children }: SmartBackLinkProps) {
    const router = useRouter();

    function handleClick(event: MouseEvent<HTMLAnchorElement>) {
        const isPlainLeftClick =
            event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
        if (isPlainLeftClick && hasInAppHistory()) {
            event.preventDefault();
            router.back();
        }
    }

    return (
        <Link href={fallbackHref} onClick={handleClick} className={className}>
            {children}
        </Link>
    );
}
