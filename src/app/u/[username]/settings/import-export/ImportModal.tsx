'use client';

import { useActionState, useCallback, useEffect, useId, useRef, useState } from 'react';
import type { ActionState } from '@/app/actions/types';
import { useCloseOnNavigate } from '@/components/useCloseOnNavigate';

const initialState: ActionState = { success: false };

// Elements a Tab-cycle focus trap should consider inside the modal.
const FOCUSABLE_SELECTOR = 'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface ImportModalProps {
    open: boolean;
    onClose: () => void;
    /** e.g. "IMPORT · OPML" */
    kicker: string;
    /** e.g. "Import OPML" */
    title: string;
    /** e.g. ".opml,.xml" */
    accept: string;
    /** e.g. "DROP YOUR .OPML FILE HERE" */
    dropLabel: string;
    /** Literal example of the expected file shape, shown as a small spec block. */
    formatPreview: string;
    action: (prevState: ActionState | null, formData: FormData) => Promise<ActionState>;
    /** Called once after a successful import, e.g. to refresh server data. */
    onImported?: () => void;
}

export default function ImportModal({
    open, onClose, kicker, title, accept, dropLabel, formatPreview, action, onImported,
}: ImportModalProps) {
    const [state, formAction, isPending] = useActionState(action, initialState);
    const formRef = useRef<HTMLFormElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const dialogRef = useRef<HTMLDivElement>(null);
    const closeButtonRef = useRef<HTMLButtonElement>(null);
    const inputId = useId();
    const [fileName, setFileName] = useState('');
    const [dragOver, setDragOver] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    // Resets local state as part of closing (rather than in a state-sync
    // effect keyed on `open`) since the modal stays mounted between opens —
    // only its `open` prop toggles visibility — so stale fileName/submitted
    // would otherwise leak into the next time it's opened.
    const handleClose = useCallback(() => {
        setFileName('');
        setSubmitted(false);
        onClose();
    }, [onClose]);

    useCloseOnNavigate(handleClose);

    useEffect(() => {
        if (open) closeButtonRef.current?.focus();
    }, [open]);

    useEffect(() => {
        if (state.success && submitted) onImported?.();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state]);

    useEffect(() => {
        if (!open) return;
        function onKeyDown(e: KeyboardEvent) {
            if (e.key === 'Escape') {
                if (!isPending) handleClose();
                return;
            }
            if (e.key !== 'Tab' || !dialogRef.current) return;
            const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
            if (focusable.length === 0) return;
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        }
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [open, isPending, handleClose]);

    if (!open) return null;

    function submitFile(file: File) {
        setFileName(file.name);
        setSubmitted(true);
        const dt = new DataTransfer();
        dt.items.add(file);
        if (inputRef.current) inputRef.current.files = dt.files;
        formRef.current?.requestSubmit();
    }

    function handleDrop(e: React.DragEvent) {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) submitFile(file);
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto pt-20 pb-8 px-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.70)' }}
            onClick={e => { if (e.target === e.currentTarget && !isPending) handleClose(); }}
        >
            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-label={title}
                className="flex w-full max-w-lg flex-col border-2 border-foreground bg-background"
            >
                <div className="flex shrink-0 items-center justify-between px-[22px] py-[22px] border-b-2 border-foreground">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-terracotta font-bold">
                        {kicker}
                    </span>
                    <button
                        ref={closeButtonRef}
                        type="button"
                        onClick={handleClose}
                        disabled={isPending}
                        aria-label="Close"
                        className="w-9 h-9 flex items-center justify-center bg-transparent border border-foreground/40 text-foreground text-xl leading-none hover:border-foreground transition-colors disabled:opacity-40"
                    >
                        ×
                    </button>
                </div>

                <div className="px-[26px] pt-[26px] pb-2 flex flex-col gap-5">
                    <h3 className="text-foreground font-bold text-[16px]">{title}</h3>

                    {!submitted ? (
                        <>
                            <form ref={formRef} action={formAction} className="contents">
                                <label htmlFor={inputId} className="sr-only">Choose a file to import</label>
                                <input
                                    ref={inputRef}
                                    id={inputId}
                                    type="file"
                                    name="file"
                                    accept={accept}
                                    onChange={e => { const f = e.target.files?.[0]; if (f) submitFile(f); }}
                                    className="hidden"
                                />
                            </form>
                            <div
                                role="button"
                                tabIndex={0}
                                onClick={() => inputRef.current?.click()}
                                onKeyDown={e => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        inputRef.current?.click();
                                    }
                                }}
                                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                                onDragLeave={() => setDragOver(false)}
                                onDrop={handleDrop}
                                className={`flex flex-col items-center justify-center gap-2 py-10 px-4 border-[1.5px] border-dashed cursor-pointer transition-colors ${
                                    dragOver ? 'border-terracotta bg-terracotta/[0.08]' : 'border-foreground/25 hover:border-foreground/50'
                                }`}
                            >
                                <span className="text-terracotta text-xl leading-none" aria-hidden="true">↓</span>
                                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-foreground">
                                    {dropLabel}
                                </span>
                                <span className="font-mono text-[9.5px] text-foreground/40">
                                    or click to browse — max 5 MB
                                </span>
                            </div>
                            <pre className="font-mono text-[10px] text-foreground/45 leading-relaxed bg-foreground/[0.04] p-3 whitespace-pre-wrap">
                                {formatPreview}
                            </pre>
                        </>
                    ) : isPending ? (
                        <div className="flex flex-col items-center gap-4 py-14" role="status" aria-live="polite">
                            <span className="text-terracotta font-mono text-[11px] font-bold uppercase tracking-widest animate-pulse">
                                Importing…
                            </span>
                            {fileName && (
                                <span className="font-mono text-[10px] text-foreground/40">{fileName}</span>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4 py-4" role="alert">
                            <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-terracotta">
                                {state.success ? 'Import complete' : 'Import failed'}
                            </span>
                            <p className="font-mono text-[12px] text-foreground whitespace-pre-wrap leading-relaxed">
                                {state.message}
                            </p>
                        </div>
                    )}
                </div>

                <div className="flex shrink-0 items-center justify-between px-[26px] py-5 mt-2 border-t-2 border-foreground">
                    <span className="font-mono text-[9px] text-foreground/35 tracking-widest">
                        {submitted ? '' : 'existing entries are skipped automatically'}
                    </span>
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={isPending}
                        className="px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-widest border-2 border-foreground bg-transparent text-foreground hover:bg-foreground hover:text-background transition-colors disabled:opacity-40"
                    >
                        {submitted && !isPending ? 'DONE' : 'CANCEL'}
                    </button>
                </div>
            </div>
        </div>
    );
}
