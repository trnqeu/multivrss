'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useCloseOnNavigate } from '@/components/useCloseOnNavigate';

interface Props {
    username: string;
}

// "Fading is on" badge next to the saved-page heading, for as long as fading
// is enabled. A toggletip rather than a hover tooltip: the explanation holds
// links (settings, FAQ), so it must open on click/tap and stay reachable by keyboard.
export default function FadingStatus({ username }: Props) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLSpanElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    useCloseOnNavigate(() => setOpen(false));

    useEffect(() => {
        if (!open) return;
        function onMouseDown(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        }
        function onKeyDown(e: KeyboardEvent) {
            if (e.key !== 'Escape') return;
            setOpen(false);
            buttonRef.current?.focus();
        }
        document.addEventListener('mousedown', onMouseDown);
        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener('mousedown', onMouseDown);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [open]);

    return (
        <span ref={ref} className="relative inline-flex">
            <button
                ref={buttonRef}
                type="button"
                onClick={() => setOpen(o => !o)}
                aria-expanded={open}
                aria-controls={open ? 'fading-status-info' : undefined}
                className="inline-flex items-center gap-1.5 border border-dashed border-foreground bg-transparent px-2 py-1 text-[9.5px] font-bold uppercase tracking-[0.08em] text-foreground transition-colors hover:border-terracotta hover:text-terracotta"
            >
                Fading is on
                <span aria-hidden="true" className="text-[9px]">?</span>
            </button>
            {open && (
                <div
                    id="fading-status-info"
                    className="absolute left-0 top-full z-20 mt-1.5 w-[min(320px,calc(100vw-4rem))] border-2 border-foreground bg-background p-4"
                >
                    <p className="mb-2 font-serif text-[14px] leading-[1.5] text-foreground">
                        Items you don&apos;t come back to slowly lose their description, then their title, and after
                        about nine months they disappear. Opening, searching, reading or keeping an item gives it more life.
                    </p>
                    <p className="font-serif text-[14px] leading-[1.5] text-foreground">
                        To turn it off, go to{' '}
                        <Link href={`/u/${username}/settings/account`} className="text-terracotta underline">
                            Settings → Account
                        </Link>
                        . What has already faded stays faded.{' '}
                        <Link href="/en/faq#faq-saved-fading" className="text-terracotta underline">How fading works</Link>
                    </p>
                </div>
            )}
        </span>
    );
}
