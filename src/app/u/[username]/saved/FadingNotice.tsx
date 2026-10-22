'use client';

import { useState } from 'react';
import Link from 'next/link';
import { dismissSavedFadingNotice } from '@/app/actions/fading';

interface Props {
    username: string;
    /** Where focus goes once the notice is gone (it removes its own button). */
    onDismissed: () => void;
}

// One-time notice for people whose account started with fading on
// (SAVED_FADING=default): they never went through the settings confirmation.
// Dismissal is stored on the account, so it doesn't come back on another device.
export default function FadingNotice({ username, onDismissed }: Props) {
    const [open, setOpen] = useState(true);
    if (!open) return null;

    function dismiss() {
        setOpen(false);
        onDismissed();
        void dismissSavedFadingNotice();
    }

    return (
        <section aria-labelledby="fading-notice-heading" className="border-b border-dashed border-foreground/45 px-8 py-5 md:px-12">
            <h2 id="fading-notice-heading" className="mb-1.5 text-[12px] font-extrabold uppercase tracking-[0.14em]">
                Your saved items fade
            </h2>
            <p className="mb-3 max-w-[64ch] font-serif text-[15px] leading-[1.5]">
                Items you don&apos;t come back to slowly lose their details, then their title, and after about nine months
                they disappear. Opening, searching, reading or keeping an item gives it more life. You can turn this off in{' '}
                <Link href={`/u/${username}/settings/account`} className="text-terracotta underline">settings</Link>.{' '}
                <Link href="/en/faq#faq-saved-fading" className="text-terracotta underline">How fading works</Link>
            </p>
            <button
                type="button"
                onClick={dismiss}
                className="border border-foreground bg-transparent px-2.5 py-[6px] text-[9.5px] font-bold uppercase leading-none tracking-[0.1em] text-foreground transition-colors hover:bg-foreground hover:text-background"
            >
                Got it
            </button>
        </section>
    );
}
