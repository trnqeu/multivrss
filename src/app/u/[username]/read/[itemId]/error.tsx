'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function ReadError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    useEffect(() => {
        Sentry.captureException(error);
    }, [error]);

    return (
        <div role="alert" className="flex-1 flex flex-col items-center justify-center gap-4 min-h-[50vh] bg-background">
            <p className="font-mono text-[11px] uppercase tracking-widest text-terracotta">
                Something went wrong loading this article.
            </p>
            <button
                onClick={reset}
                className="px-4 py-2 border border-foreground font-mono text-[10px] font-bold uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors"
            >
                Try again
            </button>
        </div>
    );
}
