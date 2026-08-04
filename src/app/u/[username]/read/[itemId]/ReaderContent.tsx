'use client';

import { useEffect, useRef, useState } from 'react';

interface ReaderContentProps {
    contentHtml: string;
    markdown: string;
    filenameBase: string;
}

type CopyStatus = 'idle' | 'copied' | 'error';

const STATUS_MESSAGE: Record<CopyStatus, string> = {
    idle: '',
    copied: 'Article text copied to clipboard.',
    error: 'Could not copy article text.',
};

const COPY_LABEL: Record<CopyStatus, string> = {
    idle: 'Copy text',
    copied: 'Copied!',
    error: 'Copy failed',
};

// Renders the sanitized article body plus a small action bar (copy text /
// download as Markdown). Client component because both actions need direct
// access to the rendered DOM / browser APIs (clipboard, Blob download).
export function ReaderContent({ contentHtml, markdown, filenameBase }: ReaderContentProps) {
    const articleRef = useRef<HTMLDivElement>(null);
    const [copyStatus, setCopyStatus] = useState<CopyStatus>('idle');

    useEffect(() => {
        if (copyStatus === 'idle') return;
        const timer = setTimeout(() => setCopyStatus('idle'), 3000);
        return () => clearTimeout(timer);
    }, [copyStatus]);

    async function handleCopy() {
        const text = articleRef.current?.innerText ?? '';
        try {
            await navigator.clipboard.writeText(text);
            setCopyStatus('copied');
        } catch {
            setCopyStatus('error');
        }
    }

    function handleDownload() {
        const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filenameBase}.md`;
        link.click();
        URL.revokeObjectURL(url);
    }

    return (
        <>
            <div className="flex flex-wrap gap-2 mb-8">
                <button
                    type="button"
                    onClick={handleCopy}
                    aria-label="Copy article text to clipboard"
                    className="px-4 py-2 border border-foreground font-mono text-[10px] font-bold uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors cursor-pointer"
                >
                    {COPY_LABEL[copyStatus]}
                </button>
                <button
                    type="button"
                    onClick={handleDownload}
                    aria-label="Download article as Markdown file"
                    className="px-4 py-2 border border-foreground font-mono text-[10px] font-bold uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors cursor-pointer"
                >
                    Download .md
                </button>
                <p role="status" aria-live="polite" className="sr-only">
                    {STATUS_MESSAGE[copyStatus]}
                </p>
            </div>
            <div ref={articleRef} className="reader-prose" dangerouslySetInnerHTML={{ __html: contentHtml }} />
        </>
    );
}
