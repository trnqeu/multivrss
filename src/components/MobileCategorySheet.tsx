'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getCategories } from '@/app/actions';

export default function MobileCategorySheet() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const cat = searchParams.get('cat') ?? 'ALL';

    const [open, setOpen] = useState(false);
    const [categories, setCategories] = useState<{ name: string }[]>([]);

    useEffect(() => {
        void getCategories().then(result => setCategories(result.map(c => ({ name: c.name }))));
    }, []);

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
        document.addEventListener('keydown', onKey);
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = prev;
        };
    }, [open]);

    function setCategory(next: string | null) {
        const params = new URLSearchParams(searchParams.toString());
        if (!next || next === 'ALL') {
            params.delete('cat');
            params.delete('view'); // back to default (Front Page)
        } else {
            params.set('cat', next);
            params.delete('source');
            params.set('view', 'river');
        }
        router.push(`?${params.toString()}`);
        setOpen(false);
    }

    const isActive = cat !== 'ALL';

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                aria-haspopup="dialog"
                aria-expanded={open}
                className={`md:hidden shrink-0 flex items-center gap-1.5 px-3 border-r-2 border-foreground cursor-pointer ${
                    isActive ? 'bg-terracotta' : 'bg-background'
                }`}
            >
                <span className={`text-[9px] font-extrabold tracking-widest ${isActive ? 'text-background/55' : 'text-foreground/40'}`}>
                    CAT
                </span>
                <span className={`text-[10px] font-extrabold tracking-wider ${isActive ? 'text-background' : 'text-foreground'}`}>
                    {cat}
                </span>
                <span className={`text-[8px] ${isActive ? 'text-background/60' : 'text-foreground/40'}`}>{'▾'}</span>
            </button>

            {open && (
                <div className="md:hidden fixed inset-0 z-50">
                    <button
                        aria-label="Close category filter"
                        onClick={() => setOpen(false)}
                        className="absolute inset-0 bg-black/55 cursor-default"
                    />
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-label="Filter by category"
                        className="absolute inset-x-0 bottom-0 bg-background border-t-2 border-foreground max-h-[80%] flex flex-col motion-safe:animate-[sheet-up_.26s_cubic-bezier(.2,.8,.2,1)]"
                    >
                        <div className="w-9 h-1 bg-foreground/30 mx-auto mt-3 mb-1 rounded-full" />
                        <div className="flex items-center justify-between px-5 pt-2 pb-3 border-b border-foreground/15">
                            <span className="text-[10px] font-extrabold uppercase tracking-widest text-foreground/50">
                                Filter by category
                            </span>
                            <button
                                onClick={() => setOpen(false)}
                                aria-label="Close"
                                className="text-foreground/50 text-base leading-none cursor-pointer bg-transparent border-0 p-0"
                            >{'✕'}</button>
                        </div>

                        <div role="listbox" aria-label="Category options" className="overflow-y-auto pb-4">
                            <button
                                role="option"
                                onClick={() => setCategory(null)}
                                aria-selected={cat === 'ALL'}
                                className={`flex w-full items-center justify-between px-6 py-4 border-b border-foreground/[0.08] text-left ${
                                    cat === 'ALL' ? 'bg-terracotta text-background' : 'bg-background text-foreground active:bg-foreground/[0.04]'
                                }`}
                            >
                                <span className="text-[13px] font-bold uppercase tracking-widest">ALL</span>
                            </button>
                            {categories.map(c => (
                                <button
                                    role="option"
                                    key={c.name}
                                    onClick={() => setCategory(c.name)}
                                    aria-selected={cat === c.name}
                                    className={`flex w-full items-center justify-between px-6 py-4 border-b border-foreground/[0.08] last:border-b-0 text-left ${
                                        cat === c.name ? 'bg-terracotta text-background' : 'bg-background text-foreground active:bg-foreground/[0.04]'
                                    }`}
                                >
                                    <span className="text-[13px] font-bold uppercase tracking-widest">{c.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
