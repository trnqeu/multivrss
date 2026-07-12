'use client';

import { markAsRead } from '@/app/actions/feed-items';

interface Props {
    itemId: string;
    href: string;
    className?: string;
    children: React.ReactNode;
    onNavigate?: () => void;
}

export default function FrontPageLink({ itemId, href, className, children, onNavigate }: Props) {
    function handleClick() {
        markAsRead(itemId);
        onNavigate?.();
    }
    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={className}
            onClick={handleClick}
        >
            {children}
        </a>
    );
}
