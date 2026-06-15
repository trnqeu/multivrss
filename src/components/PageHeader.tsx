'use client';

import { useRef, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { syncAllFeeds } from '@/app/actions';
import AddFeedForm from './AddFeedForm';
import SaveLinkBar from './SaveLinkBar';
import { useMobileSidebar } from './MobileSidebarContext';
import { useSync } from './SyncProvider';
import ThemeToggle from './ThemeToggle';
import SettingsMenu from './SettingsMenu';
import { SourceIcon } from './icons/Source';
import { PasteUrlIcon } from './icons/PasteUrl';
import type { Category } from '@prisma/client';

type Props = {
    categories: Category[];
    username: string;
    email?: string | null;
};

const INPUT_CLASS = "flex-1 p-0 bg-transparent text-foreground text-[11px] font-bold uppercase tracking-widest placeholder:text-foreground/30 border-none appearance-none shadow-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-terracotta";

export default function PageHeader({ categories, username, email }: Props) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const desktopInputRef = useRef<HTMLInputElement>(null);
    const [inputValue, setInputValue] = useState(searchParams.get('q') ?? '');
    const [showAdd, setShowAdd] = useState(false);
    const [showSaveUrl, setShowSaveUrl] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const { startSync, isSyncing } = useSync();
    const { setOpen: setMobileSidebarOpen } = useMobileSidebar();

    // refs for focus management
    const desktopUrlToggleRef = useRef<HTMLButtonElement>(null);
    const mobileUrlToggleRef = useRef<HTMLButtonElement>(null);
    const lastUrlTogglerRef = useRef<HTMLButtonElement | null>(null);
    const saveUrlPopoverRef = useRef<HTMLDivElement>(null);

    function handleSync() {
        startSync(async () => { await syncAllFeeds(); });
    }

    function openSaveUrl(fromRef: React.RefObject<HTMLButtonElement | null>) {
        lastUrlTogglerRef.current = fromRef.current;
        setShowSaveUrl(v => !v);
    }

    function closeSaveUrl() {
        setShowSaveUrl(false);
        lastUrlTogglerRef.current?.focus();
    }

    // Move focus into the URL input when popover opens
    useEffect(() => {
        if (showSaveUrl) {
            const input = saveUrlPopoverRef.current?.querySelector('input');
            input?.focus();
        }
    }, [showSaveUrl]);

    // Close popover on outside click
    useEffect(() => {
        if (!showSaveUrl) return;
        function onPointerDown(e: PointerEvent) {
            const target = e.target as Node;
            const outsidePopover = !saveUrlPopoverRef.current?.contains(target);
            const outsideDesktopToggle = !desktopUrlToggleRef.current?.contains(target);
            const outsideMobileToggle = !mobileUrlToggleRef.current?.contains(target);
            if (outsidePopover && outsideDesktopToggle && outsideMobileToggle) {
                closeSaveUrl();
            }
        }
        document.addEventListener('pointerdown', onPointerDown);
        return () => document.removeEventListener('pointerdown', onPointerDown);
    }, [showSaveUrl]);

    useEffect(() => {
        function onKeyDown(e: KeyboardEvent) {
            if (e.key === '/' && document.activeElement !== desktopInputRef.current) {
                e.preventDefault();
                setSearchOpen(true);
                desktopInputRef.current?.focus();
            }
            if (e.key === 'Escape') {
                if (showSaveUrl) {
                    closeSaveUrl();
                } else if (document.activeElement === desktopInputRef.current || searchOpen) {
                    closeSearch();
                    desktopInputRef.current?.blur();
                }
            }
        }
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchOpen, showSaveUrl]);

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
                        <button
                            onClick={() => setShowAdd(true)}
                            aria-label="Add source"
                            className="bg-transparent border border-foreground/30 px-2 py-1 text-foreground text-[11px] normal-case tracking-widest hover:border-foreground hover:bg-transparent transition-colors"
                        >
                            +
                        </button>
                        <button
                            ref={mobileUrlToggleRef}
                            onClick={() => openSaveUrl(mobileUrlToggleRef)}
                            aria-label="Save URL"
                            aria-expanded={showSaveUrl}
                            className={`bg-transparent border border-foreground/30 px-2 py-1 transition-colors ${
                                showSaveUrl ? 'border-foreground bg-foreground text-background' : 'text-foreground hover:border-foreground hover:bg-transparent'
                            }`}
                        >
                            <PasteUrlIcon size={14} />
                        </button>
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

                {/* Ingest action group: [ SOURCE | URL ] */}
                <div className="hidden md:flex items-stretch border border-foreground/30">
                    <button
                        onClick={() => setShowAdd(true)}
                        className="flex items-center gap-2 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-foreground bg-transparent border-r border-foreground/20 hover:bg-foreground hover:text-background transition-colors"
                    >
                        <SourceIcon size={12} /> Source
                    </button>
                    <button
                        ref={desktopUrlToggleRef}
                        onClick={() => openSaveUrl(desktopUrlToggleRef)}
                        aria-expanded={showSaveUrl}
                        className={`flex items-center gap-2 px-3 py-1 text-[10px] font-bold uppercase tracking-widest transition-colors ${
                            showSaveUrl ? 'bg-foreground text-background' : 'bg-transparent text-foreground hover:bg-foreground hover:text-background'
                        }`}
                    >
                        <PasteUrlIcon size={12} /> URL
                    </button>
                </div>

                <button
                    onClick={handleSync}
                    disabled={isSyncing}
                    className="hidden md:block bg-transparent border-none p-0 text-terracotta shrink-0 hover:bg-transparent normal-case tracking-widest disabled:opacity-40"
                >
                    {isSyncing ? '↻ SYNCING...' : '↻ SYNC'}
                </button>

                <div className="hidden md:flex items-center gap-3 ml-3">
                    <ThemeToggle />
                    <SettingsMenu username={username} email={email} />
                </div>

            </header>

            {/* Save URL popover strip */}
            {showSaveUrl && (
                <div
                    ref={saveUrlPopoverRef}
                    className="border-b-2 border-foreground bg-terracotta/[0.05] px-4 py-3.5 md:px-7"
                >
                    <SaveLinkBar onSaved={() => setShowSaveUrl(false)} />
                </div>
            )}

            {/* Add feed modal */}
            <AddFeedForm
                categories={categories}
                open={showAdd}
                onClose={() => setShowAdd(false)}
            />
        </>
    );
}
