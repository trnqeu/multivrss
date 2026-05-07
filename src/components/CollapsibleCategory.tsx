"use client";

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

    return (
        <div className="flex flex-col gap-4">
            <div className="label-system border-b-2 border-terracotta pb-2 flex justify-between items-center">
                <Link
                    href={`/category/${category.name.toLowerCase().replace(/\s+/g, '-')}`}
                    className="text-terracotta font-bold hover:opacity-70 transition-opacity"
                >
                    {category.name}
                </Link>
                <button onClick={() => setIsOpen(!isOpen)} className="text-terracotta font-bold">
                    {isOpen
                        ? category.sources.length.toString().padStart(2, '0')
                        : '▸'}
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
