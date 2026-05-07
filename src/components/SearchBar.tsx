'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const HL_PRE = '<<HL>>';
const HL_POST = '<</HL>>';

type SearchHit = {
    id: string;
    link: string;
    title: string;
    pubDate: number | null;
    content?: string;
    sourceTitle?: string;
    categoryName?: string;
    _formatted?: { title?: string; content?: string };
};

type SearchResult = {
    hits: SearchHit[];
    estimatedTotalHits: number;
    processingTimeMs: number;
    facetDistribution: Record<string, Record<string, number>> | null;
};

function Highlight({ text, markClass = 'bg-terracotta text-background' }: { text: string; markClass?: string }) {
    if (!text.includes(HL_PRE)) return <>{text}</>;
    const parts = text.split(HL_PRE);
    return (
        <>
            {parts[0]}
            {parts.slice(1).map((part, i) => {
                const sep = part.indexOf(HL_POST);
                if (sep === -1) return <span key={i}>{part}</span>;
                return (
                    <span key={i}>
                        <mark className={`${markClass} px-0.5 not-italic`}>{part.slice(0, sep)}</mark>
                        {part.slice(sep + HL_POST.length)}
                    </span>
                );
            })}
        </>
    );
}

function loadRecentSearches(): string[] {
    if (typeof window === 'undefined') return [];
    try {
        const stored = localStorage.getItem('multivrss_recent_searches');
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
}

export default function SearchBar() {
    const [query, setQuery] = useState('');
    const [cat, setCat] = useState('ALL');
    const [focused, setFocused] = useState(false);
    const [recent, setRecent] = useState<string[]>(loadRecentSearches);
    const [baseFacets, setBaseFacets] = useState<{ total: number; cats: Record<string, number> }>({ total: 0, cats: {} });
    const [response, setResponse] = useState<SearchResult | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        function onKeyDown(e: KeyboardEvent) {
            if (e.key === '/' && document.activeElement !== inputRef.current) {
                e.preventDefault();
                inputRef.current?.focus();
            }
            if (e.key === 'Escape' && document.activeElement === inputRef.current) {
                setQuery('');
                setCat('ALL');
                inputRef.current?.blur();
            }
        }
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, []);

    const doFetch = useCallback(async (q: string, category: string) => {
        const baseParams = new URLSearchParams({ q, limit: '0' });
        const baseRes = await fetch(`/api/search?${baseParams}`);
        if (baseRes.ok) {
            const base: SearchResult = await baseRes.json();
            setBaseFacets({
                total: base.estimatedTotalHits,
                cats: base.facetDistribution?.categoryName ?? {},
            });
        }

        const resultParams = new URLSearchParams({ q });
        if (category !== 'ALL') resultParams.set('cat', category);
        const res = await fetch(`/api/search?${resultParams}`);
        if (res.ok) setResponse(await res.json());
    }, []);

    useEffect(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => doFetch(query, cat), 120);
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, [query, cat, doFetch]);

    function handleBlur() {
        setFocused(false);
        if (!query.trim()) return;
        setRecent(prev => {
            const updated = [query.trim(), ...prev.filter(r => r !== query.trim())].slice(0, 5);
            try { localStorage.setItem('multivrss_recent_searches', JSON.stringify(updated)); } catch { /* ignore */ }
            return updated;
        });
    }

    const showRecent = focused && !query && recent.length > 0;
    const hits = response?.hits ?? [];
    const timeMs = response?.processingTimeMs ?? 0;
    const activeFilter = cat !== 'ALL' ? `cat="${cat}"` : '*';
    const categories = Object.entries(baseFacets.cats).sort((a, b) => b[1] - a[1]);

    return (
        <div>
            <section className="border-b-2 border-foreground">

                {/* Row 1: Category filter pills */}
                <div className="flex items-center gap-3 px-8 py-4 border-b-2 border-foreground overflow-x-auto">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-foreground/50 shrink-0 select-none">
                        {'FILTER_BY //'}
                    </span>
                    <button
                        onClick={() => setCat('ALL')}
                        className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 border-2 shrink-0 transition-colors ${
                            cat === 'ALL'
                                ? 'bg-terracotta text-background border-terracotta'
                                : 'border-foreground text-foreground hover:border-terracotta hover:text-terracotta'
                        }`}
                    >
                        {`ALL ${String(baseFacets.total).padStart(2, '0')}`}
                    </button>
                    {categories.map(([name, count]) => (
                        <button
                            key={name}
                            onClick={() => setCat(prev => prev === name ? 'ALL' : name)}
                            className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 border-2 shrink-0 transition-colors ${
                                cat === name
                                    ? 'bg-terracotta text-background border-terracotta'
                                    : 'border-foreground text-foreground hover:border-terracotta hover:text-terracotta'
                            }`}
                        >
                            {`${name} ${String(count).padStart(2, '0')}`}
                        </button>
                    ))}
                </div>

                {/* Row 2: Input */}
                <div className="flex items-stretch border-b-2 border-foreground">
                    <span className="px-8 py-4 text-sm font-bold uppercase tracking-widest border-r-2 border-foreground text-foreground/50 flex items-center select-none">
                        Q →
                    </span>
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onFocus={() => setFocused(true)}
                        onBlur={handleBlur}
                        placeholder="TYPE TO FILTER IN REAL TIME"
                        className="flex-1 bg-background text-foreground px-8 py-4 text-sm font-bold uppercase tracking-widest placeholder:text-foreground/30 outline-none"
                    />
                    <div className="flex items-stretch border-l-2 border-foreground">
                        {query && (
                            <button
                                onMouseDown={e => { e.preventDefault(); setQuery(''); setCat('ALL'); }}
                                className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest hover:text-terracotta transition-colors border-r-2 border-foreground"
                            >
                                CLEAR
                            </button>
                        )}
                        <kbd className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-foreground/40 flex items-center select-none">
                            /
                        </kbd>
                    </div>
                </div>

                {/* Row 3: Telemetry or recent searches */}
                <div className="px-8 py-3 text-[10px] font-bold uppercase tracking-widest text-foreground/50 flex items-center gap-4 overflow-x-auto min-h-[2.5rem]">
                    {showRecent ? (
                        <>
                            <span className="shrink-0">{'RECENT //'}</span>
                            {recent.map(r => (
                                <button
                                    key={r}
                                    onMouseDown={e => { e.preventDefault(); setQuery(r); }}
                                    className="px-2 py-0.5 border border-terracotta text-terracotta hover:bg-terracotta hover:text-background transition-colors shrink-0"
                                >
                                    {r}
                                </button>
                            ))}
                        </>
                    ) : (
                        <span className="whitespace-nowrap">
                            {'INDEX: '}
                            <span className="text-foreground">{`${hits.length} / ${baseFacets.total} ITEMS`}</span>
                            <span className="mx-3">{'·'}</span>
                            {'TIME: '}
                            <span className="text-foreground">{`${timeMs} MS`}</span>
                            <span className="mx-3">{'·'}</span>
                            {'FILTER: '}
                            <span className="text-foreground">{activeFilter}</span>
                            {query && (
                                <>
                                    <span className="mx-3">{'·'}</span>
                                    {'Q: '}
                                    <span className="text-foreground">{`"${query}"`}</span>
                                </>
                            )}
                        </span>
                    )}
                </div>
            </section>

            {/* Results river */}
            <section className="p-8 md:p-12">
                {response === null ? (
                    <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/30">
                        LOADING...
                    </p>
                ) : hits.length === 0 ? (
                    <p className="text-[10px] font-bold uppercase tracking-widest italic text-foreground/50">
                        NULL_SET // NO_RESULTS
                    </p>
                ) : (
                    <p className="leading-relaxed text-sm text-foreground font-medium">
                        {hits.map((item, index) => (
                            <span key={item.id}>
                                <a
                                    href={item.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:text-terracotta transition-colors"
                                >
                                    {item.categoryName && (
                                        <>
                                            <span className="text-terracotta text-[10px] font-bold uppercase tracking-widest">
                                                {item.categoryName}
                                            </span>
                                            <span className="text-foreground/40 mx-2">{'·'}</span>
                                        </>
                                    )}
                                    <span className="text-foreground/50 text-xs">
                                        {item.pubDate
                                            ? new Date(item.pubDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                                            : '---'}
                                    </span>
                                    <span className="text-foreground/40 mx-2">{'·'}</span>
                                    <Highlight text={item._formatted?.title ?? item.title} />
                                    {(item._formatted?.content ?? item.content) && (
                                        <>
                                            <span className="text-foreground/40 mx-2">{'—'}</span>
                                            <span className="text-foreground/50 text-xs font-normal">
                                                <Highlight
                                                    text={item._formatted?.content ?? item.content ?? ''}
                                                    markClass="underline decoration-terracotta"
                                                />
                                            </span>
                                        </>
                                    )}
                                </a>
                                {index < hits.length - 1 && (
                                    <span className="text-terracotta font-bold mx-3 select-none">{'// '}</span>
                                )}
                            </span>
                        ))}
                    </p>
                )}
            </section>
        </div>
    );
}
