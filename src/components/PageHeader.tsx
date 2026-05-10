'use client';

import { useRef, useEffect, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { syncAllFeeds } from '@/app/actions';
import AddFeedForm from './AddFeedForm';
import { useMobileSidebar } from './MobileSidebarContext';
import type { Category } from '@prisma/client';

type Props = {
    categories: Category[];
};

const INPUT_CLASS = "flex-1 p-0 bg-transparent text-foreground text-[11px] font-bold uppercase tracking-widest placeholder:text-foreground/30 outline-none border-none appearance-none shadow-none";

export default function PageHeader({ categories }: Props) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const desktopInputRef = useRef<HTMLInputElement>(null);
    const [inputValue, setInputValue] = useState(searchParams.get('q') ?? '');
    const [showAdd, setShowAdd] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [syncPending, startSync] = useTransition();
    const { setOpen: setMobileSidebarOpen } = useMobileSidebar();

    function handleSync() {
        startSync(async () => { await syncAllFeeds(); });
    }

    useEffect(() => {
        function onKeyDown(e: KeyboardEvent) {
            if (e.key === '/' && document.activeElement !== desktopInputRef.current) {
                e.preventDefault();
                setSearchOpen(true);
                desktopInputRef.current?.focus();
            }
            if (e.key === 'Escape' && (document.activeElement === desktopInputRef.current || searchOpen)) {
                closeSearch();
                desktopInputRef.current?.blur();
            }
        }
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchOpen]);

    function pushQuery(q: string) {
        const next = new URLSearchParams(searchParams.toString());
        if (q) next.set('q', q); else next.delete('q');
        router.replace(`?${next}`, { scroll: false });
    }

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        const val = e.target.value;
        setInputValue(val);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => pushQuery(val), 120);
    }

    function closeSearch() {
        setSearchOpen(false);
        setInputValue('');
        pushQuery('');
    }

    const clearBtn = (
        <button
            onMouseDown={e => { e.preventDefault(); setInputValue(''); pushQuery(''); }}
            className="bg-transparent border-none p-0 text-foreground/40 hover:text-foreground hover:bg-transparent text-[10px] leading-none"
        >
            ✕
        </button>
    );

    return (
        <>
            <header className="flex items-center h-14 border-b-2 border-foreground bg-background shrink-0 px-4 gap-4 md:px-7 md:gap-6">

                {/* ── MOBILE: search closed ── */}
                {!searchOpen && (
                    <div className="flex items-center w-full gap-4 md:hidden">
                        <button
                            onClick={() => setMobileSidebarOpen(true)}
                            aria-label="Open navigation"
                            className="bg-transparent border-none p-0 text-foreground text-base leading-none"
                        >
                            ☰
                        </button>
                        <Link
                            href="/"
                            className="text-terracotta text-[13px] font-extrabold uppercase tracking-[0.22em] flex-1"
                        >
                            MULTIVRSS
                        </Link>
                        <button
                            onClick={() => setSearchOpen(true)}
                            aria-label="Open search"
                            className="bg-transparent border-none p-0 text-foreground text-lg leading-none"
                        >
                            ⌕
                        </button>
                        <button
                            onClick={() => setShowAdd(true)}
                            className="bg-transparent border border-foreground/30 px-2 py-1 text-foreground text-[11px] normal-case tracking-widest hover:border-foreground hover:bg-transparent transition-colors"
                        >
                            +
                        </button>
                        <button
                            onClick={handleSync}
                            disabled={syncPending}
                            aria-label="Sync feeds"
                            className="bg-transparent border-none p-0 text-terracotta text-lg leading-none disabled:opacity-40"
                        >
                            ↻
                        </button>
                    </div>
                )}

                {/* ── MOBILE: search open ── */}
                {searchOpen && (
                    <div className="flex items-center w-full gap-3 md:hidden">
                        <button
                            onClick={closeSearch}
                            className="bg-transparent border-none p-0 text-foreground text-lg leading-none"
                        >
                            ←
                        </button>
                        <div className="flex-1 flex items-center h-8 px-3 border border-foreground/20">
                            <span className="text-terracotta text-[10px] font-bold shrink-0 select-none mr-2">Q</span>
                            <input
                                autoFocus
                                type="text"
                                value={inputValue}
                                onChange={handleChange}
                                placeholder="filter the stream..."
                                className={INPUT_CLASS}
                            />
                            {inputValue && clearBtn}
                        </div>
                    </div>
                )}

                {/* ── DESKTOP: always visible ── */}

                <Link href="/" className="hidden md:block text-[13px] font-extrabold uppercase tracking-[0.22em] text-terracotta shrink-0">
                    MULTIVRSS
                </Link>

                <div className="hidden md:block flex-1" />

                <div className="hidden md:flex items-center min-w-[280px] h-8 px-3 border border-foreground/20">
                    <span className="text-terracotta text-[10px] font-bold shrink-0 select-none mr-2">Q</span>
                    <input
                        ref={desktopInputRef}
                        type="text"
                        value={inputValue}
                        onChange={handleChange}
                        placeholder="filter the stream..."
                        className={INPUT_CLASS}
                    />
                    {inputValue && clearBtn}
                </div>

                <button
                    onClick={() => setShowAdd(true)}
                    className="hidden md:block bg-transparent text-foreground text-[10px] shrink-0 border border-foreground/30 px-3 py-1 hover:border-foreground hover:bg-transparent transition-colors normal-case tracking-widest"
                >
                    + SOURCE
                </button>

                <button
                    onClick={handleSync}
                    disabled={syncPending}
                    className="hidden md:block bg-transparent border-none p-0 text-terracotta shrink-0 hover:bg-transparent normal-case tracking-widest disabled:opacity-40"
                >
                    {syncPending ? '↻ SYNCING...' : '↻ SYNC'}
                </button>

            </header>

            {/* Add feed modal */}
            {showAdd && (
                <div
                    className="fixed inset-0 z-50 bg-black/70 flex items-start justify-center pt-20 px-4"
                    onClick={e => { if (e.target === e.currentTarget) setShowAdd(false); }}
                >
                    <div className="w-full max-w-2xl border-2 border-foreground bg-background">
                        <div className="flex items-center h-12 border-b-2 border-foreground shrink-0">
                            <button
                                onClick={() => setShowAdd(false)}
                                className="px-5 h-full border-r-2 border-foreground text-[11px] font-bold uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors"
                            >
                                ✕ CLOSE
                            </button>
                            <span className="px-5 label-system text-terracotta">ADD FEED</span>
                        </div>
                        <AddFeedForm categories={categories} alwaysOpen />
                    </div>
                </div>
            )}
        </>
    );
}
