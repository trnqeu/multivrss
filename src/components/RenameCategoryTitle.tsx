'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { renameCategory } from '@/app/actions';

interface Props {
    categoryId: string;
    name: string;
    username: string;
}

export default function RenameCategoryTitle({ categoryId, name, username }: Props) {
    const [editing, setEditing] = useState(false);
    const [value, setValue] = useState(name);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (editing) inputRef.current?.focus();
    }, [editing]);

    async function commit() {
        setEditing(false);
        const trimmed = value.trim().toUpperCase();
        if (trimmed === name || !trimmed) {
            setValue(name);
            return;
        }
        const result = await renameCategory(categoryId, value);
        if (!result.success) setValue(name);
    }

    function onKeyDown(e: React.KeyboardEvent) {
        if (e.key === 'Enter') inputRef.current?.blur();
        if (e.key === 'Escape') { setValue(name); setEditing(false); }
    }

    if (editing) {
        return (
            <input
                ref={inputRef}
                value={value}
                onChange={e => setValue(e.target.value)}
                onBlur={commit}
                onKeyDown={onKeyDown}
                className="w-full text-[13px] font-bold uppercase tracking-[0.18em] bg-terracotta/10 text-terracotta border-2 border-terracotta px-2 py-1 outline-none"
            />
        );
    }

    return (
        <span className="inline-flex items-center gap-1 min-w-0">
            <Link
                href={`/u/${username}?cat=${encodeURIComponent(value)}`}
                className="text-[13px] font-bold uppercase tracking-[0.18em] text-terracotta py-1 hover:text-terracotta/70 transition-colors truncate"
            >
                {value}
            </Link>
            <button
                type="button"
                onClick={() => setEditing(true)}
                className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] px-1 border-2 border-terracotta text-terracotta bg-background hover:bg-terracotta hover:text-background font-mono"
                title="RENAME_CATEGORY"
            >
                [✎]
            </button>
        </span>
    );
}
