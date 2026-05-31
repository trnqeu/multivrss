'use client';

import { useRef, useEffect } from 'react';
import MobileNavLink from './MobileNavLink';
import { renameCategory } from '@/app/actions';

interface Props {
    categoryId: string;
    name: string;
    username: string;
    editing: boolean;
    onDone: () => void;
}

export default function RenameCategoryTitle({ categoryId, name, username, editing, onDone }: Props) {
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (editing) inputRef.current?.focus();
    }, [editing]);

    if (editing) {
        return (
            <input
                ref={inputRef}
                key={name}
                defaultValue={name}
                onBlur={(e) => handleBlur(categoryId, name, e.target.value, onDone)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        handleBlur(categoryId, name, (e.target as HTMLInputElement).value, onDone);
                    }
                    if (e.key === 'Escape') onDone();
                }}
                className="w-full text-[13px] font-bold uppercase tracking-[0.18em] bg-terracotta/10 text-terracotta border-2 border-terracotta px-2 py-1 outline-none"
            />
        );
    }

    return (
        <span className="inline-flex items-center gap-1 min-w-0">
            <MobileNavLink
                href={`/u/${username}?cat=${encodeURIComponent(name)}`}
                className="text-[13px] font-bold uppercase tracking-[0.18em] text-terracotta py-1 hover:text-terracotta/70 transition-colors truncate"
            >
                {name}
            </MobileNavLink>
        </span>
    );
}

async function handleBlur(categoryId: string, original: string, value: string, onDone: () => void) {
    onDone();
    const trimmed = value.trim().toUpperCase();
    if (trimmed === original || !trimmed) return;
    await renameCategory(categoryId, value);
}
