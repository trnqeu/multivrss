'use client';

import { Fragment, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { dayBucket, getHost } from '@/lib/utils';
import { getCategories } from '@/app/actions/categories';
import { markAsRead, markAsUnread, saveFeedItem, unsaveFeedItem, updateFeedItemDetails } from '@/app/actions/feed-items';
import { updateSavedLinkDetails } from '@/app/actions/saved-links';
import { HIGHLIGHT_PRE, HIGHLIGHT_POST, type SearchHit, type SearchResult } from '@/lib/search-types';
import { Bookmark } from '@/components/icons/Bookmark';
import { TagIcon } from '@/components/icons/Tag';
import { Reader } from '@/components/icons/Reader';
import AssignTagsModal from '@/components/AssignTagsModal';
import { useCloseOnNavigate } from '@/components/useCloseOnNavigate';
import EmptyStream from "./EmptyStream";
import MobileCategorySheet from './MobileCategorySheet';
import TelemetryDropdown from './TelemetryDropdown';

const READ_OPTS = ['ALL', 'UNREAD', 'READ'] as const;
type ReadOpt = typeof READ_OPTS[number];

type TagVM = { id: string; name: string };

// Unhighlighted previews come straight from the DB with no length cap (ts_headline
// only bounds length when there's a search query) — clip them for display.
const PREVIEW_CHAR_LIMIT = 200;

function clipPreview(text: string): string {
    if (text.length <= PREVIEW_CHAR_LIMIT) return text;
    return `${text.slice(0, PREVIEW_CHAR_LIMIT).trimEnd()}…`;
}

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

export default function SearchBar({ allTags = [], username }: { allTags?: TagVM[]; username: string }) {
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
    const [tagModalItem, setTagModalItem] = useState<{ id: string; isSavedLink: boolean } | null>(null);
    const [itemTags, setItemTags] = useState<Map<string, TagVM[]>>(new Map());
    const [titleDraft, setTitleDraft] = useState('');
    useCloseOnNavigate(() => setTagModalItem(null));


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
                <Link
                    href={`/u/${username}`}
                    aria-label="Back to Front Page"
                    className="md:hidden shrink-0 flex items-center px-3 border-r-2 border-foreground font-mono text-[9.5px] font-extrabold uppercase tracking-[.1em] text-foreground/55 hover:text-terracotta"
                >
                    ▤ Front
                </Link>
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
                            const isSavedLink = item.type === 'savedLink';
                            const currentDay = dayBucket(item.pubDate);
                            const prevDay    = index > 0 ? dayBucket(hits[index - 1].pubDate) : null;
                            const isNewDay   = currentDay !== prevDay;
                            const dateLabel = item.pubDate
                                ? new Date(item.pubDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                                : '—';
                            const formattedPreview = isSavedLink ? item._formatted?.description : item._formatted?.content;
                            const rawPreview = isSavedLink ? item.description : item.content;
                            const preview = formattedPreview ?? (rawPreview ? clipPreview(rawPreview) : rawPreview);
                            const sourceLabel = isSavedLink ? getHost(item.link).toUpperCase() : item.sourceTitle;
                            const tags = itemTags.get(item.id) ?? [];

                            const readToggle = isSavedLink ? null : (
                                <button
                                    onClick={() => toggleRead(item)}
                                    className={`self-center leading-none text-[11px] bg-transparent border-0 p-0 cursor-pointer transition-colors ${item.read ? 'text-foreground/35' : 'text-terracotta'}`}
                                    title={item.read ? 'Mark as unread' : 'Mark as read'}
                                >
                                    {item.read ? '\u25CF' : '\u25CB'}
                                </button>
                            );
                            // Save/tag — small neutral icons, hover-revealed on desktop rows.
                            const secondaryActions = (
                                <>
                                    {tags.length > 0 && (
                                        <span className="inline-flex gap-1">
                                            {tags.map(tag => (
                                                <span key={tag.id} className="font-mono text-[9px] uppercase border border-current text-terracotta px-1 py-0.5 leading-none">
                                                    #{tag.name}
                                                </span>
                                            ))}
                                        </span>
                                    )}
                                    {!isSavedLink && (
                                        <button
                                            onClick={() => toggleSave(item)}
                                            aria-label={item.savedAt ? 'Remove from saved' : 'Save'}
                                            title={item.savedAt ? 'Remove from saved' : 'Save'}
                                            className="bg-transparent border-0 px-0 py-0 cursor-pointer"
                                        >
                                            <Bookmark
                                                filled={!!item.savedAt}
                                                size={13}
                                                className={item.savedAt ? 'text-terracotta' : 'text-foreground/40 hover:text-terracotta'}
                                            />
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setTagModalItem({ id: item.id, isSavedLink });
                                            setTitleDraft(item.title ?? '');
                                        }}
                                        aria-label="Assign tags"
                                        title="+ TAG"
                                        className="bg-transparent border-0 px-0 py-0 cursor-pointer leading-none"
                                    >
                                        <TagIcon size={13} className="text-foreground/40 hover:text-terracotta" />
                                    </button>
                                </>
                            );

                            // Read — primary CTA pill, always visible (not hover-only).
                            const readPill = !isSavedLink && (
                                <Link
                                    href={`/u/${username}/read/${item.id}`}
                                    onClick={() => {
                                        if (!(item.read ?? false)) {
                                            setAllHits(prev => prev.map(h => h.id === item.id ? { ...h, read: true } : h));
                                            markAsRead(item.id);
                                        }
                                    }}
                                    aria-label="Read"
                                    title="Read"
                                    className="inline-flex items-center bg-terracotta text-background px-2 py-1.5 leading-none"
                                >
                                    <Reader size={13} />
                                </Link>
                            );

                            return (
                                <Fragment key={`${item.type}-${item.id}`}>
                                    {isNewDay && currentDay && (
                                        <div className={`flex items-center gap-3 ${index === 0 ? 'mt-2' : 'mt-4'} mb-2`}>
                                            <span className="font-mono text-[9px] font-extrabold tracking-[.28em] text-terracotta whitespace-nowrap">
                                                — {currentDay}
                                            </span>
                                            <span aria-hidden="true" className="flex-1 h-px bg-terracotta/30" />
                                        </div>
                                    )}

                                    {/* Mobile row — stacked: meta+actions / title / preview */}
                                    <div
                                        role="listitem"
                                        className={`md:hidden flex flex-col gap-1 py-2.5 px-1.5 -mx-1.5 border-t border-foreground/[0.07] ${!isSavedLink && item.read ? 'opacity-[.42]' : ''}`}
                                    >
                                        <div className="flex items-center gap-2">
                                            {readToggle}
                                            <span className="font-mono text-[9px] font-extrabold uppercase tracking-[.1em] text-terracotta truncate">
                                                {sourceLabel}
                                            </span>
                                            <span aria-hidden="true" className="text-foreground/25">·</span>
                                            <span className="font-mono text-[9px] text-foreground/35 whitespace-nowrap">
                                                {dateLabel}
                                            </span>
                                            <span className="ml-auto shrink-0 inline-flex items-center gap-2">
                                                {secondaryActions}
                                                {readPill}
                                            </span>
                                        </div>
                                        <a
                                            href={item.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={() => {
                                                if (!isSavedLink && !(item.read ?? false)) {
                                                    setAllHits(prev => prev.map(h => h.id === item.id ? { ...h, read: true } : h));
                                                    markAsRead(item.id);
                                                }
                                            }}
                                            className="font-serif font-semibold text-[15px] leading-snug tracking-[-.005em] text-foreground hover:text-terracotta transition-colors no-underline"
                                        >
                                            <Highlight text={item._formatted?.title ?? item.title} />
                                        </a>
                                        {preview && (
                                            <span className="font-serif text-[13px] leading-snug text-foreground/45 font-normal line-clamp-2">
                                                <Highlight text={preview} markClass="underline decoration-terracotta" />
                                            </span>
                                        )}
                                    </div>

                                    {/* Desktop row — wraps to more lines when title/preview don't fit */}
                                    <div
                                        role="listitem"
                                        className={`hidden md:grid group grid-cols-[16px_150px_42px_1fr_auto] items-baseline gap-x-3 py-1.5 px-1.5 -mx-1.5 border-t border-foreground/[0.07] hover:bg-[var(--tc-soft)] transition-colors ${!isSavedLink && item.read ? 'opacity-[.42]' : ''}`}
                                    >
                                        {readToggle}

                                        <span className="font-mono text-[9px] font-extrabold uppercase tracking-[.1em] text-terracotta whitespace-nowrap overflow-hidden text-ellipsis">
                                            {sourceLabel}
                                        </span>

                                        <span className="font-mono text-[9.5px] text-foreground/35 whitespace-nowrap">
                                            {dateLabel}
                                        </span>

                                        <span className="min-w-0">
                                            <a
                                                href={item.link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={() => {
                                                    if (!isSavedLink && !(item.read ?? false)) {
                                                        setAllHits(prev => prev.map(h => h.id === item.id ? { ...h, read: true } : h));
                                                        markAsRead(item.id);
                                                    }
                                                }}
                                                className="font-serif font-semibold text-[15px] tracking-[-.005em] text-foreground group-hover:text-terracotta transition-colors no-underline"
                                            >
                                                <Highlight text={item._formatted?.title ?? item.title} />
                                            </a>
                                            {preview && (
                                                <span className="font-serif text-[14px] text-foreground/45 font-normal">
                                                    {' — '}
                                                    <Highlight text={preview} markClass="underline decoration-terracotta" />
                                                </span>
                                            )}
                                        </span>

                                        <span className="inline-flex items-center gap-2">
                                            <span className="inline-flex items-center gap-2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
                                                {secondaryActions}
                                            </span>
                                            {readPill}
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
                    itemId={tagModalItem.id}
                    initialTags={itemTags.get(tagModalItem.id) ?? []}
                    allTags={allTags}
                    titleField={{ value: titleDraft, onChange: setTitleDraft }}
                    onSave={(id, tagIds, title) => tagModalItem.isSavedLink
                        ? updateSavedLinkDetails(id, title ?? '', tagIds)
                        : updateFeedItemDetails(id, title ?? '', tagIds)}
                    onTagsApplied={(_id, newTags) => {
                        setItemTags(prev => new Map(prev).set(tagModalItem.id, newTags));
                        setAllHits(prev => prev.map(h => h.id === tagModalItem.id ? { ...h, title: titleDraft.trim() || h.title } : h));
                    }}
                />
            )}
        </div>
    );
}
