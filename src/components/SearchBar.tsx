'use client';

import { Fragment, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { dayBucket } from '@/lib/utils';
import { markAsRead, markAsUnread, saveFeedItem, unsaveFeedItem } from '@/app/actions';
import { HIGHLIGHT_PRE, HIGHLIGHT_POST, type SearchHit, type SearchResult } from '@/lib/meili';
import { Bookmark } from '@/components/icons/Bookmark';
import EmptyStream from "./EmptyStream";

function Highlight({ text, markClass = 'bg-terracotta text-background' }: { text: string; markClass?: string }) {
    if (!text.includes(HIGHLIGHT_PRE)) return <>{text}</>;
    const parts = text.split(HIGHLIGHT_PRE);
    return (
        <>
            {parts[0]}
            {parts.slice(1).map((part, i) => {
                const sep = part.indexOf(HIGHLIGHT_POST);
                if (sep === -1) return <span key={i}>{part}</span>;
                return (
                    <span key={i}>
                        <mark className={`${markClass} px-0.5 not-italic`}>{part.slice(0, sep)}</mark>
                        {part.slice(sep + HIGHLIGHT_POST.length)}
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
    const [loading, setLoading] = useState(true);
    const [readFilter, setReadFilter] = useState<string | undefined>(undefined);

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
            if (readFilter) resultParams.set('read', readFilter);
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
    }, [query, cat, sourceIdParam, readFilter]);

    async function loadMore() {
        setLoading(true);
        const resultParams = new URLSearchParams({ q: query, offset: String(offset) });
        if (cat !== 'ALL') resultParams.set('cat', cat);
        if (sourceIdParam) resultParams.set('source', sourceIdParam);
        if (readFilter) resultParams.set('read', readFilter);
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

    async function toggleRead(item: SearchHit) {
        const wasRead = item.read ?? false;
        setAllHits(prev => prev.map(h => h.id === item.id ? { ...h, read: !wasRead } : h));
        if (wasRead) {
            await markAsUnread(item.id);
        } else {
            await markAsRead(item.id);
        }
    }

    async function toggleSave(item: SearchHit) {
        const wasSaved = !!item.savedAt;
        setAllHits(prev => prev.map(h => h.id === item.id ? { ...h, savedAt: wasSaved ? null : Date.now() } : h));
        if (wasSaved) {
            await unsaveFeedItem(item.id);
        } else {
            await saveFeedItem(item.id);
        }
    }

    const activeFilter = sourceIdParam
        ? `source="${sourceIdParam}"`
        : cat !== 'ALL'
            ? `cat="${cat}"`
            : readFilter
                ? readFilter === 'unread' ? 'UNREAD' : 'READ'
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
                    {sourceIdParam || cat !== 'ALL' ? (
                        <span className="text-foreground">{activeFilter}</span>
                    ) : (
                        <span className="inline whitespace-nowrap">
                            {(['ALL', 'UNREAD', 'READ'] as const).map((f, i) => {
                                const isActive = f === 'ALL' ? !readFilter : readFilter === f.toLowerCase();
                                return (
                                    <span key={f}>
                                        {i > 0 && <span className="mx-1 text-foreground/30">{'·'}</span>}
                                        <button
                                            onClick={() => setReadFilter(f === 'ALL' ? undefined : f.toLowerCase())}
                                            className={`bg-transparent border-0 px-0 py-0 transition-colors cursor-pointer inline text-[10px] font-bold uppercase tracking-widest ${
                                                isActive
                                                    ? 'text-foreground underline underline-offset-4 decoration-terracotta'
                                                    : 'text-foreground/30 hover:text-foreground/60'
                                            }`}
                                        >
                                            {f}
                                        </button>
                                    </span>
                                );
                            })}
                        </span>
                    )}
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
                    <div className="leading-[1.8] text-sm text-foreground font-medium">
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
                                    <span className={`group/item transition-opacity ${item.read ? 'opacity-30' : 'opacity-100'}`}>
                                        <button
                                            onClick={() => toggleRead(item)}
                                            className="bg-transparent border-0 px-0 py-0 text-terracotta cursor-pointer select-none align-middle leading-[0] hover:opacity-80 transition-opacity text-[15px] mr-0.5"
                                            title={item.read ? 'Mark as unread' : 'Mark as read'}
                                        >
                                            {item.read ? '\u25CF' : '\u25CB'}
                                        </button>
                                        <a
                                            href={item.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={() => {
                                                if (!(item.read ?? false)) {
                                                    setAllHits(prev => prev.map(h => h.id === item.id ? { ...h, read: true } : h));
                                                    markAsRead(item.id);
                                                }
                                            }}
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
                                                    <span className="text-foreground/50 text-sm font-normal">
                                                        <Highlight
                                                            text={item._formatted?.content ?? item.content ?? ''}
                                                            markClass="underline decoration-terracotta"
                                                        />
                                                    </span>
                                                </>
                                            )}
                                        </a>
                                        <button
                                            onClick={() => toggleSave(item)}
                                            title={item.savedAt ? 'Remove from saved' : 'Save'}
                                            className={`group/save bg-transparent border-0 px-0 py-0 cursor-pointer align-baseline ml-2 transition-opacity opacity-100`}
                                        >
                                            <Bookmark
                                                filled={!!item.savedAt}
                                                className={item.savedAt ? 'text-terracotta' : 'text-foreground/40 hover:text-terracotta'}
                                            />
                                        </button>
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
