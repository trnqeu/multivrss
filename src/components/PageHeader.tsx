'use client';

import { useRef, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { syncAllFeeds } from '@/app/actions';
import AddPopover from './AddPopover';
import { useSync } from './SyncProvider';
import ThemeToggle from './ThemeToggle';
import SettingsMenu from './SettingsMenu';
import type { Category } from '@prisma/client';

type Props = {
    categories: Category[];
    username: string;
    email?: string | null;
    tabs?: React.ReactNode;
};

const INPUT_CLASS = "flex-1 p-0 bg-transparent text-foreground text-[11px] font-bold uppercase tracking-widest placeholder:text-foreground/30 border-none appearance-none shadow-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-terracotta";

export default function PageHeader({ categories, username, email, tabs }: Props) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const desktopInputRef = useRef<HTMLInputElement>(null);
    const [inputValue, setInputValue] = useState(searchParams.get('q') ?? '');
    const [searchOpen, setSearchOpen] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const { startSync, isSyncing } = useSync();

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
            if (e.key === 'Escape') {
                if (document.activeElement === desktopInputRef.current || searchOpen) {
                    closeSearch();
                    desktopInputRef.current?.blur();
                }
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
        <header className="flex items-center h-14 border-b-2 border-foreground bg-background shrink-0 px-4 gap-4 md:px-7 md:gap-6">

            {/* ── MOBILE: search closed ── */}
            {!searchOpen && (
                <div className="flex items-center w-full gap-4 md:hidden">
                    <Link
                        href={`/u/${username}`}
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
                    <AddPopover categories={categories} />
                    <button
                        onClick={handleSync}
                        disabled={isSyncing}
                        aria-label="Sync feeds"
                        className="bg-transparent border-none p-0 text-terracotta text-lg leading-none disabled:opacity-40"
                    >
                        ↻
                    </button>
                    <ThemeToggle />
                    <SettingsMenu username={username} email={email} />
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
                        <label htmlFor="stream-search-mobile" className="sr-only">Filter the stream</label>
                        <input
                            id="stream-search-mobile"
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

            {tabs && <div className="hidden md:flex items-center">{tabs}</div>}
            {!tabs && <div className="hidden md:block flex-1" />}

            <div className="hidden md:flex items-center min-w-[220px] h-[30px] px-3 border border-foreground/25">
                <span className="text-terracotta text-[10px] font-extrabold shrink-0 select-none mr-2">Q</span>
                <label htmlFor="stream-search-desktop" className="sr-only">Filter the stream</label>
                <input
                    id="stream-search-desktop"
                    ref={desktopInputRef}
                    type="text"
                    value={inputValue}
                    onChange={handleChange}
                    placeholder="filter the stream..."
                    className={INPUT_CLASS}
                />
                {inputValue && clearBtn}
            </div>

            {tabs && <div className="hidden md:block flex-1" />}

            <div className="hidden md:block">
                <AddPopover categories={categories} />
            </div>

            <button
                onClick={handleSync}
                disabled={isSyncing}
                className="hidden md:block bg-transparent border-none p-0 font-mono text-[9.5px] font-extrabold uppercase tracking-[.12em] text-foreground/55 shrink-0 hover:bg-transparent hover:text-foreground transition-colors disabled:opacity-40"
            >
                {isSyncing ? '↻ SYNCING...' : '↻ SYNC'}
            </button>

            <div className="hidden md:flex items-center gap-3 ml-3">
                <ThemeToggle />
                <SettingsMenu username={username} email={email} />
            </div>

        </header>
    );
}
