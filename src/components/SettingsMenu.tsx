'use client';

import { useRef, useState, useEffect } from 'react';
import { useActionState } from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { exportFeedsCsv, importFeedsCsv } from '@/app/actions/csv';
import type { ActionState } from '@/app/actions/types';

const initialState: ActionState = { success: false };

export default function SettingsMenu({
    username,
    email,
}: {
    username: string;
    email?: string | null;
}) {
    const [open, setOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const formRef = useRef<HTMLFormElement>(null);
    const [state, formAction, isPending] = useActionState(importFeedsCsv, initialState);
    const [overlay, setOverlay] = useState(false);
    const [fileName, setFileName] = useState('');

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
        if (!overlay) return;
        function onKey(e: KeyboardEvent) {
            if (e.key === 'Escape' && !isPending) setOverlay(false);
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [overlay, isPending]);

    async function handleExport() {
        const result = await exportFeedsCsv();
        if (!result.success || !result.data) return;
        const blob = new Blob([result.data], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'multivrss-feed.csv';
        a.click();
        URL.revokeObjectURL(url);
        setOpen(false);
    }

    function handleImportClick() {
        fileInputRef.current?.click();
    }

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        setFileName(file.name);
        setOverlay(true);
        formRef.current?.requestSubmit();
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
                        <button
                            onClick={handleExport}
                            className="w-full text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest border-b border-foreground/10 hover:bg-foreground hover:text-background transition-colors cursor-pointer"
                        >
                            ↓ EXPORT CSV
                        </button>

                        <form
                            ref={formRef}
                            action={formAction}
                            onSubmit={() => setOverlay(true)}
                            className="contents"
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                name="file"
                                accept=".csv"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                            <button
                                type="button"
                                onClick={handleImportClick}
                                disabled={isPending}
                                className="w-full text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest border-b border-foreground/10 hover:bg-foreground hover:text-background transition-colors disabled:opacity-40 cursor-pointer"
                            >
                                ↑ IMPORT CSV
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

            {overlay && (
                <div
                    className="fixed inset-0 z-50 flex items-start justify-center pt-32 px-4"
                    style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
                    onClick={() => { if (!isPending) setOverlay(false); }}
                >
                    <div
                        className="w-full max-w-lg border-2 border-foreground bg-background"
                        onClick={e => e.stopPropagation()}
                    >
                        {isPending ? (
                            <div className="flex flex-col items-center gap-5 py-20 px-8">
                                <span className="text-terracotta text-[11px] font-mono uppercase tracking-widest animate-pulse">
                                    IMPORTING FEEDS&hellip;
                                </span>
                                {fileName && (
                                    <span className="text-white/40 text-[10px] font-mono">
                                        {fileName}
                                    </span>
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-col gap-5 py-10 px-8">
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
                                    onClick={() => {
                                        setOverlay(false);
                                        setOpen(false);
                                    }}
                                    className="self-start mt-2 px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-widest border-2 border-foreground bg-foreground text-background hover:bg-background hover:text-foreground transition-colors cursor-pointer"
                                >
                                    DISMISS
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
