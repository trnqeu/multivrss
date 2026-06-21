'use client';

import { markAsRead } from '@/app/actions';

interface Props {
    itemId: string;
    href: string;
    className?: string;
    children: React.ReactNode;
}

export default function FrontPageLink({ itemId, href, className, children }: Props) {
    function handleClick() {
        markAsRead(itemId);
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
