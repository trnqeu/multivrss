'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { renameFeedSource } from '@/app/actions';
import DeleteFeedButton from './DeleteFeedButton';

interface Props {
    sourceId: string;
    title: string;
    username: string;
}

export default function RenameFeedTitle({ sourceId, title, username }: Props) {
    const [editing, setEditing] = useState(false);
    const [value, setValue] = useState(title);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (editing) inputRef.current?.focus();
    }, [editing]);

    async function commit() {
        setEditing(false);
        const trimmed = value.trim();
        if (trimmed === title || !trimmed) {
            setValue(title);
            return;
        }
        const result = await renameFeedSource(sourceId, value);
        if (!result.success) setValue(title);
    }

    function onKeyDown(e: React.KeyboardEvent) {
        if (e.key === 'Enter') inputRef.current?.blur();
        if (e.key === 'Escape') { setValue(title); setEditing(false); }
    }

    if (editing) {
        return (
            <div className="flex-1 flex">
                <input
                    ref={inputRef}
                    value={value}
                    onChange={e => setValue(e.target.value)}
                    onBlur={commit}
                    onKeyDown={onKeyDown}
                    className="flex-1 text-[12px] font-medium bg-terracotta/10 text-foreground border-2 border-terracotta px-2 py-1 outline-none"
                />
                <DeleteFeedButton sourceId={sourceId} />
            </div>
        );
    }

    return (
        <div className="flex-1 flex items-center">
            <Link
                href={`/u/${username}?source=${sourceId}`}
                className="flex-1 py-1 text-[12px] font-medium text-foreground/85 hover:text-foreground transition-colors"
            >
                {value}
            </Link>
            <button
                type="button"
                onClick={() => setEditing(true)}
                className="absolute right-9 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] px-1 border-2 border-terracotta text-terracotta bg-background hover:bg-terracotta hover:text-background font-mono"
                title="RENAME_SOURCE"
            >
                [✎]
            </button>
            <DeleteFeedButton sourceId={sourceId} />
        </div>
    );
}
