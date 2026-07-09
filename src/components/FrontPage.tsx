'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import type { FrontPage as FrontPageData, FrontPageItem } from '@/lib/frontpage';
import FrontPageItemActions from './FrontPageItemActions';
import FrontPageLink from './FrontPageLink';
import { dismissFrontPageItem } from '@/app/actions';

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

// ── Hover-reveal action cluster (save, tag, dismiss) ──
function Actions({ item, allTags, onDismiss }: { item: FrontPageItem; allTags: TagVM[]; onDismiss: () => void }) {
    return (
        <div className="ml-auto shrink-0 flex items-center gap-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <FrontPageItemActions itemId={item.id} allTags={allTags} />
            <DismissButton onClick={onDismiss} />
        </div>
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
        <article className={`group flex flex-col gap-[11px] min-w-0 border-t-2 border-foreground pt-3.5 transition-opacity ${opened ? 'opacity-40' : ''}`}>
            <CatTag name={item.categoryName} />
            <FrontPageLink
                itemId={item.id}
                href={item.link}
                onNavigate={() => setOpened(true)}
                className="font-serif text-[19px] font-semibold leading-[1.2] tracking-[-0.01em] text-foreground hover:text-terracotta transition-colors no-underline"
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
    return (
        <section aria-label="For you" className="pt-[34px]">
            <div className="flex items-center gap-4 mb-5">
                <span className="font-mono text-[11px] font-extrabold uppercase tracking-[.24em] text-foreground whitespace-nowrap">
                    For You
                </span>
                <span aria-hidden="true" className="flex-1 h-px bg-foreground/[0.14]" />
            </div>
            <div className="grid grid-cols-1 min-[761px]:grid-cols-2 min-[1181px]:grid-cols-4 gap-[30px]">
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
        <article className={`group flex flex-col items-start gap-[11px] min-w-0 transition-opacity ${opened ? 'opacity-40' : ''}`}>
            <FrontPageLink
                itemId={item.id}
                href={item.link}
                onNavigate={() => setOpened(true)}
                className="font-serif text-[27px] font-semibold leading-[1.14] tracking-[-0.015em] text-foreground hover:text-terracotta transition-colors no-underline"
            >
                {item.title}
            </FrontPageLink>
            {item.content && (
                <p className="font-serif text-[15px] leading-[1.55] text-foreground/55 font-normal max-w-[50ch]">
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
        <li className={`group flex flex-col gap-2 py-[15px] border-b border-foreground/[0.09] last:border-b-0 transition-opacity ${opened ? 'opacity-40' : ''}`}>
            <FrontPageLink
                itemId={item.id}
                href={item.link}
                onNavigate={() => setOpened(true)}
                className="font-serif text-[17px] font-medium leading-[1.26] text-foreground hover:text-terracotta transition-colors no-underline"
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

    return (
        <section aria-labelledby={`sec-${category}`} className="py-[34px]">
            <div className="flex items-center gap-4 mb-5">
                <h2 id={`sec-${category}`} className="font-mono text-[13px] font-extrabold uppercase tracking-[.22em] text-terracotta whitespace-nowrap normal-case">
                    {category}
                </h2>
                <span aria-hidden="true" className="flex-1 h-px bg-foreground/[0.14]" />
            </div>

            <div className="grid grid-cols-1 min-[1181px]:grid-cols-[1.45fr_1fr] gap-6 min-[1181px]:gap-12">
                <Lead item={lead} allTags={allTags} onDismiss={() => dismiss(lead)} />
                {rest.length > 0 && (
                    <ul role="list" className="flex flex-col border-t border-foreground/[0.14]">
                        {rest.map(item => (
                            <Row key={item.id} item={item} allTags={allTags} onDismiss={() => dismiss(item)} />
                        ))}
                    </ul>
                )}
            </div>

            <div className="flex justify-end mt-6">
                <Link
                    href={`?view=river&cat=${encodeURIComponent(category)}`}
                    className="group/all inline-flex items-center gap-1.5 border border-foreground/22 rounded-[2px] px-[11px] py-[6px] font-mono text-[9.5px] font-extrabold uppercase tracking-[.1em] text-foreground/55 hover:text-terracotta hover:border-terracotta transition-colors no-underline"
                >
                    <span>See all in {category}</span>
                    <span aria-hidden="true" className="inline-block transition-transform duration-[160ms] group-hover/all:translate-x-[3px]">
                        →
                    </span>
                </Link>
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
