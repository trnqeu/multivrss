'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import type { FrontPage as FrontPageData, FrontPageItem } from '@/lib/frontpage';
import FrontPageItemActions from './FrontPageItemActions';
import FrontPageLink from './FrontPageLink';
import { dismissFrontPageItem } from '@/app/actions';

type TagVM = { id: string; name: string };

// ── Reason component ──
function Reason({ item }: { item: FrontPageItem }) {
    const glyph = item.reasonType === 'source' ? '◆' : '✦';
    const tooltip = item.reasonType === 'source' ? 'From a source you follow closely' : 'Similar to what you read & saved';
    const affTip = item.reasonType === 'source'
        ? `${item.affinity}% source affinity`
        : `${item.affinity}% relevance`;

    return (
        <span className="flex items-center gap-1.5 mt-1">
            <span
                className="text-terracotta text-[10px] shrink-0"
                title={tooltip}
                aria-label={tooltip}
            >
                {glyph}
            </span>
            <span className="text-[9px] font-bold uppercase tracking-widest text-foreground/60 truncate">
                {item.reason}
            </span>
            <span
                className="flex items-center gap-1 shrink-0 ml-auto"
                title={affTip}
                aria-label={affTip}
            >
                <span className="relative w-[34px] h-[4px] bg-foreground/15 block">
                    <span
                        className="absolute inset-y-0 left-0 bg-terracotta"
                        style={{ width: `${item.affinity}%` }}
                    />
                </span>
                <span className="text-[9px] font-bold text-foreground/40">{item.affinity}</span>
            </span>
        </span>
    );
}

// ── Category tag ──
function CatTag({ name }: { name: string }) {
    return (
        <span className="text-[8.5px] font-extrabold uppercase tracking-[.16em] text-terracotta border border-terracotta/40 px-1.5 py-0.5 font-mono whitespace-nowrap">
            {name}
        </span>
    );
}

// ── Formatted pub date ──
function PubDate({ ts }: { ts: number | null | undefined }) {
    if (!ts) return null;
    const d = new Date(ts);
    return (
        <time
            dateTime={d.toISOString()}
            className="text-[9px] text-foreground/40 font-mono"
        >
            {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </time>
    );
}

// ── Masthead ──
function Masthead() {
    const today = new Date().toLocaleDateString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
    }).toUpperCase();

    return (
        <div className="border-b-2 border-foreground pb-3 mb-0">
            <h1 className="text-3xl md:text-4xl">
                THE FRONT PAGE
            </h1>
            <div className="h-[3px] bg-foreground my-2" />
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] font-bold uppercase tracking-widest text-foreground/50 font-mono">
                <span>Your Edition</span>
                <span aria-hidden="true">·</span>
                <span>{today}</span>
                <span aria-hidden="true">·</span>
                <span className="text-terracotta">Assembled from what you read &amp; saved</span>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[9px] font-bold uppercase tracking-widest text-foreground/40 font-mono">
                <span><b className="text-terracotta">◆</b> From sources you follow</span>
                <span aria-hidden="true">·</span>
                <span><b className="text-terracotta">✦</b> Similar to your reads &amp; saves</span>
            </div>
        </div>
    );
}

// ── Telemetry row ──
function Telemetry({ stats }: { stats: FrontPageData['stats'] }) {
    return (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2 border-b border-foreground/15 text-[9px] font-bold uppercase tracking-widest text-foreground/40 font-mono">
            <span>Curated from</span>
            <span className="text-foreground">{stats.read} read</span>
            <span aria-hidden="true">·</span>
            <span className="text-foreground">{stats.saved} saved</span>
            <span aria-hidden="true">·</span>
            <span>Across</span>
            <span className="text-foreground">{stats.categories} categories</span>
        </div>
    );
}

// ── Strength meter — 3 ticks showing affinity ──
function StrengthMeter({ affinity }: { affinity: number }) {
    const ticks = Math.round((affinity / 100) * 3);
    return (
        <span
            className="inline-flex items-center gap-[2px] shrink-0"
            title={`${affinity}% match`}
            aria-label={`${affinity}% match`}
        >
            {[0, 1, 2].map(i => (
                <span
                    key={i}
                    className={`w-[3px] h-2 ${i < ticks ? 'bg-terracotta' : 'bg-foreground/15'}`}
                />
            ))}
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
            className="bg-transparent border-0 p-0 cursor-pointer text-foreground/25 hover:text-foreground leading-none text-[14px] font-mono transition-colors"
        >
            ×
        </button>
    );
}

// ── FOR YOU card (strip) ──
function ForYouCard({ item, allTags, onDismiss }: { item: FrontPageItem; allTags: TagVM[]; onDismiss: () => void }) {
    return (
        <article className="flex flex-col gap-1 p-3 bg-background min-w-0">
            <CatTag name={item.categoryName} />
            <FrontPageLink
                itemId={item.id}
                href={item.link}
                className="font-serif text-[15px] font-semibold leading-snug text-foreground hover:text-terracotta transition-colors line-clamp-3 no-underline"
            >
                {item.title}
            </FrontPageLink>
            <div className="flex items-center gap-2 mt-auto pt-1">
                <StrengthMeter affinity={item.affinity} />
                <span className="text-[9px] font-bold uppercase tracking-[.14em] text-foreground/40 font-mono truncate">
                    {item.sourceTitle}
                </span>
                <div className="ml-auto shrink-0 flex items-center gap-2">
                    <FrontPageItemActions itemId={item.id} allTags={allTags} />
                    <DismissButton onClick={onDismiss} />
                </div>
            </div>
        </article>
    );
}

// ── FOR YOU strip — stateful ──
function ForYouStrip({ items: initialItems, allTags }: { items: FrontPageItem[]; allTags: TagVM[] }) {
    const [items, setItems] = useState(initialItems);
    const [, startTransition] = useTransition();

    function dismiss(item: FrontPageItem) {
        const excludeIds = items.map(i => i.id);
        setItems(prev => prev.filter(i => i.id !== item.id));
        startTransition(async () => {
            const res = await dismissFrontPageItem(item.id, item.categoryName, excludeIds);
            if (res.replacement) {
                setItems(prev => [...prev, res.replacement!]);
            }
        });
    }

    if (items.length === 0) return null;
    return (
        <section aria-label="For you" className="mt-4 mb-6">
            <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] font-bold uppercase tracking-widest font-mono">— For You</span>
                <span className="flex-1 h-px bg-foreground/20" aria-hidden="true" />
            </div>
            <div
                className="grid gap-px bg-foreground/15"
                style={{ gridTemplateColumns: `repeat(${Math.min(items.length, 4)}, minmax(0, 1fr))` }}
            >
                {items.map(item => (
                    <ForYouCard key={item.id} item={item} allTags={allTags} onDismiss={() => dismiss(item)} />
                ))}
            </div>
        </section>
    );
}

// ── Category section — stateful ──
function CategoryColumn({ category, items: initialItems, allTags }: { category: string; items: FrontPageItem[]; allTags: TagVM[] }) {
    const [items, setItems] = useState(initialItems);
    const [, startTransition] = useTransition();

    function dismiss(item: FrontPageItem) {
        const excludeIds = items.map(i => i.id);
        setItems(prev => prev.filter(i => i.id !== item.id));
        startTransition(async () => {
            const res = await dismissFrontPageItem(item.id, category, excludeIds);
            if (res.replacement) {
                setItems(prev => [...prev, res.replacement!]);
            }
        });
    }

    if (items.length === 0) return null;
    const [lead, ...rest] = items;

    return (
        <section aria-labelledby={`cat-${category}`} className="py-6 border-t border-foreground/15">
            <div className="flex items-center gap-3 mb-4">
                <span id={`cat-${category}`} className="text-[13px] font-extrabold uppercase tracking-[.22em] font-mono whitespace-nowrap">
                    — {category}
                </span>
                <span className="flex-1 h-px bg-foreground/15" aria-hidden="true" />
                <span className="text-foreground/30 text-[11px] font-mono" aria-hidden="true">→</span>
            </div>

            <div className="grid gap-9" style={{ gridTemplateColumns: '1.4fr 1fr' }}>
                {lead && (
                    <article className="flex flex-col gap-2 items-start">
                        <Reason item={lead} />
                        <FrontPageLink
                            itemId={lead.id}
                            href={lead.link}
                            className="font-serif text-[25px] font-semibold leading-[1.14] tracking-[-0.01em] text-foreground hover:text-terracotta transition-colors line-clamp-3 no-underline"
                        >
                            {lead.title}
                        </FrontPageLink>
                        {lead.content && (
                            <p className="font-serif text-[14.5px] leading-relaxed text-foreground/50 font-normal max-w-[48ch] line-clamp-3">
                                {lead.content}
                            </p>
                        )}
                        <div className="flex items-center gap-2 mt-auto">
                            <span className="text-[9px] font-bold uppercase tracking-widest text-terracotta font-mono truncate">
                                {lead.sourceTitle}
                            </span>
                            <span aria-hidden="true" className="text-foreground/20 text-[9px]">·</span>
                            <PubDate ts={lead.pubDate} />
                            <div className="ml-auto shrink-0 flex items-center gap-2">
                                <FrontPageItemActions itemId={lead.id} allTags={allTags} />
                                <DismissButton onClick={() => dismiss(lead)} />
                            </div>
                        </div>
                    </article>
                )}

                {rest.length > 0 && (
                    <ul role="list" className="flex flex-col border-t border-foreground/15">
                        {rest.map(item => (
                            <li key={item.id} className="py-3 border-b border-foreground/[0.08]">
                                <FrontPageLink
                                    itemId={item.id}
                                    href={item.link}
                                    className="font-serif text-[16px] font-medium leading-snug text-foreground hover:text-terracotta transition-colors line-clamp-2 no-underline block mb-1.5"
                                >
                                    {item.title}
                                </FrontPageLink>
                                <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-terracotta font-mono truncate">
                                        {item.sourceTitle}
                                    </span>
                                    <span aria-hidden="true" className="text-foreground/20 text-[9px]">·</span>
                                    <PubDate ts={item.pubDate} />
                                    <div className="ml-auto shrink-0 flex items-center gap-2">
                                        <FrontPageItemActions itemId={item.id} allTags={allTags} />
                                        <DismissButton onClick={() => dismiss(item)} />
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div className="mt-4 pt-2">
                <Link
                    href={`?view=river&cat=${encodeURIComponent(category)}`}
                    className="text-[9px] font-bold uppercase tracking-widest font-mono text-terracotta hover:text-foreground transition-colors"
                >
                    See all →
                </Link>
            </div>
        </section>
    );
}

// ── Empty state ──
function EmptyFrontPage() {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/30 font-mono">
                No recommendations yet
            </p>
            <p className="text-[11px] text-foreground/40 font-mono mt-2">
                Read or save a few articles and come back — the front page will learn what you like.
            </p>
        </div>
    );
}

// ── Main FrontPage component ──
export default function FrontPage({ data, allTags }: { data: FrontPageData; allTags: TagVM[] }) {
    const { forYou, sections, stats } = data;
    const isEmpty = forYou.length === 0 && sections.length === 0;

    return (
        <div className="px-4 md:px-7 py-4 max-w-[1400px] mx-auto">
            <Masthead />
            {isEmpty ? (
                <EmptyFrontPage />
            ) : (
                <>
                    <Telemetry stats={stats} />
                    <ForYouStrip items={forYou} allTags={allTags} />
                    {sections.length > 0 && (
                        <div className="flex flex-col">
                            {sections.map(s => (
                                <CategoryColumn key={s.category} category={s.category} items={s.items} allTags={allTags} />
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
