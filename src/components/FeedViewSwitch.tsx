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
            className="flex items-center border-b-2 border-foreground shrink-0 bg-background"
        >
            <button
                role="tab"
                aria-selected={view === 'front'}
                onClick={() => switchTo('front')}
                className={`px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest border-r border-foreground/20 transition-colors ${
                    view === 'front'
                        ? 'bg-foreground text-background'
                        : 'bg-background text-foreground/50 hover:text-foreground hover:bg-foreground/5'
                }`}
            >
                ▤ Front Page
            </button>
            <button
                role="tab"
                aria-selected={view === 'river'}
                onClick={() => switchTo('river')}
                className={`px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-colors ${
                    view === 'river'
                        ? 'bg-foreground text-background'
                        : 'bg-background text-foreground/50 hover:text-foreground hover:bg-foreground/5'
                }`}
            >
                ≡ River
            </button>
            {view === 'river' && (
                <span className="ml-auto mr-5 text-[9px] font-bold uppercase tracking-widest text-terracotta hidden md:block">
                    Curated for you →
                </span>
            )}
        </div>
    );
}
