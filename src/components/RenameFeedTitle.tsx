'use client';

import { useState } from 'react';
import Link from 'next/link';
import { renameFeedSource } from '@/app/actions';
import DeleteFeedButton from './DeleteFeedButton';

interface Props {
    sourceId: string;
    title: string;
    slug: string;
}

export default function RenameFeedTitle({ sourceId, title, slug }: Props) {
    const [editing, setEditing] = useState(false);
    const [value, setValue] = useState(title);

    async function commit() {
        setEditing(false);
        if (value.trim() === title) return;
        const result = await renameFeedSource(sourceId, value);
        if (!result.success) setValue(title);
    }

    function onKeyDown(e: React.KeyboardEvent) {
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
        if (e.key === 'Escape') { setValue(title); setEditing(false); }
    }

    if (editing) {
        return (
            <input
                autoFocus
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onBlur={commit}
                onKeyDown={onKeyDown}
                className="text-[13px] font-medium px-2 py-1 flex-1 bg-background text-foreground border-b-2 border-terracotta outline-none w-full"
            />
        );
    }

    return (
        <>
            <Link
                href={`/source/${slug}`}
                className="text-[13px] text-foreground hover:bg-foreground hover:text-background hover:translate-x-1 transition-all block py-1 font-medium px-2 flex-1"
            >
                {value}
            </Link>
            <button
                onClick={startEditing}
                className="absolute right-14 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-foreground hover:bg-foreground hover:text-background px-1 border border-foreground font-mono"
                title="RENAME"
            >
                [~]
            </button>
            <DeleteFeedButton sourceId={sourceId} />
        </>
    );

    function startEditing() {
        setEditing(true);
    }
}