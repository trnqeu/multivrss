'use client';

import { Fragment, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import EmptyStream from "./EmptyStream";

function dayBucket(pubDate: number | null): string {
    if (!pubDate) return '';
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
    }).format(new Date(pubDate)).toUpperCase();
}

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

export default function SearchBar() {
    const searchParams = useSearchParams();

    const query = searchParams.get('q') ?? '';
    const cat = searchParams.get('cat') ?? 'ALL';
    const sourceIdParam = searchParams.get('source') ?? undefined;

    const [baseFacets, setBaseFacets] = useState<{ total: number }>({ total: 0 });
    const [allHits, setAllHits] = useState<SearchHit[]>([]);
    const [totalHits, setTotalHits] = useState(0);
    const [timeMs, setTimeMs] = useState(0);
    const [offset, setOffset] = useState(0);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let cancelled = false;
        async function run() {
            setLoading(true);
            const baseParams = new URLSearchParams({ q: query, limit: '0' });
            const baseRes = await fetch(`/api/search?${baseParams}`);
            if (!cancelled && baseRes.ok) {
                const base: SearchResult = await baseRes.json();
                setBaseFacets({ total: base.estimatedTotalHits });
            }
            const resultParams = new URLSearchParams({ q: query, offset: '0' });
            if (cat !== 'ALL') resultParams.set('cat', cat);
            if (sourceIdParam) resultParams.set('source', sourceIdParam);
            const res = await fetch(`/api/search?${resultParams}`);
            if (!cancelled && res.ok) {
                const data: SearchResult = await res.json();
                setAllHits(data.hits);
                setTotalHits(data.estimatedTotalHits);
                setTimeMs(data.processingTimeMs);
                setOffset(data.hits.length);
            }
            if (!cancelled) setLoading(false);
        }
        void run();
        return () => { cancelled = true; };
    }, [query, cat, sourceIdParam]);

    async function loadMore() {
        setLoading(true);
        const resultParams = new URLSearchParams({ q: query, offset: String(offset) });
        if (cat !== 'ALL') resultParams.set('cat', cat);
        if (sourceIdParam) resultParams.set('source', sourceIdParam);
        const res = await fetch(`/api/search?${resultParams}`);
        if (res.ok) {
            const data: SearchResult = await res.json();
            setAllHits(prev => [...prev, ...data.hits]);
            setOffset(prev => prev + data.hits.length);
            setTimeMs(data.processingTimeMs);
        }
        setLoading(false);
    }

    const hits = allHits;
    const activeFilter = sourceIdParam
        ? `source="${sourceIdParam}"`
        : cat !== 'ALL'
            ? `cat="${cat}"`
            : '*';

    return (
        <div>
            {/* Telemetry */}
            <div className="px-8 py-3 border-b-2 border-foreground text-[10px] font-bold uppercase tracking-widest text-foreground/50 flex items-center gap-4 overflow-x-auto min-h-[2.5rem]">
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
            </div>

            {/* Results river */}
            <section className="p-8 md:p-12">
                {loading && allHits.length === 0 ? (
                    <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/30">
                        LOADING...
                    </p>
                ) : !loading && allHits.length === 0 ? (
                    <EmptyStream variant="no-results" contextLabel={query} />
                ) : (
                    <div className="leading-relaxed text-sm text-foreground font-medium">
                        {hits.map((item, index) => {
                            const currentDay = dayBucket(item.pubDate);
                            const prevDay    = index > 0 ? dayBucket(hits[index - 1].pubDate) : null;
                            const nextDay    = index < hits.length - 1 ? dayBucket(hits[index + 1].pubDate) : null;
                            const isNewDay   = currentDay !== prevDay;
                            const suppressSeparator = index === hits.length - 1 || currentDay !== nextDay;

                            return (
                                <Fragment key={item.id}>
                                    {isNewDay && currentDay && (
                                        <div className={`flex items-center gap-3 mb-[22px] ${index === 0 ? 'mt-4' : 'mt-8'}`}>
                                            <span className="text-[9.5px] font-extrabold tracking-[0.32em] text-terracotta shrink-0">
                                                — {currentDay}
                                            </span>
                                            <span className="flex-1 h-px bg-terracotta/35" />
                                            <span className="text-[9px] text-white/35">→</span>
                                        </div>
                                    )}
                                    <span>
                                        <a
                                            href={item.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="hover:text-terracotta transition-colors"
                                        >
                                            {item.sourceTitle && (
                                                <>
                                                    <span className="text-terracotta text-[10px] font-bold uppercase tracking-widest">
                                                        {item.sourceTitle}
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
                                        {!suppressSeparator && (
                                            <span className="text-terracotta font-bold mx-3 select-none">{'// '}</span>
                                        )}
                                    </span>
                                </Fragment>
                            );
                        })}
                    </div>
                )}
                {allHits.length > 0 && allHits.length < totalHits && (
                    <div className="mt-8 pt-6 border-t border-foreground/20">
                        <button
                            onClick={loadMore}
                            disabled={loading}
                            className="bg-background label-system text-foreground/60 hover:text-foreground disabled:opacity-30 border border-foreground/30 px-4 py-2 hover:border-foreground transition-colors"
                        >
                            {loading ? 'LOADING...' : `LOAD MORE — ${totalHits - allHits.length} REMAINING`}
                        </button>
                    </div>
                )}
            </section>
        </div>
    );
}
