'use client';

import { useReadQueue } from '@/lib/useReadQueue';
import { sendSavedTouch } from '@/lib/fading-beacon';

interface Props {
    itemId: string;
    href: string;
    className?: string;
    children: React.ReactNode;
    onNavigate?: () => void;
    /** Whether the item is saved: opening a saved item records a fading touch. */
    saved?: boolean;
}

export default function FrontPageLink({ itemId, href, className, children, onNavigate, saved = false }: Props) {
    const { queueRead } = useReadQueue();
    function handleClick() {
        queueRead(itemId);
        if (saved) sendSavedTouch('article', itemId, 'open');
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
