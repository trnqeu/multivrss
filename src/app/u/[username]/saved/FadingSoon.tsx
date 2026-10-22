'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { keepSavedItem } from '@/app/actions/fading';
import type { FadingSoonItem } from '@/lib/fading-soon';
import { sendSavedTouch } from '@/lib/fading-beacon';
import { Reader } from '@/components/icons/Reader';
import { getHost } from '@/lib/utils';

interface Props {
    items: FadingSoonItem[];
    username: string;
}

function savedMonth(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function originOf(url: string): string {
    try { return `${new URL(url).origin}/`; } catch { return url; }
}

function displayTitle(item: FadingSoonItem): string {
    if (item.stage === 'TRACE') {
        return item.kind === 'link'
            ? `A link from ${getHost(item.url)}, saved ${savedMonth(item.savedAt)}`
            : `An article from ${item.sourceTitle ?? getHost(item.url)}, saved ${savedMonth(item.savedAt)}`;
    }
    return item.title ?? getHost(item.url);
}

function dueLabel(item: FadingSoonItem): string {
    const verb = item.stage === 'TRACE' ? 'Disappears' : 'Fades';
    if (item.daysLeft === 0) return `${verb} today`;
    return `${verb} in ${item.daysLeft} ${item.daysLeft === 1 ? 'day' : 'days'}`;
}

const keyOf = (item: FadingSoonItem) => `${item.kind}:${item.id}`;

// "Fading soon": the weekly ritual of choosing what to keep (see
// docs/multivrss-goes-undurable.md). One item at a time, by design: there is
// no "keep all". A kept row stays in place saying so, and is gone on the next
// visit; the parent refetches on reshow (useOnReshow in SavedPageClient).
export default function FadingSoon({ items, username }: Props) {
    const [kept, setKept] = useState<ReadonlySet<string>>(new Set());
    const [pending, setPending] = useState<string | null>(null);
    const [announcement, setAnnouncement] = useState('');
    const sectionRef = useRef<HTMLElement>(null);
    const headingRef = useRef<HTMLHeadingElement>(null);

    if (items.length === 0) return null;

    const remaining = items.filter(item => !kept.has(keyOf(item))).length;

    async function handleKeep(item: FadingSoonItem) {
        const key = keyOf(item);
        setPending(key);
        const result = await keepSavedItem(item.kind, item.id);
        setPending(null);
        if (result.success) {
            // The Keep button disappears with focus on it: move focus to the
            // next Keep button, or to the heading when it was the last one.
            const buttons = Array.from(sectionRef.current?.querySelectorAll<HTMLButtonElement>('button[data-keep]') ?? []);
            const index = buttons.findIndex(b => b.dataset.keep === key);
            const next = buttons.slice(index + 1).find(b => b.dataset.keep !== key) ?? buttons.slice(0, index).at(-1);
            setKept(prev => new Set(prev).add(key));
            setAnnouncement(`Kept: ${displayTitle(item)}.`);
            requestAnimationFrame(() => (next ?? headingRef.current)?.focus());
        } else {
            setAnnouncement(result.message ?? 'Could not keep this item.');
        }
    }

    return (
        <section ref={sectionRef} aria-labelledby="fading-soon-heading" className="border-b-2 border-foreground px-8 py-6 md:px-12">
            <div className="mb-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h2 ref={headingRef} id="fading-soon-heading" tabIndex={-1} className="text-[12px] font-extrabold uppercase tracking-[0.14em]">
                    Fading soon
                </h2>
                <span className="text-[9.5px] font-bold uppercase tracking-[0.08em] text-foreground/60">
                    {items.length} {items.length === 1 ? 'item' : 'items'} · this week
                </span>
            </div>
            <p className="mb-2 font-serif text-[14px] text-foreground/70">
                These will lose something within a week. Keep what still matters, one at a time.
            </p>

            <ul className="m-0 list-none p-0">
                {items.map(item => {
                    const key = keyOf(item);
                    const isKept = kept.has(key);
                    const isTrace = item.stage === 'TRACE';
                    const title = displayTitle(item);
                    const href = isTrace ? originOf(item.url) : item.url;
                    const readerHref = `/u/${username}/read/${item.id}${item.kind === 'link' ? '?type=savedLink' : ''}`;

                    return (
                        <li
                            key={key}
                            className="grid grid-cols-1 items-center gap-x-4 gap-y-2 border-t border-foreground/12 py-2.5 sm:grid-cols-[minmax(0,1fr)_auto]"
                        >
                            <div className="min-w-0">
                                <a
                                    href={href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => sendSavedTouch(item.kind, item.id, 'open')}
                                    className={`mb-[5px] block leading-[1.35] text-pretty text-foreground transition-colors hover:text-terracotta ${
                                        isTrace ? 'font-serif text-[15px] font-normal italic' : 'text-[14.5px] font-semibold'
                                    }`}
                                >
                                    {item.stage === 'GIST' && <span className="sr-only">Faded: </span>}
                                    {isTrace && <span className="sr-only">Trace: </span>}
                                    {title}
                                </a>
                                <div className="flex flex-wrap items-center gap-x-[9px] gap-y-1">
                                    {!isTrace && (
                                        <>
                                            <span className="text-[9.5px] font-bold uppercase tracking-[0.06em] text-terracotta">
                                                {(item.sourceTitle ?? getHost(item.url)).toUpperCase()}
                                            </span>
                                            <span aria-hidden="true" className="text-[9px] text-foreground/25">·</span>
                                        </>
                                    )}
                                    {item.stage !== 'VIVID' && (
                                        <>
                                            <span
                                                aria-hidden="true"
                                                className={`border-foreground px-[5px] py-[2px] text-[8.5px] font-extrabold uppercase tracking-[0.12em] ${
                                                    isTrace ? 'border-2 border-dotted' : 'border border-dashed'
                                                }`}
                                            >
                                                {isTrace ? 'Trace' : 'Faded'}
                                            </span>
                                            <span aria-hidden="true" className="text-[9px] text-foreground/25">·</span>
                                        </>
                                    )}
                                    {isTrace && item.tags.map(tag => (
                                        <span
                                            key={tag.id}
                                            className="border border-foreground/30 px-1.5 py-[3px] text-[8.5px] font-bold uppercase tracking-[0.07em] text-foreground/60"
                                        >
                                            {tag.name}
                                        </span>
                                    ))}
                                    {isKept ? (
                                        <span className="text-[9.5px] font-bold uppercase tracking-[0.08em] text-foreground/60">
                                            Kept · safe for now
                                        </span>
                                    ) : (
                                        <span className="text-[9.5px] font-extrabold uppercase tracking-[0.08em] text-terracotta">
                                            {dueLabel(item)}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-1.5">
                                {!isTrace && (
                                    <Link
                                        href={readerHref}
                                        aria-label={`Read: ${title}`}
                                        className="inline-flex items-center gap-1.5 bg-terracotta px-2.5 py-[7px] text-[9.5px] font-bold uppercase leading-none tracking-[0.1em] text-background"
                                    >
                                        <Reader size={12} />
                                        Read
                                    </Link>
                                )}
                                {!isKept && (
                                    <button
                                        type="button"
                                        data-keep={key}
                                        onClick={() => handleKeep(item)}
                                        disabled={pending === key}
                                        aria-label={`Keep: ${title}`}
                                        className="border border-foreground bg-transparent px-2.5 py-[6px] text-[9.5px] font-bold uppercase leading-none tracking-[0.1em] text-foreground transition-colors hover:bg-foreground hover:text-background disabled:opacity-50"
                                    >
                                        {pending === key ? 'Keeping…' : 'Keep'}
                                    </button>
                                )}
                            </div>
                        </li>
                    );
                })}
            </ul>

            {remaining === 0 && (
                <p role="status" className="mt-2 text-[9.5px] font-bold uppercase tracking-[0.08em] text-foreground/60">
                    Nothing else fades this week.
                </p>
            )}
            <p className="sr-only" role="status" aria-live="polite">{announcement}</p>
        </section>
    );
}
