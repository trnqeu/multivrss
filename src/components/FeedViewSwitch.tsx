'use client';

import { useRouter, useSearchParams } from 'next/navigation';

type Props = {
    view: 'front' | 'river';
};

export default function FeedViewSwitch({ view }: Props) {
    const router = useRouter();
    const searchParams = useSearchParams();

    function switchTo(next: 'front' | 'river') {
        const params = new URLSearchParams(searchParams.toString());
        params.set('view', next);
        router.replace('?' + params.toString(), { scroll: false });
    }

    return (
        <div
            role="tablist"
            aria-label="Feed view"
            className="flex items-center border-[1.5px] border-foreground shrink-0"
        >
            <button
                role="tab"
                aria-selected={view === 'front'}
                onClick={() => switchTo('front')}
                className={`px-3 py-[7px] font-mono text-[9.5px] font-extrabold uppercase tracking-[.12em] border-r-[1.5px] border-foreground transition-colors ${
                    view === 'front'
                        ? 'bg-foreground text-background'
                        : 'bg-background text-foreground/35 hover:text-foreground'
                }`}
            >
                ▤ Front Page
            </button>
            <button
                role="tab"
                aria-selected={view === 'river'}
                onClick={() => switchTo('river')}
                className={`px-3 py-[7px] font-mono text-[9.5px] font-extrabold uppercase tracking-[.12em] transition-colors ${
                    view === 'river'
                        ? 'bg-foreground text-background'
                        : 'bg-background text-foreground/35 hover:text-foreground'
                }`}
            >
                ≡ River
            </button>
        </div>
    );
}
