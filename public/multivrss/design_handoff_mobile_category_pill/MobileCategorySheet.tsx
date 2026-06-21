'use client';

/**
 * REFERENCE COMPONENT — Option B (mobile category filter)
 * ────────────────────────────────────────────────────────
 * A pinned "CAT" pill + bottom sheet for picking a category on mobile.
 *
 * This is design-reference code for the existing Next.js 16 / React 19 / Tailwind v4
 * codebase. It mirrors the patterns already in SearchBar.tsx (URL `?cat` param as the
 * source of truth, `getCategories()` server action, terracotta/sharp-border design system).
 *
 * You can drop this file in as `src/components/MobileCategorySheet.tsx` and render it
 * from SearchBar's telemetry row (see README step 2), or fold the JSX directly into
 * SearchBar. Either way the contract is: read `?cat`, write `?cat`, nothing else.
 *
 * The pill is `md:hidden` (mobile only). On desktop the existing inline
 * `CAT: <value> ▾` dropdown in SearchBar keeps working — just add `hidden md:inline-flex`
 * to that desktop control so the two don't both show on small screens.
 */

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

    // Lock body scroll + close on Escape while the sheet is open.
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
        if (!next || next === 'ALL') params.delete('cat');
        else {
            params.set('cat', next);
            params.delete('source'); // mirror SearchBar.setCategory behaviour
        }
        router.push(`?${params.toString()}`);
        setOpen(false);
    }

    const isActive = cat !== 'ALL';

    return (
        <>
            {/* ── Pinned pill (mobile only). Lives at the START of the telemetry row, ── */}
            {/* ── outside the overflow-x-auto scroll area, so it never scrolls away.  ── */}
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

            {/* ── Bottom sheet ── */}
            {open && (
                <div className="md:hidden fixed inset-0 z-50">
                    {/* scrim */}
                    <button
                        aria-label="Close category filter"
                        onClick={() => setOpen(false)}
                        className="absolute inset-0 bg-black/55 cursor-default"
                    />
                    {/* sheet */}
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-label="Filter by category"
                        className="absolute inset-x-0 bottom-0 bg-background border-t-2 border-foreground max-h-[80%] flex flex-col
                                   motion-safe:animate-[sheet-up_.26s_cubic-bezier(.2,.8,.2,1)]"
                    >
                        <div className="w-9 h-1 bg-foreground/30 mx-auto mt-3 mb-1 rounded-full" />
                        <div className="flex items-center justify-between px-5 pt-2 pb-3 border-b border-foreground/15">
                            <span className="text-[10px] font-extrabold uppercase tracking-widest text-foreground/50">
                                Filter by category
                            </span>
                            <button
                                onClick={() => setOpen(false)}
                                aria-label="Close"
                                className="text-foreground/50 text-base leading-none cursor-pointer"
                            >{'✕'}</button>
                        </div>

                        <div className="overflow-y-auto pb-4">
                            {/* ALL row */}
                            <button
                                onClick={() => setCategory(null)}
                                aria-selected={cat === 'ALL'}
                                className={`flex w-full items-center justify-between px-6 py-4 border-b border-foreground/[0.08] text-left ${
                                    cat === 'ALL' ? 'bg-terracotta text-background' : 'text-foreground active:bg-foreground/[0.04]'
                                }`}
                            >
                                <span className="text-[13px] font-bold uppercase tracking-widest">ALL</span>
                            </button>
                            {categories.map(c => (
                                <button
                                    key={c.name}
                                    onClick={() => setCategory(c.name)}
                                    aria-selected={cat === c.name}
                                    className={`flex w-full items-center justify-between px-6 py-4 border-b border-foreground/[0.08] last:border-b-0 text-left ${
                                        cat === c.name ? 'bg-terracotta text-background' : 'text-foreground active:bg-foreground/[0.04]'
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

/*
Add this keyframe once (globals.css) — or use a Tailwind plugin/arbitrary keyframe:

@keyframes sheet-up {
    from { transform: translateY(100%); }
    to   { transform: translateY(0); }
}
*/
