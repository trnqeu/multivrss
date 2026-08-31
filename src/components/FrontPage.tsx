'use client';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import type { FrontPage as FrontPageData, FrontPageItem } from '@/lib/frontpage';
import FrontPageItemActions from './FrontPageItemActions';
import FrontPageLink from './FrontPageLink';
import { dismissFrontPageItem, expandFrontPageSection, markFrontPageShown } from '@/app/actions/feed-items';
import { makeDek } from '@/lib/utils';
import { EditionProgressProvider, useEditionProgress } from './EditionProgressContext';

type TagVM = { id: string; name: string };

const FORYOU_COUNT = 4;
const FIRST_BATCH_SIZE = 6;
const REST_BATCH_SIZE = 50; // "load everything remaining" cap, see plan's batch-size decision

// ── Category tag — always terracotta ──
function CatTag({ name }: { name: string }) {
    return (
        <span className="text-[9px] font-extrabold uppercase tracking-[.16em] text-terracotta font-mono whitespace-nowrap">
            {name}
        </span>
    );
}

// ── Formatted pub date ──
function PubDate({ ts }: { ts: number | null | undefined }) {
    if (!ts) return null;
    const d = new Date(ts);
    return (
        <time dateTime={d.toISOString()} className="text-[9.5px] font-semibold text-foreground/35 font-mono whitespace-nowrap">
            {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </time>
    );
}

// ── Source · date meta line ──
function Meta({ item, username }: { item: FrontPageItem; username: string }) {
    const sourceClass = 'text-[9.5px] font-bold uppercase tracking-[.1em] text-foreground/45 truncate';
    return (
        <span className="flex items-center gap-[7px] min-w-0 flex-1 font-mono">
            {item.sourceSlug ? (
                <Link
                    href={`/u/${username}/source/${item.sourceSlug}`}
                    title={item.sourceTitle}
                    className={`${sourceClass} hover:text-terracotta transition-colors`}
                >
                    {item.sourceTitle}
                </Link>
            ) : (
                <span title={item.sourceTitle} className={sourceClass}>
                    {item.sourceTitle}
                </span>
            )}
            <span aria-hidden="true" className="text-[9px] text-foreground/22">·</span>
            <PubDate ts={item.pubDate} />
        </span>
    );
}

// ── Dismiss button ──
function DismissButton({ onClick }: { onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-label="Dismiss article"
            title="Dismiss and replace"
            className="bg-transparent border-0 p-0 cursor-pointer text-foreground/35 hover:text-terracotta leading-none text-[16px] font-mono transition-colors"
        >
            ×
        </button>
    );
}

// ── Action cluster (save, tag, read) — always visible; dismiss stays hover-reveal on desktop ──
function Actions({ item, allTags, onDismiss, username }: { item: FrontPageItem; allTags: TagVM[]; onDismiss: () => void; username: string }) {
    return (
        <div className="ml-auto shrink-0 flex items-center gap-2.5">
            <FrontPageItemActions itemId={item.id} allTags={allTags} username={username} />
            <span className="opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 transition-opacity">
                <DismissButton onClick={onDismiss} />
            </span>
        </div>
    );
}

// ── Collapse toggle — disclosure button placed beside a section title ──
function CollapseToggle({ collapsed, onToggle, label, controlsId }: { collapsed: boolean; onToggle: () => void; label: string; controlsId: string }) {
    return (
        <button
            type="button"
            onClick={onToggle}
            aria-expanded={!collapsed}
            aria-controls={controlsId}
            aria-label={collapsed ? `Expand ${label}` : `Collapse ${label}`}
            className="shrink-0 bg-transparent border-0 p-0 normal-case tracking-normal font-mono text-[13px] font-extrabold text-foreground/45 hover:text-terracotta transition-colors leading-none w-4 text-center"
        >
            {collapsed ? '+' : '_'}
        </button>
    );
}

// ── Masthead — edition label + live progress ──
function Masthead({ stats }: { stats: FrontPageData['stats'] }) {
    const { readCount, total } = useEditionProgress();
    const pct = total > 0 ? Math.round((readCount / total) * 100) : 0;
    return (
        <div className="pt-[38px]">
            <div className="flex flex-wrap items-baseline justify-between gap-x-5 gap-y-1 font-mono text-[10px] font-semibold uppercase tracking-[.09em] text-foreground/45">
                <span>
                    Your edition <span aria-hidden="true" className="text-foreground/22">·</span> {stats.dateLabel}
                </span>
                <p aria-live="polite" className="m-0">
                    <b className="font-extrabold text-foreground/70">{readCount}</b> of{' '}
                    <b className="font-extrabold text-foreground/70">{total}</b> read{' '}
                    <span aria-hidden="true" className="text-foreground/22">·</span>{' '}
                    <b className="font-extrabold text-foreground/70">{stats.saved}</b> saved
                </p>
            </div>
            <div className="relative h-[2px] bg-foreground/[0.09] mt-[9px]">
                <div
                    className="absolute inset-y-0 left-0 bg-terracotta transition-[width] duration-300 ease-out"
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
}

// ── FOR YOU card ──
function ForYouCard({ item, allTags, onDismiss, username }: { item: FrontPageItem; allTags: TagVM[]; onDismiss: () => void; username: string }) {
    const [opened, setOpened] = useState(false);
    const { notifyOpened } = useEditionProgress();
    const dek = makeDek(item.content);
    return (
        <article className="group flex flex-col gap-[11px] min-w-0 border-t-2 border-foreground pt-3.5">
            <CatTag name={item.categoryName} />
            <FrontPageLink
                itemId={item.id}
                href={item.link}
                onNavigate={() => { setOpened(true); notifyOpened(item.id); }}
                className={`font-serif text-[19px] font-semibold leading-[1.2] tracking-[-0.01em] text-foreground hover:text-terracotta transition-colors transition-opacity no-underline ${opened ? 'opacity-40' : ''}`}
            >
                {item.title}
            </FrontPageLink>
            {dek && (
                <p className={`font-serif text-[13px] leading-[1.5] text-foreground/55 font-normal line-clamp-2 transition-opacity ${opened ? 'opacity-40' : ''}`}>
                    {dek}
                </p>
            )}
            <div className="flex flex-col gap-1.5 mt-auto pt-1">
                <Meta item={item} username={username} />
                <Actions item={item} allTags={allTags} onDismiss={onDismiss} username={username} />
            </div>
        </article>
    );
}

// ── FOR YOU strip — stateful pool with dismiss/replace ──
function ForYouStrip({ pool: initialPool, allTags, username }: { pool: FrontPageItem[]; allTags: TagVM[]; username: string }) {
    const [pool, setPool] = useState(initialPool);
    const [collapsed, setCollapsed] = useState(false);
    const [, startTransition] = useTransition();
    const displayed = pool.slice(0, FORYOU_COUNT);

    function dismiss(item: FrontPageItem) {
        const excludeIds = pool.map(i => i.id);
        setPool(prev => prev.filter(i => i.id !== item.id));
        startTransition(async () => {
            await dismissFrontPageItem(item.id, item.categoryName, excludeIds);
        });
    }

    if (displayed.length === 0) return null;
    const bodyId = 'foryou-body';
    return (
        <section aria-label="For you" className="pt-[34px]">
            <div className="flex items-center gap-3 mb-5">
                <CollapseToggle
                    collapsed={collapsed}
                    onToggle={() => setCollapsed(c => !c)}
                    label="For You"
                    controlsId={bodyId}
                />
                <span className="font-mono text-[11px] font-extrabold uppercase tracking-[.24em] text-foreground whitespace-nowrap">
                    For You
                </span>
            </div>
            <div
                id={bodyId}
                hidden={collapsed}
                className="grid grid-cols-1 min-[761px]:grid-cols-2 min-[1181px]:grid-cols-4 gap-[30px]"
            >
                {displayed.map(item => (
                    <ForYouCard key={item.id} item={item} allTags={allTags} onDismiss={() => dismiss(item)} username={username} />
                ))}
            </div>
        </section>
    );
}

// ── Category section lead article ──
function Lead({ item, allTags, onDismiss, username }: { item: FrontPageItem; allTags: TagVM[]; onDismiss: () => void; username: string }) {
    const [opened, setOpened] = useState(false);
    const { notifyOpened } = useEditionProgress();
    return (
        <article className="group flex flex-col items-start gap-[11px] min-w-0">
            <FrontPageLink
                itemId={item.id}
                href={item.link}
                onNavigate={() => { setOpened(true); notifyOpened(item.id); }}
                className={`font-serif text-[27px] font-semibold leading-[1.14] tracking-[-0.015em] text-foreground hover:text-terracotta transition-colors transition-opacity no-underline ${opened ? 'opacity-40' : ''}`}
            >
                {item.title}
            </FrontPageLink>
            {item.content && (
                <p className={`font-serif text-[15px] leading-[1.55] text-foreground/55 font-normal max-w-[50ch] line-clamp-3 transition-opacity ${opened ? 'opacity-40' : ''}`}>
                    {item.content}
                </p>
            )}
            <div className="flex items-center gap-3 mt-0.5 w-full min-h-[20px]">
                <Meta item={item} username={username} />
                <Actions item={item} allTags={allTags} onDismiss={onDismiss} username={username} />
            </div>
        </article>
    );
}

// ── Category section list row — every row carries a short dek when the item has one ──
function Row({ item, allTags, onDismiss, username, animate }: {
    item: FrontPageItem; allTags: TagVM[]; onDismiss: () => void; username: string; animate: boolean;
}) {
    const [opened, setOpened] = useState(false);
    const { notifyOpened } = useEditionProgress();
    const dek = makeDek(item.content);
    return (
        <li className={`group flex flex-col gap-2 py-[15px] border-b border-foreground/[0.09] last:border-b-0 ${animate ? 'animate-row-in' : ''}`}>
            <FrontPageLink
                itemId={item.id}
                href={item.link}
                onNavigate={() => { setOpened(true); notifyOpened(item.id); }}
                className={`font-serif text-[17px] font-medium leading-[1.26] text-foreground hover:text-terracotta transition-colors transition-opacity no-underline ${opened ? 'opacity-40' : ''}`}
            >
                {item.title}
            </FrontPageLink>
            {dek && (
                <p className={`font-serif text-[13.5px] leading-[1.45] text-foreground/55 font-normal max-w-[52ch] line-clamp-2 transition-opacity ${opened ? 'opacity-40' : ''}`}>
                    {dek}
                </p>
            )}
            <div className="flex items-center gap-3 min-h-[18px]">
                <Meta item={item} username={username} />
                <Actions item={item} allTags={allTags} onDismiss={onDismiss} username={username} />
            </div>
        </li>
    );
}

// ── Category section — lead + list, in-place load-more footer ──
function Section({ category, items: initialItems, remaining: initialRemaining, forYouPool, allTags, username }: {
    category: string; items: FrontPageItem[]; remaining: number; forYouPool: FrontPageItem[]; allTags: TagVM[]; username: string;
}) {
    const [items, setItems] = useState(initialItems);
    const [remaining, setRemaining] = useState(initialRemaining);
    const [collapsed, setCollapsed] = useState(false);
    const [newlyAddedIds, setNewlyAddedIds] = useState<Set<string>>(new Set());
    const [nextBatchSize, setNextBatchSize] = useState(FIRST_BATCH_SIZE);
    const [, startTransition] = useTransition();
    const [expandPending, startExpand] = useTransition();
    const [lead, ...rest] = items;

    // This category's For You ids — items drawn from the same unread pool
    // but shown at the top of the page, not in this section. Must be
    // excluded from both dismiss-replacement and load-more candidate
    // queries or either can duplicate an item already visible above.
    const catForYouIds = useMemo(
        () => forYouPool.filter(i => i.categoryName === category).map(i => i.id),
        [forYouPool, category],
    );

    function dismiss(item: FrontPageItem) {
        const excludeIds = [...items.map(i => i.id), ...catForYouIds];
        startTransition(async () => {
            const { replacement } = await dismissFrontPageItem(item.id, category, excludeIds);
            setItems(prev => {
                const filtered = prev.filter(i => i.id !== item.id);
                return replacement ? [...filtered, replacement] : filtered;
            });
        });
    }

    function loadMore() {
        const excludeIds = [...items.map(i => i.id), ...catForYouIds];
        startExpand(async () => {
            const result = await expandFrontPageSection(category, excludeIds, nextBatchSize);
            if (!result.success) return;
            setItems(prev => [...prev, ...result.items]);
            setRemaining(result.remaining);
            setNewlyAddedIds(new Set(result.items.map(i => i.id)));
            setNextBatchSize(REST_BATCH_SIZE);
        });
    }

    if (!lead) return null;
    const bodyId = `sec-${category}-body`;
    const nextCount = Math.min(nextBatchSize, remaining);

    return (
        <section aria-labelledby={`sec-${category}`} className="py-[34px]">
            <div className="flex items-center gap-3 mb-5">
                <CollapseToggle
                    collapsed={collapsed}
                    onToggle={() => setCollapsed(c => !c)}
                    label={category}
                    controlsId={bodyId}
                />
                <h2 id={`sec-${category}`} className="font-mono text-[13px] font-extrabold uppercase tracking-[.22em] text-terracotta whitespace-nowrap normal-case">
                    {category}
                </h2>
            </div>

            <div id={bodyId} hidden={collapsed}>
                <ul role="list" className="flex flex-col border-t border-foreground/[0.14]">
                    <li className={`py-[18px] ${rest.length > 0 ? 'border-b border-foreground/[0.09]' : ''}`}>
                        <Lead item={lead} allTags={allTags} onDismiss={() => dismiss(lead)} username={username} />
                    </li>
                    {rest.map((item) => (
                        <Row
                            key={item.id}
                            item={item}
                            allTags={allTags}
                            onDismiss={() => dismiss(item)}
                            username={username}
                            animate={newlyAddedIds.has(item.id)}
                        />
                    ))}
                </ul>

                <div className="flex justify-start mt-6">
                    {remaining > 0 ? (
                        <button
                            type="button"
                            onClick={loadMore}
                            disabled={expandPending}
                            className="group inline-flex items-center gap-3 border border-foreground/22 hover:border-terracotta rounded-[2px] px-[13px] py-[15px] md:py-2 font-mono text-[9.5px] uppercase bg-transparent transition-colors"
                        >
                            {expandPending ? (
                                <span className="font-extrabold tracking-[.1em] text-foreground">LOADING…</span>
                            ) : (
                                <>
                                    <span className="font-extrabold tracking-[.1em] text-foreground group-hover:text-terracotta transition-colors">
                                        + {nextCount} MORE IN {category}
                                    </span>
                                    <span className="font-semibold tracking-[.06em] text-foreground/35 group-hover:text-terracotta group-hover:opacity-65 transition-colors">
                                        {remaining} LEFT
                                    </span>
                                </>
                            )}
                        </button>
                    ) : (
                        <div className="inline-flex items-center gap-4">
                            <p role="status" aria-live="polite" className="m-0 font-mono text-[9.5px] uppercase tracking-[.1em] text-foreground/35">
                                That&rsquo;s everything new in {category}
                            </p>
                            <Link
                                href={`?view=river&cat=${encodeURIComponent(category)}`}
                                className="font-mono text-[9.5px] font-extrabold uppercase tracking-[.1em] text-foreground/45 hover:text-terracotta transition-colors no-underline"
                            >
                                Open in river →
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}

// ── Empty state ──
function EmptyFrontPage() {
    return (
        <div role="status" className="flex flex-col items-center justify-center py-20 text-center px-6">
            <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/30 font-mono">
                No recommendations yet
            </p>
            <p className="text-[11px] text-foreground/40 font-mono mt-2">
                Read or save a few articles and come back: the front page will learn what you like.
            </p>
        </div>
    );
}

// ── Main FrontPage component ──
export default function FrontPage({ data, allTags, username }: { data: FrontPageData; allTags: TagVM[]; username: string }) {
    const { forYouPool, sections, stats } = data;
    const isEmpty = forYouPool.length === 0 && sections.length === 0;

    const stamped = useRef(false);
    useEffect(() => {
        if (stamped.current) return;
        stamped.current = true;
        const ids = [...forYouPool, ...sections.flatMap(s => s.items)].map(i => i.id);
        if (ids.length > 0) void markFrontPageShown(ids);
    }, [forYouPool, sections]);

    const editionIds = useMemo(
        () => [...forYouPool, ...sections.flatMap(s => s.items)].map(i => i.id),
        [forYouPool, sections],
    );

    return (
        <EditionProgressProvider editionIds={editionIds} initialReadCount={stats.edition.readAtLoad}>
            <div className="md:hidden flex items-stretch border-b-2 border-foreground min-h-[2.5rem]">
                <Link
                    href="?view=river"
                    aria-label="Switch to River view"
                    className="shrink-0 flex items-center px-3 font-mono text-[9.5px] font-extrabold uppercase tracking-[.1em] text-foreground/55 hover:text-terracotta"
                >
                    ≡ River
                </Link>
            </div>
            <div className="max-w-[1180px] mx-auto px-4 min-[761px]:px-7 min-[1181px]:px-10 pb-[100px]">
                <h1 className="sr-only">Front Page</h1>
                {isEmpty ? (
                    <EmptyFrontPage />
                ) : (
                    <>
                        <Masthead stats={stats} />
                        <ForYouStrip pool={forYouPool} allTags={allTags} username={username} />
                        <div className="mt-[18px] flex flex-col">
                            {sections.map(s => (
                                <Section
                                    key={s.category}
                                    category={s.category}
                                    items={s.items}
                                    remaining={s.remaining}
                                    forYouPool={forYouPool}
                                    allTags={allTags}
                                    username={username}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>
        </EditionProgressProvider>
    );
}
