'use client';

import { Fragment, useState, useTransition } from 'react';
import Link from 'next/link';
import type { FrontPage as FrontPageData, FrontPageItem } from '@/lib/frontpage';
import FrontPageItemActions from './FrontPageItemActions';
import FrontPageLink from './FrontPageLink';
import { dismissFrontPageItem } from '@/app/actions';
import { timeAgo } from '@/lib/utils';

type TagVM = { id: string; name: string };

const FORYOU_COUNT = 4;

// ── Category tag — ribbon only ──
function CatTag({ name }: { name: string }) {
    return (
        <span className="text-[7.5px] font-extrabold uppercase tracking-[.14em] text-foreground/35 font-mono whitespace-nowrap">
            {name}
        </span>
    );
}

// ── Formatted pub date ──
function PubDate({ ts }: { ts: number | null | undefined }) {
    if (!ts) return null;
    const d = new Date(ts);
    return (
        <time dateTime={d.toISOString()} className="text-foreground/35 font-mono">
            {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </time>
    );
}

// ── Reason — why a lead article was picked ──
function Reason({ item }: { item: FrontPageItem }) {
    const glyph = item.reasonType === 'source' ? '◆' : '✦';
    const tooltip = item.reasonType === 'source' ? 'From a source you follow closely' : 'Similar to what you read & saved';
    return (
        <span className="flex items-center gap-1.5">
            <span className="text-terracotta text-[9px] shrink-0" title={tooltip} aria-label={tooltip}>{glyph}</span>
            <span className="text-[8.5px] font-bold uppercase tracking-widest text-foreground/45 font-mono truncate">
                {item.reason}
            </span>
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
            className="bg-transparent border-0 p-0 cursor-pointer text-foreground/25 hover:text-foreground leading-none text-[13px] font-mono transition-colors"
        >
            ×
        </button>
    );
}

// ── FOR YOU ribbon pick ──
function RibbonPick({ item, allTags, onDismiss }: { item: FrontPageItem; allTags: TagVM[]; onDismiss: () => void }) {
    const [opened, setOpened] = useState(false);
    return (
        <div className={`group/rib flex flex-col gap-1 min-w-0 flex-1 transition-opacity ${opened ? 'opacity-40' : ''}`}>
            <CatTag name={item.categoryName} />
            <FrontPageLink
                itemId={item.id}
                href={item.link}
                onNavigate={() => setOpened(true)}
                className="font-serif text-[14.5px] font-semibold leading-[1.16] text-foreground group-hover/rib:text-terracotta transition-colors line-clamp-2 no-underline"
            >
                {item.title}
            </FrontPageLink>
            <div className="flex items-center gap-2 mt-auto">
                <span className="text-[7.5px] font-extrabold uppercase tracking-[.1em] text-foreground/35 font-mono truncate">
                    {item.reason}
                </span>
                <div className="ml-auto shrink-0 flex items-center gap-1.5 opacity-0 group-hover/rib:opacity-100 transition-opacity">
                    <FrontPageItemActions itemId={item.id} allTags={allTags} />
                    <DismissButton onClick={onDismiss} />
                </div>
            </div>
        </div>
    );
}

// ── FOR YOU ribbon — stateful ──
function ForYouRibbon({ pool: initialPool, allTags }: { pool: FrontPageItem[]; allTags: TagVM[] }) {
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
        <section aria-label="For you" className="flex items-stretch gap-4 p-4 border-2 border-foreground mb-6">
            <span className="font-mono text-[9.5px] font-extrabold uppercase tracking-[.2em] text-terracotta self-center shrink-0">
                For You
            </span>
            {displayed.map((item, i) => (
                <Fragment key={item.id}>
                    {i > 0 && <span aria-hidden="true" className="w-px bg-foreground/[0.14] self-stretch" />}
                    <RibbonPick item={item} allTags={allTags} onDismiss={() => dismiss(item)} />
                </Fragment>
            ))}
        </section>
    );
}

// ── Section list row (non-lead article) ──
function SectionRow({ item, allTags }: { item: FrontPageItem; allTags: TagVM[] }) {
    const [opened, setOpened] = useState(false);
    return (
        <li className={`group/row py-2.5 border-b border-foreground/[0.08] transition-opacity ${opened ? 'opacity-40' : ''}`}>
            <FrontPageLink
                itemId={item.id}
                href={item.link}
                onNavigate={() => setOpened(true)}
                className="block font-serif text-[14.5px] font-medium leading-[1.24] text-foreground group-hover/row:text-terracotta transition-colors no-underline mb-1.5"
            >
                {item.title}
            </FrontPageLink>
            <div className="flex items-center gap-1.5 font-mono text-[8.5px] font-semibold tracking-[.08em] text-foreground/35">
                <span className="text-terracotta font-extrabold tracking-[.1em]">{item.sourceTitle}</span>
                <span aria-hidden="true">·</span>
                <PubDate ts={item.pubDate} />
                <div className="ml-auto shrink-0 flex items-center gap-1.5 opacity-0 group-hover/row:opacity-100 transition-opacity">
                    <FrontPageItemActions itemId={item.id} allTags={allTags} />
                </div>
            </div>
        </li>
    );
}

// ── Section front — one per category ──
function SectionCard({ category, items, totalCount, allTags }: { category: string; items: FrontPageItem[]; totalCount: number; allTags: TagVM[] }) {
    const [lead, ...rest] = items;
    const [leadOpened, setLeadOpened] = useState(false);

    return (
        <section aria-labelledby={`sec-${category}`} className="bg-background px-5 pt-5 flex flex-col">
            <div className="flex items-baseline justify-between pb-2.5 mb-3.5 border-b-2 border-foreground">
                <h2 id={`sec-${category}`} className="font-mono text-[12.5px] font-extrabold uppercase tracking-[.18em] normal-case">
                    {category}
                </h2>
                <span className="font-mono text-[10px] text-foreground/35">{totalCount.toString().padStart(2, '0')}</span>
            </div>

            <article className={`group/lead flex flex-col gap-1.5 mb-3.5 transition-opacity ${leadOpened ? 'opacity-40' : ''}`}>
                <Reason item={lead} />
                <FrontPageLink
                    itemId={lead.id}
                    href={lead.link}
                    onNavigate={() => setLeadOpened(true)}
                    className="font-serif text-[21px] font-semibold leading-[1.12] tracking-[-0.01em] text-foreground group-hover/lead:text-terracotta transition-colors line-clamp-3 no-underline"
                >
                    {lead.title}
                </FrontPageLink>
                {lead.content && (
                    <p className="font-serif text-[13.5px] leading-[1.5] text-foreground/55 font-normal line-clamp-3">
                        {lead.content}
                    </p>
                )}
                <div className="flex items-center gap-1.5 font-mono text-[8.5px] font-semibold tracking-[.08em] text-foreground/35 mt-0.5">
                    <span className="text-terracotta font-extrabold tracking-[.1em]">{lead.sourceTitle}</span>
                    <span aria-hidden="true">·</span>
                    <PubDate ts={lead.pubDate} />
                    <div className="ml-auto shrink-0 flex items-center gap-1.5 opacity-0 group-hover/lead:opacity-100 transition-opacity">
                        <FrontPageItemActions itemId={lead.id} allTags={allTags} />
                    </div>
                </div>
            </article>

            {rest.length > 0 && (
                <ul role="list" className="border-t border-foreground/[0.14]">
                    {rest.map(item => <SectionRow key={item.id} item={item} allTags={allTags} />)}
                </ul>
            )}

            <Link
                href={`?view=river&cat=${encodeURIComponent(category)}`}
                className="group/all -mx-5 mt-3.5 px-5 py-[13px] bg-foreground text-background hover:bg-terracotta hover:text-white flex items-center justify-between font-mono text-[10px] font-extrabold uppercase tracking-[.16em] transition-colors no-underline"
            >
                <span>View all {totalCount} in {category}</span>
                <span aria-hidden="true" className="text-[14px] transition-transform group-hover/all:translate-x-1">→</span>
            </Link>
        </section>
    );
}

// ── Telemetry stat bar ──
function TelemetryStats({ stats }: { stats: FrontPageData['stats'] }) {
    return (
        <div className="px-[18px] py-[9px] border-b-2 border-foreground font-mono text-[9.5px] font-bold uppercase tracking-[.13em] text-foreground/45 flex items-center gap-1 flex-wrap">
            <span>Curated from</span>
            <b className="text-foreground font-extrabold">{stats.read} read</b>
            <span aria-hidden="true" className="text-foreground/25 mx-1">·</span>
            <b className="text-foreground font-extrabold">{stats.saved} saved</b>
            <span aria-hidden="true" className="text-foreground/25 mx-1">·</span>
            <span>Across</span>
            <b className="text-foreground font-extrabold">{stats.categories} categories</b>
            <span aria-hidden="true" className="text-foreground/25 mx-1">·</span>
            <span>Updated</span>
            <b className="text-foreground font-extrabold">{timeAgo(stats.updatedAt)}</b>
        </div>
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
        <div>
            <h1 className="sr-only">Front Page</h1>
            <TelemetryStats stats={stats} />
            <div className="px-4 md:px-[26px] py-[22px] pb-[90px] max-w-[1600px] mx-auto">
                {isEmpty ? (
                    <EmptyFrontPage />
                ) : (
                    <>
                        <ForYouRibbon pool={forYouPool} allTags={allTags} />
                        {sections.length > 0 && (
                            <div className="grid grid-cols-1 min-[901px]:grid-cols-2 min-[1241px]:grid-cols-3 gap-x-10 gap-y-6">
                                {sections.map(s => (
                                    <SectionCard key={s.category} category={s.category} items={s.items} totalCount={s.totalCount} allTags={allTags} />
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
