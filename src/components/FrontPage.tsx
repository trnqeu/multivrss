'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import type { FrontPage as FrontPageData, FrontPageItem } from '@/lib/frontpage';
import FrontPageItemActions from './FrontPageItemActions';
import FrontPageLink from './FrontPageLink';
import { dismissFrontPageItem } from '@/app/actions/feed-items';

type TagVM = { id: string; name: string };

const FORYOU_COUNT = 4;

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
function Meta({ item }: { item: FrontPageItem }) {
    return (
        <span className="flex items-center gap-[7px] min-w-0 flex-1 font-mono">
            <span className="text-[9.5px] font-bold uppercase tracking-[.1em] text-foreground/45 truncate">
                {item.sourceTitle}
            </span>
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

// ── Action cluster (save, tag, dismiss) — always visible on mobile, hover-reveal on desktop ──
function Actions({ item, allTags, onDismiss }: { item: FrontPageItem; allTags: TagVM[]; onDismiss: () => void }) {
    return (
        <div className="ml-auto shrink-0 flex items-center gap-2.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 transition-opacity">
            <FrontPageItemActions itemId={item.id} allTags={allTags} />
            <DismissButton onClick={onDismiss} />
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

// ── Masthead — single-line dateline ──
function Masthead({ stats }: { stats: FrontPageData['stats'] }) {
    return (
        <div className="pt-[38px]">
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[10px] font-semibold uppercase tracking-[.06em] text-foreground/45">
                <span>{stats.dateLabel}</span>
                <span aria-hidden="true" className="text-foreground/22">·</span>
                <span>
                    Curated from <b className="font-extrabold text-foreground/70">{stats.read} read</b>,{' '}
                    <b className="font-extrabold text-foreground/70">{stats.saved} saved</b> across{' '}
                    <b className="font-extrabold text-foreground/70">{stats.categories} categories</b>
                </span>
            </p>
        </div>
    );
}

// ── FOR YOU card ──
function ForYouCard({ item, allTags, onDismiss }: { item: FrontPageItem; allTags: TagVM[]; onDismiss: () => void }) {
    const [opened, setOpened] = useState(false);
    return (
        <article className="group flex flex-col gap-[11px] min-w-0 border-t-2 border-foreground pt-3.5">
            <CatTag name={item.categoryName} />
            <FrontPageLink
                itemId={item.id}
                href={item.link}
                onNavigate={() => setOpened(true)}
                className={`font-serif text-[19px] font-semibold leading-[1.2] tracking-[-0.01em] text-foreground hover:text-terracotta transition-colors transition-opacity no-underline ${opened ? 'opacity-40' : ''}`}
            >
                {item.title}
            </FrontPageLink>
            <div className="flex items-center gap-2.5 mt-auto pt-1 min-h-[20px]">
                <Meta item={item} />
                <Actions item={item} allTags={allTags} onDismiss={onDismiss} />
            </div>
        </article>
    );
}

// ── FOR YOU strip — stateful pool with dismiss/replace ──
function ForYouStrip({ pool: initialPool, allTags }: { pool: FrontPageItem[]; allTags: TagVM[] }) {
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
                    <ForYouCard key={item.id} item={item} allTags={allTags} onDismiss={() => dismiss(item)} />
                ))}
            </div>
        </section>
    );
}

// ── Category section lead article ──
function Lead({ item, allTags, onDismiss }: { item: FrontPageItem; allTags: TagVM[]; onDismiss: () => void }) {
    const [opened, setOpened] = useState(false);
    return (
        <article className="group flex flex-col items-start gap-[11px] min-w-0">
            <FrontPageLink
                itemId={item.id}
                href={item.link}
                onNavigate={() => setOpened(true)}
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
                <Meta item={item} />
                <Actions item={item} allTags={allTags} onDismiss={onDismiss} />
            </div>
        </article>
    );
}

// ── Category section list row ──
function Row({ item, allTags, onDismiss }: { item: FrontPageItem; allTags: TagVM[]; onDismiss: () => void }) {
    const [opened, setOpened] = useState(false);
    return (
        <li className="group flex flex-col gap-2 py-[15px] border-b border-foreground/[0.09] last:border-b-0">
            <FrontPageLink
                itemId={item.id}
                href={item.link}
                onNavigate={() => setOpened(true)}
                className={`font-serif text-[17px] font-medium leading-[1.26] text-foreground hover:text-terracotta transition-colors transition-opacity no-underline ${opened ? 'opacity-40' : ''}`}
            >
                {item.title}
            </FrontPageLink>
            <div className="flex items-center gap-3 min-h-[18px]">
                <Meta item={item} />
                <Actions item={item} allTags={allTags} onDismiss={onDismiss} />
            </div>
        </li>
    );
}

// ── Category section — lead + list, "See all" footer ──
function Section({ category, items: initialItems, allTags }: { category: string; items: FrontPageItem[]; allTags: TagVM[] }) {
    const [items, setItems] = useState(initialItems);
    const [collapsed, setCollapsed] = useState(false);
    const [, startTransition] = useTransition();
    const [lead, ...rest] = items;

    function dismiss(item: FrontPageItem) {
        const excludeIds = items.map(i => i.id);
        startTransition(async () => {
            const { replacement } = await dismissFrontPageItem(item.id, category, excludeIds);
            setItems(prev => {
                const filtered = prev.filter(i => i.id !== item.id);
                return replacement ? [...filtered, replacement] : filtered;
            });
        });
    }

    if (!lead) return null;
    const bodyId = `sec-${category}-body`;

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
                        <Lead item={lead} allTags={allTags} onDismiss={() => dismiss(lead)} />
                    </li>
                    {rest.map(item => (
                        <Row key={item.id} item={item} allTags={allTags} onDismiss={() => dismiss(item)} />
                    ))}
                </ul>

                <div className="flex justify-start mt-6">
                    <Link
                        href={`?view=river&cat=${encodeURIComponent(category)}`}
                        className="group/all inline-flex items-center gap-1.5 border border-terracotta rounded-[2px] px-[11px] py-[6px] font-mono text-[9.5px] font-extrabold uppercase tracking-[.1em] text-terracotta hover:opacity-70 transition-opacity no-underline"
                    >
                        <span>See all in {category}</span>
                        <span aria-hidden="true" className="inline-block transition-transform duration-[160ms] group-hover/all:translate-x-[3px]">
                            →
                        </span>
                    </Link>
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
export default function FrontPage({ data, allTags }: { data: FrontPageData; allTags: TagVM[] }) {
    const { forYouPool, sections, stats } = data;
    const isEmpty = forYouPool.length === 0 && sections.length === 0;

    return (
        <div className="max-w-[1180px] mx-auto px-4 min-[761px]:px-7 min-[1181px]:px-10 pb-[100px]">
            <h1 className="sr-only">Front Page</h1>
            <div className="md:hidden flex justify-end pt-3">
                <Link
                    href="?view=river"
                    aria-label="Switch to River view"
                    className="inline-flex items-center gap-1 font-mono text-[9.5px] font-extrabold uppercase tracking-[.1em] text-foreground/55 hover:text-terracotta border-[1.5px] border-foreground px-3 py-[6px]"
                >
                    ≡ River
                </Link>
            </div>
            {isEmpty ? (
                <EmptyFrontPage />
            ) : (
                <>
                    <Masthead stats={stats} />
                    <ForYouStrip pool={forYouPool} allTags={allTags} />
                    <div className="mt-[18px] flex flex-col">
                        {sections.map(s => (
                            <Section key={s.category} category={s.category} items={s.items} allTags={allTags} />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
