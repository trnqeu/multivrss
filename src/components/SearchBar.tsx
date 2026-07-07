'use client';

import { Fragment, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { dayBucket } from '@/lib/utils';
import { getCategories, markAsRead, markAsUnread, saveFeedItem, unsaveFeedItem } from '@/app/actions';
import { HIGHLIGHT_PRE, HIGHLIGHT_POST, type SearchHit, type SearchResult } from '@/lib/meili';
import { Bookmark } from '@/components/icons/Bookmark';
import AssignTagsModal from '@/components/AssignTagsModal';
import EmptyStream from "./EmptyStream";
import MobileCategorySheet from './MobileCategorySheet';
import TelemetryDropdown from './TelemetryDropdown';

const READ_OPTS = ['ALL', 'UNREAD', 'READ'] as const;
type ReadOpt = typeof READ_OPTS[number];

type TagVM = { id: string; name: string };

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

export default function SearchBar({ allTags = [] }: { allTags?: TagVM[] }) {
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
    const router = useRouter();
    const [categories, setCategories] = useState<{ name: string }[]>([]);
    const [tagModalItem, setTagModalItem] = useState<string | null>(null);
    const [itemTags, setItemTags] = useState<Map<string, TagVM[]>>(new Map());


    useEffect(() => {
        void getCategories().then(result => setCategories(result.map(c => ({ name: c.name }))));
    }, []);

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

    function setCategory(next: string | null) {
        const params = new URLSearchParams(searchParams.toString());
        if (!next || next === 'ALL') params.delete('cat');
        else {
            params.set('cat', next);
            params.delete('source');
        }
        router.push(`?${params.toString()}`);
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

    const readOptValue: ReadOpt = readFilter ? (readFilter.toUpperCase() as ReadOpt) : 'ALL';
    const catOptions = ['ALL', ...categories.map(c => c.name)];

    return (
        <div>
            {/* Telemetry */}
            <div className="flex items-stretch border-b-2 border-foreground min-h-[2.5rem]">
                <MobileCategorySheet />
                <div className="flex-1 min-w-0 px-[18px] py-[9px] font-mono text-[9.5px] font-bold uppercase tracking-[.13em] text-foreground/45 flex items-center gap-[5px] flex-wrap">
                    <span className="whitespace-nowrap">
                        INDEX <b className="text-foreground font-extrabold">{hits.length} / {baseFacets.total}</b>
                    </span>
                    <span aria-hidden="true" className="text-foreground/25 mx-1">·</span>
                    <span className="whitespace-nowrap">
                        TIME <b className="text-foreground font-extrabold">{timeMs} MS</b>
                    </span>
                    <span aria-hidden="true" className="text-foreground/25 mx-1">·</span>

                    <TelemetryDropdown<ReadOpt>
                        label="FILTER"
                        value={readOptValue}
                        options={READ_OPTS}
                        onChange={(next) => setReadFilter(next === 'ALL' ? undefined : next.toLowerCase())}
                    />

                    <span aria-hidden="true" className="hidden md:inline text-foreground/25 mx-1">·</span>

                    <span className="hidden md:inline-flex">
                        <TelemetryDropdown
                            label="CATEGORY"
                            value={cat}
                            options={catOptions}
                            onChange={(next) => setCategory(next === 'ALL' ? null : next)}
                        />
                    </span>

                    {sourceIdParam && (
                        <>
                            <span aria-hidden="true" className="text-foreground/25 mx-1">·</span>
                            SOURCE <b className="text-foreground font-extrabold">ACTIVE</b>
                            <button
                                onClick={() => {
                                    const params = new URLSearchParams(searchParams.toString());
                                    params.delete('source');
                                    router.push(`?${params.toString()}`);
                                }}
                                aria-label="Clear source filter"
                                className="ml-1.5 bg-transparent border-0 p-0 text-terracotta text-[11px] leading-none cursor-pointer"
                            >{'✕'}</button>
                        </>
                    )}
                    {query && (
                        <>
                            <span aria-hidden="true" className="text-foreground/25 mx-1">·</span>
                            Q <b className="text-foreground font-extrabold">&ldquo;{query}&rdquo;</b>
                        </>
                    )}
                </div>
            </div>

            {/* Results river — Ledger */}
            <section className="px-2 md:px-5 py-1.5 pb-[90px]">
                {loading && allHits.length === 0 ? (
                    <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/30 px-3 py-6">
                        LOADING...
                    </p>
                ) : !loading && allHits.length === 0 ? (
                    <EmptyStream variant="no-results" contextLabel={query} />
                ) : (
                    <div role="list">
                        {hits.map((item, index) => {
                            const currentDay = dayBucket(item.pubDate);
                            const prevDay    = index > 0 ? dayBucket(hits[index - 1].pubDate) : null;
                            const isNewDay   = currentDay !== prevDay;
                            const dateLabel = item.pubDate
                                ? new Date(item.pubDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                                : '—';

                            return (
                                <Fragment key={item.id}>
                                    {isNewDay && currentDay && (
                                        <div className={`flex items-center gap-3 ${index === 0 ? 'mt-2' : 'mt-4'} mb-2`}>
                                            <span className="font-mono text-[9px] font-extrabold tracking-[.28em] text-terracotta whitespace-nowrap">
                                                — {currentDay}
                                            </span>
                                            <span aria-hidden="true" className="flex-1 h-px bg-terracotta/30" />
                                        </div>
                                    )}
                                    <div
                                        role="listitem"
                                        className={`group grid grid-cols-[16px_1fr_auto] md:grid-cols-[16px_150px_42px_1fr_auto] items-baseline gap-x-3 py-1.5 px-1.5 -mx-1.5 border-t border-foreground/[0.07] hover:bg-[var(--tc-soft)] transition-colors ${item.read ? 'opacity-[.42]' : ''}`}
                                    >
                                        <button
                                            onClick={() => toggleRead(item)}
                                            className={`self-center leading-none text-[11px] bg-transparent border-0 p-0 cursor-pointer transition-colors ${item.read ? 'text-foreground/35' : 'text-terracotta'}`}
                                            title={item.read ? 'Mark as unread' : 'Mark as read'}
                                        >
                                            {item.read ? '\u25CF' : '\u25CB'}
                                        </button>

                                        <span className="hidden md:block font-mono text-[9px] font-extrabold uppercase tracking-[.1em] text-terracotta whitespace-nowrap overflow-hidden text-ellipsis">
                                            {item.sourceTitle}
                                        </span>

                                        <span className="hidden md:block font-mono text-[9.5px] text-foreground/35 whitespace-nowrap">
                                            {dateLabel}
                                        </span>

                                        <span className="min-w-0 overflow-hidden whitespace-nowrap text-ellipsis">
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
                                                className="font-serif font-semibold text-[15px] tracking-[-.005em] text-foreground group-hover:text-terracotta transition-colors no-underline"
                                            >
                                                <Highlight text={item._formatted?.title ?? item.title} />
                                            </a>
                                            {(item._formatted?.content ?? item.content) && (
                                                <span className="font-serif text-[14px] text-foreground/45 font-normal">
                                                    {' — '}
                                                    <Highlight
                                                        text={item._formatted?.content ?? item.content ?? ''}
                                                        markClass="underline decoration-terracotta"
                                                    />
                                                </span>
                                            )}
                                            <span className="md:hidden ml-2 font-mono text-[9px] text-foreground/35 whitespace-nowrap">
                                                {item.sourceTitle} · {dateLabel}
                                            </span>
                                        </span>

                                        <span className="inline-flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {(itemTags.get(item.id) ?? []).length > 0 && (
                                                <span className="inline-flex gap-1">
                                                    {(itemTags.get(item.id) ?? []).map(tag => (
                                                        <span key={tag.id} className="font-mono text-[9px] uppercase border border-current text-terracotta px-1 py-0.5 leading-none">
                                                            #{tag.name}
                                                        </span>
                                                    ))}
                                                </span>
                                            )}
                                            <button
                                                onClick={() => toggleSave(item)}
                                                title={item.savedAt ? 'Remove from saved' : 'Save'}
                                                className="bg-transparent border-0 px-0 py-0 cursor-pointer"
                                            >
                                                <Bookmark
                                                    filled={!!item.savedAt}
                                                    className={item.savedAt ? 'text-terracotta' : 'text-foreground/40 hover:text-terracotta'}
                                                />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setTagModalItem(item.id)}
                                                className="bg-transparent border-0 font-mono text-[8.5px] font-extrabold uppercase tracking-[.12em] text-foreground/40 hover:text-terracotta px-0 py-0 cursor-pointer leading-none transition-colors whitespace-nowrap"
                                            >
                                                TAG
                                            </button>
                                        </span>
                                    </div>
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
            {tagModalItem && (
                <AssignTagsModal
                    open
                    onClose={() => setTagModalItem(null)}
                    itemId={tagModalItem}
                    initialTags={itemTags.get(tagModalItem) ?? []}
                    allTags={allTags}
                    onTagsApplied={(_id, newTags) => {
                        setItemTags(prev => new Map(prev).set(tagModalItem, newTags));
                    }}
                />
            )}
        </div>
    );
}
