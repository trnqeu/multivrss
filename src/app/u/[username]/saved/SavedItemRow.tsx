'use client';

import Link from 'next/link';
import type { TagVM } from './SavedView';
import { makeDek, stripHtml } from '@/lib/utils';
import SavedItemMenu from './SavedItemMenu';

export interface SavedRowItem {
    id: string;
    title: string;
    url: string;
    content: string | null;
    savedAt: Date;
    sourceLabel: string;
    isExternal: boolean;
    tags: TagVM[];
}

interface Props {
    item: SavedRowItem;
    username: string;
    onRemove: (item: SavedRowItem) => void;
    onEditTags: (item: SavedRowItem) => void;
}

// Two-level row: the title is the only element above 12px and is never
// truncated; source / date / tag chips sit on a second line in a smaller size.
// The one-line excerpt only appears on row hover (and always on touch, where
// there is no hover) so the resting list stays scannable.
export default function SavedItemRow({ item, username, onRemove, onEditTags }: Props) {
    const isoDate = new Date(item.savedAt).toISOString();
    const dateLabel = new Date(item.savedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const excerpt = makeDek(stripHtml(item.content ?? ''), 200);
    const readerHref = `/u/${username}/read/${item.id}${item.isExternal ? '?type=savedLink' : ''}`;

    return (
        <div className="group relative grid grid-cols-[minmax(0,1fr)_34px] items-start gap-x-3.5 border-b border-foreground/[0.07] py-[11px] transition-colors hover:bg-foreground/[0.022]">
            <div className="min-w-0">
                <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mb-[5px] block text-[14.5px] font-semibold leading-[1.35] text-pretty text-foreground transition-colors hover:text-terracotta"
                >
                    {item.title}
                </a>
                <div className="flex flex-wrap items-center gap-x-[9px] gap-y-1">
                    <span className="text-[9.5px] font-bold uppercase tracking-[0.06em] text-terracotta">
                        {item.sourceLabel}
                    </span>
                    <span aria-hidden="true" className="text-[9px] text-foreground/25">·</span>
                    <time dateTime={isoDate} className="text-[9.5px] font-semibold tracking-[0.04em] text-foreground/40">
                        {dateLabel}
                    </time>
                    {item.tags.length > 0 && (
                        <span aria-hidden="true" className="text-[9px] text-foreground/25">·</span>
                    )}
                    {item.tags.map(tag => (
                        <Link
                            key={tag.id}
                            href={`/u/${username}/saved?tag=${encodeURIComponent(tag.name)}`}
                            className="inline-flex items-center border border-foreground/30 px-1.5 py-[3px] text-[8.5px] font-bold uppercase tracking-[0.07em] text-foreground/60 transition-colors hover:border-terracotta hover:text-terracotta"
                        >
                            {tag.name}
                        </Link>
                    ))}
                </div>
                {excerpt && (
                    <p className="max-h-0 truncate text-[11.5px] leading-[1.5] text-foreground/50 opacity-0 transition-[max-height,opacity,margin-top] duration-150 group-hover:mt-1.5 group-hover:max-h-[19px] group-hover:opacity-100 pointer-coarse:mt-1.5 pointer-coarse:max-h-[19px] pointer-coarse:opacity-100">
                        {excerpt}
                    </p>
                )}
            </div>
            <SavedItemMenu
                readerHref={readerHref}
                onEditTags={() => onEditTags(item)}
                onRemove={() => onRemove(item)}
            />
        </div>
    );
}
