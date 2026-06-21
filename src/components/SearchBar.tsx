'use client';

import { Fragment, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { dayBucket } from '@/lib/utils';
import { getCategories, markAsRead, markAsUnread, saveFeedItem, unsaveFeedItem } from '@/app/actions';
import { HIGHLIGHT_PRE, HIGHLIGHT_POST, type SearchHit, type SearchResult } from '@/lib/meili';
import { Bookmark } from '@/components/icons/Bookmark';
import AssignTagsModal from '@/components/AssignTagsModal';
import EmptyStream from "./EmptyStream";
import MobileCategorySheet from './MobileCategorySheet';

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
    const [catOpen, setCatOpen] = useState(false);
    const [catDropdownPos, setCatDropdownPos] = useState({ top: 0, right: 0 });
    const catButtonRef = useRef<HTMLButtonElement>(null);
    const catDropdownRef = useRef<HTMLDivElement>(null);
    const [tagModalItem, setTagModalItem] = useState<string | null>(null);
    const [itemTags, setItemTags] = useState<Map<string, TagVM[]>>(new Map());


    useEffect(() => {
        void getCategories().then(result => setCategories(result.map(c => ({ name: c.name }))));
    }, []);

    useEffect(() => {
        if (!catOpen) return;
        function onMouseDown(e: MouseEvent) {
            if (
                catButtonRef.current?.contains(e.target as Node) ||
                catDropdownRef.current?.contains(e.target as Node)
            ) return;
            setCatOpen(false);
        }
        function onKeyDown(e: KeyboardEvent) {
            if (e.key === 'Escape') {
                setCatOpen(false);
                catButtonRef.current?.focus();
            }
        }
        document.addEventListener('mousedown', onMouseDown);
        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener('mousedown', onMouseDown);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [catOpen]);

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
        setCatOpen(false);
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

    return (
        <div>
            {/* Telemetry */}
            <div className="flex items-stretch border-b-2 border-foreground min-h-[2.5rem]">
                <MobileCategorySheet />
                <div className="flex-1 min-w-0 px-8 py-3 text-[10px] font-bold uppercase tracking-widest text-foreground/50 flex items-center gap-4 overflow-x-auto">
                <span className="whitespace-nowrap">
                    {'INDEX: '}
                    <span className="text-foreground">{`${hits.length} / ${baseFacets.total} ITEMS`}</span>
                    <span className="mx-3">{'·'}</span>
                    {'TIME: '}
                    <span className="text-foreground">{`${timeMs} MS`}</span>
                    <span className="mx-3">{'·'}</span>
                    {'FILTER: '}
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
                                    >{f}</button>
                                </span>
                            );
                        })}
                    </span>

                    <span className="hidden md:inline mx-3">{'·'}</span>

                    <span className="hidden md:inline-flex items-center">
                    {'CAT: '}
                        <button
                            ref={catButtonRef}
                            onClick={() => {
                                if (!catOpen && catButtonRef.current) {
                                    const rect = catButtonRef.current.getBoundingClientRect();
                                    setCatDropdownPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
                                }
                                setCatOpen(o => !o);
                            }}
                            aria-haspopup="listbox"
                            aria-expanded={catOpen}
                            className={`inline-flex items-center gap-1 bg-transparent border-0 px-0 py-0 cursor-pointer text-[10px] font-bold uppercase tracking-widest ${
                                cat !== 'ALL'
                                    ? 'text-foreground underline underline-offset-4 decoration-terracotta'
                                    : 'text-foreground/30 hover:text-foreground/60'
                            }`}
                        >
                            {cat}
                            <span className="text-[8px] text-foreground/45">{'▾'}</span>
                        </button>
                        {cat !== 'ALL' && (
                            <button
                                onClick={() => setCategory(null)}
                                aria-label="Clear category filter"
                                className="ml-2 bg-transparent border-0 p-0 text-terracotta text-[11px] leading-none cursor-pointer"
                            >{'✕'}</button>
                        )}
                        {catOpen && (
                            <div
                                ref={catDropdownRef}
                                role="listbox"
                                style={{ top: catDropdownPos.top, right: catDropdownPos.right }}
                                className="fixed z-50 w-[200px] bg-background border-2 border-foreground"
                            >
                                <button
                                    onClick={() => setCategory(null)}
                                    className={`flex w-full items-center justify-between px-3 py-2 border-b border-foreground/10 text-left ${cat === 'ALL' ? 'bg-terracotta text-background' : 'hover:bg-foreground/[0.04]'}`}
                                >
                                    <span className="text-[10px] font-bold uppercase tracking-widest">ALL</span>
                                </button>
                                {categories.map(c => (
                                    <button
                                        key={c.name}
                                        onClick={() => setCategory(c.name)}
                                        className={`flex w-full items-center justify-between px-3 py-2 border-b border-foreground/10 last:border-b-0 text-left ${cat === c.name ? 'bg-terracotta text-background' : 'hover:bg-foreground/[0.04]'}`}
                                    >
                                        <span className="text-[10px] font-bold uppercase tracking-widest">{c.name}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </span>

                    {sourceIdParam && (
                        <>
                            <span className="mx-3">{'·'}</span>
                            {'SOURCE: '}
                            <span className="text-foreground underline underline-offset-4 decoration-terracotta">ACTIVE</span>
                            <button
                                onClick={() => {
                                    const params = new URLSearchParams(searchParams.toString());
                                    params.delete('source');
                                    router.push(`?${params.toString()}`);
                                }}
                                aria-label="Clear source filter"
                                className="ml-2 bg-transparent border-0 p-0 text-terracotta text-[11px] leading-none cursor-pointer"
                            >{'✕'}</button>
                        </>
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
                    <div role="list" className="leading-[1.8] text-sm text-foreground font-medium">
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
                                    <span role="listitem" className={`group/item transition-opacity ${item.read ? 'opacity-30' : 'opacity-100'}`}>
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
                                        <span className="inline-flex items-center gap-1 ml-2 align-middle">
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
                                                className="bg-transparent border border-current font-mono text-[9px] font-bold uppercase text-foreground/30 hover:text-foreground px-1 py-0.5 cursor-pointer leading-none transition-colors whitespace-nowrap"
                                            >
                                                + TAG
                                            </button>
                                        </span>
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
