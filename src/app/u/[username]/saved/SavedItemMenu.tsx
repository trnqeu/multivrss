'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { Reader } from '@/components/icons/Reader';
import { TagIcon } from '@/components/icons/Tag';
import { Bookmark } from '@/components/icons/Bookmark';
import { useCloseOnNavigate } from '@/components/useCloseOnNavigate';

interface Props {
    readerHref: string;
    onEditTags: () => void;
    onRemove: () => void;
}

// One target per row: the three per-row icons (read / edit tags / remove) fold
// into this menu so a colour-heavy action cluster doesn't repeat down every row.
// Keyboard contract: Escape and click-outside close and return focus to the
// trigger; Arrow/Tab keys cycle the items; the first item is focused on open.
export default function SavedItemMenu({ readerHref, onEditTags, onRemove }: Props) {
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const itemsRef = useRef<(HTMLElement | null)[]>([]);
    const menuId = useId();

    useCloseOnNavigate(() => setOpen(false));

    useEffect(() => {
        if (!open) return;
        const onDocMouseDown = (e: MouseEvent) => {
            if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', onDocMouseDown);
        return () => document.removeEventListener('mousedown', onDocMouseDown);
    }, [open]);

    useEffect(() => {
        if (open) itemsRef.current[0]?.focus();
    }, [open]);

    function close(focusTrigger = true) {
        setOpen(false);
        if (focusTrigger) triggerRef.current?.focus();
    }

    function handleMenuKeyDown(e: React.KeyboardEvent) {
        const items = itemsRef.current.filter((el): el is HTMLElement => el != null);
        if (items.length === 0) return;
        const current = items.indexOf(document.activeElement as HTMLElement);

        if (e.key === 'Escape') {
            e.preventDefault();
            close();
        } else if (e.key === 'ArrowDown' || (e.key === 'Tab' && !e.shiftKey)) {
            e.preventDefault();
            items[(current + 1) % items.length]?.focus();
        } else if (e.key === 'ArrowUp' || (e.key === 'Tab' && e.shiftKey)) {
            e.preventDefault();
            items[(current - 1 + items.length) % items.length]?.focus();
        }
    }

    const itemClass =
        'flex w-full items-center gap-2.5 px-2.5 py-2 text-left text-[9.5px] font-bold uppercase tracking-[0.07em] outline-none transition-colors hover:bg-foreground hover:text-background focus:bg-foreground focus:text-background';
    const dangerClass =
        'flex w-full items-center gap-2.5 border-t border-foreground/10 px-2.5 py-2 text-left text-[9.5px] font-bold uppercase tracking-[0.07em] text-terracotta outline-none transition-colors hover:bg-terracotta hover:text-background focus:bg-terracotta focus:text-background';

    return (
        <div ref={containerRef} className="justify-self-end">
            <button
                ref={triggerRef}
                type="button"
                aria-label="Item actions"
                aria-haspopup="menu"
                aria-expanded={open}
                aria-controls={open ? menuId : undefined}
                onClick={() => setOpen(v => !v)}
                className={`px-1.5 py-[3px] text-[15px] font-extrabold leading-none transition-colors hover:text-terracotta ${
                    open ? 'text-foreground/60' : 'text-foreground/30 group-hover:text-foreground/60'
                }`}
            >
                ⋯
            </button>
            {open && (
                <div
                    id={menuId}
                    role="menu"
                    aria-label="Item actions"
                    onKeyDown={handleMenuKeyDown}
                    className="absolute right-0 top-8 z-20 min-w-[186px] border border-foreground/25 bg-background shadow-[3px_3px_0_rgba(0,0,0,0.10)]"
                >
                    <Link
                        ref={el => { itemsRef.current[0] = el; }}
                        href={readerHref}
                        role="menuitem"
                        tabIndex={-1}
                        onClick={() => close(false)}
                        className={itemClass}
                    >
                        <Reader size={13} />
                        Read
                    </Link>
                    <button
                        ref={el => { itemsRef.current[1] = el; }}
                        type="button"
                        role="menuitem"
                        tabIndex={-1}
                        onClick={() => { close(false); onEditTags(); }}
                        className={itemClass}
                    >
                        <TagIcon size={13} />
                        Edit tags
                    </button>
                    <button
                        ref={el => { itemsRef.current[2] = el; }}
                        type="button"
                        role="menuitem"
                        tabIndex={-1}
                        onClick={() => { close(false); onRemove(); }}
                        className={dangerClass}
                    >
                        <Bookmark filled size={13} />
                        Remove from saved
                    </button>
                </div>
            )}
        </div>
    );
}
