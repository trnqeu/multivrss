'use client';

import { useRef, useEffect } from 'react';
import Link from 'next/link';
import { renameFeedSource } from '@/app/actions';

interface Props {
    sourceId: string;
    title: string;
    username: string;
    editing: boolean;
    onDone: () => void;
}

export default function RenameFeedTitle({ sourceId, title, username, editing, onDone }: Props) {
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (editing) inputRef.current?.focus();
    }, [editing]);

    if (editing) {
        return (
            <input
                ref={inputRef}
                key={title}
                defaultValue={title}
                onBlur={(e) => handleBlur(sourceId, title, e.target.value, onDone)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        handleBlur(sourceId, title, (e.target as HTMLInputElement).value, onDone);
                    }
                    if (e.key === 'Escape') onDone();
                }}
                className="flex-1 text-[12px] font-medium bg-terracotta/10 text-foreground border-2 border-terracotta px-2 py-1 outline-none"
            />
        );
    }

    return (
        <div className="flex-1 flex items-center">
            <Link
                href={`/u/${username}?source=${sourceId}`}
                className="flex-1 py-1 text-[12px] font-medium text-foreground/85 hover:text-foreground transition-colors"
            >
                {title}
            </Link>
        </div>
    );
}

async function handleBlur(sourceId: string, original: string, value: string, onDone: () => void) {
    onDone();
    const trimmed = value.trim();
    if (trimmed === original || !trimmed) return;
    await renameFeedSource(sourceId, value);
}
