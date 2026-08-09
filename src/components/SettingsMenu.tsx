'use client';

import { useRef, useState, useEffect } from 'react';
import { useActionState } from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { exportFeedsCsv, importFeedsCsv, exportSavedLinksCsv, importSavedLinksCsv } from '@/app/actions/csv';
import type { ActionState } from '@/app/actions/types';

const initialState: ActionState = { success: false };

function ImportOverlay({
    verb,
    isPending,
    fileName,
    state,
    onDismiss,
}: {
    verb: string;
    isPending: boolean;
    fileName: string;
    state: ActionState;
    onDismiss: () => void;
}) {
    return (
        <div
            className="fixed inset-0 z-50 flex items-start justify-center pt-32 px-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
            onClick={() => { if (!isPending) onDismiss(); }}
        >
            <div
                className="w-full max-w-lg border-2 border-foreground bg-background"
                onClick={e => e.stopPropagation()}
            >
                {isPending ? (
                    <div className="flex flex-col items-center gap-5 py-20 px-8">
                        <span
                            role="status"
                            aria-live="polite"
                            className="text-terracotta text-[11px] font-mono uppercase tracking-widest animate-pulse"
                        >
                            {verb}&hellip;
                        </span>
                        {fileName && (
                            <span className="text-white/40 text-[10px] font-mono">
                                {fileName}
                            </span>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col gap-5 py-10 px-8" role="alert">
                        <span
                            className={`text-[11px] font-mono uppercase tracking-widest ${
                                state?.success ? 'text-green-400/70' : 'text-terracotta'
                            }`}
                        >
                            {state?.success ? 'IMPORT COMPLETE' : 'IMPORT FAILED'}
                        </span>
                        <p className="font-mono text-[13px] text-foreground whitespace-pre-wrap leading-relaxed">
                            {state?.message}
                        </p>
                        <button
                            onClick={onDismiss}
                            className="self-start mt-2 px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-widest border-2 border-foreground bg-foreground text-background hover:bg-background hover:text-foreground transition-colors cursor-pointer"
                        >
                            DISMISS
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function SettingsMenu({
    username,
    email,
}: {
    username: string;
    email?: string | null;
}) {
    const [open, setOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Feed list CSV import
    const feedFileInputRef = useRef<HTMLInputElement>(null);
    const feedFormRef = useRef<HTMLFormElement>(null);
    const [feedState, feedFormAction, feedIsPending] = useActionState(importFeedsCsv, initialState);
    const [feedOverlay, setFeedOverlay] = useState(false);
    const [feedFileName, setFeedFileName] = useState('');

    // Saved links CSV import
    const linksFileInputRef = useRef<HTMLInputElement>(null);
    const linksFormRef = useRef<HTMLFormElement>(null);
    const [linksState, linksFormAction, linksIsPending] = useActionState(importSavedLinksCsv, initialState);
    const [linksOverlay, setLinksOverlay] = useState(false);
    const [linksFileName, setLinksFileName] = useState('');

    useEffect(() => {
        if (!open) return;
        function handleClick(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        function handleKey(e: KeyboardEvent) {
            if (e.key === 'Escape') setOpen(false);
        }
        document.addEventListener('mousedown', handleClick);
        document.addEventListener('keydown', handleKey);
        return () => {
            document.removeEventListener('mousedown', handleClick);
            document.removeEventListener('keydown', handleKey);
        };
    }, [open]);

    useEffect(() => {
        if (!feedOverlay) return;
        function onKey(e: KeyboardEvent) {
            if (e.key === 'Escape' && !feedIsPending) setFeedOverlay(false);
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [feedOverlay, feedIsPending]);

    useEffect(() => {
        if (!linksOverlay) return;
        function onKey(e: KeyboardEvent) {
            if (e.key === 'Escape' && !linksIsPending) setLinksOverlay(false);
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [linksOverlay, linksIsPending]);

    function downloadCsv(data: string, filename: string) {
        const blob = new Blob([data], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

    async function handleExportFeeds() {
        const result = await exportFeedsCsv();
        if (!result.success || !result.data) return;
        downloadCsv(result.data, 'multivrss-feed.csv');
        setOpen(false);
    }

    async function handleExportSavedLinks() {
        const result = await exportSavedLinksCsv();
        if (!result.success || !result.data) return;
        downloadCsv(result.data, 'multivrss-saved-links.csv');
        setOpen(false);
    }

    function handleFeedImportClick() {
        feedFileInputRef.current?.click();
    }

    function handleFeedFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        setFeedFileName(file.name);
        setFeedOverlay(true);
        feedFormRef.current?.requestSubmit();
    }

    function handleLinksImportClick() {
        linksFileInputRef.current?.click();
    }

    function handleLinksFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        setLinksFileName(file.name);
        setLinksOverlay(true);
        linksFormRef.current?.requestSubmit();
    }

    return (
        <div ref={menuRef} className="relative inline-flex items-center">
            <button
                onClick={() => setOpen(!open)}
                className="bg-transparent border-0 p-0 text-foreground/60 hover:text-foreground transition-colors cursor-pointer text-[17px] leading-none inline-flex items-center"
                aria-label="Settings"
            >
                ⚙
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-2 w-56 border-2 border-foreground bg-background z-50">
                    <div className="px-4 py-3 border-b-2 border-foreground">
                        <div className="text-[11px] font-bold uppercase tracking-widest text-foreground">
                            {username}
                        </div>
                        {email && (
                            <div className="text-[9px] text-foreground/50 font-mono mt-0.5">
                                {email}
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col">
                        <Link
                            href={`/u/${username}/settings/api-keys`}
                            onClick={() => setOpen(false)}
                            className="w-full text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest border-b border-foreground/10 hover:bg-foreground hover:text-background transition-colors cursor-pointer"
                        >
                            ⚿ API KEYS
                        </Link>
                        <Link
                            href={`/u/${username}/settings/account`}
                            onClick={() => setOpen(false)}
                            className="w-full text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest border-b border-foreground/10 hover:bg-foreground hover:text-background transition-colors cursor-pointer"
                        >
                            ⚙ ACCOUNT
                        </Link>
                        <button
                            onClick={handleExportFeeds}
                            className="w-full text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest border-b border-foreground/10 hover:bg-foreground hover:text-background transition-colors cursor-pointer"
                        >
                            ↓ EXPORT CSV
                        </button>
                        <form
                            ref={feedFormRef}
                            action={feedFormAction}
                            onSubmit={() => setFeedOverlay(true)}
                            className="contents"
                        >
                            <label htmlFor="import-feeds-csv-file" className="sr-only">Import feed list CSV file</label>
                            <input
                                ref={feedFileInputRef}
                                id="import-feeds-csv-file"
                                type="file"
                                name="file"
                                accept=".csv"
                                onChange={handleFeedFileChange}
                                className="hidden"
                            />
                            <button
                                type="button"
                                onClick={handleFeedImportClick}
                                disabled={feedIsPending}
                                className="w-full text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest border-b border-foreground/10 hover:bg-foreground hover:text-background transition-colors disabled:opacity-40 cursor-pointer"
                            >
                                ↑ IMPORT CSV
                            </button>
                        </form>
                        <button
                            onClick={handleExportSavedLinks}
                            className="w-full text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest border-b border-foreground/10 hover:bg-foreground hover:text-background transition-colors cursor-pointer"
                        >
                            ↓ EXPORT SAVED LINKS
                        </button>
                        <form
                            ref={linksFormRef}
                            action={linksFormAction}
                            onSubmit={() => setLinksOverlay(true)}
                            className="contents"
                        >
                            <label htmlFor="import-saved-links-csv-file" className="sr-only">Import saved links CSV file</label>
                            <input
                                ref={linksFileInputRef}
                                id="import-saved-links-csv-file"
                                type="file"
                                name="file"
                                accept=".csv"
                                onChange={handleLinksFileChange}
                                className="hidden"
                            />
                            <button
                                type="button"
                                onClick={handleLinksImportClick}
                                disabled={linksIsPending}
                                className="w-full text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest border-b border-foreground/10 hover:bg-foreground hover:text-background transition-colors disabled:opacity-40 cursor-pointer"
                            >
                                ↑ IMPORT SAVED LINKS
                            </button>
                        </form>
                    </div>

                    <button
                        onClick={() => {
                            try { new BroadcastChannel('auth').postMessage('logout'); } catch { /* unsupported */ }
                            signOut({ callbackUrl: '/' });
                        }}
                        className="w-full text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-terracotta hover:bg-terracotta hover:text-background transition-colors cursor-pointer"
                    >
                        ⊘ LOGOUT
                    </button>
                </div>
            )}

            {feedOverlay && (
                <ImportOverlay
                    verb="IMPORTING FEEDS"
                    isPending={feedIsPending}
                    fileName={feedFileName}
                    state={feedState}
                    onDismiss={() => { setFeedOverlay(false); setOpen(false); }}
                />
            )}
            {linksOverlay && (
                <ImportOverlay
                    verb="IMPORTING SAVED LINKS"
                    isPending={linksIsPending}
                    fileName={linksFileName}
                    state={linksState}
                    onDismiss={() => { setLinksOverlay(false); setOpen(false); }}
                />
            )}
        </div>
    );
}
