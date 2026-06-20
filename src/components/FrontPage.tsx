import Link from 'next/link';
import type { FrontPage as FrontPageData, FrontPageItem } from '@/lib/frontpage';
import FrontPageItemActions from './FrontPageItemActions';

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
        <span className="text-[9px] font-bold uppercase tracking-widest text-foreground/40 font-mono">
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

// ── FOR YOU card (strip) ──
function ForYouCard({ item }: { item: FrontPageItem }) {
    return (
        <article className="flex flex-col gap-1 p-3 bg-background min-w-0">
            <div className="flex items-center justify-between gap-2">
                <CatTag name={item.categoryName} />
                <span className="text-terracotta text-[10px]" aria-hidden="true">
                    {item.reasonType === 'source' ? '◆' : '✦'}
                </span>
            </div>
            <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="font-serif text-[15px] font-semibold leading-snug text-foreground hover:text-terracotta transition-colors line-clamp-3 no-underline"
            >
                {item.title}
            </a>
            <div className="flex items-center gap-2 mt-auto pt-1">
                <span className="text-[9px] font-bold uppercase tracking-widest text-foreground/40 font-mono truncate">
                    {item.sourceTitle}
                </span>
                <span aria-hidden="true" className="text-foreground/20 text-[9px]">·</span>
                <PubDate ts={item.pubDate} />
                <div className="ml-auto shrink-0">
                    <FrontPageItemActions itemId={item.id} />
                </div>
            </div>
            <Reason item={item} />
        </article>
    );
}

// ── Category column (grid) ──
function CategoryColumn({ category, items }: { category: string; items: FrontPageItem[] }) {
    const [lead, ...rest] = items;
    return (
        <section aria-labelledby={`cat-${category}`}>
            <div className="flex items-center gap-2 py-2 border-b border-foreground/30 mb-3">
                <span id={`cat-${category}`} className="text-[10px] font-bold uppercase tracking-widest font-mono">
                    — {category}
                </span>
                <span className="text-[9px] text-foreground/30 font-mono ml-auto">{items.length}</span>
            </div>

            {lead && (
                <article className="mb-3">
                    <Reason item={lead} />
                    <a
                        href={lead.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-serif text-[15px] font-semibold leading-snug text-foreground hover:text-terracotta transition-colors line-clamp-3 no-underline block mt-1"
                    >
                        {lead.title}
                    </a>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-foreground/40 font-mono truncate">
                            {lead.sourceTitle}
                        </span>
                        <span aria-hidden="true" className="text-foreground/20 text-[9px]">·</span>
                        <PubDate ts={lead.pubDate} />
                        <div className="ml-auto shrink-0">
                            <FrontPageItemActions itemId={lead.id} />
                        </div>
                    </div>
                </article>
            )}

            {rest.length > 0 && (
                <ul role="list" className="flex flex-col divide-y divide-foreground/10">
                    {rest.map(item => (
                        <li key={item.id} className="py-2" role="listitem">
                            <a
                                href={item.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-serif text-[12px] font-semibold leading-snug text-foreground hover:text-terracotta transition-colors line-clamp-2 no-underline block"
                            >
                                {item.title}
                            </a>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[9px] text-foreground/40 font-mono truncate">
                                    {item.sourceTitle}
                                </span>
                                <span aria-hidden="true" className="text-foreground/20 text-[9px]">·</span>
                                <PubDate ts={item.pubDate} />
                                <div className="ml-auto shrink-0">
                                    <FrontPageItemActions itemId={item.id} />
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            <div className="mt-3 pt-2 border-t border-foreground/10">
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
export default function FrontPage({ data }: { data: FrontPageData }) {
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

                    {/* FOR YOU strip */}
                    {forYou.length > 0 && (
                        <section aria-label="For you" className="mt-4 mb-6">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-[10px] font-bold uppercase tracking-widest font-mono">— For You</span>
                                <span className="flex-1 h-px bg-foreground/20" aria-hidden="true" />
                            </div>
                            <div
                                className="grid gap-px bg-foreground/15"
                                style={{ gridTemplateColumns: `repeat(${Math.min(forYou.length, 4)}, minmax(0, 1fr))` }}
                            >
                                {forYou.map(item => (
                                    <ForYouCard key={item.id} item={item} />
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Category grid */}
                    {sections.length > 0 && (
                        <div
                            className="grid gap-6 md:gap-8 border-t border-foreground/15 pt-4"
                            style={{ gridTemplateColumns: `repeat(auto-fill, minmax(240px, 1fr))` }}
                        >
                            {sections.map(s => (
                                <CategoryColumn key={s.category} category={s.category} items={s.items} />
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
