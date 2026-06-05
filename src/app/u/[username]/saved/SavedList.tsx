'use client';

import { unsaveFeedItem, deleteSavedLink } from '@/app/actions';
import { dayBucket } from '@/lib/utils';
import { Fragment, useState } from 'react';
import EmptyStream from '@/components/EmptyStream';

interface SavedItem {
    id: string;
    title: string | null;
    link: string;
    content: string | null;
    savedAt: Date;
    sourceTitle: string | null;
    type?: 'feed' | 'external';
    isExternal?: true;
}

interface Props {
    items: SavedItem[];
}

export default function SavedList({ items }: Props) {
    const [localItems, setLocalItems] = useState(items);

    async function handleRemove(item: SavedItem) {
        setLocalItems(prev => prev.filter(i => i.id !== item.id));
        if (item.type === 'feed' || !item.isExternal) {
            await unsaveFeedItem(item.id);
        } else {
            await deleteSavedLink(item.id);
        }
    }

    if (localItems.length === 0) {
        return (
            <section className="p-8 md:p-12">
                <EmptyStream variant="no-saved" />
            </section>
        );
    }

    return (
        <section className="p-8 md:p-12">
            <div className="leading-relaxed text-sm text-foreground font-medium">
                {localItems.map((item, index) => {
                    const currentDay = dayBucket(item.savedAt);
                    const prevDay = index > 0 ? dayBucket(localItems[index - 1].savedAt) : null;
                    const nextDay = index < localItems.length - 1 ? dayBucket(localItems[index + 1].savedAt) : null;
                    const isNewDay = currentDay !== prevDay;
                    const suppressSeparator = index === localItems.length - 1 || currentDay !== nextDay;

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
                            <span>
                                <span className="text-terracotta text-[10px] font-bold uppercase tracking-widest">
                                    {item.sourceTitle ?? 'SAVED LINK'}
                                </span>
                                <span className="text-foreground/40 mx-2">·</span>
                                <span className="text-foreground/50 text-xs">
                                    {item.savedAt
                                        ? new Date(item.savedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                                        : '---'}
                                </span>
                                <span className="text-foreground/40 mx-2">·</span>
                                <a
                                    href={item.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:text-terracotta transition-colors"
                                >
                                    {item.title}
                                </a>
                                {item.content && (
                                    <>
                                        <span className="text-foreground/40 mx-2">—</span>
                                        <span className="text-foreground/50 text-xs font-normal">
                                            {item.content.replace(/<[^>]*>?/gm, '').slice(0, 120).trimEnd()}…
                                        </span>
                                    </>
                                )}
                                <button
                                    onClick={() => handleRemove(item)}
                                    className="bg-transparent border-0 px-0 py-0 cursor-pointer text-[10px] font-bold uppercase tracking-widest transition-colors align-baseline mx-1 text-foreground/40 hover:text-terracotta"
                                    title="Remove from saved"
                                >
                                    [REMOVE]
                                </button>
                                {!suppressSeparator && (
                                    <span className="text-terracotta font-bold mx-3 select-none">{'/ /'}</span>
                                )}
                            </span>
                        </Fragment>
                    );
                })}
            </div>
        </section>
    );
}
