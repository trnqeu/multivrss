'use client';

import { useState } from 'react';
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
    const [error, setError] = useState('');

    async function handleSubmit(value: string) {
        const trimmed = value.trim().toUpperCase();
        if (trimmed === name || !trimmed) {
            onDone();
            return;
        }
        const result = await renameCategory(categoryId, value);
        onDone();
        if (!result.success) {
            setError(result.message ?? 'Rename failed.');
        }
    }

    if (editing) {
        return (
            <div className="flex flex-col gap-1 min-w-0">
                <input
                    key={name}
                    defaultValue={name}
                    autoFocus
                    onBlur={(e) => handleSubmit(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            handleSubmit((e.target as HTMLInputElement).value);
                        }
                        if (e.key === 'Escape') onDone();
                    }}
                    className="w-full text-[13px] font-bold uppercase tracking-[0.18em] bg-terracotta/10 text-terracotta border-2 border-terracotta px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta focus-visible:ring-offset-1"
                />
                {error && (
                    <span className="font-mono text-[9px] text-terracotta uppercase tracking-wider px-1">
                        {error}
                    </span>
                )}
            </div>
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
            {error && (
                <span className="font-mono text-[9px] text-terracotta uppercase tracking-wider ml-1 shrink-0">!</span>
            )}
        </span>
    );
}
