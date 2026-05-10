'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

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

    const [baseFacets, setBaseFacets] = useState<{ total: number }>({ total: 0 });
    const [response, setResponse] = useState<SearchResult | null>(null);

    useEffect(() => {
        let cancelled = false;
        async function run() {
            const baseParams = new URLSearchParams({ q: query, limit: '0' });
            const baseRes = await fetch(`/api/search?${baseParams}`);
            if (!cancelled && baseRes.ok) {
                const base: SearchResult = await baseRes.json();
                setBaseFacets({ total: base.estimatedTotalHits });
            }
            const resultParams = new URLSearchParams({ q: query });
            if (cat !== 'ALL') resultParams.set('cat', cat);
            const res = await fetch(`/api/search?${resultParams}`);
            if (!cancelled && res.ok) setResponse(await res.json());
        }
        void run();
        return () => { cancelled = true; };
    }, [query, cat]);

    const hits = response?.hits ?? [];
    const timeMs = response?.processingTimeMs ?? 0;
    const activeFilter = cat !== 'ALL' ? `cat="${cat}"` : '*';

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
