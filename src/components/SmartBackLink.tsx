'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { MouseEvent, ReactNode } from 'react';

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
export default function SmartBackLink({ fallbackHref, className, children }: SmartBackLinkProps) {
    const router = useRouter();

    function handleClick(event: MouseEvent<HTMLAnchorElement>) {
        const isPlainLeftClick =
            event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
        if (isPlainLeftClick && window.history.length > 1) {
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
