'use client';

import { useSyncExternalStore } from 'react';
import SidebarNavLink from './SidebarNavLink';

// Shared with MarkBlogSeen (src/components/marketing/MarkBlogSeen.tsx), which
// writes this key when the user visits /blog.
export const BLOG_LAST_SEEN_KEY = 'blog:lastSeenDate';

function subscribe(callback: () => void) {
    window.addEventListener('storage', callback);
    return () => window.removeEventListener('storage', callback);
}

function getServerSnapshot() {
    return false;
}

interface Props {
    href: string;
    label: string;
    latestPostDate?: string;
}

export default function BlogNavLink({ href, label, latestPostDate }: Props) {
    const hasUnread = useSyncExternalStore(
        subscribe,
        () => {
            if (!latestPostDate) return false;
            const lastSeen = window.localStorage.getItem(BLOG_LAST_SEEN_KEY);
            return !lastSeen || lastSeen < latestPostDate;
        },
        getServerSnapshot,
    );

    return <SidebarNavLink href={href} label={label} dot={hasUnread} />;
}
