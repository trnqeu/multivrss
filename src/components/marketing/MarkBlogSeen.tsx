'use client';

import { useEffect } from 'react';
import { BLOG_LAST_SEEN_KEY } from '@/components/BlogNavLink';

// Renders nothing — on mount, records that the user has seen posts up to
// this date, so the dashboard's Blog unread dot (BlogNavLink) clears.
export default function MarkBlogSeen({ latestPostDate }: { latestPostDate?: string }) {
    useEffect(() => {
        if (!latestPostDate) return;
        const lastSeen = window.localStorage.getItem(BLOG_LAST_SEEN_KEY);
        if (!lastSeen || lastSeen < latestPostDate) {
            window.localStorage.setItem(BLOG_LAST_SEEN_KEY, latestPostDate);
        }
    }, [latestPostDate]);

    return null;
}
