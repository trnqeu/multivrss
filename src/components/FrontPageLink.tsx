'use client';

import { useReadQueue } from '@/lib/useReadQueue';

interface Props {
    itemId: string;
    href: string;
    className?: string;
    children: React.ReactNode;
    onNavigate?: () => void;
}

export default function FrontPageLink({ itemId, href, className, children, onNavigate }: Props) {
    const { queueRead } = useReadQueue();
    function handleClick() {
        queueRead(itemId);
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
