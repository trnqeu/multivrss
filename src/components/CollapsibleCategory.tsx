"use client";

import { renameCategory } from '@/app/actions';
import { useState } from 'react';
import Link from 'next/link';
import RenameFeedTitle from './RenameFeedTitle';

type Props = {
    category: {
        id: string;
        name: string;
        sources: { id: string; title: string | null; slug: string }[];
    };
};

export default function CollapsibleCategory({ category }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [editingName, setEditingName] = useState(false);
    const [nameValue, setNameValue] = useState(category.name);

    async function commitName() {
        setEditingName(false);
        if (nameValue.trim() === category.name) return;
        const result = await renameCategory(category.id, nameValue);
        if (!result.success) setNameValue(category.name);
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="label-system border-b-2 border-terracotta pb-2 flex justify-between items-center">
                <div className="flex items-center gap-2 flex-1 min-w-0 group/name">
                    {editingName ? (
                        <input
                            autoFocus
                            value={nameValue}
                            onChange={(e) => setNameValue(e.target.value)}
                            onBlur={commitName}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                                if (e.key === 'Escape') { setNameValue(category.name); setEditingName(false); }
                            }}
                            className="text-[10px] font-bold uppercase tracking-widest bg-background text-terracotta border-b-2 border-terracotta outline-none w-full"
                        />
                    ) : (
                        <>
                            <Link
                                href={`/category/${category.name.toLowerCase().replace(/\s+/g, '-')}`}
                                className="text-terracotta font-bold hover:opacity-70 transition-opacity"
                            >
                                {nameValue}
                            </Link>
                            <button
                                onClick={() => setEditingName(true)}
                                className="opacity-0 group-hover/name:opacity-100 transition-opacity text-[9px] text-foreground hover:text-terracotta font-mono border border-foreground hover:border-terracotta px-1"
                                title="RENAME"
                            >
                                [~]
                            </button>
                        </>
                    )}
                </div>
                <button onClick={() => setIsOpen(!isOpen)} className="text-terracotta font-bold ml-2 shrink-0">
                    {isOpen ? category.sources.length.toString().padStart(2, '0') : '▸'}
                </button>
            </div>

            {isOpen && (
                <ul className="flex flex-col gap-2">
                    {category.sources.map((source) => (
                        <li key={source.id} className="group flex items-center relative pr-20">
                            <RenameFeedTitle sourceId={source.id} title={source.title ?? ''} slug={source.slug} />
                        </li>
                    ))}
                    {category.sources.length === 0 && (
                        <span className="label-system text-[9px] opacity-20 italic">Empty_Slot</span>
                    )}
                </ul>
            )}
        </div>
    );
}
