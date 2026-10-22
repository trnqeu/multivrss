'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { disableSavedFading, enableSavedFading } from '@/app/actions/fading';
import { useCloseOnNavigate } from '@/components/useCloseOnNavigate';

// Elements a Tab-cycle focus trap should consider inside the dialog (same as ImportModal).
const FOCUSABLE_SELECTOR = 'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])';

const COPY = {
    enable: {
        title: 'Turn on fading?',
        body: 'Your saved items start fresh and will fade unless you come back to them. What fades is gone for good: nothing can be restored.',
        confirm: 'Turn on fading',
    },
    disable: {
        title: 'Turn off fading?',
        body: 'Items stop fading. Anything already faded stays as it is.',
        confirm: 'Turn off fading',
    },
} as const;

interface Props {
    initialEnabled: boolean;
    /** ISO date, when fading was turned on. */
    initialSince: string | null;
}

function formatSince(iso: string): string {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function SavedFadingSetting({ initialEnabled, initialSince }: Props) {
    const [enabled, setEnabled] = useState(initialEnabled);
    const [since, setSince] = useState(initialSince);
    const [confirming, setConfirming] = useState<'enable' | 'disable' | null>(null);
    const [isPending, setIsPending] = useState(false);
    const [message, setMessage] = useState('');
    const triggerRef = useRef<HTMLButtonElement>(null);
    const dialogRef = useRef<HTMLDivElement>(null);
    const cancelRef = useRef<HTMLButtonElement>(null);
    const titleId = useId();
    const bodyId = useId();

    const close = useCallback(() => {
        setConfirming(null);
        triggerRef.current?.focus();
    }, []);

    useCloseOnNavigate(() => setConfirming(null));

    useEffect(() => {
        if (confirming) cancelRef.current?.focus();
    }, [confirming]);

    useEffect(() => {
        if (!confirming) return;
        function onKeyDown(e: KeyboardEvent) {
            if (e.key === 'Escape') {
                if (!isPending) close();
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
    }, [confirming, isPending, close]);

    async function confirm() {
        if (!confirming) return;
        const turningOn = confirming === 'enable';
        setIsPending(true);
        const result = turningOn ? await enableSavedFading() : await disableSavedFading();
        setIsPending(false);
        if (result.success) {
            setEnabled(turningOn);
            setSince(turningOn ? new Date().toISOString() : null);
            setMessage(turningOn ? 'Fading is on. Your saved items start fresh today.' : 'Fading is off.');
        } else {
            setMessage(result.message ?? 'Something went wrong. Try again.');
        }
        close();
    }

    const copy = confirming ? COPY[confirming] : null;

    return (
        <section className="flex flex-col gap-3 border-t-2 border-foreground pt-4" aria-labelledby="saved-fading-heading">
            <h2 id="saved-fading-heading" className="text-[12px] font-extrabold uppercase tracking-[0.14em]">
                Let saved items fade
            </h2>
            <div className="flex flex-wrap items-center gap-3">
                <button
                    ref={triggerRef}
                    type="button"
                    role="switch"
                    aria-checked={enabled}
                    aria-labelledby="saved-fading-heading"
                    onClick={() => setConfirming(enabled ? 'disable' : 'enable')}
                    className="inline-flex border-2 border-foreground bg-transparent p-0 text-[9.5px] font-extrabold uppercase tracking-[0.12em] text-foreground"
                >
                    <span aria-hidden="true" className={`px-3 py-1.5 ${enabled ? '' : 'bg-foreground text-background'}`}>Off</span>
                    <span aria-hidden="true" className={`px-3 py-1.5 ${enabled ? 'bg-foreground text-background' : ''}`}>On</span>
                </button>
                {enabled && since && (
                    <span className="text-[9.5px] font-bold uppercase tracking-[0.08em] text-foreground/60">
                        On since {formatSince(since)}
                    </span>
                )}
            </div>
            <p className="max-w-[60ch] font-serif text-[15px] leading-[1.5]">
                Saved items you don&apos;t come back to slowly lose their details, then their title, and after about nine
                months they disappear. Opening, searching, reading or keeping an item gives it more life.{' '}
                <Link href="/en/faq#faq-saved-fading" className="text-terracotta underline">How fading works</Link>
            </p>
            <p role="status" aria-live="polite" className="text-[11px] font-bold uppercase tracking-widest">
                {message}
            </p>

            {copy && (
                <div
                    className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto px-4 pt-24 pb-8"
                    style={{ backgroundColor: 'rgba(0,0,0,0.70)' }}
                    onClick={e => { if (e.target === e.currentTarget && !isPending) close(); }}
                >
                    <div
                        ref={dialogRef}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby={titleId}
                        aria-describedby={bodyId}
                        className="w-full max-w-[420px] border-2 border-foreground bg-background p-6"
                    >
                        <h3 id={titleId} className="mb-2.5 text-[12px] font-extrabold uppercase tracking-[0.14em]">
                            {copy.title}
                        </h3>
                        <p id={bodyId} className="mb-4 font-serif text-[15px] leading-[1.5]">{copy.body}</p>
                        <div className="flex flex-wrap justify-end gap-2">
                            <button
                                ref={cancelRef}
                                type="button"
                                onClick={close}
                                disabled={isPending}
                                className="border-2 border-foreground bg-transparent px-3 py-2 text-[9.5px] font-extrabold uppercase tracking-[0.12em] text-foreground"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={confirm}
                                disabled={isPending}
                                className="border-2 border-foreground bg-foreground px-3 py-2 text-[9.5px] font-extrabold uppercase tracking-[0.12em] text-background disabled:opacity-60"
                            >
                                {isPending ? 'Saving…' : copy.confirm}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
